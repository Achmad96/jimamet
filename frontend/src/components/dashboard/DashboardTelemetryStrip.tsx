import { MacroProgress } from "@/lib/dashboard-utils";

interface DashboardTelemetryStripProps {
  progress: MacroProgress;
  targets: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

export function DashboardTelemetryStrip({
  progress,
  targets,
}: DashboardTelemetryStripProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Energi Hari Ini */}
      <div className="bg-surface-lowest border border-surface-high rounded-lg p-5 flex flex-col gap-2.5 hover:border-outline-variant transition-colors">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] font-semibold tracking-wider text-on-surface-variant">
            ENERGI HARI INI
          </span>
          <span className="font-mono text-[11px] font-semibold text-primary px-2 py-0.5 bg-primary-fixed rounded-sm">
            {Math.round(progress.caloriePct)}%
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-mono text-[26px] font-semibold text-on-surface tracking-tight leading-tight tabular-nums">
            {progress.calories.toLocaleString("id-ID")}
          </span>
          <span className="font-mono text-[11px] text-outline">
            target {progress.calorieTarget.toLocaleString("id-ID")} kkal
          </span>
        </div>
        <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden mt-1">
          <div
            className="h-full rounded-full transition-all duration-500 bg-macro-cal"
            style={{ width: `${progress.caloriePct}%` }}
          />
        </div>
      </div>

      {/* 2. Protein */}
      <div className="bg-surface-lowest border border-surface-high rounded-lg p-5 flex flex-col gap-2.5 hover:border-outline-variant transition-colors">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] font-semibold tracking-wider text-on-surface-variant">
            PROTEIN
          </span>
          <span className="w-2 h-2 rounded-[2px] bg-macro-protein" />
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-mono text-[26px] font-semibold text-on-surface tracking-tight leading-tight tabular-nums">
            {progress.protein}g
          </span>
          <span className="font-mono text-[11px] text-outline">target {targets.protein}g</span>
        </div>
        <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden mt-1">
          <div
            className="h-full rounded-full transition-all duration-500 bg-macro-protein"
            style={{ width: `${progress.proteinPct}%` }}
          />
        </div>
      </div>

      {/* 3. Karbohidrat */}
      <div className="bg-surface-lowest border border-surface-high rounded-lg p-5 flex flex-col gap-2.5 hover:border-outline-variant transition-colors">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] font-semibold tracking-wider text-on-surface-variant">
            KARBOHIDRAT
          </span>
          <span className="w-2 h-2 rounded-[2px] bg-macro-carbs" />
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-mono text-[26px] font-semibold text-on-surface tracking-tight leading-tight tabular-nums">
            {progress.carbs}g
          </span>
          <span className="font-mono text-[11px] text-outline">target {targets.carbs}g</span>
        </div>
        <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden mt-1">
          <div
            className="h-full rounded-full transition-all duration-500 bg-macro-carbs"
            style={{ width: `${progress.carbPct}%` }}
          />
        </div>
      </div>

      {/* 4. Lemak */}
      <div className="bg-surface-lowest border border-surface-high rounded-lg p-5 flex flex-col gap-2.5 hover:border-outline-variant transition-colors">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] font-semibold tracking-wider text-on-surface-variant">
            LEMAK
          </span>
          <span className="w-2 h-2 rounded-[2px] bg-macro-fat" />
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-mono text-[26px] font-semibold text-on-surface tracking-tight leading-tight tabular-nums">
            {progress.fat}g
          </span>
          <span className="font-mono text-[11px] text-outline">target {targets.fat}g</span>
        </div>
        <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden mt-1">
          <div
            className="h-full rounded-full transition-all duration-500 bg-macro-fat"
            style={{ width: `${progress.fatPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
