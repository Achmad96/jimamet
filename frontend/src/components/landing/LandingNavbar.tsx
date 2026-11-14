"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface NavItem {
  id: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "fitur", label: "Fitur" },
  { id: "cara-kerja", label: "Cara Kerja" },
  { id: "cakupan-menu", label: "Cakupan Menu" },
  { id: "faq", label: "Tanya Jawab" }
];

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      // ScrollSpy: highlight whichever section is currently in view
      const scrollPosition = window.scrollY + 130;
      for (let i = NAV_ITEMS.length - 1; i >= 0; i--) {
        const el = document.getElementById(NAV_ITEMS[i].id);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSection(NAV_ITEMS[i].id);
          return;
        }
      }
      if (window.scrollY < 200) {
        setActiveSection("");
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    const element = document.getElementById(targetId);
    if (element) {
      const navHeight = 80;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - navHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });

      window.history.pushState(null, "", `#${targetId}`);
      setActiveSection(targetId);
    }
  };

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (window.location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      window.history.pushState(null, "", "/");
      setActiveSection("");
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-surface-bright/95 backdrop-blur-md border-b border-surface-high shadow-xs" : "bg-surface/60 backdrop-blur-xs border-b border-transparent"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link href="/" onClick={handleLogoClick} className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center p-1.5 transition-transform group-hover:scale-105 shadow-xs">
            <Image src="/jimamet_logo.webp" alt="Jimamet Logo" width={32} height={32} className="object-contain" priority />
          </div>
          <div className="flex flex-col">
            <span className="font-headline text-xl font-bold tracking-tight text-on-surface">Jimamet</span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-outline">Pencatat Gizi Pintar</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 font-headline text-sm font-medium">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a key={item.id} href={`#${item.id}`} onClick={(e) => handleNavClick(e, item.id)} className={`relative py-1 transition-colors ${isActive ? "text-primary font-bold" : "text-on-surface-variant hover:text-on-surface"}`}>
                {item.label}
                {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full animate-in fade-in" />}
              </a>
            );
          })}
        </nav>

        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="px-4 py-2 text-sm font-semibold font-headline text-on-surface-variant hover:text-on-surface transition-colors">
            Masuk
          </Link>
          <Link href="/login?tab=register" className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-on-primary rounded-lg text-sm font-semibold font-headline transition-all shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0">
            Mulai Gratis
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg text-on-surface hover:bg-surface-high transition-colors" aria-label={mobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileMenuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-surface-bright/98 backdrop-blur-lg border-b border-surface-high px-4 pt-3 pb-6 flex flex-col gap-3 shadow-xl animate-in fade-in slide-in-from-top-2">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => handleNavClick(e, item.id)}
                className={`py-2 px-3 rounded-lg text-base font-semibold transition-colors flex items-center justify-between ${isActive ? "bg-surface-low text-primary font-bold" : "text-on-surface hover:bg-surface-low/60 hover:text-primary"}`}>
                <span>{item.label}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
              </a>
            );
          })}
          <div className="pt-3 border-t border-surface-high flex flex-col gap-2.5">
            <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="w-full py-2.5 text-center text-sm font-semibold font-headline rounded-lg border border-surface-high text-on-surface hover:bg-surface-low transition-colors">
              Masuk
            </Link>
            <Link href="/login?tab=register" onClick={() => setMobileMenuOpen(false)} className="w-full py-2.5 text-center text-sm font-semibold font-headline rounded-lg bg-primary text-on-primary hover:bg-primary-hover transition-colors shadow-xs">
              Mulai Gratis
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
