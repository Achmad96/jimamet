import { PatientProfile } from "./PatientDetailClient";

interface PatientProfileSidebarProps {
  profile: PatientProfile | null;
  bmiInfo: string | null;
  catatan: string;
  savingCatatan: boolean;
  activityLabels: Record<string, string>;
  goalLabels: Record<string, string>;
  onCatatanChange: (val: string) => void;
  onSaveCatatan: () => void;
}

export function PatientProfileSidebar({ profile, bmiInfo, catatan, savingCatatan, activityLabels, goalLabels, onCatatanChange, onSaveCatatan }: PatientProfileSidebarProps) {
  if (!profile) {
    return <p className="text-center text-xs text-outline py-8">Profil pasien belum lengkap.</p>;
  }

  return (
    <div className="flex flex-col gap-4 text-[13px]">
      <div className="flex items-center gap-3 pb-3 border-b border-surface-container">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-xl font-bold text-on-primary">{profile.full_name?.[0]?.toUpperCase() || "P"}</div>
        <div>
          <h4 className="font-headline text-base font-bold text-on-surface">{profile.full_name}</h4>
          <p className="font-mono text-xs text-outline">{profile.email || "—"}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-surface-low p-2.5">
          <span className="block font-mono text-[10px] text-outline uppercase">Usia</span>
          <span className="font-bold text-on-surface">{profile.age ? `${profile.age} thn` : "—"}</span>
        </div>
        <div className="rounded-lg bg-surface-low p-2.5">
          <span className="block font-mono text-[10px] text-outline uppercase">Gender</span>
          <span className="font-bold text-on-surface">{profile.gender === "female" ? "Perempuan" : "Laki-laki"}</span>
        </div>
        <div className="rounded-lg bg-surface-low p-2.5">
          <span className="block font-mono text-[10px] text-outline uppercase">Berat Badan</span>
          <span className="font-bold text-on-surface">{profile.weight ? `${profile.weight} kg` : "—"}</span>
        </div>
        <div className="rounded-lg bg-surface-low p-2.5">
          <span className="block font-mono text-[10px] text-outline uppercase">Tinggi Badan</span>
          <span className="font-bold text-on-surface">{profile.height ? `${profile.height} cm` : "—"}</span>
        </div>
        {bmiInfo && (
          <div className="rounded-lg bg-surface-low p-2.5 col-span-2">
            <span className="block font-mono text-[10px] text-outline uppercase">Indeks Massa Tubuh (BMI)</span>
            <span className="font-bold text-primary font-mono">{bmiInfo} kg/m²</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 pt-2 border-t border-surface-container">
        <div className="flex justify-between">
          <span className="text-outline">Faktor Aktivitas:</span>
          <span className="font-semibold text-on-surface">{activityLabels[profile.activity_level || ""] || profile.activity_level || "—"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-outline">Orientasi Target:</span>
          <span className="font-semibold text-on-surface">{goalLabels[profile.goal || ""] || profile.goal || "—"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-outline">Target Energi:</span>
          <span className="font-mono font-bold text-primary">{profile.daily_calorie_target ? `${profile.daily_calorie_target} kkal` : "2000 kkal"}</span>
        </div>
      </div>

      {/* Catatan Intervensi Gizi */}
      <div className="mt-4 pt-4 border-t border-surface-container flex flex-col gap-2">
        <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-outline">Catatan Klinis Ahli Gizi</label>
        <textarea
          rows={4}
          value={catatan}
          onChange={(e) => onCatatanChange(e.target.value)}
          placeholder="Instruksi pola makan khusus pasien..."
          className="w-full rounded-md border border-surface-high bg-surface-low p-2.5 text-xs text-on-surface outline-none focus:border-primary focus:bg-surface-lowest"
        />
        <button onClick={onSaveCatatan} disabled={savingCatatan} className="self-end cursor-pointer rounded-md bg-surface-container px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-high disabled:opacity-50">
          {savingCatatan ? "Menyimpan..." : "Simpan Catatan"}
        </button>
      </div>
    </div>
  );
}
