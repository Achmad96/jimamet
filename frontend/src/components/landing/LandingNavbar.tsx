"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-surface-bright/90 backdrop-blur-md border-b border-surface-high shadow-xs" : "bg-transparent border-b border-transparent"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center p-1.5 transition-transform group-hover:scale-105">
            <Image src="/jimamet_logo.webp" alt="Jimamet Logo" width={32} height={32} className="object-contain" priority />
          </div>
          <div className="flex flex-col">
            <span className="font-headline text-xl font-bold tracking-tight text-on-surface">Jimamet</span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-outline">Pencatat Gizi Pintar</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 font-headline text-sm font-medium text-on-surface-variant">
          <a href="#fitur" className="hover:text-primary transition-colors">
            Fitur
          </a>
          <a href="#cara-kerja" className="hover:text-primary transition-colors">
            Cara Kerja
          </a>
          <a href="#cakupan-menu" className="hover:text-primary transition-colors">
            Cakupan Menu
          </a>
          <a href="#faq" className="hover:text-primary transition-colors">
            Tanya Jawab
          </a>
        </nav>

        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="px-4 py-2 text-sm font-semibold font-headline text-on-surface-variant hover:text-on-surface transition-colors">
            Masuk
          </Link>
          <Link href="/login?tab=register" className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-on-primary rounded-lg text-sm font-semibold font-headline transition-all shadow-xs hover:shadow-md">
            Mulai Gratis
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-md text-on-surface hover:bg-surface-high transition-colors" aria-label="Buka menu">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileMenuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-surface-bright border-b border-surface-high px-4 pt-3 pb-6 flex flex-col gap-4 shadow-lg animate-in fade-in slide-in-from-top-2">
          <a href="#fitur" onClick={() => setMobileMenuOpen(false)} className="py-2 text-base font-semibold text-on-surface hover:text-primary transition-colors">
            Fitur
          </a>
          <a href="#cara-kerja" onClick={() => setMobileMenuOpen(false)} className="py-2 text-base font-semibold text-on-surface hover:text-primary transition-colors">
            Cara Kerja
          </a>
          <a href="#cakupan-menu" onClick={() => setMobileMenuOpen(false)} className="py-2 text-base font-semibold text-on-surface hover:text-primary transition-colors">
            Cakupan Menu
          </a>
          <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="py-2 text-base font-semibold text-on-surface hover:text-primary transition-colors">
            Tanya Jawab
          </a>
          <div className="pt-3 border-t border-surface-high flex flex-col gap-2.5">
            <Link href="/login" className="w-full py-2.5 text-center text-sm font-semibold font-headline rounded-lg border border-surface-high text-on-surface hover:bg-surface-low transition-colors">
              Masuk
            </Link>
            <Link href="/login?tab=register" className="w-full py-2.5 text-center text-sm font-semibold font-headline rounded-lg bg-primary text-on-primary hover:bg-primary-hover transition-colors shadow-xs">
              Mulai Gratis
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
