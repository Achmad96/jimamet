import { RefObject } from "react";
import Image from "next/image";

interface PhotoPreviewSectionProps {
  selectedImage: string;
  fileName: string;
  uploadCanvasRef: RefObject<HTMLCanvasElement | null>;
  isAnalyzing: boolean;
  hasResult: boolean;
  onAnalyze: () => void;
  onOpenCamera: () => void;
  onReset: () => void;
}

export function PhotoPreviewSection({ selectedImage, fileName, uploadCanvasRef, isAnalyzing, hasResult, onAnalyze, onOpenCamera, onReset }: PhotoPreviewSectionProps) {
  return (
    <div className="bg-surface-lowest border border-surface-high rounded-lg overflow-hidden">
      <div className="relative max-h-[380px] overflow-hidden bg-inverse-surface">
        <Image src={selectedImage} alt="Food preview" width={800} height={320} unoptimized className="w-full h-[320px] object-cover block" />
        <canvas ref={uploadCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
        {isAnalyzing && (
          <div className="absolute inset-0 bg-inverse-surface/60 flex flex-col items-center justify-center gap-3">
            <div className="w-4/5 h-0.5 bg-gradient-to-r from-transparent via-primary-fixed-dim to-transparent absolute animate-[scanMove_2s_ease-in-out_infinite]" />
            <span className="text-white font-mono text-xs font-semibold px-4 py-1.5 bg-black/55 rounded-full backdrop-blur-xs">Menganalisis YOLO...</span>
          </div>
        )}
      </div>
      <div className="flex flex-wrap justify-between items-center p-4 gap-3">
        <span className="text-[13px] font-medium text-on-surface-variant truncate max-w-[200px]">{fileName || "Foto Makanan"}</span>
        <div className="flex flex-wrap gap-2 items-center">
          {!hasResult && !isAnalyzing && (
            <button onClick={onAnalyze} className="inline-flex items-center gap-2 py-2.5 px-4 bg-primary hover:bg-primary-container text-on-primary border-none rounded-md font-headline text-[13px] font-semibold cursor-pointer transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              Analisis Nutrisi
            </button>
          )}
          <button onClick={onOpenCamera} className="py-2 px-3.5 bg-surface-low hover:bg-surface-container border border-surface-high rounded-md text-xs font-semibold text-on-surface cursor-pointer transition-colors">
            Buka Kamera
          </button>
          <button onClick={onReset} className="py-2 px-3.5 bg-transparent hover:bg-surface-low text-on-surface-variant border border-surface-high rounded-md text-xs font-medium cursor-pointer transition-colors">
            Ganti File
          </button>
        </div>
      </div>
    </div>
  );
}
