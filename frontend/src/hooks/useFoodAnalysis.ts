import { useState, useRef, useCallback, useMemo } from "react";
import { useCameraStream } from "./useCameraStream";
import { useVideoAnalysis } from "./useVideoAnalysis";
import {
  AnalysisResult,
  DetectionBox,
  drawDetections,
} from "@/lib/food-detection";
import { buildAnalysisResultFromDetection } from "@/lib/food-analysis-utils";
import { apiCreateFoodRecord, apiDetectFood } from "@/lib/api";

export function useFoodAnalysis() {
  const camera = useCameraStream();
  const video = useVideoAnalysis();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadDetections, setUploadDetections] = useState<DetectionBox[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [saveStatus, setSaveStatus] = useState<"" | "saving" | "saved">("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraCaptureInputRef = useRef<HTMLInputElement>(null);
  const uploadCanvasRef = useRef<HTMLCanvasElement>(null);

  // Derived calculations using useMemo
  const topUploadDetection = useMemo(() => {
    if (uploadDetections.length === 0) return null;
    return [...uploadDetections].sort((a, b) => b.confidence - a.confidence)[0];
  }, [uploadDetections]);

  const resetAll = useCallback(() => {
    camera.stopCameraStream();
    camera.setCameraError(null);
    video.resetVideo();
    setSelectedImage(null);
    setSelectedFile(null);
    setFileName("");
    setResult(null);
    setSaveStatus("");
    setUploadDetections([]);
  }, [camera, video]);

  const handleFile = useCallback(
    (file: File) => {
      if (file.type.startsWith("image/")) {
        camera.stopCameraStream();
        camera.setCameraError(null);
        video.resetVideo();
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
        camera.stopCameraStream();
        camera.setCameraError(null);
        setSelectedImage(null);
        setSelectedFile(null);
        setUploadDetections([]);
        setResult(null);
        video.handleVideoFile(file);
      }
    },
    [camera, video]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
    },
    [handleFile]
  );

  const analyzeImage = useCallback(async () => {
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
        setResult(buildAnalysisResultFromDetection(top));

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
  }, [selectedFile]);

  const captureCameraSnapshot = useCallback(() => {
    const snap = camera.captureCameraSnapshot();
    if (!snap) return;

    setSelectedImage(snap.snapshotUrl);
    setFileName("Snapshot Kamera");

    if (snap.topDetection) {
      setResult(buildAnalysisResultFromDetection(snap.topDetection));
      const currentDets = snap.detections;
      setTimeout(() => {
        if (uploadCanvasRef.current) {
          uploadCanvasRef.current.width = snap.width;
          uploadCanvasRef.current.height = snap.height;
          drawDetections(uploadCanvasRef.current, currentDets, snap.topDetection?.food_name || null, false);
        }
      }, 150);
    } else if (snap.personDetected) {
      alert("Kamera mendeteksi wajah/orang, bukan makanan. Silakan arahkan kamera ke hidangan makanan Anda.");
    } else {
      alert("Tidak ada makanan yang terdeteksi pada frame ini. Coba arahkan kamera lebih dekat.");
    }
  }, [camera]);

  const captureVideoFrame = useCallback(() => {
    const snap = video.captureVideoFrame();
    if (!snap) return;

    setSelectedImage(snap.snapshotUrl);

    if (snap.topDetection) {
      setResult(buildAnalysisResultFromDetection(snap.topDetection));
    } else {
      alert("Tidak ada makanan terdeteksi pada detik video ini. Coba geser ke frame lain.");
    }
  }, [video]);

  const scanEntireVideo = useCallback(async () => {
    const report = await video.scanEntireVideo();
    if (report && report.summary && report.summary.length > 0) {
      const first = report.summary[0];
      setResult(
        buildAnalysisResultFromDetection({
          class_id: 0,
          raw_label: first.raw_label,
          food_name: first.food_name,
          confidence: first.max_confidence,
          bbox: [0, 0, 0, 0],
          bbox_normalized: [0, 0, 1, 1],
          nutrition: first.nutrition,
        })
      );
    }
  }, [video]);

  const saveToHistory = useCallback(async () => {
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
  }, [result, selectedImage]);

  return {
    camera,
    video,
    selectedImage,
    selectedFile,
    fileName,
    isAnalyzing,
    uploadDetections,
    topUploadDetection,
    dragActive,
    setDragActive,
    result,
    saveStatus,
    fileInputRef,
    cameraCaptureInputRef,
    uploadCanvasRef,
    handleFile,
    handleDrop,
    analyzeImage,
    captureCameraSnapshot,
    captureVideoFrame,
    scanEntireVideo,
    saveToHistory,
    resetAll,
  };
}
