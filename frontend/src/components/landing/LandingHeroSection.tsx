"use client";

import Link from "next/link";
import { InteractiveMealShowcase } from "./InteractiveMealShowcase";

export function LandingHeroSection() {
  const scrollToCaraKerja = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const el = document.getElementById("cara-kerja");
    if (el) {
      const navHeight = 80;
      const elementPosition = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - navHeight,
        behavior: "smooth",
      });
      window.history.pushState(null, "", "#cara-kerja");
    }
  };

  return (
    <section className="pt-32 pb-20 lg:pt-38 lg:pb-28 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-175 h-95 bg-primary-fixed/20 blur-[130px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-300 mx-auto px-5 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          {/* Left Content */}
          <div className="lg:col-span-7 flex flex-col items-start">
            <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-extrabold leading-[1.12] tracking-[-0.03em] text-on-surface mb-5">
              Cek nutrisi makanan cukup dengan <span className="text-primary font-serif italic font-normal underline decoration-primary-fixed-dim decoration-wavy decoration-2 underline-offset-4">sekali foto.</span>
            </h1>

            <p className="text-base sm:text-lg leading-[1.65] text-on-surface-variant max-w-140 mb-8 font-normal">
              Tak perlu repot menimbang dan mencatat manual. Cukup arahkan kamera ke piring Anda, Jimamet langsung mengenali hidangan, menghitung kalori, serta menyediakan pendampingan bersama Ahli Gizi.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto">
              <Link
                href="/login?tab=register"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-primary hover:bg-primary-hover text-on-primary rounded-xl font-headline text-sm font-semibold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0">
                <span>Mulai Sekarang — Gratis</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
              <a
                href="#cara-kerja"
                onClick={scrollToCaraKerja}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-surface-lowest hover:bg-surface-low text-on-surface border border-surface-high hover:border-outline-variant rounded-xl font-headline text-sm font-semibold transition-colors shadow-xs">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
                </svg>
                <span>Lihat Cara Kerja</span>
              </a>
            </div>
          </div>

          {/* Right Column: Interactive Meal Scanner Widget */}
          <div className="lg:col-span-5 w-full">
            <InteractiveMealShowcase />
          </div>
        </div>
      </div>
    </section>
  );
}
