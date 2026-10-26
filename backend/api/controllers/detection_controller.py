import json
import logging
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from api.services.detection_service import DetectionService

logger = logging.getLogger(__name__)


@csrf_exempt
@require_http_methods(["POST"])
def detect_food_api(request):
    """
    Endpoint untuk mengunggah gambar dan mendeteksi makanan menggunakan YOLOv8.
    Mendukung mode cepat via query param fast=1 atau fast=true.
    """
    if "image" not in request.FILES:
        return JsonResponse({"status": "error", "message": "Tidak ada gambar yang diunggah"}, status=400)

    image_file = request.FILES["image"]
    fast_mode = request.GET.get("fast", "0").lower() in ("1", "true", "yes")

    try:
        predictions = DetectionService.detect_food(image_file, fast_mode=fast_mode)
        return JsonResponse({
            "status": "success",
            "message": "Deteksi berhasil",
            "data": predictions
        }, status=200)
    except Exception as e:
        logger.error(f"Detection API error: {str(e)}")
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def detect_frame_api(request):
    """
    Endpoint ultra low-latency untuk frame tunggal dari video atau kamera streaming.
    Menerima JSON base64 {'frame': '...'} atau multipart {'image': file}.
    """
    try:
        conf_threshold = 0.35
        imgsz = 384
        fast_mode = True
        image_input = None

        content_type = request.content_type or ""

        if "multipart/form-data" in content_type:
            if "image" in request.FILES:
                image_input = request.FILES["image"]
            elif "frame" in request.FILES:
                image_input = request.FILES["frame"]
            conf_threshold = float(request.POST.get("conf", 0.35))
            imgsz = int(request.POST.get("imgsz", 384))
            fast_mode = request.POST.get("fast", "true").lower() in ("1", "true", "yes")
        else:
            try:
                body = json.loads(request.body.decode("utf-8")) if request.body else {}
            except Exception:
                body = {}

            image_input = body.get("frame") or body.get("image")
            conf_threshold = float(body.get("conf", 0.35))
            imgsz = int(body.get("imgsz", 384))
            fast_mode = bool(body.get("fast", True))

        if not image_input:
            return JsonResponse({"status": "error", "message": "Frame gambar tidak ditemukan"}, status=400)

        result = DetectionService.detect_frame(
            image_input,
            imgsz=imgsz,
            conf_threshold=conf_threshold,
            fast_mode=fast_mode,
        )

        return JsonResponse(result, status=200)

    except Exception as e:
        logger.error(f"detect_frame_api error: {str(e)}")
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def detect_video_api(request):
    """
    Endpoint untuk mengunggah file video (.mp4, .webm, .mov) dan melakukan
    analisis deteksi makanan berbasis frame sampling dengan ringkasan nutrisi total.
    """
    if "video" not in request.FILES:
        return JsonResponse({"status": "error", "message": "Tidak ada file video yang diunggah"}, status=400)

    video_file = request.FILES["video"]
    try:
        sample_fps = float(request.POST.get("sample_fps", 2.0))
        conf_threshold = float(request.POST.get("conf", 0.35))
        imgsz = int(request.POST.get("imgsz", 384))

        result = DetectionService.process_video(
            video_file,
            sample_fps=sample_fps,
            conf_threshold=conf_threshold,
            imgsz=imgsz,
        )

        return JsonResponse(result, status=200)

    except Exception as e:
        logger.error(f"detect_video_api error: {str(e)}")
        return JsonResponse({"status": "error", "message": str(e)}, status=500)
