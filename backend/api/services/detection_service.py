import os
import csv
import io
import json
import re
import logging
import base64
import time
from typing import Any, Dict, List, Optional, Tuple, Union
from PIL import Image, ImageOps
import numpy as np

logger = logging.getLogger(__name__)


class DetectionService:
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    MODEL_PATH = os.path.join(BASE_DIR, "ml_models", "JIMAMET_MODEL.pt")
    CSV_PATH = os.path.join(BASE_DIR, "indonesian_foods_nutrition.csv")
    model = None
    _fast_nutrition_cache: Dict[str, dict] = {}

    @classmethod
    def get_model(cls):
        if cls.model is None:
            candidates = [
                cls.MODEL_PATH,
                os.path.join(cls.BASE_DIR, "ml_models", "best.pt"),
                os.path.join(os.path.dirname(cls.BASE_DIR), "deep_learning", "JIMAMET_MODEL.pt"),
            ]
            active_path = None
            for p in candidates:
                if os.path.exists(p):
                    active_path = p
                    break

            if not active_path:
                logger.error(f"Model file not found in candidates: {candidates}")
                return None
            try:
                from ultralytics import YOLO

                cls.model = YOLO(active_path)
                logger.info(f"YOLO model loaded successfully from {active_path}")
            except ImportError:
                logger.error("ultralytics library is not installed.")
                return None
            except Exception as exception:
                logger.error(f"Error loading YOLO model: {exception}")
                return None
        return cls.model

    @classmethod
    def get_fast_nutrition(cls, food_name: str) -> dict:
        """
        Fast in-memory nutrition lookup via TF-IDF IR and cached dictionary.
        Executes in sub-millisecond without external AI calls, optimal for video and camera frames.
        """
        if food_name in cls._fast_nutrition_cache:
            return dict(cls._fast_nutrition_cache[food_name])

        try:
            from api.services.nutrition_retrieval_service import NutritionRetrievalService

            match = NutritionRetrievalService.retrieve(food_name, threshold=0.35)
            if match:
                matched_name = match.get("food_name", food_name.replace("_", " "))
                result = {
                    "calories": round(match.get("energy_100g", 0.0), 1),
                    "protein": round(match.get("protein_100g", 0.0), 1),
                    "carbs": round(match.get("carbs_100g", 0.0), 1),
                    "fat": round(match.get("fat_100g", 0.0), 1),
                    "fiber": round(match.get("fiber_100g", 0.0), 1) if "fiber_100g" in match else 0.0,
                    "sugar": round(match.get("sugar_100g", 0.0), 1) if "sugar_100g" in match else 0.0,
                    "serving_size": 100,
                    "serving_unit": "g",
                    "source": "csv",
                    "matched_food_name": matched_name,
                    "food_name": matched_name,
                    "retrieval_score": match.get("similarity_score", 1.0),
                    "retrieval_method": match.get("match_type", "tfidf_cosine"),
                }
                cls._fast_nutrition_cache[food_name] = result
                return dict(result)
        except Exception as e:
            logger.error(f"Error during fast nutrition lookup for '{food_name}': {e}")

        # Fallback when no match in CSV
        clean_name = food_name.replace("_", " ")
        result = {
            "calories": 0.0,
            "protein": 0.0,
            "carbs": 0.0,
            "fat": 0.0,
            "fiber": 0.0,
            "sugar": 0.0,
            "serving_size": 100,
            "serving_unit": "g",
            "source": "unmatched",
            "matched_food_name": clean_name,
            "food_name": clean_name,
        }
        cls._fast_nutrition_cache[food_name] = result
        return dict(result)

    @classmethod
    def load_image(cls, image_input: Any) -> Tuple[Image.Image, int, int]:
        """
        Universal image loader that accepts PIL Image, numpy array (cv2),
        bytes, base64 data string, or file-like object.
        Returns (pil_rgb_image, width, height).
        """
        import cv2

        if isinstance(image_input, Image.Image):
            img = image_input.convert("RGB")
            return img, img.width, img.height

        if isinstance(image_input, np.ndarray):
            if len(image_input.shape) == 2:
                img = Image.fromarray(image_input).convert("RGB")
            elif image_input.shape[2] == 4:
                img = Image.fromarray(cv2.cvtColor(image_input, cv2.COLOR_BGRA2RGB))
            else:
                img = Image.fromarray(cv2.cvtColor(image_input, cv2.COLOR_BGR2RGB))
            return img, img.width, img.height

        if isinstance(image_input, (bytes, bytearray)):
            raw_img = Image.open(io.BytesIO(image_input))
            img = ImageOps.exif_transpose(raw_img).convert("RGB")
            return img, img.width, img.height

        if isinstance(image_input, str):
            if image_input.startswith("data:image"):
                _, base64_str = image_input.split(",", 1)
                img_bytes = base64.b64decode(base64_str)
                return cls.load_image(img_bytes)
            try:
                img_bytes = base64.b64decode(image_input)
                return cls.load_image(img_bytes)
            except Exception:
                if os.path.exists(image_input):
                    raw_img = Image.open(image_input)
                    img = ImageOps.exif_transpose(raw_img).convert("RGB")
                    return img, img.width, img.height
                raise ValueError("String image_input is neither valid base64 nor existing file path")

        # Assume Django UploadedFile or file-like object
        raw_img = Image.open(image_input)
        img = ImageOps.exif_transpose(raw_img).convert("RGB")
        return img, img.width, img.height

    @classmethod
    def detect_frame(
        cls,
        image_input: Any,
        imgsz: int = 384,
        conf_threshold: float = 0.25,
        iou_threshold: float = 0.45,
        fast_mode: bool = True,
    ) -> dict:
        """
        Low-latency frame detection designed for real-time video and camera feeds.
        Runs YOLO inference, measures precise inference time, and returns bounding boxes
        with both pixel and normalized coordinates.
        """
        model = cls.get_model()
        if not model:
            raise RuntimeError("Model deteksi makanan belum siap atau file model tidak ditemukan.")

        img, width, height = cls.load_image(image_input)

        t0 = time.perf_counter()
        results = model(img, imgsz=imgsz, conf=conf_threshold, iou=iou_threshold, verbose=False)
        inference_ms = round((time.perf_counter() - t0) * 1000, 1)

        detected_foods = []
        for result in results:
            boxes = result.boxes
            for box in boxes:
                class_id = int(box.cls[0].item())
                confidence = float(box.conf[0].item())
                yolo_label = result.names[class_id]

                if confidence >= conf_threshold:
                    xyxy = box.xyxy[0].tolist()
                    x1, y1, x2, y2 = xyxy

                    norm_x1 = round(max(0.0, min(1.0, x1 / width)), 4)
                    norm_y1 = round(max(0.0, min(1.0, y1 / height)), 4)
                    norm_x2 = round(max(0.0, min(1.0, x2 / width)), 4)
                    norm_y2 = round(max(0.0, min(1.0, y2 / height)), 4)

                    if fast_mode:
                        nutrition = cls.get_fast_nutrition(yolo_label)
                    else:
                        nutrition = cls._get_nutrition_data(yolo_label, pil_image=img)

                    food_name = nutrition.get("matched_food_name") or yolo_label.replace("_", " ")

                    detected_foods.append({
                        "class_id": class_id,
                        "raw_label": yolo_label,
                        "food_name": food_name,
                        "confidence": round(confidence * 100, 1),
                        "bbox": [round(x1, 1), round(y1, 1), round(x2, 1), round(y2, 1)],
                        "bbox_normalized": [norm_x1, norm_y1, norm_x2, norm_y2],
                        "nutrition": nutrition,
                    })

        return {
            "status": "success",
            "detections": detected_foods,
            "count": len(detected_foods),
            "inference_ms": inference_ms,
            "width": width,
            "height": height,
        }

    @classmethod
    def detect_food(cls, image_file, fast_mode: bool = False) -> list:
        """
        Original endpoint method, updated to return enriched bounding boxes
        while preserving backward compatibility.
        """
        frame_result = cls.detect_frame(image_file, imgsz=416, conf_threshold=0.25, fast_mode=fast_mode)
        return frame_result["detections"]

    @classmethod
    def process_video(
        cls,
        video_source: Any,
        sample_fps: float = 2.0,
        conf_threshold: float = 0.25,
        imgsz: int = 384,
        max_duration_sec: float = 120.0,
    ) -> dict:
        """
        Process a video file with frame sampling for low-latency batch analysis.
        Returns metadata, timeline detections, and an aggregated nutritional summary.
        """
        import cv2
        import tempfile

        temp_path = None
        if hasattr(video_source, "read"):
            suffix = os.path.splitext(getattr(video_source, "name", "video.mp4"))[1] or ".mp4"
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                for chunk in (video_source.chunks() if hasattr(video_source, "chunks") else [video_source.read()]):
                    tmp.write(chunk)
                temp_path = tmp.name
            video_path = temp_path
        else:
            video_path = str(video_source)

        try:
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                raise RuntimeError("Gagal membuka file video. Format mungkin tidak didukung.")

            fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            duration_sec = total_frames / fps if fps > 0 else 0

            sample_step = max(1, int(round(fps / max(0.5, sample_fps))))
            max_sampled_frames = int(max_duration_sec * sample_fps)

            timeline = []
            unique_foods: Dict[str, dict] = {}
            frame_idx = 0
            sampled_count = 0

            while cap.isOpened() and sampled_count < max_sampled_frames:
                ret, frame = cap.read()
                if not ret:
                    break

                if frame_idx % sample_step == 0:
                    timestamp_sec = round(frame_idx / fps, 2)
                    frame_res = cls.detect_frame(
                        frame,
                        imgsz=imgsz,
                        conf_threshold=conf_threshold,
                        fast_mode=True,
                    )
                    detections = frame_res.get("detections", [])
                    if detections:
                        timeline.append({
                            "timestamp": timestamp_sec,
                            "frame_index": frame_idx,
                            "detections": detections,
                        })

                        for det in detections:
                            key = det["food_name"]
                            if key not in unique_foods:
                                unique_foods[key] = {
                                    "food_name": key,
                                    "raw_label": det["raw_label"],
                                    "max_confidence": det["confidence"],
                                    "first_seen": timestamp_sec,
                                    "last_seen": timestamp_sec,
                                    "appearances": 1,
                                    "nutrition": det["nutrition"],
                                }
                            else:
                                unique_foods[key]["appearances"] += 1
                                unique_foods[key]["last_seen"] = timestamp_sec
                                if det["confidence"] > unique_foods[key]["max_confidence"]:
                                    unique_foods[key]["max_confidence"] = det["confidence"]

                    sampled_count += 1
                frame_idx += 1

            cap.release()

            summary_list = list(unique_foods.values())
            total_cals = sum(item["nutrition"].get("calories", 0) for item in summary_list)
            total_protein = sum(item["nutrition"].get("protein", 0) for item in summary_list)
            total_carbs = sum(item["nutrition"].get("carbs", 0) for item in summary_list)
            total_fat = sum(item["nutrition"].get("fat", 0) for item in summary_list)

            return {
                "status": "success",
                "video_info": {
                    "fps": round(fps, 1),
                    "total_frames": total_frames,
                    "duration_sec": round(duration_sec, 2),
                    "sampled_frames": sampled_count,
                    "width": width,
                    "height": height,
                },
                "summary": summary_list,
                "timeline": timeline,
                "total_nutrition": {
                    "calories": round(total_cals, 1),
                    "protein": round(total_protein, 1),
                    "carbs": round(total_carbs, 1),
                    "fat": round(total_fat, 1),
                },
            }
        finally:
            if temp_path and os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except Exception:
                    pass

    # ------------------------------------------------------------------ #
    #  Nutrition lookup (CSV → AI fallback)                                #
    # ------------------------------------------------------------------ #

    @classmethod
    def _get_nutrition_data(cls, food_name: str, pil_image=None) -> dict:
        """
        Attempts to get nutrition data via TF-IDF Information Retrieval from the CSV first.
        If TF-IDF match is found above threshold, calls AI to estimate portion size (grams)
        from the food image and scales the per-100g database values accordingly.
        Also estimates fiber and sugar via AI since those are not in the CSV.
        If no satisfactory match found in CSV (or database missing), falls back entirely to Generative AI.
        """
        clean_name = food_name.replace("_", " ").lower()

        # 1. TF-IDF Information Retrieval lookup
        try:
            from api.services.nutrition_retrieval_service import NutritionRetrievalService

            match = NutritionRetrievalService.retrieve(food_name, threshold=0.40)
            if match:
                matched_name = match.get("food_name", food_name)
                cal_100 = match.get("energy_100g", 0.0)
                protein_100 = match.get("protein_100g", 0.0)
                carbs_100 = match.get("carbs_100g", 0.0)
                fat_100 = match.get("fat_100g", 0.0)
                similarity_score = match.get("similarity_score", 1.0)
                match_type = match.get("match_type", "tfidf_cosine")

                # Estimate portion size + fiber/sugar from AI using the image
                portion_extras = cls._estimate_portion_and_extras(matched_name, pil_image)
                portion_grams = portion_extras.get("portion_grams", 100)
                fiber_100 = portion_extras.get("fiber_per_100g", 0)
                sugar_100 = portion_extras.get("sugar_per_100g", 0)

                # Scale per-100g values by estimated portion size
                scale = portion_grams / 100.0

                return {
                    "calories": round(cal_100 * scale, 1),
                    "protein": round(protein_100 * scale, 1),
                    "carbs": round(carbs_100 * scale, 1),
                    "fat": round(fat_100 * scale, 1),
                    "fiber": round(fiber_100 * scale, 1),
                    "sugar": round(sugar_100 * scale, 1),
                    "serving_size": portion_grams,
                    "serving_unit": "g",
                    "source": "csv",
                    "matched_food_name": matched_name,
                    "retrieval_score": similarity_score,
                    "retrieval_method": match_type,
                }
        except Exception as exception:
            logger.error(f"Error during TF-IDF nutrition retrieval: {exception}")

        # 2. Fallback to Generative AI if not matched in database
        return cls._get_nutrition_from_ai(clean_name)

    # ------------------------------------------------------------------ #
    #  AI-based portion + fiber/sugar estimation (for CSV-matched foods)    #
    # ------------------------------------------------------------------ #
    @classmethod
    def _estimate_portion_and_extras(cls, food_name: str, pil_image=None) -> dict:
        """
        Calls Generative AI to estimate portion size (grams) from the food image,
        plus fiber and sugar per 100g for the given food.
        Returns { portion_grams, fiber_per_100g, sugar_per_100g }.
        Falls back to defaults (100g, 0, 0) if AI is unavailable.
        """
        prompt_text = (
            f"Lihat gambar makanan ini. Makanan yang terdeteksi adalah '{food_name}'.\n"
            "Tugas Anda:\n"
            "1. Estimasi berat total porsi makanan tersebut yang terlihat di gambar (dalam gram).\n"
            "2. Estimasi kandungan serat (fiber) per 100 gram untuk makanan ini.\n"
            "3. Estimasi kandungan gula (sugar) per 100 gram untuk makanan ini.\n"
            "RESPONS WAJIB berupa JSON murni (tanpa markdown, tanpa teks tambahan):\n"
            "{\n"
            '  "portion_grams": <berat porsi dalam gram>,\n'
            '  "fiber_per_100g": <gram serat per 100g>,\n'
            '  "sugar_per_100g": <gram gula per 100g>\n'
            "}\n"
            "Semua nilai WAJIB berupa angka (int/float), bukan string."
        )

        defaults = {"portion_grams": 100, "fiber_per_100g": 0, "sugar_per_100g": 0}

        # Prepare image bytes for Gemini multimodal
        image_bytes = None
        if pil_image is not None:
            try:
                buf = io.BytesIO()
                pil_image.save(buf, format="JPEG")
                image_bytes = buf.getvalue()
            except Exception as e:
                logger.error(f"Failed to encode image for AI: {e}")

        import google.genai as genai
        from google.genai import types as genai_types

        api_key = os.environ.get("GEMINI_API_KEY")
        if api_key:
            parsed = cls._call_gemini_portion(genai, genai_types, api_key, prompt_text, image_bytes, food_name)
            if parsed:
                return parsed

        openrouter_key = os.environ.get("OPENROUTER_API_KEY")
        if openrouter_key:
            import requests

            parsed = cls._call_openrouter_portion(requests, openrouter_key, prompt_text, food_name)
            if parsed:
                return parsed

        logger.warning(f"Portion estimation failed for '{food_name}', using defaults.")
        return defaults

    @classmethod
    def _call_gemini_portion(cls, genai, genai_types, api_key, prompt_text, image_bytes, food_name) -> dict | None:
        """Call Gemini with image to estimate portion, fiber, sugar."""
        import time

        client = genai.Client(api_key=api_key)

        # Build contents: image (if available) + text prompt
        parts = []
        if image_bytes:
            parts.append(genai_types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"))
        parts.append(genai_types.Part.from_text(text=prompt_text))

        for model_name in cls._GEMINI_MODELS:
            for attempt in range(3):
                try:
                    response = client.models.generate_content(
                        model=model_name,
                        contents=parts,
                    )
                    return cls._parse_portion_response(response.text)
                except Exception as e:
                    error_str = str(e)
                    is_503 = "503" in error_str or "UNAVAILABLE" in error_str
                    if is_503 and attempt < 2:
                        wait = (attempt + 1) * 1.5
                        logger.warning(f"Gemini {model_name} portion 503 for '{food_name}' " f"(attempt {attempt + 1}/3). Retrying in {wait}s...")
                        time.sleep(wait)
                        continue
                    logger.error(f"Gemini {model_name} portion failed for '{food_name}': {e}")
                    break
        return None

    @classmethod
    def _call_openrouter_portion(cls, requests_mod, api_key, prompt_text, food_name) -> dict | None:
        """Call OpenRouter (text-only) to estimate portion, fiber, sugar."""
        try:
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": "google/gemini-2.5-flash",
                "messages": [{"role": "system", "content": prompt_text}],
            }
            resp = requests_mod.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=10,
            )
            resp.raise_for_status()
            text = resp.json()["choices"][0]["message"]["content"]
            return cls._parse_portion_response(text)
        except Exception as e:
            logger.error(f"OpenRouter portion failed for '{food_name}': {e}")
            return None

    @staticmethod
    def _parse_portion_response(raw_text: str) -> dict | None:
        """Parse AI response for portion/fiber/sugar estimation."""
        try:
            text = raw_text.strip()
            if text.startswith("```json"):
                text = text.replace("```json", "").replace("```", "").strip()
            elif text.startswith("```"):
                text = text.replace("```", "").strip()

            data = json.loads(text)
            result = {
                "portion_grams": float(data.get("portion_grams", 100)),
                "fiber_per_100g": float(data.get("fiber_per_100g", 0)),
                "sugar_per_100g": float(data.get("sugar_per_100g", 0)),
            }
            # Sanity check: portion should be positive and reasonable
            if result["portion_grams"] <= 0 or result["portion_grams"] > 5000:
                result["portion_grams"] = 100
            return result
        except Exception as e:
            logger.error(f"Failed to parse portion response: {e}")
            return None

    #  AI-based nutrition + portion estimation (full fallback)
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

        api_key = os.environ.get("GEMINI_API_KEY")
        if api_key:
            parsed = cls._call_gemini_nutrition(genai, api_key, system_prompt, food_name)
            if parsed:
                return parsed

        openrouter_key = os.environ.get("OPENROUTER_API_KEY")
        if openrouter_key:
            parsed = cls._call_openrouter_nutrition(requests, openrouter_key, system_prompt, food_name)
            if parsed:
                return parsed

        logger.error(f"All AI providers failed for '{food_name}'. No API keys configured or all calls failed.")
        return {
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "fat": 0,
            "fiber": 0,
            "sugar": 0,
            "serving_size": 0,
            "serving_unit": "g",
            "source": "unavailable",
        }

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
                        logger.warning(f"Gemini {model_name} returned 503 for '{food_name}' " f"(attempt {attempt + 1}/3). Retrying in {wait}s...")
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
                "messages": [{"role": "system", "content": prompt}],
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
