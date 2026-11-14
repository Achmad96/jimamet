"use client";

import Link from "next/link";
import Image from "next/image";

interface LandingFooterProps {
  currentYear: number;
}

export function LandingFooter({ currentYear }: LandingFooterProps) {
  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const el = document.getElementById(id);
    if (el) {
      e.preventDefault();
      const navHeight = 80;
      const elementPosition = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - navHeight,
        behavior: "smooth"
      });
      window.history.pushState(null, "", `#${id}`);
    }
  };

  const scrollToTop = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (window.location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      window.history.pushState(null, "", "/");
    }
  };

  return (
    <footer className="pt-16 pb-12 bg-surface-low border-t border-surface-high text-on-surface-variant">
      <div className="max-w-300 mx-auto px-5 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-surface-high">
          <div className="md:col-span-5 flex flex-col items-start">
            <Link href="/" onClick={scrollToTop} className="flex items-center gap-2.5 mb-3 group">
              <div className="w-8 h-8 rounded-lg bg-surface-lowest border border-surface-high flex items-center justify-center p-1 transition-transform group-hover:scale-105 shadow-xs">
                <Image src="/jimamet_logo.webp" alt="Logo Jimamet" width={24} height={24} className="object-contain" />
              </div>
              <span className="font-headline text-xl font-extrabold text-primary">Jimamet</span>
            </Link>
            <p className="text-sm leading-relaxed text-outline max-w-90">Platform pemantauan nutrisi dan pola makan sehat berbasis kamera cerdas, dirancang khusus untuk berbagai hidangan khas Indonesia.</p>
          </div>

          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6">
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface mb-1 font-mono">Navigasi</span>
              <a href="#fitur" onClick={(e) => scrollTo(e, "fitur")} className="text-sm text-outline hover:text-primary transition-colors">
                Keunggulan
              </a>
              <a href="#cara-kerja" onClick={(e) => scrollTo(e, "cara-kerja")} className="text-sm text-outline hover:text-primary transition-colors">
                Cara Kerja
              </a>
              <a href="#cakupan-menu" onClick={(e) => scrollTo(e, "cakupan-menu")} className="text-sm text-outline hover:text-primary transition-colors">
                Cakupan Menu
              </a>
              <a href="#faq" onClick={(e) => scrollTo(e, "faq")} className="text-sm text-outline hover:text-primary transition-colors">
                Tanya Jawab
              </a>
            </div>

            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface mb-1 font-mono">Akses Akun</span>
              <Link href="/login" className="text-sm text-outline hover:text-primary transition-colors">
                Masuk ke Akun
              </Link>
              <Link href="/login?tab=register" className="text-sm text-outline hover:text-primary transition-colors">
                Daftar Pengguna Baru
              </Link>
              <Link href="/login" className="text-sm text-outline hover:text-primary transition-colors">
                Portal Ahli Gizi
              </Link>
            </div>

            <div className="flex flex-col gap-2.5 col-span-2 sm:col-span-1">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface mb-1 font-mono">Standar Gizi</span>
              <span className="text-xs text-outline leading-relaxed">Mengacu pada Tabel Komposisi Pangan Indonesia (TKPI) dari Kementerian Kesehatan Republik Indonesia.</span>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-outline">
          <span>© {currentYear} Jimamet. Hak cipta dilindungi undang-undang.</span>
          <span className="font-mono text-[11px] text-outline/80">Pencatat Kalori & Gizi Praktis</span>
        </div>
      </div>
    </footer>
  );
}
