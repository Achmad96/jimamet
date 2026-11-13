import Link from "next/link";

export function HistoryHeader() {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-4 border-b border-surface-high">
      <div>
        <h1 className="font-headline text-2xl sm:text-[28px] font-bold text-on-surface tracking-tight">Riwayat Konsumsi Makanan</h1>
        <p className="text-sm text-on-surface-variant mt-1">Arsip seluruh catatan asupan gizi yang terdeteksi dan tersimpan dalam sistem.</p>
      </div>
      <Link href="/dashboard/food-analysis" className="px-4 py-2.5 bg-primary hover:bg-primary-container text-on-primary rounded-md text-xs font-semibold font-headline no-underline transition-colors shrink-0">
        + Catat Makanan Baru
      </Link>
    </div>
  );
}
