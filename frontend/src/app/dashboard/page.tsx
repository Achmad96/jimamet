import Link from "next/link";
import { getServerMe, getServerDashboardSummary } from "@/lib/server-api";
import {
  getGreeting,
  formatTime,
  formatDateHeader,
  calculateMacroProgress,
  DEFAULT_PROTEIN_TARGET,
  DEFAULT_CARB_TARGET,
  DEFAULT_FAT_TARGET,
  DEFAULT_FIBER_TARGET,
} from "@/lib/dashboard-utils";
import { formatFoodLabel } from "@/lib/food-labels";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";

export default async function DashboardPage() {
  const [meRes, summaryRes] = await Promise.all([
    getServerMe(),
    getServerDashboardSummary(),
  ]);

  const user = meRes.data;
  const summary = summaryRes.data || {
    total_calories: 0,
    target_calories: 2000,
    total_protein: 0,
    total_carbs: 0,
    total_fat: 0,
    meals: [],
    weekly_data: [],
  };

  const greeting = getGreeting();
  const dateFormatted = formatDateHeader();
  const progress = calculateMacroProgress(summary);

  const macroProgressBars = [
    { name: "Protein", value: progress.protein, target: DEFAULT_PROTEIN_TARGET, unit: "g", color: "#c85a32" },
    { name: "Karbohidrat", value: progress.carbs, target: DEFAULT_CARB_TARGET, unit: "g", color: "#d9822b" },
    { name: "Lemak", value: progress.fat, target: DEFAULT_FAT_TARGET, unit: "g", color: "#2b6f77" },
    { name: "Serat", value: 0, target: DEFAULT_FIBER_TARGET, unit: "g", color: "#588157" },
  ];

  const meals = summary.meals || [];

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page Header (SSR Pre-rendered) ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-4 border-b border-surface-high">
        <div>
          <h1 className="font-headline text-2xl sm:text-[28px] font-bold text-on-surface tracking-tight">
            {greeting}, {user?.full_name?.split(" ")[0] || user?.username || "Pasien"}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Ringkasan keseimbangan energi dan makronutrien berdasarkan catatan konsumsi Anda.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 font-mono text-xs font-medium text-on-surface-variant px-3.5 py-2 bg-surface-lowest rounded-md border border-surface-high">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {dateFormatted}
          </span>
        </div>
      </div>

      {/* ── 4-Column Clinical Telemetry Strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-lowest border border-surface-high rounded-lg p-5 flex flex-col gap-2.5 hover:border-outline-variant transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-semibold tracking-wider text-on-surface-variant">ENERGI HARI INI</span>
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
            <div className="h-full rounded-full transition-all duration-500 bg-macro-cal" style={{ width: `${progress.caloriePct}%` }} />
          </div>
        </div>

        <div className="bg-surface-lowest border border-surface-high rounded-lg p-5 flex flex-col gap-2.5 hover:border-outline-variant transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-semibold tracking-wider text-on-surface-variant">PROTEIN</span>
            <span className="w-2 h-2 rounded-[2px] bg-macro-protein" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-mono text-[26px] font-semibold text-on-surface tracking-tight leading-tight tabular-nums">
              {progress.protein}g
            </span>
            <span className="font-mono text-[11px] text-outline">target {DEFAULT_PROTEIN_TARGET}g</span>
          </div>
          <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden mt-1">
            <div className="h-full rounded-full transition-all duration-500 bg-macro-protein" style={{ width: `${progress.proteinPct}%` }} />
          </div>
        </div>

        <div className="bg-surface-lowest border border-surface-high rounded-lg p-5 flex flex-col gap-2.5 hover:border-outline-variant transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-semibold tracking-wider text-on-surface-variant">KARBOHIDRAT</span>
            <span className="w-2 h-2 rounded-[2px] bg-macro-carbs" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-mono text-[26px] font-semibold text-on-surface tracking-tight leading-tight tabular-nums">
              {progress.carbs}g
            </span>
            <span className="font-mono text-[11px] text-outline">target {DEFAULT_CARB_TARGET}g</span>
          </div>
          <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden mt-1">
            <div className="h-full rounded-full transition-all duration-500 bg-macro-carbs" style={{ width: `${progress.carbPct}%` }} />
          </div>
        </div>

        <div className="bg-surface-lowest border border-surface-high rounded-lg p-5 flex flex-col gap-2.5 hover:border-outline-variant transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-semibold tracking-wider text-on-surface-variant">LEMAK</span>
            <span className="w-2 h-2 rounded-[2px] bg-macro-fat" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-mono text-[26px] font-semibold text-on-surface tracking-tight leading-tight tabular-nums">
              {progress.fat}g
            </span>
            <span className="font-mono text-[11px] text-outline">target {DEFAULT_FAT_TARGET}g</span>
          </div>
          <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden mt-1">
            <div className="h-full rounded-full transition-all duration-500 bg-macro-fat" style={{ width: `${progress.fatPct}%` }} />
          </div>
        </div>
      </div>

      {/* ── Charts Row (Delegated to Client Component for hover interactions) ── */}
      <DashboardCharts
        weeklyData={summary.weekly_data || []}
        todayCalories={progress.calories}
        targetCalories={progress.calorieTarget}
        protein={progress.protein}
        carbs={progress.carbs}
        fat={progress.fat}
      />

      {/* ── Bottom Row (Log Konsumsi & Target Makronutrien) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-surface-lowest border border-surface-high rounded-lg p-6">
          <div className="flex justify-between items-start mb-5 pb-3.5 border-b border-surface-container">
            <div>
              <h3 className="font-headline text-base font-bold text-on-surface tracking-tight">Log Konsumsi Hari Ini</h3>
              <p className="text-xs text-outline mt-0.5">{meals.length} entri makanan tercatat</p>
            </div>
            <Link
              href="/dashboard/food-analysis"
              className="px-3.5 py-2 bg-primary hover:bg-primary-container text-on-primary border-none rounded-md text-xs font-semibold font-headline no-underline transition-colors"
            >
              + Catat Makanan
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {meals.length === 0 ? (
              <div className="py-9 px-4 text-center bg-surface-low border border-dashed border-surface-high rounded-md">
                <p className="text-[13px] text-on-surface-variant mb-2">Belum ada makanan yang dicatat hari ini.</p>
                <Link href="/dashboard/food-analysis" className="text-xs font-semibold text-primary no-underline hover:underline">
                  Mulai analisis foto atau kamera →
                </Link>
              </div>
            ) : (
              meals.map((meal, i) => (
                <div key={meal.id || i} className="flex items-center gap-3.5 px-3.5 py-3 rounded-md bg-surface-low border border-transparent hover:border-surface-high hover:bg-surface-container transition-all">
                  <div className="w-9 h-9 rounded-md bg-surface-lowest border border-surface-high text-primary flex items-center justify-center shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                      <line x1="6" y1="1" x2="6" y2="4" />
                      <line x1="10" y1="1" x2="10" y2="4" />
                      <line x1="14" y1="1" x2="14" y2="4" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-on-surface truncate">
                      {formatFoodLabel(meal.food_name || meal.nama_makanan || "Makanan")}
                    </span>
                    <span className="font-mono text-[11px] text-outline">
                      {formatTime(meal.recorded_at || meal.tanggal)}
                    </span>
                  </div>
                  <span className="font-mono text-[13px] font-semibold text-primary shrink-0 tabular-nums">
                    {meal.calories || meal.kalori} kkal
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-surface-lowest border border-surface-high rounded-lg p-6">
          <div className="flex justify-between items-start mb-5 pb-3.5 border-b border-surface-container">
            <div>
              <h3 className="font-headline text-base font-bold text-on-surface tracking-tight">Target Kecukupan Makronutrien</h3>
              <p className="text-xs text-outline mt-0.5">Pencapaian gramasi harian per kategori gizi</p>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {macroProgressBars.map((m) => (
              <div key={m.name} className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[13px] font-semibold text-on-surface">{m.name}</span>
                  <span className="font-mono text-xs font-semibold text-on-surface tabular-nums">
                    {m.value}
                    {m.unit}{" "}
                    <span className="font-normal text-outline">
                      / {m.target}
                      {m.unit}
                    </span>
                  </span>
                </div>
                <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((m.value / m.target) * 100, 100)}%`,
                      background: m.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
