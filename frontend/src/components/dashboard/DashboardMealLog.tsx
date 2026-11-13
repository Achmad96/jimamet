import Link from "next/link";
import { formatFoodLabel } from "@/lib/food-labels";
import { formatTime, DashboardMeal } from "@/lib/dashboard-utils";

interface DashboardMealLogProps {
  meals: DashboardMeal[];
}

export function DashboardMealLog({ meals }: DashboardMealLogProps) {
  return (
    <div className="bg-surface-lowest border border-surface-high rounded-lg p-6">
      <div className="flex justify-between items-start mb-5 pb-3.5 border-b border-surface-container">
        <div>
          <h3 className="font-headline text-base font-bold text-on-surface tracking-tight">
            Log Konsumsi Hari Ini
          </h3>
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
            <p className="text-[13px] text-on-surface-variant mb-2">
              Belum ada makanan yang dicatat hari ini.
            </p>
            <Link
              href="/dashboard/food-analysis"
              className="text-xs font-semibold text-primary no-underline hover:underline"
            >
              Mulai analisis foto atau kamera →
            </Link>
          </div>
        ) : (
          meals.map((meal, i) => (
            <div
              key={meal.id || i}
              className="flex items-center gap-3.5 px-3.5 py-3 rounded-md bg-surface-low border border-transparent hover:border-surface-high hover:bg-surface-container transition-all"
            >
              <div className="w-9 h-9 rounded-md bg-surface-lowest border border-surface-high text-primary flex items-center justify-center shrink-0">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                  <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                  <line x1="6" y1="2" x2="6" y2="4" />
                  <line x1="10" y1="1" x2="10" y2="4" />
                  <line x1="14" y1="2" x2="14" y2="4" />
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
  );
}
