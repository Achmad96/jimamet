"use client";

import { useFoodAnalysis } from "@/hooks/useFoodAnalysis";
import { CameraErrorBanner } from "./CameraErrorBanner";
import { PhotoPreviewSection } from "./PhotoPreviewSection";
import { MediaDropzoneSection } from "./MediaDropzoneSection";
import { CameraLiveStreamSection } from "./CameraLiveStreamSection";
import { VideoPlaybackSection } from "./VideoPlaybackSection";
import { VideoReportSection } from "./VideoReportSection";
import { NutritionResultCard } from "./NutritionResultCard";
import { AnalysisStatusState } from "./AnalysisStatusState";

export function FoodAnalysisClient() {
  const { camera, video, selectedImage, fileName, isAnalyzing, dragActive, setDragActive, result, saveStatus, fileInputRef, cameraCaptureInputRef, uploadCanvasRef, handleFile, handleDrop, analyzeImage, captureCameraSnapshot, captureVideoFrame, scanEntireVideo, saveToHistory, resetAll } =
    useFoodAnalysis();

  const { state: cameraState, cameraVideoRef, cameraCanvasRef, startCamera, stopCameraStream, toggleCameraFacing, setResolutionPreset, setCameraError } = camera;

  const { state: videoState, videoElementRef, videoCanvasRef, toggleVideoPlay } = video;

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
        {cameraState.cameraError && !cameraState.cameraActive && <CameraErrorBanner cameraError={cameraState.cameraError} cameraCaptureInputRef={cameraCaptureInputRef} onClose={() => setCameraError(null)} />}

        {/* ── 1. PHOTO PREVIEW STATE ── */}
        {!cameraState.cameraActive && selectedImage && <PhotoPreviewSection selectedImage={selectedImage} fileName={fileName} uploadCanvasRef={uploadCanvasRef} isAnalyzing={isAnalyzing} hasResult={Boolean(result)} onAnalyze={analyzeImage} onOpenCamera={() => startCamera()} onReset={resetAll} />}

        {/* ── 2. DEFAULT UNIFIED DROPZONE & ACTIONS ── */}
        {!cameraState.cameraActive && !selectedImage && !videoState.videoSrc && (
          <MediaDropzoneSection
            dragActive={dragActive}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onPickFile={() => fileInputRef.current?.click()}
            onOpenCamera={() => startCamera()}
          />
        )}

        {/* ── 3. REAL-TIME CAMERA ── */}
        {cameraState.cameraActive && (
          <CameraLiveStreamSection
            cameraVideoRef={cameraVideoRef}
            cameraCanvasRef={cameraCanvasRef}
            facing={cameraState.cameraFacing}
            fps={cameraState.cameraFps}
            latency={cameraState.cameraLatency}
            resolutionPreset={cameraState.resolutionPreset}
            detections={cameraState.cameraDetections}
            personDetected={cameraState.cameraPersonDetected}
            isFlipping={cameraState.isFlipping}
            onClose={stopCameraStream}
            onToggleResolution={() => setResolutionPreset(cameraState.resolutionPreset === 480 ? 640 : 480)}
            onCapture={captureCameraSnapshot}
            onToggleFacing={toggleCameraFacing}
            onOpenGallery={() => {
              stopCameraStream();
              fileInputRef.current?.click();
            }}
          />
        )}

        {/* ── 4. VIDEO PLAYBACK STATE ── */}
        {!cameraState.cameraActive && !selectedImage && videoState.videoSrc && (
          <VideoPlaybackSection
            videoElementRef={videoElementRef}
            videoCanvasRef={videoCanvasRef}
            videoSrc={videoState.videoSrc}
            isVideoPlaying={videoState.isVideoPlaying}
            videoCurrentTime={videoState.videoCurrentTime}
            videoDuration={videoState.videoDuration}
            videoDetectionsCount={videoState.videoDetections.length}
            isScanningVideo={videoState.isScanningVideo}
            onTogglePlay={toggleVideoPlay}
            onSeek={(val) => {
              if (videoElementRef.current) videoElementRef.current.currentTime = val;
            }}
            onCaptureFrame={captureVideoFrame}
            onScanEntireVideo={scanEntireVideo}
            onOpenCamera={() => startCamera()}
            onReset={resetAll}
          />
        )}

        {/* ── VIDEO ANALYSIS SUMMARY REPORT ── */}
        {videoState.videoReport && <VideoReportSection videoReport={videoState.videoReport} />}
      </div>

      {/* ═══════════════════════════════════════════════════
          RIGHT COLUMN: NUTRITION RESULTS CARD
         ═══════════════════════════════════════════════════ */}
      <div>
        {!result && <AnalysisStatusState isAnalyzing={isAnalyzing} />}

        {result && <NutritionResultCard result={result} saveStatus={saveStatus} onSave={saveToHistory} onReset={resetAll} />}
      </div>
    </div>
  );
}
