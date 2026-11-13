interface MacroTargetItem {
  name: string;
  value: number;
  target: number;
  unit: string;
  color: string;
}

interface DashboardMacroTargetsProps {
  macroProgressBars: MacroTargetItem[];
}

export function DashboardMacroTargets({
  macroProgressBars,
}: DashboardMacroTargetsProps) {
  return (
    <div className="bg-surface-lowest border border-surface-high rounded-lg p-6">
      <div className="flex justify-between items-start mb-5 pb-3.5 border-b border-surface-container">
        <div>
          <h3 className="font-headline text-base font-bold text-on-surface tracking-tight">
            Target Kecukupan Makronutrien
          </h3>
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
  );
}
