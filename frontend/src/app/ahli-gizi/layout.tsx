"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { apiGetMe, apiLogout } from "@/lib/api";

export default function AhliGiziLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ full_name?: string; spesialisasi?: string } | null>(null);

  useEffect(() => {
    apiGetMe().then(({ ok, data }) => {
      if (!ok || data?.role !== "nutritionist") {
        router.replace("/login");
        return;
      }
      setUser(data);
    });
  }, [router]);

  const handleLogout = async () => {
    await apiLogout();
    router.replace("/login");
  };

  const navItems = [
    { href: "/ahli-gizi", icon: "dashboard", label: "Ringkasan" },
    { href: "/ahli-gizi/pasien", icon: "medical_services", label: "Konsultasi Pasien" },
  ];

  return (
    <div className="flex min-h-screen bg-surface font-body">
      {/* ── Sidebar ── */}
      <aside className="fixed inset-y-0 left-0 flex w-60 shrink-0 flex-col bg-inverse-surface px-4 py-6 text-inverse-on-surface">
        <div className="mb-7 flex items-center gap-3 border-b border-white/[0.08] px-2 pb-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.06]">
            <Image src="/jimamet_logo.webp" alt="Jimamet Logo" width={48} height={48} className="object-contain" />
          </span>
          <div>
            <div className="font-headline text-[15px] font-bold tracking-[-0.02em] text-inverse-on-surface">
              Jimamet Expert
            </div>
            <div className="mt-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-[#8fa899]">
              Portal Ahli Gizi
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-md px-3 py-2.5 text-[13px] font-medium transition-all ${
                  active
                    ? "bg-primary-fixed font-semibold text-primary"
                    : "text-[#b8c7be] hover:bg-white/[0.06] hover:text-inverse-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col gap-3 border-t border-white/[0.08] pt-4">
          <div className="flex items-center gap-2.5 px-1">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-container font-headline text-sm font-bold text-primary-fixed">
              {user?.full_name?.[0]?.toUpperCase() ?? "A"}
            </div>
            <div>
              <div className="text-[13px] font-semibold text-inverse-on-surface">
                {user?.full_name ?? "Ahli Gizi"}
              </div>
              <div className="mt-0.5 font-mono text-[11px] text-[#8fa899]">
                {user?.spesialisasi ?? "Gizi Klinik"}
              </div>
            </div>
          </div>
          <button
            className="flex w-full cursor-pointer items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-[#b8c7be] transition-all hover:border-[#ffb4ab]/30 hover:bg-[#ba1a1a]/25 hover:text-[#ffb4ab]"
            onClick={handleLogout}
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            Keluar
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="ml-60 min-h-screen flex-1 px-10 py-8 max-[900px]:ml-0 max-[900px]:px-5 max-[900px]:py-6">
        {children}
      </main>
    </div>
  );
}
