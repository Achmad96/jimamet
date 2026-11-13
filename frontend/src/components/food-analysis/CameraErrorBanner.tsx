import { RefObject } from "react";
import { CameraErrorInfo } from "@/lib/camera";

interface CameraErrorBannerProps {
  cameraError: CameraErrorInfo;
  cameraCaptureInputRef: RefObject<HTMLInputElement | null>;
  onClose: () => void;
}

export function CameraErrorBanner({ cameraError, cameraCaptureInputRef, onClose }: CameraErrorBannerProps) {
  return (
    <div className="flex gap-3.5 items-start p-4 rounded-lg bg-[#fff8eb] border border-[#f59e0b]/35 text-[#78350f]" role="alert">
      <div className="shrink-0 mt-0.5 text-[#d97706]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-headline text-sm font-bold text-[#92400e] mb-1">{cameraError.title}</h4>
        <p className="text-[13px] leading-relaxed text-[#78350f] mb-3">{cameraError.message}</p>
        <div className="flex flex-wrap gap-2">
          {cameraError.showNativeCapture && (
            <button type="button" className="px-3.5 py-2 rounded-md border-none bg-primary text-on-primary text-xs font-semibold cursor-pointer" onClick={() => cameraCaptureInputRef.current?.click()}>
              Ambil Foto dengan Kamera Perangkat
            </button>
          )}
          <button type="button" className="px-3 py-2 rounded-md border border-[#92400e]/25 bg-white/75 text-[#78350f] text-xs font-semibold cursor-pointer" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
