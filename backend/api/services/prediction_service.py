"""
Business logic for NutriCoach AI predictions (Gemini / OpenRouter).
Session listings and details are cached for 30 seconds.
"""

import os
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

import requests
import google.genai as genai
from google.genai import types as genai_types

from api.models import UserModel, FoodRecordModel, CoachSessionModel, CoachMessageModel
from api import cache as app_cache

# Consultation trigger keywords
_CONSULTATION_TRIGGERS = [
    # Penyakit kronis
    "diabetes",
    "diabetik",
    "gula darah",
    "kencing manis",
    "hipertensi",
    "darah tinggi",
    "tekanan darah",
    "kolesterol",
    "trigliserida",
    "ldl",
    "hdl",
    "jantung",
    "serangan jantung",
    "gagal jantung",
    "aritmia",
    "ginjal",
    "gagal ginjal",
    "batu ginjal",
    "cuci darah",
    "kanker",
    "tumor",
    "kemoterapi",
    "onkologi",
    "asam urat",
    "gout",
    "rematik",
    "arthritis",
    "stroke",
    "lumpuh",
    "liver",
    "hati",
    "hepatitis",
    "sirosis",
    "tiroid",
    "hipotiroid",
    "hipertiroid",
    "anemia",
    "kekurangan darah",
    "osteoporosis",
    "tulang rapuh",
    "autoimun",
    "lupus",
    # Kondisi khusus
    "hamil",
    "kehamilan",
    "trimester",
    "ibu hamil",
    "menyusui",
    "asi",
    "obesitas",
    "kegemukan",
    "bmi tinggi",
    "kurus ekstrem",
    "underweight",
    "kurang gizi",
    "malnutrisi",
    # Gejala serius
    "penyakit",
    "sakit parah",
    "rawat inap",
    "opname",
    "sesak napas",
    "nyeri dada",
    "pingsan",
    "kejang",
    "mual parah",
    "muntah darah",
    "bab berdarah",
    "luka tidak sembuh",
    "infeksi",
    "alergi",
    "anafilaksis",
    # Diet medis
    "diet khusus",
    "diet dokter",
    "pantangan",
    "tidak boleh makan",
    "suplemen",
    "vitamin dosis tinggi",
    "obat",
    "interaksi makanan",
    "makanan terlarang",
    # Kondisi mental terkait makan
    "anoreksia",
    "bulimia",
    "binge eating",
    "gangguan makan",
    # Kondisi olahraga/ekstrem
    "atlet profesional",
    "kompetisi",
    "cutting",
    "bulking ekstrem",
]

_SYSTEM_PROMPT_TEMPLATE = """
**[Peran dan Identitas]**
Anda adalah Asisten Nutrisi JIMAMET, sebuah AI cerdas yang bertugas sebagai *coach* (pelatih) gizi dan nutrisi virtual. Tugas utama Anda adalah membantu pengguna melakukan pemantauan (monitoring) dan evaluasi gizi harian mereka.

**[Target Pengguna & Gaya Bahasa]**
Pengguna Anda adalah masyarakat umum yang ingin memahami tentang gizi, memperbaiki pola makan, atau sedang menjalani program diet.
Gaya bahasa Anda harus **formal, profesional, sopan, dan edukatif**. Gunakan tata bahasa Indonesia yang baik dan benar (PUEBI). Hindari penggunaan bahasa gaul atau *slang*, namun pastikan penjelasan teknis terkait gizi tetap mudah dipahami oleh orang awam.

**[Tugas dan Kapabilitas Utama]**
1. **Evaluasi Gizi:** Berikan analisis dan umpan balik terhadap asupan makanan harian yang dilaporkan pengguna (kalori, makronutrien seperti protein/karbohidrat/lemak, dan mikronutrien).
2. **Edukasi Nutrisi:** Jawab pertanyaan umum seputar pola makan sehat, jenis diet, fungsi vitamin/mineral, dan tips manajemen berat badan berdasarkan pedoman gizi yang diakui secara ilmiah.
3. **Motivasi:** Berikan dorongan yang positif dan objektif agar pengguna tetap konsisten dengan target kesehatan dan gizi mereka.

**[BATASAN KRITIS & PROTOKOL KEAMANAN MEDIS]**
Ini adalah aturan yang mutlak dan tidak boleh dilanggar dalam kondisi apa pun:

1. Anda HANYA berkapasitas sebagai pelatih (coach) nutrisi, bukan dokter atau tenaga medis klinis.
2. Anda **DILARANG KERAS** memberikan diagnosis penyakit, menafsirkan hasil tes laboratorium medis, meresepkan obat, atau memberikan saran diet untuk kondisi medis spesifik (seperti diabetes parah, gagal ginjal, kanker, gangguan makan klinis, dsb).
3. **Protokol Pengalihan (Handoff):** Jika pengguna mengajukan pertanyaan yang mengarah pada gejala penyakit, keluhan medis, atau meminta diagnosis kesehatan, Anda harus menghentikan percakapan terkait topik tersebut dan **mengarahkan pengguna untuk beralih ke fitur "Chat dengan Ahli/Expert"** di dalam aplikasi.

**[Format Respons Pengalihan Medis]**
Jika terdeteksi pertanyaan medis, gunakan templat respons berikut (atau variasi yang serupa dan formal):
*"Mohon maaf, kapasitas saya sebagai Asisten Nutrisi JIMAMET terbatas pada evaluasi gizi dan pola makan umum. Saya tidak memiliki wewenang untuk memberikan diagnosis atau saran medis terkait penyakit. Untuk memastikan kondisi kesehatan Anda tertangani dengan aman dan tepat, silakan gunakan fitur 'Chat dengan Ahli' di aplikasi ini untuk berkonsultasi langsung dengan dokter atau ahli gizi klinis kami."*

**[Instruksi Tambahan Formating]**
* Gunakan poin-poin (bullet points) atau daftar bernomor (numbered lists) jika memberikan penjelasan yang panjang agar mudah dibaca oleh pengguna.
* Awali sapaan dengan sopan tanpa harus selalu mengulang perkenalan diri di setiap pertanyaan lanjutan.

Konteks Pengguna Saat Ini:  
{nutrition_context}
Gunakan data ini untuk memberikan evaluasi yang lebih personal, namun tetap patuhi semua batasan yang ada.
"""


class PredictionService:
    """NutriCoach AI chat business logic."""

    @classmethod
    def list_sessions(cls, user_id: str) -> list:
        """Fetch all sessions for user that have at least one message (cached 30s).
        Empty sessions where no message was sent are not saved in history.
        """
        cache_key = app_cache.key_coach_sessions(user_id)
        cached = app_cache.get(cache_key)
        if cached is not None:
            return cached

        raw_sessions = CoachSessionModel.find_by_user(user_id)
        if not raw_sessions:
            app_cache.set(cache_key, [], app_cache.TTL_COACH_SESSIONS)
            return []

        # Only retain sessions that have messages; clean up empty ones
        filtered_sessions = []
        for s in raw_sessions:
            s_id = s.get("id")
            if not s_id:
                continue
            msgs = CoachMessageModel.find_by_session(s_id, order="sent_at.asc")
            if msgs:
                filtered_sessions.append(s)
            else:
                try:
                    CoachSessionModel.delete(s_id)
                    app_cache.delete(app_cache.key_coach_session_detail(s_id))
                except Exception as del_err:
                    logger.warning("Failed to clean up empty session %s: %s", s_id, del_err)

        app_cache.set(cache_key, filtered_sessions, app_cache.TTL_COACH_SESSIONS)
        return filtered_sessions

    @classmethod
    def create_session(cls, user_id: str, title: str = "New Consultation") -> dict:
        """Create a new AI chat session. Invalidates session list cache."""
        result = CoachSessionModel.create({"user_id": user_id, "title": title})
        app_cache.delete(app_cache.key_coach_sessions(user_id))
        return result

    @classmethod
    def get_session(cls, user_id: str, session_id: str) -> dict:
        """Get session details and all its messages (cached 30s)."""
        cache_key = app_cache.key_coach_session_detail(session_id)
        cached = app_cache.get(cache_key)
        if cached is not None:
            return cached

        session = CoachSessionModel.find_by_id_and_user(session_id, user_id)
        if not session:
            raise ValueError("Session not found")

        messages = CoachMessageModel.find_by_session(session_id)
        result = {"session": session, "messages": messages}
        app_cache.set(cache_key, result, app_cache.TTL_COACH_MESSAGES)
        return result

    @classmethod
    def delete_session(cls, user_id: str, session_id: str) -> bool:
        """Delete an AI chat session. Invalidates caches."""
        session = CoachSessionModel.find_by_id_and_user(session_id, user_id)
        if not session:
            raise ValueError("Session not found")

        result = CoachSessionModel.delete(session_id)
        app_cache.delete(app_cache.key_coach_sessions(user_id))
        app_cache.delete(app_cache.key_coach_session_detail(session_id))
        return result

    @classmethod
    def chat(cls, user_id, session_id: str, message: str) -> dict:
        """
        Process a chat message within a session and return AI response.
        """
        if not message:
            raise ValueError("Pesan tidak boleh kosong")

        session = CoachSessionModel.find_by_id_and_user(session_id, user_id)
        if not session:
            raise ValueError("Session not found")

        # Update title if it's the first message or placeholder title
        messages = CoachMessageModel.find_by_session(session_id)
        current_title = session.get("title", "")
        if not messages or current_title in ("New Consultation", "Sesi Konsultasi Baru", "Sesi Baru", "Sesi NutriCoach"):
            title = message[:40] + ("..." if len(message) > 40 else "")
            CoachSessionModel.update(session_id, {"title": title})

        # Build nutrition context
        nutrition = cls._build_nutrition_context(user_id)
        nutrition_context = f"""
        [DATA NUTRISI PENGGUNA HARI INI]
        - Target Kalori Harian (BMR): {nutrition['target_calories']} kkal
        - Kalori Terkonsumsi: {nutrition['total_cal']} kkal
        - Protein: {nutrition['total_protein']} g
        - Karbohidrat: {nutrition['total_carbs']} g
        - Lemak: {nutrition['total_fat']} g
        """

        system_prompt = _SYSTEM_PROMPT_TEMPLATE.format(nutrition_context=nutrition_context)

        # Build chat history context
        history_context = ""
        for msg in messages[-5:]:  # Last 5 messages for context
            role = "AI" if msg["sender"] == "ai" else "User"
            history_context += f"{role}: {msg['message']}\n"

        full_prompt = f"{system_prompt}\n\nRiwayat percakapan:\n{history_context}\n\nPesan pengguna: {message}\n\nJawaban Anda:"

        # Try Gemini first, fallback to OpenRouter
        ai_reply = None
        fallback_error = ""

        api_key = os.environ.get("GEMINI_API_KEY")
        if api_key:
            ai_reply = cls._call_gemini(full_prompt, api_key)
            if not ai_reply:
                fallback_error = "Gemini gagal merespons."
        else:
            fallback_error = "GEMINI_API_KEY tidak diatur."

        if not ai_reply:
            openrouter_key = os.environ.get("OPENROUTER_API_KEY")
            if not openrouter_key:
                raise RuntimeError(f"{fallback_error} | OpenRouter juga tidak bisa digunakan " f"karena OPENROUTER_API_KEY belum diatur.")

            # Send simplified prompt to OpenRouter
            or_prompt = f"{system_prompt}\n\nRiwayat percakapan:\n{history_context}"
            ai_reply = cls._call_openrouter(or_prompt, message, openrouter_key)
            if not ai_reply:
                raise RuntimeError(f"{fallback_error} | OpenRouter juga gagal merespons.")

        # Append automatic disclaimer
        disclaimer = (
            "Rekomendasi ini berdasarkan data konsumsi dan goal kamu. Untuk kondisi kesehatan khusus, disarankan konsultasi dengan Nutritionist."
        )
        ai_reply = f"{ai_reply.strip()}\n\n{disclaimer}"

        # Check if consultation is needed
        needs_consultation = any(t in message.lower() for t in _CONSULTATION_TRIGGERS)

        # Save to database
        CoachMessageModel.create({"session_id": session_id, "sender": "user", "message": message})
        CoachMessageModel.create({"session_id": session_id, "sender": "ai", "message": ai_reply, "needs_consultation": needs_consultation})

        # Update session updated_at
        updated_session = CoachSessionModel.update(session_id, {"updated_at": datetime.utcnow().isoformat() + "Z"})

        # Invalidate caches
        app_cache.delete(app_cache.key_coach_sessions(user_id))
        app_cache.delete(app_cache.key_coach_session_detail(session_id))

        return {"reply": ai_reply, "needs_consultation": needs_consultation, "session": updated_session}

    @classmethod
    def _build_nutrition_context(cls, user_id) -> dict:
        """Gather user profile and today's nutrition data."""
        target_calories = 2000

        profile = UserModel.find_by_id(user_id)
        if profile:
            w = float(profile.get("weight") or 0)
            h = float(profile.get("height") or 0)
            a = float(profile.get("age") or 0)
            if w and h and a:
                gender = profile.get("gender", "male")
                bmr = (10 * w + 6.25 * h - 5 * a + 5) if gender == "male" else (10 * w + 6.25 * h - 5 * a - 161)
                factors = {
                    "sedentary": 1.2,
                    "light": 1.375,
                    "moderate": 1.55,
                    "active": 1.725,
                    "veryActive": 1.9,
                }
                tdee = bmr * factors.get(profile.get("activity_level", "moderate"), 1.55)
                goal = profile.get("goal", "maintain")
                if goal == "lose":
                    tdee -= 400
                elif goal == "gain":
                    tdee += 400
                target_calories = round(tdee)

        # Get today's food records (WIB timezone)
        now_utc = datetime.utcnow()
        today_wib = (now_utc + timedelta(hours=7)).strftime("%Y-%m-%d")
        yesterday_utc = (now_utc - timedelta(days=1)).isoformat()

        food_rows = FoodRecordModel.find_by_user(
            user_id,
            order="recorded_at.desc",
            extra_params={"recorded_at": f"gte.{yesterday_utc}"},
        )

        total_cal = 0
        total_protein = 0
        total_carbs = 0
        total_fat = 0
        for f in food_rows:
            t = f.get("recorded_at", "")
            clean_str = t.split("+")[0].replace("Z", "")
            if clean_str:
                dt_local = datetime.fromisoformat(clean_str) + timedelta(hours=7)
                if dt_local.strftime("%Y-%m-%d") == today_wib:
                    total_cal += float(f.get("calories") or 0)
                    total_protein += float(f.get("protein") or 0)
                    total_carbs += float(f.get("carbs") or 0)
                    total_fat += float(f.get("fat") or 0)

        return {
            "target_calories": target_calories,
            "total_cal": total_cal,
            "total_protein": total_protein,
            "total_carbs": total_carbs,
            "total_fat": total_fat,
        }

    @classmethod
    def _call_gemini(cls, full_prompt: str, api_key: str) -> str | None:
        """Call Gemini API directly. Returns response text or None."""
        try:
            client = genai.Client(api_key=api_key)
            response = client.models.generate_content(
                model="gemini-3.8-flash",
                contents=full_prompt,
            )
            return response.text.strip()
        except Exception as e:
            logger.error("[Gemini ERROR] %s: %s", type(e).__name__, e)
            return None

    @classmethod
    def _call_openrouter(cls, system_prompt: str, user_message: str, api_key: str) -> str | None:
        """Fallback to OpenRouter API. Returns response text or None."""
        try:
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            }
            data = {
                "model": "google/gemini-3.8-flash",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
            }
            resp = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=data,
                timeout=15,
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"].strip()
        except Exception as e:
            logger.error("[OpenRouter ERROR] %s: %s", type(e).__name__, e)
            return None
