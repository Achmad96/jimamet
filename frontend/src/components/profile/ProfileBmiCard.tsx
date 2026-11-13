import type { BmiInfo } from "@/lib/profile-utils";

export type { BmiInfo };

interface ProfileBmiCardProps {
  bmiInfo: BmiInfo | null;
}

export function ProfileBmiCard({ bmiInfo }: ProfileBmiCardProps) {
  return (
    <div className="bg-surface-lowest border border-surface-high rounded-lg p-6 flex flex-col gap-3 justify-center">
      <span className="font-mono text-[11px] font-semibold tracking-wider text-outline uppercase">Indeks Massa Tubuh (BMI)</span>
      {bmiInfo ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline gap-2.5">
            <span className="font-mono text-3xl font-bold text-on-surface tabular-nums">{bmiInfo.value}</span>
            <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-sm" style={{ background: `${bmiInfo.color}18`, color: bmiInfo.color }}>
              {bmiInfo.label}
            </span>
          </div>
          <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden mt-1">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(5, ((bmiInfo.value - 15) / (35 - 15)) * 100))}%`,
                background: bmiInfo.color
              }}
            />
          </div>
        </div>
      ) : (
        <span className="font-mono text-sm text-outline">Lengkapi berat dan tinggi badan</span>
      )}
    </div>
  );
}
