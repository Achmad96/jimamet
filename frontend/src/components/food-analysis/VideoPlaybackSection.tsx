import { RefObject } from "react";

interface VideoPlaybackSectionProps {
  videoElementRef: RefObject<HTMLVideoElement | null>;
  videoCanvasRef: RefObject<HTMLCanvasElement | null>;
  videoSrc: string;
  isVideoPlaying: boolean;
  videoCurrentTime: number;
  videoDuration: number;
  videoDetectionsCount: number;
  isScanningVideo: boolean;
  onTogglePlay: () => void;
  onSeek: (val: number) => void;
  onCaptureFrame: () => void;
  onScanEntireVideo: () => void;
  onOpenCamera: () => void;
  onReset: () => void;
}

export function VideoPlaybackSection({ videoElementRef, videoCanvasRef, videoSrc, isVideoPlaying, videoCurrentTime, videoDuration, videoDetectionsCount, isScanningVideo, onTogglePlay, onSeek, onCaptureFrame, onScanEntireVideo, onOpenCamera, onReset }: VideoPlaybackSectionProps) {
  return (
    <div className="bg-surface-lowest border border-surface-high rounded-lg overflow-hidden">
      <div className="relative aspect-4/3 bg-black overflow-hidden">
        <video ref={videoElementRef} src={videoSrc} playsInline className="w-full h-full object-cover block" onEnded={onTogglePlay} />
        <canvas ref={videoCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

        <div className="absolute top-3 left-3 right-3 flex justify-between items-center pointer-events-none">
          <span className={`px-2.5 py-1 rounded-sm font-mono text-[10px] font-semibold tracking-wider text-white ${isVideoPlaying ? "bg-primary" : "bg-black/60"}`}>{isVideoPlaying ? "PLAYING" : "PAUSED"}</span>
          <span className="px-2.5 py-1 rounded-sm font-mono text-[11px] text-white bg-black/60 backdrop-blur-xs">{videoDetectionsCount} Makanan Terdeteksi</span>
        </div>
      </div>

      {/* Video Playback Controls Bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-surface-low border-t border-surface-high">
        <button onClick={onTogglePlay} className="w-8 h-8 rounded-md bg-primary text-on-primary border-none flex items-center justify-center cursor-pointer">
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

        <input type="range" min={0} max={videoDuration || 100} step={0.1} value={videoCurrentTime} onChange={(e) => onSeek(parseFloat(e.target.value))} className="flex-1 accent-primary cursor-pointer" />

        <span className="font-mono text-xs text-on-surface-variant tabular-nums">
          {Math.floor(videoCurrentTime)}s / {Math.floor(videoDuration)}s
        </span>
      </div>

      {/* Actions for Video */}
      <div className="flex flex-wrap gap-2 p-4 border-t border-surface-high">
        <button onClick={onCaptureFrame} className="inline-flex items-center gap-1.5 py-2 px-3.5 bg-primary text-on-primary border-none rounded-md text-xs font-semibold cursor-pointer">
          Ambil Frame Ini
        </button>

        <button onClick={onScanEntireVideo} disabled={isScanningVideo} className="py-2 px-3.5 bg-surface-low hover:bg-surface-container text-on-surface border border-surface-high rounded-md text-xs font-semibold cursor-pointer disabled:opacity-60">
          {isScanningVideo ? "Memindai Video..." : "Pindai Seluruh Video"}
        </button>

        <button onClick={onOpenCamera} className="py-2 px-3.5 bg-surface-low hover:bg-surface-container text-on-surface border border-surface-high rounded-md text-xs font-semibold cursor-pointer">
          Buka Kamera
        </button>

        <button onClick={onReset} className="py-2 px-3.5 bg-transparent text-on-surface-variant border border-surface-high rounded-md text-xs font-medium cursor-pointer ml-auto">
          Ganti File
        </button>
      </div>
    </div>
  );
}
