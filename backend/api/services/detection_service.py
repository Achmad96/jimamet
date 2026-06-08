import os
import csv
import json
import re
import logging
from PIL import Image

logger = logging.getLogger(__name__)


class DetectionService:
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    MODEL_PATH = os.path.join(BASE_DIR, "ml_models", "best.pt")
    # CSV file is located at the root of the project (above codes/backend)
    CSV_PATH = os.path.join(os.path.dirname(os.path.dirname(BASE_DIR)), "indonesian_foods_nutrition.csv")
    model = None

    @classmethod
    def get_model(cls):
        if cls.model is None:
            if not os.path.exists(cls.MODEL_PATH):
                logger.error(f"Model file not found at {cls.MODEL_PATH}")
                return None
            try:
                from ultralytics import YOLO

                cls.model = YOLO(cls.MODEL_PATH)
                logger.info(f"YOLO model loaded successfully from {cls.MODEL_PATH}")
            except ImportError:
                logger.error("ultralytics library is not installed.")
                return None
            except Exception as e:
                logger.error(f"Error loading YOLO model: {e}")
                return None
        return cls.model

    @classmethod
    def detect_food(cls, image_file) -> list:
        model = cls.get_model()
        if not model:
            raise RuntimeError("Model deteksi makanan belum siap atau file best.pt tidak ditemukan.")

        try:
            from PIL import ImageOps

            # Buka gambar, perbaiki rotasi EXIF HP, dan standarisasi warna ke RGB
            raw_img = Image.open(image_file)
            img = ImageOps.exif_transpose(raw_img).convert("RGB")

            results = model(img, verbose=False)

            detected_foods = []
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    class_id = int(box.cls[0].item())
                    confidence = float(box.conf[0].item())
                    yolo_label = result.names[class_id]

                    if confidence > 0.25:
                        nutrition = cls._get_nutrition_data(yolo_label)

                        food_name = nutrition.pop("ai_food_name", None) or yolo_label

                        detected_foods.append({
                            "food_name": food_name,
                            "confidence": round(confidence * 100, 2),
                            "nutrition": nutrition
                        })

            return detected_foods
        except Exception as e:
            logger.error(f"Error during detection: {e}")
            raise RuntimeError(f"Gagal memproses gambar: {str(e)}")

    # ------------------------------------------------------------------ #
    #  Nutrition lookup (CSV → AI fallback)                                #
    # ------------------------------------------------------------------ #

    @classmethod
    def _get_nutrition_data(cls, food_name: str) -> dict:
        """
        Attempts to get nutrition data from CSV first.
        If not found, falls back to Generative AI which predicts
        food name, portion size, and complete macronutrients.
        """
        clean_name = food_name.replace("_", " ").lower()

        # 1. Search in CSV
        if os.path.exists(cls.CSV_PATH):
            try:
                matches = []
                with open(cls.CSV_PATH, newline='', encoding='utf-8') as csvfile:
                    reader = csv.DictReader(csvfile)
                    for row in reader:
                        csv_food = row.get("food_name", "").lower()
                        # Allow substring match
                        if clean_name in csv_food or csv_food in clean_name:
                            if csv_food == "unknown" or not csv_food:
                                continue
                            matches.append(row)

                if matches:
                    # Sort matches by length difference to prioritize exact/closer matches
                    matches.sort(key=lambda r: abs(len(r.get("food_name", "")) - len(clean_name)))
                    best_match = matches[0]

                    def parse_val(val_str):
                        if not val_str:
                            return 0
                        match = re.search(r"[\d\.]+", val_str)
                        return float(match.group()) if match else 0

                    return {
                        "calories": parse_val(best_match.get("energy")),
                        "protein": parse_val(best_match.get("protein")),
                        "carbs": parse_val(best_match.get("total_carbohydrates")),
                        "fat": parse_val(best_match.get("total_fat")),
                        "fiber": 0,   # Not available in CSV
                        "sugar": 0,   # Not available in CSV
                        "serving_size": 0,
                        "serving_unit": "g",
                        "source": "csv"
                    }
            except Exception as e:
                logger.error(f"Error reading CSV: {e}")

        # 2. Fallback to Generative AI (predicts portion + full macros)
        return cls._get_nutrition_from_ai(clean_name)

    # ------------------------------------------------------------------ #
    #  AI-based nutrition + portion estimation                             #
    # ------------------------------------------------------------------ #

    @classmethod
    def _get_nutrition_from_ai(cls, food_name: str) -> dict:
        """
        Calls Generative AI to estimate the food name (in Indonesian),
        standard portion size, and complete macronutrients.
        All data comes from the AI — no hardcoded defaults.
        """
        system_prompt = (
            "Anda adalah ahli gizi profesional Indonesia. "
            f"Berikan estimasi nutrisi lengkap untuk 1 porsi standar makanan: '{food_name}'. "
            "RESPONS WAJIB berupa JSON murni (tanpa markdown, tanpa teks tambahan). "
            "Gunakan struktur berikut PERSIS:\n"
            "{\n"
            '  "food_name": "<nama makanan dalam Bahasa Indonesia>",\n'
            '  "food_portion": {\n'
            '    "serving_size": <jumlah porsi dalam angka>,\n'
            '    "serving_unit": "<satuan: g, ml, pcs, atau slice>"\n'
            "  },\n"
            '  "food_nutrition": {\n'
            '    "calories": <kkal per porsi>,\n'
            '    "protein": <gram>,\n'
            '    "carbs": <gram>,\n'
            '    "fat": <gram>,\n'
            '    "fiber": <gram>,\n'
            '    "sugar": <gram>\n'
            "  }\n"
            "}\n"
            "Semua nilai numerik WAJIB berupa angka (int/float), bukan string."
        )

        import requests
        import google.genai as genai

        # --- Try Gemini ---
        api_key = os.environ.get("GEMINI_API_KEY")
        if api_key:
            parsed = cls._call_gemini_nutrition(genai, api_key, system_prompt, food_name)
            if parsed:
                return parsed

        # --- Try OpenRouter ---
        openrouter_key = os.environ.get("OPENROUTER_API_KEY")
        if openrouter_key:
            parsed = cls._call_openrouter_nutrition(requests, openrouter_key, system_prompt, food_name)
            if parsed:
                return parsed

        logger.error(f"All AI providers failed for '{food_name}'. No API keys configured or all calls failed.")
        return {
            "calories": 0, "protein": 0, "carbs": 0, "fat": 0,
            "fiber": 0, "sugar": 0, "serving_size": 0, "serving_unit": "g",
            "source": "unavailable"
        }

    # Models to try in order (primary → fallback)
    _GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"]

    @classmethod
    def _call_gemini_nutrition(cls, genai, api_key: str, prompt: str, food_name: str) -> dict | None:
        """
        Call Gemini API to estimate nutrition.
        Retries up to 3 times on 503 (transient overload) with backoff,
        then falls back to an alternative model.
        Returns parsed dict or None.
        """
        import time

        client = genai.Client(api_key=api_key)

        for model_name in cls._GEMINI_MODELS:
            for attempt in range(3):
                try:
                    response = client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                    )
                    return cls._parse_ai_nutrition_response(response.text, "ai_gemini")
                except Exception as e:
                    error_str = str(e)
                    is_503 = "503" in error_str or "UNAVAILABLE" in error_str

                    if is_503 and attempt < 2:
                        wait = (attempt + 1) * 1.5  # 1.5s, 3s
                        logger.warning(
                            f"Gemini {model_name} returned 503 for '{food_name}' "
                            f"(attempt {attempt + 1}/3). Retrying in {wait}s..."
                        )
                        time.sleep(wait)
                        continue

                    logger.error(f"Gemini {model_name} failed for '{food_name}': {e}")
                    break  # Non-retryable error or max retries reached, try next model

        return None

    @classmethod
    def _call_openrouter_nutrition(cls, requests_mod, api_key: str, prompt: str, food_name: str) -> dict | None:
        """Call OpenRouter API to estimate nutrition. Returns parsed dict or None."""
        try:
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": "google/gemini-2.5-flash",
                "messages": [
                    {"role": "system", "content": prompt}
                ],
            }
            resp = requests_mod.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=10,
            )
            resp.raise_for_status()
            text = resp.json()["choices"][0]["message"]["content"]
            return cls._parse_ai_nutrition_response(text, "ai_openrouter")
        except Exception as e:
            logger.error(f"OpenRouter estimation failed for '{food_name}': {e}")
            return None

    # ------------------------------------------------------------------ #
    #  Response parsing                                                    #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _parse_ai_nutrition_response(raw_text: str, source_label: str) -> dict | None:
        """
        Parse the structured AI response (food_name / food_portion / food_nutrition)
        into a flat dict that the rest of the codebase expects.
        Returns None if parsing fails.
        """
        try:
            text = raw_text.strip()
            # Clean markdown code block if present
            if text.startswith("```json"):
                text = text.replace("```json", "").replace("```", "").strip()
            elif text.startswith("```"):
                text = text.replace("```", "").strip()

            data = json.loads(text)

            # Handle the structured format: { food_name, food_portion, food_nutrition }
            ai_food_name = data.get("food_name")
            portion = data.get("food_portion", {})
            nutrition = data.get("food_nutrition", {})

            # If the AI returned the structured format
            if portion and nutrition:
                result = {
                    "calories": float(nutrition.get("calories", 0)),
                    "protein": float(nutrition.get("protein", 0)),
                    "carbs": float(nutrition.get("carbs", 0)),
                    "fat": float(nutrition.get("fat", 0)),
                    "fiber": float(nutrition.get("fiber", 0)),
                    "sugar": float(nutrition.get("sugar", 0)),
                    "serving_size": float(portion.get("serving_size", 0)),
                    "serving_unit": str(portion.get("serving_unit", "g")),
                    "source": source_label,
                }
                if ai_food_name:
                    result["ai_food_name"] = ai_food_name
                return result

            # Fallback: flat format (in case AI ignores the structure)
            result = {
                "calories": float(data.get("calories", 0)),
                "protein": float(data.get("protein", 0)),
                "carbs": float(data.get("carbs", 0)),
                "fat": float(data.get("fat", 0)),
                "fiber": float(data.get("fiber", 0)),
                "sugar": float(data.get("sugar", 0)),
                "serving_size": float(data.get("serving_size", 0)),
                "serving_unit": str(data.get("serving_unit", "g")),
                "source": source_label,
            }
            if ai_food_name:
                result["ai_food_name"] = ai_food_name
            return result
        except Exception as e:
            logger.error(f"Failed to parse AI nutrition response: {e}")
            return None
