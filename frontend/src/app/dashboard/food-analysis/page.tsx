"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import styles from "./food-analysis.module.css";
import {
  apiCreateFoodRecord,
  apiDetectFood,
  apiDetectFrame,
  apiDetectVideo,
  getWsDetectUrl,
} from "@/lib/api";
import { formatFoodLabel } from "@/lib/food-labels";

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
  const [uploadDetections, setUploadDetections] = useState<DetectionBox[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadCanvasRef = useRef<HTMLCanvasElement>(null);

  // ── Camera Mode State ──
  const [cameraActive, setCameraActive] = useState(false);
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
  const cameraCanvasRef = useRef<HTMLCanvasElement>(null);
  const cameraWsRef = useRef<WebSocket | null>(null);
  const cameraInFlightRef = useRef<boolean>(false);
  const cameraIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fpsHistoryRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef<number>(Date.now());

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
      } catch (e) {}
      cameraWsRef.current = null;
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
          color: "#4caf50",
        },
        {
          name: "Karbohidrat",
          value: carbs,
          unit: "g",
          pct: Math.min(100, Math.round((carbs / 300) * 100)),
          color: "#ff9800",
        },
        {
          name: "Lemak",
          value: fat,
          unit: "g",
          pct: Math.min(100, Math.round((fat / 65) * 100)),
          color: "#f44336",
        },
        {
          name: "Serat",
          value: fiber,
          unit: "g",
          pct: Math.min(100, Math.round((fiber / 25) * 100)),
          color: "#9c27b0",
        },
        {
          name: "Gula",
          value: sugar,
          unit: "g",
          pct: Math.min(100, Math.round((sugar / 50) * 100)),
          color: "#e91e63",
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

  const handleVideoFile = useCallback((file: File) => {
    if (!file.type.startsWith("video/")) {
      alert("Pilih file video yang valid (.mp4, .webm, .mov).");
      return;
    }
    stopCameraStream();
    setSelectedImage(null);
    setSelectedFile(null);
    setUploadDetections([]);
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    setVideoReport(null);
    setVideoDetections([]);
    setResult(null);
  }, [stopCameraStream]);

  const handleFile = useCallback((file: File) => {
    if (file.type.startsWith("image/")) {
      stopCameraStream();
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
  }, [stopCameraStream, handleVideoFile]);

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

        // Sort by confidence
        const top = [...detections].sort((a, b) => b.confidence - a.confidence)[0];
        populateResultFromTopDetection(top);

        // Draw bounding boxes on canvas
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
    try {
      stopCameraStream();
      setSelectedImage(null);
      setSelectedFile(null);
      setVideoSrc(null);
      setVideoFile(null);
      setVideoReport(null);
      setResult(null);

      // Lock mobile body scroll during full-screen camera
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
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        console.warn("Primary constraint failed, falling back to basic facingMode:", err);
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing },
          audio: false,
        });
      }

      if (!cameraVideoRef.current) return;
      cameraVideoRef.current.srcObject = stream;
      await cameraVideoRef.current.play();

      setCameraActive(true);

      // Connect WebSocket for ultra-low latency streaming
      const wsUrl = getWsDetectUrl();
      const ws = new WebSocket(wsUrl);
      cameraWsRef.current = ws;

      let useFallback = false;

      ws.onopen = () => {
        console.log("WebSocket Camera Detection connected:", wsUrl);
      };

      ws.onerror = (e) => {
        console.warn("WebSocket connection failed, falling back to HTTP fast frames:", e);
        useFallback = true;
      };

      ws.onmessage = (event) => {
        try {
          const res = JSON.parse(event.data);
          if (res.status === "success") {
            const dets: DetectionBox[] = res.detections || [];
            setCameraDetections(dets);
            setCameraPersonDetected(Boolean(res.person_detected));

            // Calculate latency
            if (res.ts) {
              const rtt = Date.now() - res.ts;
              setCameraLatency(rtt);
            }

            // Draw bounding boxes on video overlay canvas
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

      // Create offscreen canvas for frame capture
      const offscreen = document.createElement("canvas");
      const offCtx = offscreen.getContext("2d", { willReadFrequently: true });

      // Frame dispatch loop — only fires when previous frame returns (0 accumulation delay!)
      cameraIntervalRef.current = setInterval(async () => {
        if (!cameraVideoRef.current || cameraVideoRef.current.readyState < 2) return;
        if (cameraInFlightRef.current) return; // Drop frame if backend still processing

        const video = cameraVideoRef.current;
        const targetW = resolutionPreset;
        const aspect = (video.videoHeight || 360) / (video.videoWidth || 480);
        const targetH = Math.round(targetW * aspect);

        offscreen.width = targetW;
        offscreen.height = targetH;
        offCtx?.drawImage(video, 0, 0, targetW, targetH);

        const frameData = offscreen.toDataURL("image/jpeg", 0.65);
        const sendTs = Date.now();

        // Calculate smooth client FPS
        const now = Date.now();
        const delta = now - lastFrameTimeRef.current;
        lastFrameTimeRef.current = now;
        if (delta > 0) {
          fpsHistoryRef.current.push(1000 / delta);
          if (fpsHistoryRef.current.length > 10) fpsHistoryRef.current.shift();
          const avgFps =
            fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length;
          setCameraFps(Math.round(avgFps * 10) / 10);
        }

        cameraInFlightRef.current = true;

        if (ws.readyState === WebSocket.OPEN && !useFallback) {
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
          // Fast HTTP fallback
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
      }, 70); // 70ms tick ~ 14 FPS theoretical limit
    } catch (err) {
      console.error("Gagal memulai kamera:", err);
      alert("Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan di browser.");
      setCameraActive(false);
      if (typeof window !== "undefined") {
        document.body.style.overflow = "";
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

  // Real-time detection while video plays
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

        // Pre-fill result from first unique dish if available
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
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Analisis Nutrisi Makanan</h1>
          <p className={styles.subtitle}>
            Deteksi hidangan makanan Indonesia secara instan via Kamera Real-Time, Foto, atau Video.
          </p>
        </div>
      </div>

      <div className={styles.content}>
        {/* ═══════════════════════════════════════════════════
            LEFT COLUMN: UNIFIED ALL-IN-ONE MEDIA INPUT
           ═══════════════════════════════════════════════════ */}
        <div className={styles.uploadSection}>
          {/* ── 1. PHOTO PREVIEW STATE ── */}
          {!cameraActive && selectedImage && (
            <div className={styles.previewCard}>
              <div className={styles.previewImageWrapper}>
                <img src={selectedImage} alt="Food preview" className={styles.previewImage} />
                <canvas ref={uploadCanvasRef} className={styles.streamCanvas} />
                {isAnalyzing && (
                  <div className={styles.scanOverlay}>
                    <div className={styles.scanLine} />
                    <span className={styles.scanText}>Menganalisis YOLO...</span>
                  </div>
                )}
              </div>
              <div className={styles.previewInfo}>
                <span className={styles.previewName}>{fileName || "Foto Makanan"}</span>
                <div className={styles.previewActions}>
                  {!result && !isAnalyzing && (
                    <button onClick={analyzeImage} className={styles.analyzeBtn}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                      </svg>
                      Analisis Nutrisi
                    </button>
                  )}
                  <button onClick={() => startCamera()} className={styles.cameraBtn} style={{ padding: "8px 14px", fontSize: 13 }}>
                    📸 Buka Kamera
                  </button>
                  <button onClick={resetAll} className={styles.resetBtn}>
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
                className={`${styles.dropZone} ${dragActive ? styles.dropZoneActive : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className={styles.dropIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <h3>Pilih atau Ambil Foto / Video Makanan</h3>
                <p>Drag & drop file di sini, atau gunakan kamera langsung</p>
                <span className={styles.dropFormats}>Foto (JPG, PNG, WEBP) atau Video (MP4, WEBM) — Maks 50MB</span>
              </div>

              <div className={styles.uploadButtons}>
                <button className={styles.cameraBtn} onClick={() => startCamera()}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  Buka Kamera Real-Time
                </button>
                <button className={styles.uploadBtn} onClick={() => fileInputRef.current?.click()}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  Pilih dari Galeri
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                hidden
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </>
          )}

          {/* ── 3. REAL-TIME CAMERA (FULL SCREEN ON MOBILE, SLEEK VIEWFINDER ON DESKTOP) ── */}
          {cameraActive && (
            <div className={styles.streamCard}>
              <div className={styles.streamWrapper}>
                <video
                  ref={cameraVideoRef}
                  playsInline
                  muted
                  autoPlay
                  className={`${styles.streamVideo} ${
                    cameraFacing === "user" ? styles.streamVideoMirrored : ""
                  }`}
                />
                <canvas ref={cameraCanvasRef} className={styles.streamCanvas} />

                {/* Modern Viewfinder Scanner Reticle */}
                <div className={styles.scannerReticle}>
                  <span className={`${styles.reticleCorner} ${styles.reticleTL}`} />
                  <span className={`${styles.reticleCorner} ${styles.reticleTR}`} />
                  <span className={`${styles.reticleCorner} ${styles.reticleBL}`} />
                  <span className={`${styles.reticleCorner} ${styles.reticleBR}`} />
                </div>

                {/* Floating Glass Top HUD Bar */}
                <div className={styles.cameraTopBar}>
                  <button
                    onClick={stopCameraStream}
                    className={styles.glassCircleBtn}
                    title="Tutup Kamera (Esc)"
                    aria-label="Tutup Kamera"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>

                  <div className={styles.cameraLiveBadge}>
                    <span className={styles.pulseDot} />
                    <span className={styles.liveText}>LIVE</span>
                    {cameraFps > 0 && (
                      <span className={styles.liveFps}>{cameraFps} FPS</span>
                    )}
                    {cameraLatency > 0 && (
                      <span className={styles.liveMs}>{cameraLatency}ms</span>
                    )}
                  </div>

                  <button
                    onClick={() =>
                      setResolutionPreset((prev) => (prev === 480 ? 640 : 480))
                    }
                    className={styles.glassPillBtn}
                    title="Kualitas Deteksi: 480p / 640p"
                  >
                    {resolutionPreset === 640 ? "HD" : "SD"}
                  </button>
                </div>

                {/* Floating Dynamic Recognition Banner */}
                <div className={styles.floatingBannerArea}>
                  {cameraDetections.length > 0 ? (
                    <div
                      className={styles.floatingDetectionCard}
                      onClick={captureCameraSnapshot}
                      role="button"
                      tabIndex={0}
                      title="Klik untuk analisis & simpan nutrisi"
                    >
                      <div className={styles.floatingDetectionInfo}>
                        <span className={styles.floatingDot} />
                        <span className={styles.floatingName}>
                          {formatFoodLabel(cameraDetections[0].food_name)}
                        </span>
                        <span className={styles.floatingConf}>
                          {Math.round(cameraDetections[0].confidence)}%
                        </span>
                        {cameraDetections[0].nutrition?.calories && (
                          <span className={styles.floatingCal}>
                            {Math.round(cameraDetections[0].nutrition.calories)} kkal
                          </span>
                        )}
                      </div>
                      <span className={styles.floatingCta}>Ambil Foto ➔</span>
                    </div>
                  ) : cameraPersonDetected ? (
                    <div className={styles.floatingPersonAlert}>
                      <span>👤 Wajah terdeteksi — Arahkan lensa ke makanan</span>
                    </div>
                  ) : (
                    <div className={styles.floatingHintPill}>
                      <span>Arahkan kamera ke hidangan makanan</span>
                    </div>
                  )}
                </div>

                {/* Floating Glass Bottom Controls Bar */}
                <div className={styles.cameraBottomBar}>
                  {/* Left: Gallery upload button */}
                  <button
                    onClick={() => {
                      stopCameraStream();
                      fileInputRef.current?.click();
                    }}
                    className={styles.cameraSideBtn}
                    title="Pilih dari Galeri"
                    aria-label="Pilih dari Galeri"
                  >
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </button>

                  {/* Center: Beautiful Native Shutter Button */}
                  <button
                    onClick={captureCameraSnapshot}
                    className={styles.shutterBtn}
                    title="Ambil Foto & Analisis"
                    aria-label="Ambil Foto"
                  >
                    <div className={styles.shutterBtnInner} />
                  </button>

                  {/* Right: Camera Flip Icon Button */}
                  <button
                    onClick={toggleCameraFacing}
                    className={styles.cameraSideBtn}
                    title="Ganti Kamera Depan / Belakang"
                    aria-label="Ganti Kamera"
                  >
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={isFlipping ? styles.rotatingIcon : ""}
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
            <div className={styles.streamCard}>
              <div className={styles.streamWrapper}>
                <video
                  ref={videoElementRef}
                  src={videoSrc}
                  playsInline
                  className={styles.streamVideo}
                  onLoadedMetadata={(e) => {
                    setVideoDuration(e.currentTarget.duration || 0);
                  }}
                  onEnded={() => setIsVideoPlaying(false)}
                />
                <canvas ref={videoCanvasRef} className={styles.streamCanvas} />

                <div className={styles.streamHud}>
                  <div className={styles.hudLeft}>
                    <span className={`${styles.liveBadge} ${!isVideoPlaying ? styles.liveBadgeOffline : ""}`}>
                      {isVideoPlaying ? "PLAYING" : "PAUSED"}
                    </span>
                  </div>
                  <div className={styles.hudRight}>
                    <span className={styles.hudStatPill}>
                      {videoDetections.length} Makanan Terdeteksi
                    </span>
                  </div>
                </div>
              </div>

              {/* Video Playback Controls Bar */}
              <div className={styles.videoControlsBar}>
                <button onClick={toggleVideoPlay} className={styles.playToggleBtn}>
                  {isVideoPlaying ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
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
                  className={styles.videoScrubber}
                />

                <span className={styles.timeDisplay}>
                  {Math.floor(videoCurrentTime)}s / {Math.floor(videoDuration)}s
                </span>
              </div>

              {/* Actions for Video */}
              <div className={styles.videoActionsRow}>
                <button onClick={captureVideoFrame} className={styles.captureFrameBtn}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  Ambil Frame Ini
                </button>

                <button
                  onClick={scanEntireVideo}
                  disabled={isScanningVideo}
                  className={styles.scanVideoBtn}
                >
                  {isScanningVideo ? "Memindai Video..." : "⚡ Scan Seluruh Video (Server)"}
                </button>

                <button onClick={() => startCamera()} className={styles.uploadBtn} style={{ padding: "8px 14px", fontSize: 13 }}>
                  📸 Buka Kamera
                </button>

                <button onClick={resetAll} className={styles.resetBtn}>
                  Ganti File
                </button>
              </div>
            </div>
          )}

          {/* ── VIDEO ANALYSIS SUMMARY REPORT ── */}
          {videoReport && (
            <div className={styles.videoReportCard}>
              <div className={styles.videoReportHeader}>
                <div>
                  <h3 className={styles.videoReportTitle}>Ringkasan Deteksi Video</h3>
                  <span className={styles.videoMetaBadge}>
                    Durasi: {videoReport.video_info.duration_sec}s | {videoReport.video_info.sampled_frames} frame dianalisis
                  </span>
                </div>
              </div>

              {/* Macro Aggregates Grid */}
              <div className={styles.videoMacroGrid}>
                <div className={styles.videoMacroBox}>
                  <span className={styles.videoMacroLabel}>Total Kalori</span>
                  <div className={styles.videoMacroVal} style={{ color: "#2e7d32" }}>
                    {videoReport.total_nutrition.calories} kkal
                  </div>
                </div>
                <div className={styles.videoMacroBox}>
                  <span className={styles.videoMacroLabel}>Protein</span>
                  <div className={styles.videoMacroVal}>{videoReport.total_nutrition.protein}g</div>
                </div>
                <div className={styles.videoMacroBox}>
                  <span className={styles.videoMacroLabel}>Karbohidrat</span>
                  <div className={styles.videoMacroVal}>{videoReport.total_nutrition.carbs}g</div>
                </div>
                <div className={styles.videoMacroBox}>
                  <span className={styles.videoMacroLabel}>Lemak</span>
                  <div className={styles.videoMacroVal}>{videoReport.total_nutrition.fat}g</div>
                </div>
              </div>

              {/* Unique Dishes List in Video */}
              <div>
                <h4 className={styles.videoDishesTitle}>
                  Hidangan Ditemukan ({videoReport.summary.length})
                </h4>
                <div className={styles.videoDishesList}>
                  {videoReport.summary.map((item, i) => (
                    <div key={i} className={styles.videoDishItem}>
                      <div className={styles.dishInfo}>
                        <span className={styles.dishName}>{formatFoodLabel(item.food_name)}</span>
                        <span className={styles.dishTimeline}>
                          Muncul di {item.first_seen}s - {item.last_seen}s ({item.appearances}x) | Akurasi: {Math.round(item.max_confidence)}%
                        </span>
                      </div>
                      <div className={styles.dishMacros}>
                        <div className={styles.dishCalories}>{item.nutrition.calories || 0} kkal</div>
                        <span className={styles.dishNutrients}>
                          P: {item.nutrition.protein || 0}g | C: {item.nutrition.carbs || 0}g
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
        <div className={styles.resultSection}>
          {!result && !isAnalyzing && (
            <div className={styles.emptyResult}>
              <div className={styles.emptyIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <h3>Hasil Analisis Nutrisi</h3>
              <p>
                Gunakan kamera langsung, putar video, atau unggah foto makanan untuk mendapatkan estimasi komposisi nutrisi secara real-time.
              </p>
            </div>
          )}

          {isAnalyzing && (
            <div className={styles.analyzingState}>
              <div className={styles.analyzingSpinner}>
                <div className={styles.spinRing} />
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28" className={styles.spinIcon}>
                  <path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.58-3.25 3.93L12 22M12 2a4 4 0 0 0-4 4c0 1.95 1.4 3.58 3.25 3.93" />
                </svg>
              </div>
              <h3>AI sedang menganalisis...</h3>
              <p>Mendeteksi objek makanan dan mengalkulasi nutrisi</p>
              <div className={styles.analyzingSteps}>
                <span className={styles.stepDone}>✓ Deteksi YOLOv8</span>
                <span className={styles.stepDone}>✓ Pencocokan Database Gizi</span>
                <span className={styles.stepActive}>⟳ Menyiapkan Profil Nutrisi...</span>
              </div>
            </div>
          )}

          {result && (
            <div className={styles.resultCard}>
              {/* Food Header */}
              <div className={styles.resultHeader}>
                <div>
                  <h2 className={styles.foodName}>{result.foodName}</h2>
                  <span className={styles.portion}>{result.portion}</span>
                </div>
                <div className={styles.confidenceBadge}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  {result.confidence}% akurat
                </div>
              </div>

              {/* Calorie Ring */}
              <div className={styles.calorieSection}>
                <div className={styles.calorieRing}>
                  <svg viewBox="0 0 120 120" width="120" height="120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="var(--surface-container)" strokeWidth="10" />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="url(#calGrad)"
                      strokeWidth="10"
                      strokeDasharray={`${(result.calories / 800) * 314} 314`}
                      strokeLinecap="round"
                      transform="rotate(-90 60 60)"
                    />
                    <defs>
                      <linearGradient id="calGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#2e7d32" />
                        <stop offset="100%" stopColor="#4caf50" />
                      </linearGradient>
                    </defs>
                    <text x="60" y="56" textAnchor="middle" fontSize="24" fontWeight="700" fill="var(--on-surface)" fontFamily="Plus Jakarta Sans">
                      {result.calories}
                    </text>
                    <text x="60" y="72" textAnchor="middle" fontSize="11" fill="var(--outline)" fontFamily="Inter">
                      kkal
                    </text>
                  </svg>
                </div>
                <div className={styles.tags}>
                  {result.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`${styles.tag} ${tag.includes("Perhatian") ? styles.tagWarn : ""}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Warning if AI failed */}
              {result.nutritionUnavailable && (
                <div className={styles.warningAlert}>
                  <div className={styles.warningIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                  <div>
                    <h4>Data Nutrisi Tidak Tersedia</h4>
                    <p>Layanan mengalami gangguan sementara. Silakan coba lagi beberapa saat kemudian.</p>
                  </div>
                </div>
              )}

              {/* Nutrients List */}
              <div className={styles.nutrientsList}>
                <h4>Detail Nutrisi</h4>
                {result.nutrients.map((n) => (
                  <div key={n.name} className={styles.nutrientRow}>
                    <span className={styles.nutrientName}>{n.name}</span>
                    <div className={styles.nutrientBar}>
                      <div style={{ width: `${n.pct}%`, background: n.color }} />
                    </div>
                    <span className={styles.nutrientVal}>
                      {n.value} {n.unit}
                    </span>
                  </div>
                ))}
              </div>

              {/* NutriCoach Recommendation */}
              <div className={styles.recoCard}>
                <div className={styles.recoIcon}>💡</div>
                <div>
                  <h4>Rekomendasi NutriCoach</h4>
                  <p>{result.recommendation}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className={styles.resultActions}>
                <button
                  className={`${styles.saveBtn} ${result.nutritionUnavailable ? styles.saveBtnDisabled : ""}`}
                  onClick={saveToHistory}
                  disabled={saveStatus !== "" || result.nutritionUnavailable}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  {saveStatus === "saving" ? "Menyimpan..." : saveStatus === "saved" ? "✓ Tersimpan!" : "Simpan ke Riwayat"}
                </button>
                <button onClick={resetAll} className={styles.newBtn}>
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
