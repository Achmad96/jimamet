import os
import base64
import json
from dotenv import load_dotenv
from google import genai
from supabase import create_client, Client

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

CHAT_SYSTEM_PROMPT = """Kamu adalah CoachBot, asisten kesehatan dan nutrisi berbahasa Indonesia.
Tugasmu:
- Menjawab pertanyaan seputar kesehatan, nutrisi, dan pola makan
- Memberikan saran yang mudah dipahami
- Selalu ingatkan user untuk konsultasi ke dokter untuk masalah serius
Jawab dengan singkat, jelas, dan ramah."""

FOOD_ANALYSIS_PROMPT = """Analisis gambar makanan ini dan berikan informasi dalam format JSON berikut:
{
    "description": "nama dan deskripsi singkat makanan",
    "calories": "estimasi total kalori (angka saja)",
    "nutrients": {
        "karbohidrat": "estimasi dalam gram",
        "protein": "estimasi dalam gram",
        "lemak": "estimasi dalam gram",
        "serat": "estimasi dalam gram"
    },
    "saran": "saran singkat tentang makanan ini"
}
Jawab HANYA dengan JSON, tanpa teks tambahan."""


def get_user_profile(user_id: str) -> dict:
    result = supabase.table("user_profiles").select("*").eq("id", user_id).execute()
    if result.data and len(result.data) > 0:
        return result.data[0]
    return None


def get_consumption_history(user_id: str) -> list:
    result = (
        supabase.table("consumption_history")
        .select("food_name,calories,protein,carbs,fat,consumed_at")
        .eq("user_id", user_id)
        .order("consumed_at", desc=True)
        .limit(10)
        .execute()
    )
    return result.data if result.data else []


def build_nutrition_context(user_id: str) -> str:
    profile = get_user_profile(user_id)
    history = get_consumption_history(user_id)

    if not profile:
        return ""

    food_list = ""
    total_cal = 0
    for item in history:
        food_list += f"  - {item['food_name']}: {item['calories']} kcal (P:{item['protein']}g K:{item['carbs']}g L:{item['fat']}g)\n"
        total_cal += item['calories']

    context = f"""Data profil user:
- Berat badan: {profile['weight']} kg
- Tinggi badan: {profile['height']} cm
- Usia: {profile['age']} tahun
- Pekerjaan: {profile['job']}
- Aktivitas harian: {profile['activity']}

Histori konsumsi hari ini (total: {total_cal} kcal):
{food_list}"""

    return context


def chat(message: str, user_id: str = None) -> str:
    context = ""
    if user_id:
        context = build_nutrition_context(user_id)

    if context:
        prompt = f"""{CHAT_SYSTEM_PROMPT}

{context}
Berdasarkan data di atas, jawab pertanyaan berikut:
{message}"""
    else:
        prompt = f"{CHAT_SYSTEM_PROMPT}\n\nPertanyaan user: {message}"

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    return response.text


def get_nutrition_recommendation(user_id: str) -> str:
    context = build_nutrition_context(user_id)

    if not context:
        return "Profil user tidak ditemukan. Silakan lengkapi profil terlebih dahulu."

    prompt = f"""{CHAT_SYSTEM_PROMPT}

{context}
Berdasarkan data di atas, berikan rekomendasi nutrisi yang personal dan lengkap:
1. Analisis pola makan hari ini
2. Kekurangan atau kelebihan nutrisi
3. Rekomendasi makanan untuk makan selanjutnya
4. Tips kesehatan sesuai profil user"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    return response.text


def analyze_food(image_base64: str) -> dict:
    image_bytes = base64.b64decode(image_base64)

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            FOOD_ANALYSIS_PROMPT,
            genai.types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg")
        ]
    )

    raw_text = response.text.strip()
    if raw_text.startswith("```"):
        raw_text = raw_text.split("\n", 1)[1]
        raw_text = raw_text.rsplit("```", 1)[0]

    return json.loads(raw_text)
