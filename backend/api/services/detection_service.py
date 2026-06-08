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
                    food_name = result.names[class_id]

                    if confidence > 0.25:
                        nutrition = cls._get_nutrition_data(food_name)
                        detected_foods.append({
                            "food_name": food_name,
                            "confidence": round(confidence * 100, 2),
                            "nutrition": nutrition
                        })

            return detected_foods
        except Exception as e:
            logger.error(f"Error during detection: {e}")
            raise RuntimeError(f"Gagal memproses gambar: {str(e)}")

    @classmethod
    def _get_nutrition_data(cls, food_name: str) -> dict:
        """
        Attempts to get nutrition data from CSV first.
        If not found, falls back to Generative AI.
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
                        "fiber": 0, # Not in CSV
                        "sugar": 0, # Not in CSV
                        "source": "csv"
                    }
            except Exception as e:
                logger.error(f"Error reading CSV: {e}")

        # 2. Fallback to Generative AI
        return cls._get_nutrition_from_ai(clean_name)

    @classmethod
    def _get_nutrition_from_ai(cls, food_name: str) -> dict:
        """
        Calls Generative AI to estimate nutrition for the given food name.
        Returns a dictionary with parsed nutritional values.
        """
        default_nutrition = {
            "calories": 250,
            "protein": 10,
            "carbs": 30,
            "fat": 10,
            "fiber": 2,
            "sugar": 5,
            "source": "fallback_default"
        }

        system_prompt = (
            "Anda adalah ahli gizi. Berikan perkiraan nutrisi makro untuk 1 porsi standar dari makanan berikut: "
            f"'{food_name}'. "
            "Anda WAJIB merespons hanya dengan format JSON murni tanpa ada tambahan teks atau format markdown. "
            "Format JSON yang diharapkan: "
            '{"calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0, "sugar": 0}'
        )

        import requests
        import google.genai as genai

        api_key = os.environ.get("GEMINI_API_KEY")
        if api_key:
            try:
                client = genai.Client(api_key=api_key)
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=system_prompt,
                )
                text = response.text.strip()
                # Clean markdown block if present
                if text.startswith("```json"):
                    text = text.replace("```json", "").replace("```", "").strip()
                elif text.startswith("```"):
                    text = text.replace("```", "").strip()
                
                data = json.loads(text)
                data["source"] = "ai_gemini"
                return data
            except Exception as e:
                logger.error(f"Gemini estimation failed for '{food_name}': {e}")
        
        # Try OpenRouter if Gemini fails or is not configured
        openrouter_key = os.environ.get("OPENROUTER_API_KEY")
        if openrouter_key:
            try:
                headers = {
                    "Authorization": f"Bearer {openrouter_key}",
                    "Content-Type": "application/json",
                }
                payload = {
                    "model": "google/gemini-2.5-flash",
                    "messages": [
                        {"role": "system", "content": system_prompt}
                    ],
                }
                resp = requests.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=10,
                )
                resp.raise_for_status()
                text = resp.json()["choices"][0]["message"]["content"].strip()
                if text.startswith("```json"):
                    text = text.replace("```json", "").replace("```", "").strip()
                elif text.startswith("```"):
                    text = text.replace("```", "").strip()
                
                data = json.loads(text)
                data["source"] = "ai_openrouter"
                return data
            except Exception as e:
                logger.error(f"OpenRouter estimation failed for '{food_name}': {e}")

        return default_nutrition
