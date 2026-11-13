import { AnalysisResult } from "@/lib/food-detection";

interface NutritionResultCardProps {
  result: AnalysisResult;
  saveStatus: "" | "saving" | "saved";
  onSave: () => void;
  onReset: () => void;
}

export function NutritionResultCard({ result, saveStatus, onSave, onReset }: NutritionResultCardProps) {
  return (
    <div className="bg-surface-lowest border border-surface-high rounded-lg p-6 flex flex-col gap-5">
      {/* Food Header */}
      <div className="flex justify-between items-start gap-3 pb-4 border-b border-surface-container">
        <div>
          <h2 className="font-headline text-xl font-bold text-on-surface tracking-tight">{result.foodName}</h2>
          <span className="font-mono text-xs text-outline">{result.portion}</span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-fixed text-primary rounded-sm font-mono text-[11px] font-semibold">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            <circle cx="60" cy="60" r="50" fill="none" stroke="var(--surface-container)" strokeWidth="10" />
            <circle cx="60" cy="60" r="50" fill="none" stroke="#143625" strokeWidth="10" strokeDasharray={`${Math.min(1, result.calories / 800) * 314} 314`} strokeLinecap="round" transform="rotate(-90 60 60)" />
            <text x="60" y="56" textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--on-surface)" fontFamily="Space Mono, monospace">
              {result.calories}
            </text>
            <text x="60" y="72" textAnchor="middle" fontSize="11" fill="var(--outline)" fontFamily="Space Mono, monospace">
              kkal
            </text>
          </svg>
        </div>
        <div className="flex flex-wrap gap-2">
          {result.tags.map((tag) => (
            <span key={tag} className="px-2.5 py-1 rounded-sm font-mono text-[11px] font-semibold bg-surface-lowest border border-surface-high text-on-surface">
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
        <h4 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-outline">Detail Komposisi Makronutrien</h4>
        {result.nutrients.map((n) => (
          <div key={n.name} className="grid grid-cols-[100px_1fr_64px] items-center gap-3">
            <span className="text-[13px] font-medium text-on-surface">{n.name}</span>
            <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${n.pct}%`, background: n.color }} />
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </div>
        <div>
          <h4 className="font-headline text-xs font-bold text-on-surface mb-1">Catatan Klinis NutriCoach</h4>
          <p className="text-xs text-on-surface-variant leading-relaxed">{result.recommendation}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2.5 pt-2">
        <button
          className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 bg-primary hover:bg-primary-container text-on-primary border-none rounded-md font-headline text-[13px] font-semibold cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={onSave}
          disabled={saveStatus !== "" || result.nutritionUnavailable}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          {saveStatus === "saving" ? "Menyimpan..." : saveStatus === "saved" ? "✓ Tersimpan!" : "Simpan ke Riwayat"}
        </button>
        <button onClick={onReset} className="py-3 px-4 bg-surface-lowest hover:bg-surface-low text-on-surface border border-surface-high rounded-md font-headline text-[13px] font-semibold cursor-pointer transition-colors">
          Reset
        </button>
      </div>
    </div>
  );
}
