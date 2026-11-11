"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  apiCreateFoodRecord,
  apiDetectFood,
  apiDetectFrame,
  apiDetectVideo,
  getWsDetectUrl,
  isDetectWsSupported,
} from "@/lib/api";
import { formatFoodLabel } from "@/lib/food-labels";

type LegacyGetUserMedia = (
  constraints: MediaStreamConstraints,
  onSuccess: (stream: MediaStream) => void,
  onError: (err: unknown) => void
) => void;

interface CameraErrorInfo {
  title: string;
  message: string;
  showNativeCapture?: boolean;
}

function hasUserMediaSupport(): boolean {
  if (typeof navigator === "undefined") return false;
  if (typeof navigator.mediaDevices?.getUserMedia === "function") return true;
  const legacyNav = navigator as Navigator & {
    getUserMedia?: LegacyGetUserMedia;
    webkitGetUserMedia?: LegacyGetUserMedia;
    mozGetUserMedia?: LegacyGetUserMedia;
  };
  return Boolean(
    legacyNav.getUserMedia ||
      legacyNav.webkitGetUserMedia ||
      legacyNav.mozGetUserMedia
  );
}

async function requestCameraStream(
  constraints: MediaStreamConstraints
): Promise<MediaStream> {
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices?.getUserMedia === "function"
  ) {
    return navigator.mediaDevices.getUserMedia(constraints);
  }

  if (typeof navigator !== "undefined") {
    const legacyNav = navigator as Navigator & {
      getUserMedia?: LegacyGetUserMedia;
      webkitGetUserMedia?: LegacyGetUserMedia;
      mozGetUserMedia?: LegacyGetUserMedia;
    };
    const legacyFn =
      legacyNav.getUserMedia ||
      legacyNav.webkitGetUserMedia ||
      legacyNav.mozGetUserMedia;

    if (legacyFn) {
      return new Promise<MediaStream>((resolve, reject) => {
        legacyFn.call(navigator, constraints, resolve, reject);
      });
    }
  }

  const isInsecure =
    typeof window !== "undefined" && window.isSecureContext === false;
  const error = new Error(
    isInsecure
      ? "Browser memblokir streaming kamera pada koneksi HTTP jaringan lokal. Gunakan HTTPS atau localhost."
      : "Browser pada perangkat ini tidak mendukung akses kamera real-time."
  );
  error.name = isInsecure
    ? "InsecureContextError"
    : "MediaDevicesUnavailableError";
  throw error;
}

interface NutrientResult {
  name: string;
  value: number;
  unit: string;
  pct: number;
  color: string;
}

interface AnalysisResult {
  foodName: string;
  confidence: number;
  calories: number;
  portion: string;
  nutrients: NutrientResult[];
  tags: string[];
  recommendation: string;
  nutritionUnavailable: boolean;
}

interface DetectionBox {
  class_id: number;
  raw_label: string;
  food_name: string;
  confidence: number;
  bbox: [number, number, number, number];
  bbox_normalized: [number, number, number, number];
  nutrition: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    serving_size?: number;
    serving_unit?: string;
    source?: string;
  };
}

interface VideoSummaryItem {
  food_name: string;
  raw_label: string;
  max_confidence: number;
  first_seen: number;
  last_seen: number;
  appearances: number;
  nutrition: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
}

interface VideoReport {
  video_info: {
    fps: number;
    total_frames: number;
    duration_sec: number;
    sampled_frames: number;
    width: number;
    height: number;
  };
  summary: VideoSummaryItem[];
  total_nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

const PALETTE = [
  { stroke: "#4caf50", fill: "rgba(76, 175, 80, 0.18)", tag: "#2e7d32" },
  { stroke: "#2196f3", fill: "rgba(33, 150, 243, 0.18)", tag: "#1565c0" },
  { stroke: "#ff9800", fill: "rgba(255, 152, 0, 0.18)", tag: "#e65100" },
  { stroke: "#9c27b0", fill: "rgba(156, 39, 176, 0.18)", tag: "#6a1b9a" },
  { stroke: "#00bcd4", fill: "rgba(0, 188, 212, 0.18)", tag: "#00838f" },
  { stroke: "#e91e63", fill: "rgba(233, 30, 99, 0.18)", tag: "#c2185b" },
];

function drawDetections(
  canvas: HTMLCanvasElement,
  detections: DetectionBox[],
  activeFoodName?: string | null,
  isMirrored: boolean = false
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  detections.forEach((det) => {
    const [nx1, ny1, nx2, ny2] = det.bbox_normalized;
    const bw = (nx2 - nx1) * w;
    const bh = (ny2 - ny1) * h;
    const x = isMirrored ? (1 - nx2) * w : nx1 * w;
    const y = ny1 * h;

    const color = PALETTE[det.class_id % PALETTE.length];
    const isHighlighted = activeFoodName === det.food_name;

    ctx.save();
    ctx.lineWidth = isHighlighted ? 4 : 2.5;
    ctx.strokeStyle = color.stroke;
    ctx.fillStyle = color.fill;

    // Rounded rectangle
    const r = Math.min(8, bw * 0.2, bh * 0.2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + bw - r, y);
    ctx.quadraticCurveTo(x + bw, y, x + bw, y + r);
    ctx.lineTo(x + bw, y + bh - r);
    ctx.quadraticCurveTo(x + bw, y + bh, x + bw - r, y + bh);
    ctx.lineTo(x + r, y + bh);
    ctx.quadraticCurveTo(x, y + bh, x, y + bh - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();

    // Corner accents
    const cLen = Math.min(18, bw * 0.25, bh * 0.25);
    ctx.lineWidth = 4;
    ctx.strokeStyle = color.stroke;
    // Top-left
    ctx.beginPath();
    ctx.moveTo(x, y + cLen);
    ctx.lineTo(x, y);
    ctx.lineTo(x + cLen, y);
    ctx.stroke();
    // Top-right
    ctx.beginPath();
    ctx.moveTo(x + bw - cLen, y);
    ctx.lineTo(x + bw, y);
    ctx.lineTo(x + bw, y + cLen);
    ctx.stroke();
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(x, y + bh - cLen);
    ctx.lineTo(x, y + bh);
    ctx.lineTo(x + cLen, y + bh);
    ctx.stroke();
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(x + bw - cLen, y + bh);
    ctx.lineTo(x + bw, y + bh);
    ctx.lineTo(x + bw, y + bh - cLen);
    ctx.stroke();

    // Tag Pill (Food Name + Conf % + Calories)
    const displayName = formatFoodLabel(det.food_name);
    const label = `${displayName} ${Math.round(det.confidence)}%`;
    const calLabel = det.nutrition?.calories ? `${Math.round(det.nutrition.calories)} kkal` : "";

    ctx.font = "bold 13px 'Plus Jakarta Sans', sans-serif";
    const textWidth = ctx.measureText(label).width;
    const tagW = Math.max(textWidth + 20, calLabel ? 115 : 85);
    const tagH = calLabel ? 36 : 24;
    const tagY = Math.max(6, y - tagH - 6);

    // Pill background
    ctx.fillStyle = color.tag;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x, tagY, tagW, tagH, 6);
      ctx.fill();
    } else {
      ctx.fillRect(x, tagY, tagW, tagH);
    }

    // Text
    ctx.fillStyle = "#ffffff";
    ctx.fillText(label, x + 8, tagY + 16);
    if (calLabel) {
      ctx.font = "11px Inter, sans-serif";
      ctx.fillStyle = "#e0f2f1";
      ctx.fillText(calLabel, x + 8, tagY + 30);
    }

    ctx.restore();
  });
}

export default function FoodAnalysisPage() {
  // ── Upload / Photo Mode State ──
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [, setUploadDetections] = useState<DetectionBox[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraCaptureInputRef = useRef<HTMLInputElement>(null);
  const uploadCanvasRef = useRef<HTMLCanvasElement>(null);

  // ── Camera Mode State ──
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<CameraErrorInfo | null>(null);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
  const [isFlipping, setIsFlipping] = useState(false);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [resolutionPreset, setResolutionPreset] = useState<320 | 480 | 640>(480);
  const [cameraFps, setCameraFps] = useState<number>(0);
  const [cameraLatency, setCameraLatency] = useState<number>(0);
  const [cameraDetections, setCameraDetections] = useState<DetectionBox[]>([]);
  const [cameraPersonDetected, setCameraPersonDetected] = useState<boolean>(false);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraCanvasRef = useRef<HTMLCanvasElement>(null);
  const cameraWsRef = useRef<WebSocket | null>(null);
  const cameraInFlightRef = useRef<boolean>(false);
  const cameraIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fpsHistoryRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef<number>(0);

  // ── Video Mode State ──
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoDetections, setVideoDetections] = useState<DetectionBox[]>([]);
  const [videoReport, setVideoReport] = useState<VideoReport | null>(null);
  const [isScanningVideo, setIsScanningVideo] = useState(false);
  const videoElementRef = useRef<HTMLVideoElement>(null);
  const videoCanvasRef = useRef<HTMLCanvasElement>(null);
  const videoInFlightRef = useRef<boolean>(false);

  // ── Common Result State ──
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [saveStatus, setSaveStatus] = useState<"" | "saving" | "saved">("");

  // ═══════════════════════════════════════════════════
  //  CLEANUP & DEVICE DISCOVERY
  // ═══════════════════════════════════════════════════

  const stopCameraStream = useCallback(() => {
    if (typeof window !== "undefined") {
      document.body.style.overflow = "";
    }
    if (cameraIntervalRef.current) {
      clearInterval(cameraIntervalRef.current);
      cameraIntervalRef.current = null;
    }
    if (cameraWsRef.current) {
      try {
        cameraWsRef.current.close();
      } catch {}
      cameraWsRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (cameraVideoRef.current && cameraVideoRef.current.srcObject) {
      const stream = cameraVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      cameraVideoRef.current.srcObject = null;
    }
    cameraInFlightRef.current = false;
    setCameraActive(false);
    setCameraFps(0);
    setCameraLatency(0);
    setCameraDetections([]);
    setCameraPersonDetected(false);
    if (cameraCanvasRef.current) {
      const ctx = cameraCanvasRef.current.getContext("2d");
      ctx?.clearRect(0, 0, cameraCanvasRef.current.width, cameraCanvasRef.current.height);
    }
  }, []);

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  // Close camera on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && cameraActive) {
        stopCameraStream();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cameraActive, stopCameraStream]);

  // Ensure camera stream is attached and playing when camera view mounts
  useEffect(() => {
    if (cameraActive && cameraVideoRef.current && streamRef.current) {
      if (cameraVideoRef.current.srcObject !== streamRef.current) {
        cameraVideoRef.current.srcObject = streamRef.current;
        cameraVideoRef.current.play().catch((err) => {
          console.warn("Camera video play on mount error:", err);
        });
      }
    }
  }, [cameraActive]);

  // Load available camera devices
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          const videoDevs = devices.filter((d) => d.kind === "videoinput");
          setVideoDevices(videoDevs);
          if (videoDevs.length > 0 && !selectedDeviceId) {
            setSelectedDeviceId(videoDevs[0].deviceId);
          }
        })
        .catch(() => {});
    }
  }, [selectedDeviceId]);

  // ═══════════════════════════════════════════════════
  //  HELPER: SET RESULT FROM DETECTIONS
  // ═══════════════════════════════════════════════════

  const populateResultFromTopDetection = useCallback((top: DetectionBox) => {
    const nut = top.nutrition || {};
    const cals = nut.calories || 0;
    const protein = nut.protein || 0;
    const carbs = nut.carbs || 0;
    const fat = nut.fat || 0;
    const fiber = nut.fiber || 0;
    const sugar = nut.sugar || 0;
    const servingSize = nut.serving_size || 0;
    const servingUnit = nut.serving_unit || "g";
    const isUnavailable = nut.source === "unavailable";

    const portionLabel =
      servingSize > 0 ? `~${Math.round(servingSize)}${servingUnit}` : "1 Porsi (100g)";

    setResult({
      foodName: formatFoodLabel(top.food_name),
      confidence: top.confidence,
      calories: cals,
      portion: portionLabel,
      nutrients: [
        {
          name: "Protein",
          value: protein,
          unit: "g",
          pct: Math.min(100, Math.round((protein / 50) * 100)),
          color: "#c85a32",
        },
        {
          name: "Karbohidrat",
          value: carbs,
          unit: "g",
          pct: Math.min(100, Math.round((carbs / 300) * 100)),
          color: "#d9822b",
        },
        {
          name: "Lemak",
          value: fat,
          unit: "g",
          pct: Math.min(100, Math.round((fat / 65) * 100)),
          color: "#2b6f77",
        },
        {
          name: "Serat",
          value: fiber,
          unit: "g",
          pct: Math.min(100, Math.round((fiber / 25) * 100)),
          color: "#588157",
        },
        {
          name: "Gula",
          value: sugar,
          unit: "g",
          pct: Math.min(100, Math.round((sugar / 50) * 100)),
          color: "#a8385d",
        },
      ],
      tags: isUnavailable
        ? ["Data Tidak Tersedia"]
        : nut.source === "csv"
        ? ["Data Akurat (Dataset)", "Real-time Low Latency"]
        : ["Estimasi AI"],
      recommendation: isUnavailable
        ? "Layanan AI sedang tidak tersedia. Silakan coba analisis ulang beberapa saat lagi."
        : nut.source === "csv"
        ? "Data kalori dan makronutrisi divalidasi langsung dari basis data gizi makanan Indonesia."
        : "Nutrisi di atas merupakan estimasi model berdasarkan komposisi porsi makanan standar.",
      nutritionUnavailable: isUnavailable,
    });
  }, []);

  // ═══════════════════════════════════════════════════
  //  1. UNIFIED FILE INPUT (PHOTO & VIDEO)
  // ═══════════════════════════════════════════════════

  const handleVideoFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("video/")) {
        alert("Pilih file video yang valid (.mp4, .webm, .mov).");
        return;
      }
      stopCameraStream();
      setCameraError(null);
      setSelectedImage(null);
      setSelectedFile(null);
      setUploadDetections([]);
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setVideoReport(null);
      setVideoDetections([]);
      setResult(null);
    },
    [stopCameraStream]
  );

  const handleFile = useCallback(
    (file: File) => {
      if (file.type.startsWith("image/")) {
        stopCameraStream();
        setCameraError(null);
        setVideoSrc(null);
        setVideoFile(null);
        setVideoReport(null);
        setVideoDetections([]);
        setFileName(file.name);
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setSelectedImage(e.target?.result as string);
          setResult(null);
          setUploadDetections([]);
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith("video/")) {
        handleVideoFile(file);
      }
    },
    [stopCameraStream, handleVideoFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
    },
    [handleFile]
  );

  const analyzeImage = async () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    setResult(null);
    setUploadDetections([]);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const { ok, data } = await apiDetectFood(formData, false);

      if (ok && data.status === "success" && data.data && data.data.length > 0) {
        const detections: DetectionBox[] = data.data;
        setUploadDetections(detections);

        const top = [...detections].sort((a, b) => b.confidence - a.confidence)[0];
        populateResultFromTopDetection(top);

        if (uploadCanvasRef.current) {
          drawDetections(uploadCanvasRef.current, detections, top.food_name);
        }
      } else {
        alert("Makanan tidak terdeteksi: Pastikan objek makanan terlihat jelas.");
      }
    } catch (err) {
      console.error(err);
      alert("Gagal menghubungi server deteksi.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ═══════════════════════════════════════════════════
  //  2. REAL-TIME CAMERA FLOW (WebSocket / Low-Latency)
  // ═══════════════════════════════════════════════════

  const startCamera = async (
    facing: "environment" | "user" = cameraFacing,
    deviceId?: string
  ) => {
    setCameraError(null);

    if (!hasUserMediaSupport()) {
      const isInsecure =
        typeof window !== "undefined" && window.isSecureContext === false;
      const httpsUrl =
        typeof window !== "undefined"
          ? `https://${window.location.host}${window.location.pathname}`
          : "";
      setCameraError({
        title: isInsecure
          ? "Kamera Real-Time Membutuhkan Koneksi Aman (HTTPS)"
          : "Kamera Real-Time Tidak Tersedia di Browser Ini",
        message: isInsecure
          ? `Browser memblokir streaming kamera langsung pada alamat HTTP jaringan lokal (${window.location.origin}). Jalankan server mode HTTPS (run-https.bat / npm run dev:https) lalu buka ${httpsUrl}, atau ambil foto langsung memakai kamera perangkat di bawah ini.`
          : "Browser atau perangkat ini tidak menyediakan akses streaming kamera (getUserMedia). Anda tetap dapat memotret makanan secara langsung menggunakan tombol di bawah.",
        showNativeCapture: true,
      });
      return;
    }

    try {
      stopCameraStream();
      setSelectedImage(null);
      setSelectedFile(null);
      setVideoSrc(null);
      setVideoFile(null);
      setVideoReport(null);
      setResult(null);

      if (typeof window !== "undefined" && window.innerWidth <= 768) {
        document.body.style.overflow = "hidden";
      }

      const targetDeviceId = deviceId !== undefined ? deviceId : selectedDeviceId;
      let stream: MediaStream;

      try {
        const constraints: MediaStreamConstraints = {
          video: targetDeviceId
            ? {
                deviceId: { exact: targetDeviceId },
                width: { ideal: resolutionPreset === 640 ? 1280 : 854 },
                height: { ideal: resolutionPreset === 640 ? 720 : 480 },
              }
            : {
                facingMode: { ideal: facing },
                width: { ideal: resolutionPreset === 640 ? 1280 : 854 },
                height: { ideal: resolutionPreset === 640 ? 720 : 480 },
              },
          audio: false,
        };
        stream = await requestCameraStream(constraints);
      } catch (err) {
        const errName = (err as { name?: string })?.name;
        if (
          errName === "NotAllowedError" ||
          errName === "PermissionDeniedError" ||
          errName === "SecurityError" ||
          errName === "InsecureContextError" ||
          errName === "MediaDevicesUnavailableError"
        ) {
          throw err;
        }
        try {
          stream = await requestCameraStream({
            video: { facingMode: facing },
            audio: false,
          });
        } catch (fallbackErr) {
          const fbName = (fallbackErr as { name?: string })?.name;
          if (fbName === "NotAllowedError" || fbName === "PermissionDeniedError") {
            throw fallbackErr;
          }
          stream = await requestCameraStream({ video: true, audio: false });
        }
      }

      if (typeof navigator !== "undefined" && navigator.mediaDevices?.enumerateDevices) {
        navigator.mediaDevices
          .enumerateDevices()
          .then((devices) => {
            const videoDevs = devices.filter((d) => d.kind === "videoinput" && d.deviceId);
            if (videoDevs.length > 0) {
              setVideoDevices(videoDevs);
            }
          })
          .catch(() => {});
      }

      streamRef.current = stream;
      setCameraActive(true);

      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
        try {
          await cameraVideoRef.current.play();
        } catch (playErr) {
          console.warn("Camera video play warning:", playErr);
        }
      }

      let ws: WebSocket | null = null;
      let useFallback = !isDetectWsSupported();

      if (!useFallback) {
        try {
          const wsUrl = getWsDetectUrl();
          ws = new WebSocket(wsUrl);
          cameraWsRef.current = ws;

          ws.onerror = () => {
            useFallback = true;
          };

          ws.onclose = () => {
            useFallback = true;
          };

          ws.onmessage = (event) => {
            try {
              const res = JSON.parse(event.data);
              if (res.status === "success") {
                const dets: DetectionBox[] = res.detections || [];
                setCameraDetections(dets);
                setCameraPersonDetected(Boolean(res.person_detected));

                if (res.ts) {
                  const rtt = Date.now() - res.ts;
                  setCameraLatency(rtt);
                }

                if (cameraCanvasRef.current && cameraVideoRef.current) {
                  const v = cameraVideoRef.current;
                  cameraCanvasRef.current.width = v.videoWidth || 640;
                  cameraCanvasRef.current.height = v.videoHeight || 480;
                  drawDetections(cameraCanvasRef.current, dets, null, facing === "user");
                }
              }
            } catch (e) {
              console.error("WS parse error:", e);
            } finally {
              cameraInFlightRef.current = false;
            }
          };
        } catch {
          useFallback = true;
        }
      }

      const offscreen = document.createElement("canvas");
      const offCtx = offscreen.getContext("2d", { willReadFrequently: true });

      cameraIntervalRef.current = setInterval(async () => {
        if (!cameraVideoRef.current || cameraVideoRef.current.readyState < 2) return;
        if (cameraInFlightRef.current) return;

        const video = cameraVideoRef.current;
        const targetW = resolutionPreset;
        const aspect = (video.videoHeight || 360) / (video.videoWidth || 480);
        const targetH = Math.round(targetW * aspect);

        offscreen.width = targetW;
        offscreen.height = targetH;
        offCtx?.drawImage(video, 0, 0, targetW, targetH);

        const frameData = offscreen.toDataURL("image/jpeg", 0.65);
        const sendTs = Date.now();

        const now = Date.now();
        const prev = lastFrameTimeRef.current;
        lastFrameTimeRef.current = now;
        if (prev > 0 && now > prev) {
          fpsHistoryRef.current.push(1000 / (now - prev));
          if (fpsHistoryRef.current.length > 10) fpsHistoryRef.current.shift();
          const avgFps =
            fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length;
          setCameraFps(Math.round(avgFps * 10) / 10);
        }

        cameraInFlightRef.current = true;

        if (ws && ws.readyState === WebSocket.OPEN && !useFallback) {
          ws.send(
            JSON.stringify({
              frame: frameData,
              ts: sendTs,
              conf: 0.35,
              imgsz: resolutionPreset,
              fast: true,
            })
          );
        } else {
          try {
            const { ok, data } = await apiDetectFrame({
              frame: frameData,
              conf: 0.35,
              imgsz: resolutionPreset,
              fast: true,
            });
            if (ok && data.status === "success") {
              const dets: DetectionBox[] = data.detections || [];
              setCameraDetections(dets);
              setCameraPersonDetected(Boolean(data.person_detected));
              setCameraLatency(Date.now() - sendTs);
              if (cameraCanvasRef.current && cameraVideoRef.current) {
                const v = cameraVideoRef.current;
                cameraCanvasRef.current.width = v.videoWidth || 640;
                cameraCanvasRef.current.height = v.videoHeight || 480;
                drawDetections(cameraCanvasRef.current, dets, null, facing === "user");
              }
            }
          } catch (e) {
            console.error("HTTP frame fallback error:", e);
          } finally {
            cameraInFlightRef.current = false;
          }
        }
      }, 70);
    } catch (err: unknown) {
      const e = err as { name?: string; message?: string };
      stopCameraStream();
      if (e?.name === "NotAllowedError" || e?.name === "PermissionDeniedError") {
        setCameraError({
          title: "Izin Kamera Ditolak",
          message:
            "Izin akses kamera ditolak oleh browser. Aktifkan izin kamera pada ikon gembok/pengaturan situs di bilah alamat, atau ambil foto langsung dari kamera perangkat.",
          showNativeCapture: true,
        });
      } else if (e?.name === "NotFoundError" || e?.name === "DevicesNotFoundError") {
        setCameraError({
          title: "Kamera Tidak Ditemukan",
          message:
            "Tidak ada perangkat kamera yang terdeteksi. Pastikan kamera terhubung atau unggah foto makanan dari galeri.",
          showNativeCapture: false,
        });
      } else if (e?.name === "NotReadableError" || e?.name === "TrackStartError") {
        setCameraError({
          title: "Kamera Sedang Digunakan",
          message:
            "Kamera sedang dipakai oleh aplikasi atau tab lain. Tutup aplikasi lain yang menggunakan kamera lalu coba lagi.",
          showNativeCapture: true,
        });
      } else {
        setCameraError({
          title: "Tidak Dapat Mengakses Kamera",
          message:
            e?.message || "Pastikan izin kamera telah diberikan pada pengaturan browser.",
          showNativeCapture: true,
        });
      }
    }
  };

  const toggleCameraFacing = async () => {
    setIsFlipping(true);
    setTimeout(() => setIsFlipping(false), 500);

    const nextFacing = cameraFacing === "environment" ? "user" : "environment";
    setCameraFacing(nextFacing);

    let nextDeviceId: string | undefined = undefined;
    if (videoDevices.length > 1) {
      const currIdx = videoDevices.findIndex((d) => d.deviceId === selectedDeviceId);
      const nextIdx = (currIdx + 1) % videoDevices.length;
      nextDeviceId = videoDevices[nextIdx]?.deviceId;
      if (nextDeviceId) setSelectedDeviceId(nextDeviceId);
    }

    await startCamera(nextFacing, nextDeviceId);
  };

  const captureCameraSnapshot = () => {
    if (!cameraVideoRef.current) return;
    const video = cameraVideoRef.current;
    const c = document.createElement("canvas");
    c.width = video.videoWidth || 640;
    c.height = video.videoHeight || 480;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    if (cameraFacing === "user") {
      ctx.translate(c.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, c.width, c.height);

    const snapshotUrl = c.toDataURL("image/jpeg", 0.9);
    setSelectedImage(snapshotUrl);
    setFileName("Snapshot Kamera");

    if (cameraDetections.length > 0) {
      const top = [...cameraDetections].sort((a, b) => b.confidence - a.confidence)[0];
      populateResultFromTopDetection(top);
      const currentDets = [...cameraDetections];
      setTimeout(() => {
        if (uploadCanvasRef.current) {
          uploadCanvasRef.current.width = c.width;
          uploadCanvasRef.current.height = c.height;
          drawDetections(uploadCanvasRef.current, currentDets, top.food_name, false);
        }
      }, 150);
    } else if (cameraPersonDetected) {
      alert("Kamera mendeteksi wajah/orang, bukan makanan. Silakan arahkan kamera ke hidangan makanan Anda.");
    } else {
      alert("Tidak ada makanan yang terdeteksi pada frame ini. Coba arahkan kamera lebih dekat.");
    }
    stopCameraStream();
  };

  // ═══════════════════════════════════════════════════
  //  3. VIDEO PLAYBACK FLOW
  // ═══════════════════════════════════════════════════

  const toggleVideoPlay = () => {
    if (!videoElementRef.current) return;
    if (isVideoPlaying) {
      videoElementRef.current.pause();
      setIsVideoPlaying(false);
    } else {
      videoElementRef.current.play();
      setIsVideoPlaying(true);
    }
  };

  useEffect(() => {
    let animId: number;
    const offscreen = document.createElement("canvas");
    const offCtx = offscreen.getContext("2d", { willReadFrequently: true });

    const processVideoFrame = async () => {
      if (
        isVideoPlaying &&
        videoElementRef.current &&
        !videoElementRef.current.paused &&
        !videoElementRef.current.ended
      ) {
        const v = videoElementRef.current;
        setVideoCurrentTime(v.currentTime);

        if (!videoInFlightRef.current && v.readyState >= 2) {
          videoInFlightRef.current = true;
          const targetW = 384;
          const aspect = (v.videoHeight || 360) / (v.videoWidth || 480);
          offscreen.width = targetW;
          offscreen.height = Math.round(targetW * aspect);
          offCtx?.drawImage(v, 0, 0, offscreen.width, offscreen.height);

          const frameData = offscreen.toDataURL("image/jpeg", 0.6);

          try {
            const { ok, data } = await apiDetectFrame({
              frame: frameData,
              conf: 0.35,
              imgsz: 384,
              fast: true,
            });

            if (ok && data.status === "success") {
              const dets: DetectionBox[] = data.detections || [];
              setVideoDetections(dets);

              if (videoCanvasRef.current) {
                videoCanvasRef.current.width = v.videoWidth || 640;
                videoCanvasRef.current.height = v.videoHeight || 480;
                drawDetections(videoCanvasRef.current, dets);
              }
            }
          } catch (e) {
            console.error("Video frame detection error:", e);
          } finally {
            videoInFlightRef.current = false;
          }
        }
      }
      if (isVideoPlaying) {
        animId = requestAnimationFrame(processVideoFrame);
      }
    };

    if (isVideoPlaying) {
      animId = requestAnimationFrame(processVideoFrame);
    }

    return () => cancelAnimationFrame(animId);
  }, [isVideoPlaying]);

  const captureVideoFrame = () => {
    if (!videoElementRef.current) return;
    const v = videoElementRef.current;
    const c = document.createElement("canvas");
    c.width = v.videoWidth || 640;
    c.height = v.videoHeight || 480;
    const ctx = c.getContext("2d");
    ctx?.drawImage(v, 0, 0, c.width, c.height);

    const snapshotUrl = c.toDataURL("image/jpeg", 0.9);
    setSelectedImage(snapshotUrl);

    if (videoDetections.length > 0) {
      const top = [...videoDetections].sort((a, b) => b.confidence - a.confidence)[0];
      populateResultFromTopDetection(top);
    } else {
      alert("Tidak ada makanan terdeteksi pada detik video ini. Coba geser ke frame lain.");
    }
  };

  const scanEntireVideo = async () => {
    if (!videoFile) return;
    setIsScanningVideo(true);
    setVideoReport(null);

    try {
      const formData = new FormData();
      formData.append("video", videoFile);
      formData.append("sample_fps", "2.0");
      formData.append("conf", "0.35");

      const { ok, data } = await apiDetectVideo(formData);
      if (ok && data.status === "success") {
        setVideoReport(data);

        if (data.summary && data.summary.length > 0) {
          const first = data.summary[0];
          populateResultFromTopDetection({
            class_id: 0,
            raw_label: first.raw_label,
            food_name: first.food_name,
            confidence: first.max_confidence,
            bbox: [0, 0, 0, 0],
            bbox_normalized: [0, 0, 1, 1],
            nutrition: first.nutrition,
          });
        }
      } else {
        alert("Gagal memproses video: " + (data?.message || "Format video tidak didukung."));
      }
    } catch (err) {
      console.error(err);
      alert("Gagal menghubungi server analisis video.");
    } finally {
      setIsScanningVideo(false);
    }
  };

  // ═══════════════════════════════════════════════════
  //  SAVE TO HISTORY
  // ═══════════════════════════════════════════════════

  const saveToHistory = async () => {
    if (!result) return;
    setSaveStatus("saving");
    const { ok } = await apiCreateFoodRecord({
      food_name: result.foodName,
      calories: result.calories,
      protein: result.nutrients.find((n) => n.name === "Protein")?.value || 0,
      carbs: result.nutrients.find((n) => n.name === "Karbohidrat")?.value || 0,
      fat: result.nutrients.find((n) => n.name === "Lemak")?.value || 0,
      fiber: result.nutrients.find((n) => n.name === "Serat")?.value || 0,
      sugar: result.nutrients.find((n) => n.name === "Gula")?.value || 0,
      portion: result.portion,
      emoji: "🍽️",
      confidence: result.confidence,
      image_url: selectedImage || undefined,
      tags: result.tags,
      recommendation: result.recommendation,
    });
    setSaveStatus(ok ? "saved" : "");
  };

  const resetAll = () => {
    stopCameraStream();
    setCameraError(null);
    setSelectedImage(null);
    setSelectedFile(null);
    setFileName("");
    setVideoSrc(null);
    setVideoFile(null);
    setResult(null);
    setSaveStatus("");
    setUploadDetections([]);
    setVideoDetections([]);
    setVideoReport(null);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex justify-between items-end pb-4 border-b border-surface-high">
        <div>
          <span className="block font-mono text-[11px] font-semibold tracking-wider text-primary mb-1.5">
            MODUL VISI KOMPUTER · YOLOv8
          </span>
          <h1 className="font-headline text-2xl sm:text-[28px] font-bold text-on-surface tracking-tight">
            Analisis Nutrisi Makanan
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Identifikasi hidangan Nusantara secara instan melalui kamera real-time, foto, atau pemindaian video.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-7 items-start">
        {/* ═══════════════════════════════════════════════════
            LEFT COLUMN: UNIFIED ALL-IN-ONE MEDIA INPUT
           ═══════════════════════════════════════════════════ */}
        <div className="flex flex-col gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
          <input
            ref={cameraCaptureInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />

          {/* ── Camera / Secure Context Notice Banner ── */}
          {cameraError && !cameraActive && (
            <div
              className="flex gap-3.5 items-start p-4 rounded-lg bg-[#fff8eb] border border-[#f59e0b]/35 text-[#78350f]"
              role="alert"
            >
              <div className="shrink-0 mt-0.5 text-[#d97706]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-headline text-sm font-bold text-[#92400e] mb-1">
                  {cameraError.title}
                </h4>
                <p className="text-[13px] leading-relaxed text-[#78350f] mb-3">
                  {cameraError.message}
                </p>
                <div className="flex flex-wrap gap-2">
                  {cameraError.showNativeCapture && (
                    <button
                      type="button"
                      className="px-3.5 py-2 rounded-md border-none bg-primary text-on-primary text-xs font-semibold cursor-pointer"
                      onClick={() => cameraCaptureInputRef.current?.click()}
                    >
                      Ambil Foto dengan Kamera Perangkat
                    </button>
                  )}
                  <button
                    type="button"
                    className="px-3 py-2 rounded-md border border-[#92400e]/25 bg-white/75 text-[#78350f] text-xs font-semibold cursor-pointer"
                    onClick={() => setCameraError(null)}
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── 1. PHOTO PREVIEW STATE ── */}
          {!cameraActive && selectedImage && (
            <div className="bg-surface-lowest border border-surface-high rounded-lg overflow-hidden">
              <div className="relative max-h-[380px] overflow-hidden bg-inverse-surface">
                <img
                  src={selectedImage}
                  alt="Food preview"
                  className="w-full h-[320px] object-cover block"
                />
                <canvas
                  ref={uploadCanvasRef}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                />
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-inverse-surface/60 flex flex-col items-center justify-center gap-3">
                    <div className="w-4/5 h-0.5 bg-gradient-to-r from-transparent via-primary-fixed-dim to-transparent absolute animate-[scanMove_2s_ease-in-out_infinite]" />
                    <span className="text-white font-mono text-xs font-semibold px-4 py-1.5 bg-black/55 rounded-full backdrop-blur-xs">
                      Menganalisis YOLO...
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap justify-between items-center p-4 gap-3">
                <span className="text-[13px] font-medium text-on-surface-variant truncate max-w-[200px]">
                  {fileName || "Foto Makanan"}
                </span>
                <div className="flex flex-wrap gap-2 items-center">
                  {!result && !isAnalyzing && (
                    <button
                      onClick={analyzeImage}
                      className="inline-flex items-center gap-2 py-2.5 px-4 bg-primary hover:bg-primary-container text-on-primary border-none rounded-md font-headline text-[13px] font-semibold cursor-pointer transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                      </svg>
                      Analisis Nutrisi
                    </button>
                  )}
                  <button
                    onClick={() => startCamera()}
                    className="py-2 px-3.5 bg-surface-low hover:bg-surface-container border border-surface-high rounded-md text-xs font-semibold text-on-surface cursor-pointer transition-colors"
                  >
                    Buka Kamera
                  </button>
                  <button
                    onClick={resetAll}
                    className="py-2 px-3.5 bg-transparent hover:bg-surface-low text-on-surface-variant border border-surface-high rounded-md text-xs font-medium cursor-pointer transition-colors"
                  >
                    Ganti File
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── 2. DEFAULT UNIFIED DROPZONE & ACTIONS ── */}
          {!cameraActive && !selectedImage && !videoSrc && (
            <>
              <div
                className={`border-[1.5px] border-dashed rounded-lg py-14 px-8 text-center cursor-pointer transition-all flex flex-col items-center gap-3 ${
                  dragActive
                    ? "border-primary bg-primary/4"
                    : "border-outline-variant bg-surface-lowest hover:border-primary hover:bg-surface-bright"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-13 h-13 rounded-md bg-surface-low border border-surface-high flex items-center justify-center text-primary mb-1">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <h3 className="font-headline text-base font-bold text-on-surface">
                  Pilih atau Ambil Foto / Video Makanan
                </h3>
                <p className="text-[13px] text-on-surface-variant">
                  Drag & drop file di sini, atau gunakan kamera langsung
                </p>
                <span className="font-mono text-[11px] text-outline px-3 py-1 bg-surface-low border border-surface-high rounded-sm mt-1">
                  Foto (JPG, PNG, WEBP) atau Video (MP4, WEBM) — Maks 50MB
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  className="flex items-center justify-center gap-2.5 py-3 px-4 bg-primary hover:bg-primary-container text-on-primary border-none rounded-md font-headline text-[13px] font-semibold cursor-pointer transition-colors"
                  onClick={() => startCamera()}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  Buka Kamera Real-Time
                </button>
                <button
                  className="flex items-center justify-center gap-2.5 py-3 px-4 bg-surface-lowest hover:bg-surface-low text-on-surface border border-surface-high hover:border-outline rounded-md font-headline text-[13px] font-semibold cursor-pointer transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  Pilih dari Galeri
                </button>
              </div>
            </>
          )}

          {/* ── 3. REAL-TIME CAMERA ── */}
          {cameraActive && (
            <div className="bg-surface-lowest border border-surface-high rounded-lg overflow-hidden fixed inset-0 z-[9999] md:static md:z-auto">
              <div className="relative w-full h-[100dvh] md:h-auto md:aspect-[4/3] md:min-h-[380px] bg-black overflow-hidden flex items-center justify-center">
                <video
                  ref={(el) => {
                    cameraVideoRef.current = el;
                    if (el && streamRef.current && el.srcObject !== streamRef.current) {
                      el.srcObject = streamRef.current;
                      el.play().catch((err) => {
                        console.warn("Camera video play on ref callback error:", err);
                      });
                    }
                  }}
                  playsInline
                  muted
                  autoPlay
                  className={`w-full h-full object-cover block ${
                    cameraFacing === "user" ? "-scale-x-100" : ""
                  }`}
                />
                <canvas
                  ref={cameraCanvasRef}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                />

                {/* Top Bar */}
                <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/65 to-transparent z-10">
                  <button
                    onClick={stopCameraStream}
                    className="w-10 h-10 rounded-full bg-black/45 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center cursor-pointer backdrop-blur-md transition-colors"
                    title="Tutup Kamera (Esc)"
                    aria-label="Tutup Kamera"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>

                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 border border-white/15 backdrop-blur-md font-mono text-[11px] text-white">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-semibold">LIVE</span>
                    {cameraFps > 0 && <span className="text-white/80">{cameraFps} FPS</span>}
                    {cameraLatency > 0 && <span className="text-white/70">{cameraLatency}ms</span>}
                  </div>

                  <button
                    onClick={() => setResolutionPreset((prev) => (prev === 480 ? 640 : 480))}
                    className="px-3 py-1.5 rounded-full bg-black/45 border border-white/20 text-white font-mono text-[11px] font-semibold cursor-pointer backdrop-blur-md"
                    title="Kualitas Deteksi: 480p / 640p"
                  >
                    {resolutionPreset === 640 ? "HD" : "SD"}
                  </button>
                </div>

                {/* Floating Recognition Banner */}
                <div className="absolute bottom-24 left-4 right-4 flex justify-center z-10">
                  {cameraDetections.length > 0 ? (
                    <div
                      className="flex items-center justify-between gap-4 px-4 py-2.5 rounded-lg bg-primary/92 text-white border border-white/20 backdrop-blur-md cursor-pointer shadow-lg w-full max-w-[420px]"
                      onClick={captureCameraSnapshot}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex items-center gap-2 text-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-300" />
                        <span className="font-headline font-bold">
                          {formatFoodLabel(cameraDetections[0].food_name)}
                        </span>
                        <span className="font-mono text-white/80">
                          {Math.round(cameraDetections[0].confidence)}%
                        </span>
                        {cameraDetections[0].nutrition?.calories && (
                          <span className="font-mono font-semibold text-primary-fixed">
                            {Math.round(cameraDetections[0].nutrition.calories)} kkal
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[11px] font-semibold">Ambil Foto →</span>
                    </div>
                  ) : cameraPersonDetected ? (
                    <div className="px-4 py-2 rounded-full bg-amber-900/85 text-amber-100 border border-amber-400/30 font-mono text-xs backdrop-blur-md">
                      Wajah terdeteksi — Arahkan lensa ke makanan
                    </div>
                  ) : (
                    <div className="px-4 py-2 rounded-full bg-black/55 text-white/90 border border-white/15 font-mono text-xs backdrop-blur-md">
                      Arahkan kamera ke hidangan makanan
                    </div>
                  )}
                </div>

                {/* Bottom Controls Bar */}
                <div className="absolute bottom-0 left-0 right-0 p-5 flex items-center justify-around bg-gradient-to-t from-black/75 to-transparent z-10">
                  <button
                    onClick={() => {
                      stopCameraStream();
                      fileInputRef.current?.click();
                    }}
                    className="w-11 h-11 rounded-full bg-black/45 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center cursor-pointer backdrop-blur-md"
                    title="Pilih dari Galeri"
                    aria-label="Pilih dari Galeri"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </button>

                  <button
                    onClick={captureCameraSnapshot}
                    className="w-16 h-16 rounded-full border-4 border-white bg-white/20 p-1 flex items-center justify-center cursor-pointer transition-transform active:scale-95"
                    title="Ambil Foto & Analisis"
                    aria-label="Ambil Foto"
                  >
                    <div className="w-full h-full rounded-full bg-white" />
                  </button>

                  <button
                    onClick={toggleCameraFacing}
                    className="w-11 h-11 rounded-full bg-black/45 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center cursor-pointer backdrop-blur-md"
                    title="Ganti Kamera Depan / Belakang"
                    aria-label="Ganti Kamera"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={isFlipping ? "animate-spin" : ""}
                    >
                      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                      <path d="M3 3v5h5" />
                      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                      <path d="M16 21h5v-5" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── 4. VIDEO PLAYBACK STATE ── */}
          {!cameraActive && !selectedImage && videoSrc && (
            <div className="bg-surface-lowest border border-surface-high rounded-lg overflow-hidden">
              <div className="relative aspect-[4/3] bg-black overflow-hidden">
                <video
                  ref={videoElementRef}
                  src={videoSrc}
                  playsInline
                  className="w-full h-full object-cover block"
                  onLoadedMetadata={(e) => {
                    setVideoDuration(e.currentTarget.duration || 0);
                  }}
                  onEnded={() => setIsVideoPlaying(false)}
                />
                <canvas
                  ref={videoCanvasRef}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                />

                <div className="absolute top-3 left-3 right-3 flex justify-between items-center pointer-events-none">
                  <span
                    className={`px-2.5 py-1 rounded-sm font-mono text-[10px] font-semibold tracking-wider text-white ${
                      isVideoPlaying ? "bg-primary" : "bg-black/60"
                    }`}
                  >
                    {isVideoPlaying ? "PLAYING" : "PAUSED"}
                  </span>
                  <span className="px-2.5 py-1 rounded-sm font-mono text-[11px] text-white bg-black/60 backdrop-blur-xs">
                    {videoDetections.length} Makanan Terdeteksi
                  </span>
                </div>
              </div>

              {/* Video Playback Controls Bar */}
              <div className="flex items-center gap-3 px-4 py-3 bg-surface-low border-t border-surface-high">
                <button
                  onClick={toggleVideoPlay}
                  className="w-8 h-8 rounded-md bg-primary text-on-primary border-none flex items-center justify-center cursor-pointer"
                >
                  {isVideoPlaying ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  )}
                </button>

                <input
                  type="range"
                  min={0}
                  max={videoDuration || 100}
                  step={0.1}
                  value={videoCurrentTime}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setVideoCurrentTime(val);
                    if (videoElementRef.current) videoElementRef.current.currentTime = val;
                  }}
                  className="flex-1 accent-primary cursor-pointer"
                />

                <span className="font-mono text-xs text-on-surface-variant tabular-nums">
                  {Math.floor(videoCurrentTime)}s / {Math.floor(videoDuration)}s
                </span>
              </div>

              {/* Actions for Video */}
              <div className="flex flex-wrap gap-2 p-4 border-t border-surface-high">
                <button
                  onClick={captureVideoFrame}
                  className="inline-flex items-center gap-1.5 py-2 px-3.5 bg-primary text-on-primary border-none rounded-md text-xs font-semibold cursor-pointer"
                >
                  Ambil Frame Ini
                </button>

                <button
                  onClick={scanEntireVideo}
                  disabled={isScanningVideo}
                  className="py-2 px-3.5 bg-surface-low hover:bg-surface-container text-on-surface border border-surface-high rounded-md text-xs font-semibold cursor-pointer disabled:opacity-60"
                >
                  {isScanningVideo ? "Memindai Video..." : "Pindai Seluruh Video"}
                </button>

                <button
                  onClick={() => startCamera()}
                  className="py-2 px-3.5 bg-surface-low hover:bg-surface-container text-on-surface border border-surface-high rounded-md text-xs font-semibold cursor-pointer"
                >
                  Buka Kamera
                </button>

                <button
                  onClick={resetAll}
                  className="py-2 px-3.5 bg-transparent text-on-surface-variant border border-surface-high rounded-md text-xs font-medium cursor-pointer ml-auto"
                >
                  Ganti File
                </button>
              </div>
            </div>
          )}

          {/* ── VIDEO ANALYSIS SUMMARY REPORT ── */}
          {videoReport && (
            <div className="bg-surface-lowest border border-surface-high rounded-lg p-5 flex flex-col gap-4">
              <div className="flex justify-between items-start pb-3 border-b border-surface-container">
                <div>
                  <h3 className="font-headline text-base font-bold text-on-surface">
                    Ringkasan Deteksi Video
                  </h3>
                  <span className="font-mono text-[11px] text-outline">
                    Durasi: {videoReport.video_info.duration_sec}s |{" "}
                    {videoReport.video_info.sampled_frames} frame dianalisis
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-md bg-surface-low border border-surface-high">
                  <span className="block font-mono text-[10px] uppercase text-outline">
                    Total Kalori
                  </span>
                  <div className="font-mono text-base font-bold text-primary mt-0.5 tabular-nums">
                    {videoReport.total_nutrition.calories} kkal
                  </div>
                </div>
                <div className="p-3 rounded-md bg-surface-low border border-surface-high">
                  <span className="block font-mono text-[10px] uppercase text-outline">
                    Protein
                  </span>
                  <div className="font-mono text-base font-bold text-macro-protein mt-0.5 tabular-nums">
                    {videoReport.total_nutrition.protein}g
                  </div>
                </div>
                <div className="p-3 rounded-md bg-surface-low border border-surface-high">
                  <span className="block font-mono text-[10px] uppercase text-outline">
                    Karbohidrat
                  </span>
                  <div className="font-mono text-base font-bold text-macro-carbs mt-0.5 tabular-nums">
                    {videoReport.total_nutrition.carbs}g
                  </div>
                </div>
                <div className="p-3 rounded-md bg-surface-low border border-surface-high">
                  <span className="block font-mono text-[10px] uppercase text-outline">
                    Lemak
                  </span>
                  <div className="font-mono text-base font-bold text-macro-fat mt-0.5 tabular-nums">
                    {videoReport.total_nutrition.fat}g
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-outline mb-2.5">
                  Hidangan Ditemukan ({videoReport.summary.length})
                </h4>
                <div className="flex flex-col gap-2">
                  {videoReport.summary.map((item, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center p-3 rounded-md bg-surface-low border border-surface-high"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-on-surface">
                          {formatFoodLabel(item.food_name)}
                        </span>
                        <span className="font-mono text-[11px] text-outline">
                          {item.first_seen}s - {item.last_seen}s ({item.appearances}x) ·{" "}
                          {Math.round(item.max_confidence)}%
                        </span>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-xs font-bold text-primary">
                          {item.nutrition.calories || 0} kkal
                        </div>
                        <span className="text-[11px] text-outline">
                          P {item.nutrition.protein || 0}g · K {item.nutrition.carbs || 0}g
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════
            RIGHT COLUMN: NUTRITION RESULTS CARD
           ═══════════════════════════════════════════════════ */}
        <div>
          {!result && !isAnalyzing && (
            <div className="bg-surface-lowest border border-surface-high rounded-lg py-20 px-8 text-center flex flex-col items-center gap-3">
              <div className="w-13 h-13 rounded-md bg-surface-low border border-surface-high flex items-center justify-center text-outline">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <h3 className="font-headline text-base font-bold text-on-surface">
                Hasil Analisis Nutrisi
              </h3>
              <p className="text-[13px] text-on-surface-variant max-w-[300px] leading-relaxed">
                Gunakan kamera langsung, putar video, atau unggah foto makanan untuk mendapatkan estimasi komposisi nutrisi secara real-time.
              </p>
            </div>
          )}

          {isAnalyzing && (
            <div className="bg-surface-lowest border border-surface-high rounded-lg py-16 px-8 text-center flex flex-col items-center gap-3.5">
              <div className="relative w-14 h-14 flex items-center justify-center text-primary">
                <div className="absolute inset-0 border-2 border-surface-container border-t-primary rounded-full animate-spin" />
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                  <path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.58-3.25 3.93L12 22M12 2a4 4 0 0 0-4 4c0 1.95 1.4 3.58 3.25 3.93" />
                </svg>
              </div>
              <h3 className="font-headline text-base font-bold text-on-surface">
                AI sedang menganalisis...
              </h3>
              <p className="text-[13px] text-on-surface-variant">
                Mendeteksi objek makanan dan mengalkulasi nutrisi
              </p>
              <div className="flex flex-col gap-1.5 mt-2 font-mono text-xs">
                <span className="text-primary font-semibold">✓ Deteksi YOLOv8</span>
                <span className="text-primary font-semibold">✓ Pencocokan Database Gizi</span>
                <span className="text-outline">⟳ Menyiapkan Profil Nutrisi...</span>
              </div>
            </div>
          )}

          {result && (
            <div className="bg-surface-lowest border border-surface-high rounded-lg p-6 flex flex-col gap-5">
              {/* Food Header */}
              <div className="flex justify-between items-start gap-3 pb-4 border-b border-surface-container">
                <div>
                  <h2 className="font-headline text-xl font-bold text-on-surface tracking-tight">
                    {result.foodName}
                  </h2>
                  <span className="font-mono text-xs text-outline">{result.portion}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-fixed text-primary rounded-sm font-mono text-[11px] font-semibold">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  {result.confidence}% akurat
                </div>
              </div>

              {/* Calorie Ring */}
              <div className="flex items-center gap-5 p-4 bg-surface-low border border-surface-high rounded-md">
                <div className="shrink-0">
                  <svg viewBox="0 0 120 120" width="110" height="110">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="var(--surface-container)" strokeWidth="10" />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="#143625"
                      strokeWidth="10"
                      strokeDasharray={`${Math.min(1, result.calories / 800) * 314} 314`}
                      strokeLinecap="round"
                      transform="rotate(-90 60 60)"
                    />
                    <text x="60" y="56" textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--on-surface)" fontFamily="JetBrains Mono, monospace">
                      {result.calories}
                    </text>
                    <text x="60" y="72" textAnchor="middle" fontSize="11" fill="var(--outline)" fontFamily="JetBrains Mono, monospace">
                      kkal
                    </text>
                  </svg>
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-sm font-mono text-[11px] font-semibold bg-surface-lowest border border-surface-high text-on-surface"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {result.nutritionUnavailable && (
                <div className="flex gap-3 p-3.5 rounded-md bg-error-container text-error border border-error/25 text-xs">
                  <div>
                    <h4 className="font-bold mb-0.5">Data Nutrisi Tidak Tersedia</h4>
                    <p>Layanan mengalami gangguan sementara. Silakan coba lagi beberapa saat kemudian.</p>
                  </div>
                </div>
              )}

              {/* Nutrients List */}
              <div className="flex flex-col gap-3">
                <h4 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-outline">
                  Detail Komposisi Makronutrien
                </h4>
                {result.nutrients.map((n) => (
                  <div key={n.name} className="grid grid-cols-[100px_1fr_64px] items-center gap-3">
                    <span className="text-[13px] font-medium text-on-surface">{n.name}</span>
                    <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${n.pct}%`, background: n.color }}
                      />
                    </div>
                    <span className="font-mono text-xs font-semibold text-on-surface text-right tabular-nums">
                      {n.value} {n.unit}
                    </span>
                  </div>
                ))}
              </div>

              {/* NutriCoach Recommendation */}
              <div className="flex gap-3 p-4 rounded-md bg-surface-low border border-surface-high">
                <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-headline text-xs font-bold text-on-surface mb-1">
                    Catatan Klinis NutriCoach
                  </h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {result.recommendation}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 bg-primary hover:bg-primary-container text-on-primary border-none rounded-md font-headline text-[13px] font-semibold cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={saveToHistory}
                  disabled={saveStatus !== "" || result.nutritionUnavailable}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  {saveStatus === "saving"
                    ? "Menyimpan..."
                    : saveStatus === "saved"
                    ? "✓ Tersimpan!"
                    : "Simpan ke Riwayat"}
                </button>
                <button
                  onClick={resetAll}
                  className="py-3 px-4 bg-surface-lowest hover:bg-surface-low text-on-surface border border-surface-high rounded-md font-headline text-[13px] font-semibold cursor-pointer transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
