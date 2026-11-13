"use client";

import Image from "next/image";
import { formatFoodLabel } from "@/lib/food-labels";
import { useFoodAnalysis } from "@/hooks/useFoodAnalysis";

export function FoodAnalysisClient() {
  const {
    camera,
    video,
    selectedImage,
    fileName,
    isAnalyzing,
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
  } = useFoodAnalysis();

  const {
    state: cameraState,
    cameraVideoRef,
    cameraCanvasRef,
    startCamera,
    stopCameraStream,
    toggleCameraFacing,
    setResolutionPreset,
    setCameraError,
  } = camera;

  const {
    state: videoState,
    videoElementRef,
    videoCanvasRef,
    toggleVideoPlay,
  } = video;

  return (
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
        {cameraState.cameraError && !cameraState.cameraActive && (
          <div
            className="flex gap-3.5 items-start p-4 rounded-lg bg-[#fff8eb] border border-[#f59e0b]/35 text-[#78350f]"
            role="alert"
          >
            <div className="shrink-0 mt-0.5 text-[#d97706]">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-headline text-sm font-bold text-[#92400e] mb-1">
                {cameraState.cameraError.title}
              </h4>
              <p className="text-[13px] leading-relaxed text-[#78350f] mb-3">
                {cameraState.cameraError.message}
              </p>
              <div className="flex flex-wrap gap-2">
                {cameraState.cameraError.showNativeCapture && (
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
        {!cameraState.cameraActive && selectedImage && (
          <div className="bg-surface-lowest border border-surface-high rounded-lg overflow-hidden">
            <div className="relative max-h-[380px] overflow-hidden bg-inverse-surface">
              <Image
                src={selectedImage}
                alt="Food preview"
                width={800}
                height={320}
                unoptimized
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
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
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
        {!cameraState.cameraActive && !selectedImage && !videoState.videoSrc && (
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
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
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
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                Buka Kamera Real-Time
              </button>
              <button
                className="flex items-center justify-center gap-2.5 py-3 px-4 bg-surface-lowest hover:bg-surface-low text-on-surface border border-surface-high hover:border-outline rounded-md font-headline text-[13px] font-semibold cursor-pointer transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
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
        {cameraState.cameraActive && (
          <div className="bg-surface-lowest border border-surface-high rounded-lg overflow-hidden fixed inset-0 z-[9999] md:static md:z-auto">
            <div className="relative w-full h-[100dvh] md:h-auto md:aspect-[4/3] md:min-h-[380px] bg-black overflow-hidden flex items-center justify-center">
              <video
                ref={cameraVideoRef}
                playsInline
                muted
                autoPlay
                className={`w-full h-full object-cover block ${
                  cameraState.cameraFacing === "user" ? "-scale-x-100" : ""
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
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 border border-white/15 backdrop-blur-md font-mono text-[11px] text-white">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold">LIVE</span>
                  {cameraState.cameraFps > 0 && (
                    <span className="text-white/80">{cameraState.cameraFps} FPS</span>
                  )}
                  {cameraState.cameraLatency > 0 && (
                    <span className="text-white/70">{cameraState.cameraLatency}ms</span>
                  )}
                </div>

                <button
                  onClick={() =>
                    setResolutionPreset(cameraState.resolutionPreset === 480 ? 640 : 480)
                  }
                  className="px-3 py-1.5 rounded-full bg-black/45 border border-white/20 text-white font-mono text-[11px] font-semibold cursor-pointer backdrop-blur-md"
                  title="Kualitas Deteksi: 480p / 640p"
                >
                  {cameraState.resolutionPreset === 640 ? "HD" : "SD"}
                </button>
              </div>

              {/* Floating Recognition Banner */}
              <div className="absolute bottom-24 left-4 right-4 flex justify-center z-10">
                {cameraState.cameraDetections.length > 0 ? (
                  <div
                    className="flex items-center justify-between gap-4 px-4 py-2.5 rounded-lg bg-primary/92 text-white border border-white/20 backdrop-blur-md cursor-pointer shadow-lg w-full max-w-[420px]"
                    onClick={captureCameraSnapshot}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-300" />
                      <span className="font-headline font-bold">
                        {formatFoodLabel(cameraState.cameraDetections[0].food_name)}
                      </span>
                      <span className="font-mono text-white/80">
                        {Math.round(cameraState.cameraDetections[0].confidence)}%
                      </span>
                      {cameraState.cameraDetections[0].nutrition?.calories && (
                        <span className="font-mono font-semibold text-primary-fixed">
                          {Math.round(cameraState.cameraDetections[0].nutrition.calories)} kkal
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[11px] font-semibold">Ambil Foto →</span>
                  </div>
                ) : cameraState.cameraPersonDetected ? (
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
                  <svg
                    width="20"
                    height="20"
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
                    className={cameraState.isFlipping ? "animate-spin" : ""}
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
        {!cameraState.cameraActive && !selectedImage && videoState.videoSrc && (
          <div className="bg-surface-lowest border border-surface-high rounded-lg overflow-hidden">
            <div className="relative aspect-[4/3] bg-black overflow-hidden">
              <video
                ref={videoElementRef}
                src={videoState.videoSrc}
                playsInline
                className="w-full h-full object-cover block"
                onEnded={() => toggleVideoPlay()}
              />
              <canvas
                ref={videoCanvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />

              <div className="absolute top-3 left-3 right-3 flex justify-between items-center pointer-events-none">
                <span
                  className={`px-2.5 py-1 rounded-sm font-mono text-[10px] font-semibold tracking-wider text-white ${
                    videoState.isVideoPlaying ? "bg-primary" : "bg-black/60"
                  }`}
                >
                  {videoState.isVideoPlaying ? "PLAYING" : "PAUSED"}
                </span>
                <span className="px-2.5 py-1 rounded-sm font-mono text-[11px] text-white bg-black/60 backdrop-blur-xs">
                  {videoState.videoDetections.length} Makanan Terdeteksi
                </span>
              </div>
            </div>

            {/* Video Playback Controls Bar */}
            <div className="flex items-center gap-3 px-4 py-3 bg-surface-low border-t border-surface-high">
              <button
                onClick={toggleVideoPlay}
                className="w-8 h-8 rounded-md bg-primary text-on-primary border-none flex items-center justify-center cursor-pointer"
              >
                {videoState.isVideoPlaying ? (
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
                max={videoState.videoDuration || 100}
                step={0.1}
                value={videoState.videoCurrentTime}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (videoElementRef.current) videoElementRef.current.currentTime = val;
                }}
                className="flex-1 accent-primary cursor-pointer"
              />

              <span className="font-mono text-xs text-on-surface-variant tabular-nums">
                {Math.floor(videoState.videoCurrentTime)}s / {Math.floor(videoState.videoDuration)}s
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
                disabled={videoState.isScanningVideo}
                className="py-2 px-3.5 bg-surface-low hover:bg-surface-container text-on-surface border border-surface-high rounded-md text-xs font-semibold cursor-pointer disabled:opacity-60"
              >
                {videoState.isScanningVideo ? "Memindai Video..." : "Pindai Seluruh Video"}
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
        {videoState.videoReport && (
          <div className="bg-surface-lowest border border-surface-high rounded-lg p-5 flex flex-col gap-4">
            <div className="flex justify-between items-start pb-3 border-b border-surface-container">
              <div>
                <h3 className="font-headline text-base font-bold text-on-surface">
                  Ringkasan Deteksi Video
                </h3>
                <span className="font-mono text-[11px] text-outline">
                  Durasi: {videoState.videoReport.video_info.duration_sec}s |{" "}
                  {videoState.videoReport.video_info.sampled_frames} frame dianalisis
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-md bg-surface-low border border-surface-high">
                <span className="block font-mono text-[10px] uppercase text-outline">
                  Total Kalori
                </span>
                <div className="font-mono text-base font-bold text-primary mt-0.5 tabular-nums">
                  {videoState.videoReport.total_nutrition.calories} kkal
                </div>
              </div>
              <div className="p-3 rounded-md bg-surface-low border border-surface-high">
                <span className="block font-mono text-[10px] uppercase text-outline">Protein</span>
                <div className="font-mono text-base font-bold text-macro-protein mt-0.5 tabular-nums">
                  {videoState.videoReport.total_nutrition.protein}g
                </div>
              </div>
              <div className="p-3 rounded-md bg-surface-low border border-surface-high">
                <span className="block font-mono text-[10px] uppercase text-outline">
                  Karbohidrat
                </span>
                <div className="font-mono text-base font-bold text-macro-carbs mt-0.5 tabular-nums">
                  {videoState.videoReport.total_nutrition.carbs}g
                </div>
              </div>
              <div className="p-3 rounded-md bg-surface-low border border-surface-high">
                <span className="block font-mono text-[10px] uppercase text-outline">Lemak</span>
                <div className="font-mono text-base font-bold text-macro-fat mt-0.5 tabular-nums">
                  {videoState.videoReport.total_nutrition.fat}g
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-outline mb-2.5">
                Hidangan Ditemukan ({videoState.videoReport.summary.length})
              </h4>
              <div className="flex flex-col gap-2">
                {videoState.videoReport.summary.map((item, i) => (
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
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <h3 className="font-headline text-base font-bold text-on-surface">
              Hasil Analisis Nutrisi
            </h3>
            <p className="text-[13px] text-on-surface-variant max-w-[300px] leading-relaxed">
              Gunakan kamera langsung, putar video, atau unggah foto makanan untuk mendapatkan estimasi
              komposisi nutrisi secara real-time.
            </p>
          </div>
        )}

        {isAnalyzing && (
          <div className="bg-surface-lowest border border-surface-high rounded-lg py-16 px-8 text-center flex flex-col items-center gap-3.5">
            <div className="relative w-14 h-14 flex items-center justify-center text-primary">
              <div className="absolute inset-0 border-2 border-surface-container border-t-primary rounded-full animate-spin" />
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                width="24"
                height="24"
              >
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
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
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
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="var(--surface-container)"
                    strokeWidth="10"
                  />
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
                  <text
                    x="60"
                    y="56"
                    textAnchor="middle"
                    fontSize="22"
                    fontWeight="700"
                    fill="var(--on-surface)"
                    fontFamily="Space Mono, monospace"
                  >
                    {result.calories}
                  </text>
                  <text
                    x="60"
                    y="72"
                    textAnchor="middle"
                    fontSize="11"
                    fill="var(--outline)"
                    fontFamily="Space Mono, monospace"
                  >
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
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
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
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
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
  );
}
