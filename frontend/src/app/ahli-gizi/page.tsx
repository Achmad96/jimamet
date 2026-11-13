import Link from "next/link";
import { getServerMe } from "@/lib/server-api";
import { formatDateHeader } from "@/lib/dashboard-utils";

export default async function AhliGiziDashboard() {
  const { data: user } = await getServerMe();
  const today = formatDateHeader();

  let firstName = "Ahli Gizi";
  if (user?.full_name) {
    const parts = user.full_name.split(" ");
    firstName =
      parts.length > 1 && parts[0].toLowerCase().includes("dr")
        ? `${parts[0]} ${parts[1]}`
        : parts[0];
  }

  return (
    <div>
      {/* ── Page Header (SSR Pre-rendered) ── */}
      <div className="mb-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">
              PORTAL SPESIALIS GIZI KLINIK
            </span>
            <h1 className="font-headline text-[26px] font-bold tracking-[-0.03em] text-on-surface">
              Selamat Bertugas, {firstName}
            </h1>
            <p className="mt-1 text-sm text-on-surface-variant">
              Manajemen rujukan pasien dan supervisi monitoring dietetika Jimamet.
            </p>
          </div>
          {today && (
            <span className="rounded-md border border-surface-high bg-surface-lowest px-3.5 py-2 font-mono text-xs font-medium text-on-surface-variant">
              {today}
            </span>
          )}
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-headline text-[17px] font-bold tracking-[-0.02em] text-on-surface">
            Modul Supervisi Klinis
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-4 max-[768px]:grid-cols-1">
          <Link
            href="/ahli-gizi/pasien"
            className="flex items-start gap-4 rounded-xl border border-surface-high bg-surface-lowest p-6 transition-all hover:border-outline-variant hover:shadow-md"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/[0.08] text-primary">
              <span className="material-symbols-outlined text-[22px]">medical_services</span>
            </div>
            <div>
              <div className="mb-1 font-headline text-[15px] font-bold text-on-surface">
                Antrean Konsultasi Pasien
              </div>
              <div className="text-[13px] leading-[1.55] text-on-surface-variant">
                Tinjau eskalasi dari NutriCoach AI, inspeksi log asupan harian, dan berikan intervensi gizi langsung.
              </div>
            </div>
          </Link>
          <div className="flex cursor-default items-start gap-4 rounded-xl border border-surface-high bg-surface-lowest p-6 opacity-65">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/[0.08] text-primary">
              <span className="material-symbols-outlined text-[22px]">analytics</span>
            </div>
            <div>
              <div className="mb-1 font-headline text-[15px] font-bold text-on-surface">
                Agregasi Populasi Klinis (Segera)
              </div>
              <div className="text-[13px] leading-[1.55] text-on-surface-variant">
                Evaluasi distribusi makronutrisi dan kepatuhan kalori kohort pasien secara berkala.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
