import { RefObject } from "react";
import { DetectionBox } from "@/lib/food-detection";
import { formatFoodLabel } from "@/lib/food-labels";

interface CameraLiveStreamSectionProps {
  cameraVideoRef: RefObject<HTMLVideoElement | null>;
  cameraCanvasRef: RefObject<HTMLCanvasElement | null>;
  facing: "environment" | "user";
  fps: number;
  latency: number;
  resolutionPreset: 320 | 480 | 640;
  detections: DetectionBox[];
  personDetected: boolean;
  isFlipping: boolean;
  onClose: () => void;
  onToggleResolution: () => void;
  onCapture: () => void;
  onToggleFacing: () => void;
  onOpenGallery: () => void;
}

export function CameraLiveStreamSection({ cameraVideoRef, cameraCanvasRef, facing, fps, latency, resolutionPreset, detections, personDetected, isFlipping, onClose, onToggleResolution, onCapture, onToggleFacing, onOpenGallery }: CameraLiveStreamSectionProps) {
  return (
    <div className="bg-surface-lowest border border-surface-high rounded-lg overflow-hidden fixed inset-0 z-9999 md:static md:z-auto">
      <div className="relative w-full h-dvh md:h-auto md:aspect-4/3 md:min-h-95 bg-black overflow-hidden flex items-center justify-center">
        <video ref={cameraVideoRef} playsInline muted autoPlay className={`w-full h-full object-cover block ${facing === "user" ? "-scale-x-100" : ""}`} />
        <canvas ref={cameraCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-linear-to-b from-black/65 to-transparent z-10">
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-black/45 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center cursor-pointer backdrop-blur-md transition-colors" title="Tutup Kamera (Esc)" aria-label="Tutup Kamera">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 border border-white/15 backdrop-blur-md font-mono text-[11px] text-white">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold">LIVE</span>
            {fps > 0 && <span className="text-white/80">{fps} FPS</span>}
            {latency > 0 && <span className="text-white/70">{latency}ms</span>}
          </div>

          <button onClick={onToggleResolution} className="px-3 py-1.5 rounded-full bg-black/45 border border-white/20 text-white font-mono text-[11px] font-semibold cursor-pointer backdrop-blur-md" title="Kualitas Deteksi: 480p / 640p">
            {resolutionPreset === 640 ? "HD" : "SD"}
          </button>
        </div>

        {/* Floating Recognition Banner */}
        <div className="absolute bottom-24 left-4 right-4 flex justify-center z-10">
          {detections.length > 0 ? (
            <div className="flex items-center justify-between gap-4 px-4 py-2.5 rounded-lg bg-primary/92 text-white border border-white/20 backdrop-blur-md cursor-pointer shadow-lg w-full max-w-105" onClick={onCapture} role="button" tabIndex={0}>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-300" />
                <span className="font-headline font-bold">{formatFoodLabel(detections[0].food_name)}</span>
                <span className="font-mono text-white/80">{Math.round(detections[0].confidence)}%</span>
                {detections[0].nutrition?.calories && <span className="font-mono font-semibold text-primary-fixed">{Math.round(detections[0].nutrition.calories)} kkal</span>}
              </div>
              <span className="font-mono text-[11px] font-semibold">Ambil Foto →</span>
            </div>
          ) : personDetected ? (
            <div className="px-4 py-2 rounded-full bg-amber-900/85 text-amber-100 border border-amber-400/30 font-mono text-xs backdrop-blur-md">Wajah terdeteksi — Arahkan lensa ke makanan</div>
          ) : (
            <div className="px-4 py-2 rounded-full bg-black/55 text-white/90 border border-white/15 font-mono text-xs backdrop-blur-md">Arahkan kamera ke hidangan makanan</div>
          )}
        </div>

        {/* Bottom Controls Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-5 flex items-center justify-around bg-linear-to-t from-black/75 to-transparent z-10">
          <button onClick={onOpenGallery} className="w-11 h-11 rounded-full bg-black/45 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center cursor-pointer backdrop-blur-md" title="Pilih dari Galeri" aria-label="Pilih dari Galeri">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </button>

          <button onClick={onCapture} className="w-16 h-16 rounded-full border-4 border-white bg-white/20 p-1 flex items-center justify-center cursor-pointer transition-transform active:scale-95" title="Ambil Foto & Analisis" aria-label="Ambil Foto">
            <div className="w-full h-full rounded-full bg-white" />
          </button>

          <button onClick={onToggleFacing} className="w-11 h-11 rounded-full bg-black/45 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center cursor-pointer backdrop-blur-md" title="Ganti Kamera Depan / Belakang" aria-label="Ganti Kamera">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isFlipping ? "animate-spin" : ""}>
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 21h5v-5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
