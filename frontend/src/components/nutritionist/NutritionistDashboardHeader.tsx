interface NutritionistDashboardHeaderProps {
  firstName: string;
  today: string;
}

export function NutritionistDashboardHeader({ firstName, today }: NutritionistDashboardHeaderProps) {
  return (
    <div className="mb-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-widest text-primary">PORTAL SPESIALIS GIZI KLINIK</span>
          <h1 className="font-headline text-[26px] font-bold tracking-[-0.03em] text-on-surface">Selamat Bertugas, {firstName}</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Manajemen rujukan pasien dan supervisi monitoring dietetika Jimamet.</p>
        </div>
        {today && <span className="rounded-md border border-surface-high bg-surface-lowest px-3.5 py-2 font-mono text-xs font-medium text-on-surface-variant">{today}</span>}
      </div>
    </div>
  );
}
