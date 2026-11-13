"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { apiLogout, apiGetMe } from "@/lib/api";
import { SkeletonLayout } from "@/components/Skeleton";

const navItems = [
  {
    href: "/dashboard",
    label: "Ringkasan",
    icon: (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    )
  },
  {
    href: "/dashboard/food-analysis",
    label: "Analisis Nutrisi",
    icon: (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    )
  },
  {
    href: "/dashboard/history",
    label: "Riwayat Konsumsi",
    icon: (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    )
  },
  {
    href: "/dashboard/coach",
    label: "NutriCoach",
    icon: (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    )
  },
  {
    href: "/dashboard/profile",
    label: "Profil",
    icon: (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    )
  }
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userInitial, setUserInitial] = useState("U");
  const [userName, setUserName] = useState("Pasien");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    apiGetMe().then(({ ok, data }) => {
      if (!ok) {
        router.replace("/login");
        return;
      }
      if (data?.full_name) {
        setUserInitial(data.full_name.charAt(0).toUpperCase());
        setUserName(data.full_name.split(" ")[0]);
      } else if (data?.username) {
        setUserInitial(data.username.charAt(0).toUpperCase());
        setUserName(data.username);
      }
      setReady(true);
    });
  }, [router]);

  const handleLogout = async () => {
    await apiLogout();
    router.replace("/login");
  };

  if (!ready) return <SkeletonLayout />;

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {/* ── TOP NAV ── */}
      <header className="sticky top-0 z-50 h-16 bg-surface-lowest/92 backdrop-blur-md border-b border-surface-high">
        <div className="max-w-330 mx-auto px-6 h-full flex items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <button className="flex md:hidden items-center justify-center w-9 h-9 bg-transparent border border-surface-high rounded-md cursor-pointer text-on-surface" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <Link href="/" className="flex items-center gap-2.5 no-underline font-headline text-lg font-bold text-primary tracking-tight">
              <Image src="/jimamet_logo.webp" alt="Jimamet Logo" width={34} height={34} className="object-contain" />
              <span>Jimamet</span>
            </Link>
          </div>

          {/* ── Nav Links (Desktop) ── */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-[13px] no-underline transition-all whitespace-nowrap ${active ? "bg-primary text-on-primary font-semibold" : "text-on-surface-variant font-medium hover:text-on-surface hover:bg-surface-low"}`}>
                  <span className={active ? "opacity-100" : "opacity-80"}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2.5">
            <Link href="/dashboard/profile" className="flex items-center gap-2 py-1 pl-1 pr-3 bg-surface-low border border-surface-high hover:border-outline-variant rounded-full no-underline transition-colors" title="Kelola Profil Klinis">
              <span className="w-7 h-7 rounded-full bg-primary text-on-primary font-headline font-bold text-xs flex items-center justify-center">{userInitial}</span>
              <span className="hidden sm:inline text-xs font-semibold text-on-surface">{userName}</span>
            </Link>
            <button
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-surface-high bg-surface-lowest text-on-surface-variant hover:text-error hover:border-error/30 hover:bg-error-container text-xs font-semibold cursor-pointer transition-all"
              onClick={handleLogout}
              title="Keluar dari sesi">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Menu ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-16 bg-on-surface/35 z-40" onClick={() => setMobileMenuOpen(false)}>
          <nav className="bg-surface-lowest p-3 border-b border-surface-high flex flex-col gap-1 shadow-md" onClick={(e) => e.stopPropagation()}>
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm no-underline ${active ? "bg-primary text-on-primary font-semibold" : "text-on-surface-variant font-medium hover:bg-surface-low"}`} onClick={() => setMobileMenuOpen(false)}>
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 max-w-330 w-full mx-auto px-4 sm:px-6 pt-7 pb-14">{children}</main>
    </div>
  );
}
