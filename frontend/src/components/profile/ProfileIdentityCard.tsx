import { ProfileData } from "@/lib/profile-utils";

interface ProfileIdentityCardProps {
  profile: ProfileData;
  fieldInputClass: string;
  onChange: (field: keyof ProfileData, value: string) => void;
}

export function ProfileIdentityCard({ profile, fieldInputClass, onChange }: ProfileIdentityCardProps) {
  return (
    <div className="bg-surface-lowest border border-surface-high rounded-lg p-6 flex flex-col gap-5">
      <h3 className="font-headline text-[15px] font-bold text-on-surface flex items-center gap-2.5 pb-3 border-b border-surface-container">
        <svg className="text-primary" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        Identitas Pengguna
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-on-surface">Nama Lengkap</label>
          <input type="text" value={profile.fullName} onChange={(e) => onChange("fullName", e.target.value)} className={fieldInputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-on-surface">Email</label>
          <input type="email" value={profile.email} disabled className={`${fieldInputClass} opacity-70 cursor-not-allowed`} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-on-surface">Username</label>
          <input type="text" value={profile.username} disabled className={`${fieldInputClass} opacity-70 cursor-not-allowed`} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-on-surface">Usia</label>
          <div className="relative flex items-center">
            <input type="number" value={profile.age} onChange={(e) => onChange("age", e.target.value)} className={`${fieldInputClass} pr-12 font-mono tabular-nums`} />
            <span className="absolute right-3.5 font-mono text-xs font-medium text-outline pointer-events-none">thn</span>
          </div>
        </div>
      </div>
    </div>
  );
}
