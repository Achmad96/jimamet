interface AnalysisStatusStateProps {
  isAnalyzing: boolean;
}

export function AnalysisStatusState({ isAnalyzing }: AnalysisStatusStateProps) {
  if (isAnalyzing) {
    return (
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
    );
  }

  return (
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
  );
}
