import { ProfileData } from "@/lib/profile-utils";

interface ProfileActivityGoalCardProps {
  profile: ProfileData;
  fieldInputClass: string;
  onChange: (field: keyof ProfileData, value: string) => void;
}

export function ProfileActivityGoalCard({ profile, fieldInputClass, onChange }: ProfileActivityGoalCardProps) {
  return (
    <div className="bg-surface-lowest border border-surface-high rounded-lg p-6 flex flex-col gap-5">
      <h3 className="font-headline text-[15px] font-bold text-on-surface flex items-center gap-2.5 pb-3 border-b border-surface-container">
        <svg className="text-primary" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
          <line x1="6" y1="2" x2="6" y2="4" />
          <line x1="10" y1="2" x2="10" y2="4" />
          <line x1="14" y1="2" x2="14" y2="4" />
        </svg>
        Tingkat Aktivitas & Orientasi Diet
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-on-surface">Aktivitas Fisik</label>
          <select value={profile.activityLevel} onChange={(e) => onChange("activityLevel", e.target.value)} className={fieldInputClass}>
            <option value="sedentary">Sedentari (jarang olahraga)</option>
            <option value="light">Ringan (1-3 hari/minggu)</option>
            <option value="moderate">Moderat (3-5 hari/minggu)</option>
            <option value="active">Aktif (6-7 hari/minggu)</option>
            <option value="veryActive">Sangat Aktif (2x sehari)</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-on-surface">Target Berat Badan</label>
          <select value={profile.goal} onChange={(e) => onChange("goal", e.target.value)} className={fieldInputClass}>
            <option value="lose">Defisit Kalori (-500 kkal)</option>
            <option value="maintain">Pemeliharaan (Maintenance)</option>
            <option value="gain">Surplus Kalori (+500 kkal)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
