"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { apiLogout, apiGetMe } from "@/lib/api";
import styles from "./dashboard-layout.module.css";
import { SkeletonLayout } from "@/components/Skeleton";

const navItems = [
  {
    href: "/dashboard",
    label: "Ringkasan",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: "/dashboard/food-analysis",
    label: "Analisis Makanan",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    ),
  },
  {
    href: "/dashboard/history",
    label: "Jurnal Konsumsi",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    href: "/dashboard/coach",
    label: "NutriCoach & Konsultasi",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/profile",
    label: "Profil Klinis",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    <div className={styles.layout}>
      {/* ── TOP NAV ── */}
      <header className={styles.topNav}>
        <div className={styles.topNavInner}>
          <div className={styles.topNavLeft}>
            <button
              className={styles.menuBtn}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <Link href="/" className={styles.logo}>
              <Image src="/jimamet_logo.webp" alt="Jimamet Logo" width={34} height={34} style={{ objectFit: "contain" }} />
              <span>Jimamet</span>
              <span className={styles.logoTag}>WORKSPACE</span>
            </Link>
          </div>

          {/* ── Nav Links (Desktop) ── */}
          <nav className={styles.navLinks}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${pathname === item.href ? styles.navLinkActive : ""}`}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className={styles.topNavRight}>
            <Link
              href="/dashboard/profile"
              className={styles.userChip}
              title="Kelola Profil Klinis"
            >
              <span className={styles.avatar}>{userInitial}</span>
              <span className={styles.userName}>{userName}</span>
            </Link>
            <button
              className={styles.logoutBtn}
              onClick={handleLogout}
              title="Keluar dari sesi"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Menu ── */}
      {mobileMenuOpen && (
        <div className={styles.mobileOverlay} onClick={() => setMobileMenuOpen(false)}>
          <nav className={styles.mobileMenu} onClick={(e) => e.stopPropagation()}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.mobileLink} ${pathname === item.href ? styles.mobileLinkActive : ""}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <main className={styles.main}>{children}</main>
    </div>
  );
}
