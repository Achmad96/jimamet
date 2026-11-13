interface HistoryMacroSummaryCardsProps {
  totalCal: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export function HistoryMacroSummaryCards({ totalCal, totalProtein, totalCarbs, totalFat }: HistoryMacroSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="bg-surface-lowest border border-surface-high rounded-lg p-4">
        <span className="block font-mono text-[11px] text-outline uppercase tracking-wider mb-1">Total Energi</span>
        <span className="font-mono text-2xl font-bold text-primary tabular-nums">{totalCal.toLocaleString("id-ID")}</span>
        <span className="font-mono text-xs text-outline ml-1">kkal</span>
      </div>
      <div className="bg-surface-lowest border border-surface-high rounded-lg p-4">
        <span className="block font-mono text-[11px] text-outline uppercase tracking-wider mb-1">Total Protein</span>
        <span className="font-mono text-2xl font-bold text-macro-protein tabular-nums">{totalProtein}</span>
        <span className="font-mono text-xs text-outline ml-1">g</span>
      </div>
      <div className="bg-surface-lowest border border-surface-high rounded-lg p-4">
        <span className="block font-mono text-[11px] text-outline uppercase tracking-wider mb-1">Total Karbohidrat</span>
        <span className="font-mono text-2xl font-bold text-macro-carbs tabular-nums">{totalCarbs}</span>
        <span className="font-mono text-xs text-outline ml-1">g</span>
      </div>
      <div className="bg-surface-lowest border border-surface-high rounded-lg p-4">
        <span className="block font-mono text-[11px] text-outline uppercase tracking-wider mb-1">Total Lemak</span>
        <span className="font-mono text-2xl font-bold text-macro-fat tabular-nums">{totalFat}</span>
        <span className="font-mono text-xs text-outline ml-1">g</span>
      </div>
    </div>
  );
}
