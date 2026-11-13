import { DragEvent } from "react";

interface MediaDropzoneSectionProps {
  dragActive: boolean;
  onDragOver: (e: DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: DragEvent) => void;
  onPickFile: () => void;
  onOpenCamera: () => void;
}

export function MediaDropzoneSection({ dragActive, onDragOver, onDragLeave, onDrop, onPickFile, onOpenCamera }: MediaDropzoneSectionProps) {
  return (
    <>
      <div
        className={`border-[1.5px] border-dashed rounded-lg py-14 px-8 text-center cursor-pointer transition-all flex flex-col items-center gap-3 ${dragActive ? "border-primary bg-primary/4" : "border-outline-variant bg-surface-lowest hover:border-primary hover:bg-surface-bright"}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={onPickFile}>
        <div className="w-13 h-13 rounded-md bg-surface-low border border-surface-high flex items-center justify-center text-primary mb-1">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <h3 className="font-headline text-base font-bold text-on-surface">Pilih atau Ambil Foto / Video Makanan</h3>
        <p className="text-[13px] text-on-surface-variant">Drag & drop file di sini, atau gunakan kamera langsung</p>
        <span className="font-mono text-[11px] text-outline px-3 py-1 bg-surface-low border border-surface-high rounded-sm mt-1">Foto (JPG, PNG, WEBP) atau Video (MP4, WEBM) — Maks 50MB</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button className="flex items-center justify-center gap-2.5 py-3 px-4 bg-primary hover:bg-primary-container text-on-primary border-none rounded-md font-headline text-[13px] font-semibold cursor-pointer transition-colors" onClick={onOpenCamera}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          Buka Kamera Real-Time
        </button>
        <button className="flex items-center justify-center gap-2.5 py-3 px-4 bg-surface-lowest hover:bg-surface-low text-on-surface border border-surface-high hover:border-outline rounded-md font-headline text-[13px] font-semibold cursor-pointer transition-colors" onClick={onPickFile}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          Pilih dari Galeri
        </button>
      </div>
    </>
  );
}
