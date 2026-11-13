import Image from "next/image";
import Link from "next/link";
import { MealRecord } from "@/lib/history-utils";

interface HistoryGroupedListProps {
  grouped: Record<string, MealRecord[]>;
  searchQuery: string;
}

export function HistoryGroupedList({ grouped, searchQuery }: HistoryGroupedListProps) {
  if (Object.keys(grouped).length === 0) {
    return (
      <div className="text-center py-16 bg-surface-lowest border border-dashed border-surface-high rounded-lg p-6">
        <p className="text-sm text-on-surface-variant mb-2">{searchQuery ? `Tidak ditemukan makanan dengan kata kunci "${searchQuery}".` : "Belum ada riwayat konsumsi makanan yang tercatat."}</p>
        <Link href="/dashboard/food-analysis" className="text-xs font-semibold text-primary hover:underline">
          Mulai analisis makanan baru →
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {Object.entries(grouped).map(([dateHeader, meals]) => (
        <div key={dateHeader} className="flex flex-col gap-2">
          <div className="flex justify-between items-center px-1">
            <span className="font-headline text-sm font-bold text-on-surface">{dateHeader}</span>
            <span className="font-mono text-xs font-semibold text-primary tabular-nums">{meals.reduce((s, m) => s + m.calories, 0).toLocaleString("id-ID")} kkal</span>
          </div>
          <div className="bg-surface-lowest border border-surface-high rounded-lg overflow-hidden divide-y divide-surface-container">
            {meals.map((meal) => (
              <div key={meal.id} className="flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-surface-low">
                {meal.imageUrl ? (
                  <Image src={meal.imageUrl} alt={meal.name} width={40} height={40} unoptimized className="w-10 h-10 rounded-md object-cover shrink-0 bg-surface-container border border-surface-high" />
                ) : (
                  <div className="w-10 h-10 rounded-md bg-surface-low border border-surface-high text-on-surface-variant flex items-center justify-center shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                      <line x1="6" y1="2" x2="6" y2="4" />
                      <line x1="10" y1="1" x2="10" y2="4" />
                      <line x1="14" y1="1" x2="14" y2="4" />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-on-surface truncate">{meal.name}</span>
                  <span className="font-mono text-[11px] text-outline tabular-nums">{meal.time}</span>
                </div>
                <div className="hidden md:flex gap-1.5 shrink-0">
                  <span className="px-2.5 py-1 rounded-md font-mono text-[11px] font-semibold tabular-nums bg-macro-protein/10 text-macro-protein">P {meal.protein}g</span>
                  <span className="px-2.5 py-1 rounded-md font-mono text-[11px] font-semibold tabular-nums bg-macro-carbs/10 text-macro-carbs">K {meal.carbs}g</span>
                  <span className="px-2.5 py-1 rounded-md font-mono text-[11px] font-semibold tabular-nums bg-macro-fat/10 text-macro-fat">L {meal.fat}g</span>
                </div>
                <span className="font-mono text-[13px] font-semibold text-primary shrink-0 tabular-nums">{meal.calories} kkal</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
