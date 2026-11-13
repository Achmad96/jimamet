import { ProfileData } from "@/lib/profile-utils";

interface ProfileBodyMetricsCardProps {
  profile: ProfileData;
  fieldInputClass: string;
  onChange: (field: keyof ProfileData, value: string) => void;
}

export function ProfileBodyMetricsCard({ profile, fieldInputClass, onChange }: ProfileBodyMetricsCardProps) {
  return (
    <div className="bg-surface-lowest border border-surface-high rounded-lg p-6 flex flex-col gap-5">
      <h3 className="font-headline text-[15px] font-bold text-on-surface flex items-center gap-2.5 pb-3 border-b border-surface-container">
        <svg className="text-primary" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        Metrik Fisiologis Tubuh
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-on-surface">Berat Badan</label>
          <div className="relative flex items-center">
            <input type="number" step="0.1" value={profile.weight} onChange={(e) => onChange("weight", e.target.value)} className={`${fieldInputClass} pr-12 font-mono tabular-nums`} />
            <span className="absolute right-3.5 font-mono text-xs font-medium text-outline pointer-events-none">kg</span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-on-surface">Tinggi Badan</label>
          <div className="relative flex items-center">
            <input type="number" value={profile.height} onChange={(e) => onChange("height", e.target.value)} className={`${fieldInputClass} pr-12 font-mono tabular-nums`} />
            <span className="absolute right-3.5 font-mono text-xs font-medium text-outline pointer-events-none">cm</span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-on-surface">Jenis Kelamin</label>
          <div className="flex gap-2">
            <button
              type="button"
              className={`flex-1 py-2.5 px-3 rounded-md font-body text-[13px] font-semibold cursor-pointer border transition-colors ${profile.gender === "male" ? "bg-primary text-on-primary border-primary" : "bg-surface-low text-on-surface-variant border-surface-high hover:bg-surface-container"}`}
              onClick={() => onChange("gender", "male")}>
              Laki-laki
            </button>
            <button
              type="button"
              className={`flex-1 py-2.5 px-3 rounded-md font-body text-[13px] font-semibold cursor-pointer border transition-colors ${profile.gender === "female" ? "bg-primary text-on-primary border-primary" : "bg-surface-low text-on-surface-variant border-surface-high hover:bg-surface-container"}`}
              onClick={() => onChange("gender", "female")}>
              Perempuan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
