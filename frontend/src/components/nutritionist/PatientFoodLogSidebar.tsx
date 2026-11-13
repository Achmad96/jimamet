import { FoodRecord } from "./PatientDetailClient";
import { formatFoodLabel } from "@/lib/food-labels";

interface PatientFoodLogSidebarProps {
  foodHistory: FoodRecord[];
  formatDateShort: (iso: string) => string;
}

export function PatientFoodLogSidebar({ foodHistory, formatDateShort }: PatientFoodLogSidebarProps) {
  if (foodHistory.length === 0) {
    return <p className="text-center text-xs text-outline py-8">Belum ada makanan yang dicatat.</p>;
  }

  return (
    <div className="flex flex-col gap-2.5">
      {foodHistory.map((m) => (
        <div key={m.id} className="rounded-lg border border-surface-high bg-surface-lowest p-3">
          <div className="flex justify-between items-start mb-1">
            <span className="font-semibold text-on-surface text-xs">{formatFoodLabel(m.food_name)}</span>
            <span className="font-mono text-xs font-bold text-primary">{m.calories} kkal</span>
          </div>
          <span className="block font-mono text-[10px] text-outline mb-2">{formatDateShort(m.recorded_at)}</span>
          <div className="flex gap-2 font-mono text-[10px] text-on-surface-variant">
            <span>P: {m.protein || 0}g</span>
            <span>K: {m.carbs || 0}g</span>
            <span>L: {m.fat || 0}g</span>
          </div>
        </div>
      ))}
    </div>
  );
}
