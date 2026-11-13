interface ProfileCalorieBudgetCardProps {
  estimatedCalories: number | null;
  todayCalories: number;
}

export function ProfileCalorieBudgetCard({ estimatedCalories, todayCalories }: ProfileCalorieBudgetCardProps) {
  return (
    <div className="bg-surface-lowest border border-surface-high rounded-lg p-6 flex flex-col gap-3 justify-center">
      <span className="font-mono text-[11px] font-semibold tracking-wider text-outline uppercase">Target Anggaran Energi Harian</span>
      {estimatedCalories ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-3xl font-bold text-primary tabular-nums">{estimatedCalories.toLocaleString("id-ID")}</span>
            <span className="font-mono text-xs font-semibold text-outline">kkal / hari</span>
          </div>
          <span className="text-xs text-on-surface-variant leading-relaxed">
            Asupan tercatat hari ini: <strong className="font-mono text-on-surface">{todayCalories.toLocaleString("id-ID")} kkal</strong>
          </span>
        </div>
      ) : (
        <span className="font-mono text-sm text-outline">Lengkapi data untuk estimasi Mifflin-St Jeor</span>
      )}
    </div>
  );
}
