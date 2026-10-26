"""
Jimamet 2.0 - Real-Time Low-Latency Camera & Video Food Detection CLI

Runs real-time Indonesian food detection on webcam, video file, or stream
using the custom YOLO model with instant nutritional information overlay.

Usage:
    python detect_realtime.py --source 0                      # Default webcam
    python detect_realtime.py --source video.mp4              # Video file
    python detect_realtime.py --source 0 --imgsz 320          # Ultra low-latency mode
    python detect_realtime.py --source video.mp4 --save out.mp4
"""

import argparse
import os
import sys
import time
import threading
from typing import Optional

# Setup Django environment for access to Jimamet models & nutrition retrieval
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
try:
    import django
    django.setup()
except Exception as e:
    print(f"[Warning] Django setup skipped: {e}")

import cv2
import numpy as np
from api.services.detection_service import DetectionService


class ThreadedCamera:
    """
    Dedicated thread for video capture. Keeps only the latest fresh frame
    in a 1-slot buffer, completely eliminating OpenCV's internal frame queue lag.
    """
    def __init__(self, source: str | int = 0):
        if str(source).isdigit():
            source = int(source)
        self.cap = cv2.VideoCapture(source)
        if not self.cap.isOpened():
            raise RuntimeError(f"Gagal membuka sumber video: {source}")

        # Try to set low-latency capture options if available
        self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

        self.fps = self.cap.get(cv2.CAP_PROP_FPS) or 30.0
        self.width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        self.total_frames = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))

        self.frame: Optional[np.ndarray] = None
        self.ret = False
        self.running = True
        self.lock = threading.Lock()

        self.thread = threading.Thread(target=self._update, daemon=True)
        self.thread.start()

    def _update(self):
        while self.running:
            if not self.cap.isOpened():
                break
            ret, frame = self.cap.read()
            if not ret:
                self.ret = False
                break
            with self.lock:
                self.frame = frame
                self.ret = ret

    def read(self):
        with self.lock:
            if self.frame is not None:
                return self.ret, self.frame.copy()
            return self.ret, None

    def release(self):
        self.running = False
        if self.thread.is_alive():
            self.thread.join(timeout=1.0)
        self.cap.release()


def draw_hud(frame, fps, latency_ms, detected_count, is_paused=False):
    """Render a modern HUD bar at the top with FPS and latency stats."""
    h, w = frame.shape[:2]
    # Header bar background
    bar_h = 42
    overlay = frame.copy()
    cv2.rectangle(overlay, (0, 0), (w, bar_h), (20, 24, 20), -1)
    cv2.addWeighted(overlay, 0.82, frame, 0.18, 0, frame)

    # Status pill (Live / Paused)
    status_text = "PAUSED" if is_paused else "LIVE"
    status_color = (0, 165, 255) if is_paused else (46, 204, 113)  # BGR
    cv2.circle(frame, (20, 21), 6, status_color, -1)
    cv2.putText(frame, status_text, (34, 26), cv2.FONT_HERSHEY_SIMPLEX, 0.55, status_color, 2, cv2.LINE_AA)

    # FPS & Latency stats
    hud_text = f"FPS: {fps:4.1f} | Latency: {latency_ms:4.0f}ms | Makanan: {detected_count}"
    cv2.putText(frame, hud_text, (115, 26), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (240, 240, 240), 1, cv2.LINE_AA)

    # Instructions in bottom bar
    cv2.putText(
        frame,
        "Tekan 'q' untuk keluar | 's' untuk snapshot | 'space' untuk pause",
        (16, h - 14),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.45,
        (200, 200, 200),
        1,
        cv2.LINE_AA,
    )


def draw_detections(frame, detections):
    """Draw stylish bounding boxes with labels and nutrition badges."""
    palette = [
        (46, 204, 113),   # Emerald
        (52, 152, 219),   # Blue
        (241, 196, 15),   # Amber
        (230, 126, 34),   # Orange
        (155, 89, 182),   # Purple
        (26, 188, 156),   # Turquoise
    ]

    for i, det in enumerate(detections):
        color = palette[det.get("class_id", 0) % len(palette)]
        x1, y1, x2, y2 = [int(v) for v in det["bbox"]]

        # Draw main bounding box with rounded corner accents
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2, cv2.LINE_AA)

        # Draw corner accents
        corner_len = min(20, int((x2 - x1) * 0.2), int((y2 - y1) * 0.2))
        thick = 4
        # Top-left
        cv2.line(frame, (x1, y1), (x1 + corner_len, y1), color, thick)
        cv2.line(frame, (x1, y1), (x1, y1 + corner_len), color, thick)
        # Top-right
        cv2.line(frame, (x2, y1), (x2 - corner_len, y1), color, thick)
        cv2.line(frame, (x2, y1), (x2, y1 + corner_len), color, thick)
        # Bottom-left
        cv2.line(frame, (x1, y2), (x1 + corner_len, y2), color, thick)
        cv2.line(frame, (x1, y2), (x1, y2 - corner_len), color, thick)
        # Bottom-right
        cv2.line(frame, (x2, y2), (x2 - corner_len, y2), color, thick)
        cv2.line(frame, (x2, y2), (x2, y2 - corner_len), color, thick)

        # Label tag
        food_name = det.get("food_name", det.get("raw_label", ""))
        conf = det.get("confidence", 0)
        nutrition = det.get("nutrition", {})
        calories = nutrition.get("calories", 0)

        label_main = f"{food_name} {conf:.0f}%"
        label_nut = f"{calories:.0f} kkal / 100g" if calories > 0 else ""

        # Measure tag dimensions
        (tw1, th1), _ = cv2.getTextSize(label_main, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)
        (tw2, th2), _ = cv2.getTextSize(label_nut, cv2.FONT_HERSHEY_SIMPLEX, 0.42, 1) if label_nut else ((0, 0), 0)

        box_w = max(tw1, tw2) + 16
        box_h = th1 + (th2 + 8 if label_nut else 0) + 12
        tag_y = max(45, y1 - box_h - 4)

        # Label background
        cv2.rectangle(frame, (x1, tag_y), (x1 + box_w, tag_y + box_h), color, -1)
        # Text
        cv2.putText(frame, label_main, (x1 + 8, tag_y + th1 + 4), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2, cv2.LINE_AA)
        if label_nut:
            cv2.putText(frame, label_nut, (x1 + 8, tag_y + th1 + th2 + 10), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (245, 245, 245), 1, cv2.LINE_AA)


def run_detector(
    source=0,
    imgsz=384,
    conf=0.25,
    save_path=None,
    no_view=False,
    skip_frames=1,
):
    print("=" * 60)
    print("   JIMAMET 2.0 - Real-Time Low-Latency Food Detector")
    print("=" * 60)
    print(f"[*] Sumber input     : {source}")
    print(f"[*] Resolusi inferensi: {imgsz}x{imgsz}")
    print(f"[*] Ambang batas conf: {conf}")
    print("[*] Memuat model YOLO...")

    model = DetectionService.get_model()
    if not model:
        print("[Error] Model tidak dapat dimuat.")
        return

    print("[*] Membuka stream video...")
    is_video_file = isinstance(source, str) and os.path.isfile(source)
    if is_video_file:
        cap = cv2.VideoCapture(source)
        is_threaded = False
    else:
        try:
            cap = ThreadedCamera(source)
            is_threaded = True
        except Exception as e:
            print(f"[Fallback] ThreadedCamera gagal, menggunakan cv2.VideoCapture biasa: {e}")
            cap = cv2.VideoCapture(int(source) if str(source).isdigit() else source)
            is_threaded = False

    writer = None
    if save_path:
        w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) if not is_threaded else cap.width)
        h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) if not is_threaded else cap.height)
        fps = cap.get(cv2.CAP_PROP_FPS) if not is_threaded else cap.fps
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        writer = cv2.VideoWriter(save_path, fourcc, fps or 25.0, (w, h))
        print(f"[*] Output akan disimpan ke: {save_path}")

    fps_history = []
    last_detections = []
    last_infer_ms = 0.0
    frame_counter = 0
    paused = False
    window_name = "Jimamet 2.0 - Real-Time Food Detection"

    if not no_view:
        cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)

    print("[*] Deteksi berjalan. Tekan 'q' di jendela tampilan untuk berhenti.")

    try:
        while True:
            if not paused:
                t_frame_start = time.perf_counter()
                if is_threaded:
                    ret, frame = cap.read()
                else:
                    ret, frame = cap.read()

                if not ret or frame is None:
                    if is_video_file:
                        print("[*] Pemutaran video selesai.")
                    else:
                        print("[*] Stream kamera terputus.")
                    break

                frame_counter += 1

                # Run inference on every N-th frame
                if frame_counter % skip_frames == 0:
                    t_inf_start = time.perf_counter()
                    res = DetectionService.detect_frame(
                        frame,
                        imgsz=imgsz,
                        conf_threshold=conf,
                        fast_mode=True,
                    )
                    last_infer_ms = res.get("inference_ms", (time.perf_counter() - t_inf_start) * 1000)
                    last_detections = res.get("detections", [])

                # Calculate smoothed FPS
                frame_time = time.perf_counter() - t_frame_start
                if frame_time > 0:
                    fps_history.append(1.0 / frame_time)
                    if len(fps_history) > 30:
                        fps_history.pop(0)
                current_fps = sum(fps_history) / max(1, len(fps_history))

                display_frame = frame.copy()
                draw_detections(display_frame, last_detections)
                draw_hud(display_frame, current_fps, last_infer_ms, len(last_detections), is_paused=False)

                if writer:
                    writer.write(display_frame)

            else:
                # When paused, keep rendering last frame with PAUSED badge
                display_frame = frame.copy()
                draw_detections(display_frame, last_detections)
                draw_hud(display_frame, 0.0, last_infer_ms, len(last_detections), is_paused=True)

            if not no_view:
                cv2.imshow(window_name, display_frame)
                key = cv2.waitKey(1 if not paused else 30) & 0xFF
                if key == ord("q") or key == 27:  # 'q' or ESC
                    break
                elif key == ord(" "):  # spacebar pause toggle
                    paused = not paused
                elif key == ord("s"):  # snapshot
                    snap_name = f"snapshot_{int(time.time())}.jpg"
                    cv2.imwrite(snap_name, display_frame)
                    print(f"[Snapshot] Gambar disimpan: {snap_name}")

    finally:
        if is_threaded:
            cap.release()
        else:
            cap.release()
        if writer:
            writer.release()
        if not no_view:
            cv2.destroyAllWindows()
        print("[*] Deteksi ditutup dengan sukses.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Jimamet Real-Time Food Detector")
    parser.add_argument("--source", default="0", help="Camera index (0, 1), video file, or RTSP stream")
    parser.add_argument("--imgsz", type=int, default=384, help="Inference resolution (e.g. 320, 384, 416, 640)")
    parser.add_argument("--conf", type=float, default=0.25, help="Confidence threshold (0.0 - 1.0)")
    parser.add_argument("--save", default=None, help="Save output video to file")
    parser.add_argument("--no-view", action="store_true", help="Run without opening GUI window")
    parser.add_argument("--skip-frames", type=int, default=1, help="Process every N-th frame")
    args = parser.parse_args()

    run_detector(
        source=args.source,
        imgsz=args.imgsz,
        conf=args.conf,
        save_path=args.save,
        no_view=args.no_view,
        skip_frames=args.skip_frames,
    )
