import Link from "next/link";

interface PatientDetailHeaderProps {
  consultationStatus: string;
  onComplete: () => void;
}

export function PatientDetailHeader({ consultationStatus, onComplete }: PatientDetailHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-surface-high p-4">
      <Link href="/ahli-gizi/pasien" className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-on-surface">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Daftar Pasien
      </Link>
      <div className="flex items-center gap-2">
        {consultationStatus === "active" && (
          <button onClick={onComplete} className="cursor-pointer rounded-md bg-macro-cal px-2.5 py-1 text-xs font-semibold text-white hover:opacity-90">
            Selesaikan
          </button>
        )}
        <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${consultationStatus === "completed" ? "bg-surface-high text-outline" : "bg-primary-fixed text-primary"}`}>{consultationStatus}</span>
      </div>
    </div>
  );
}
