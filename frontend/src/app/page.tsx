"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

const capabilities = [
  {
    index: "01",
    tag: "COMPUTER VISION",
    title: "Deteksi Hidangan Multi-Modal",
    desc: "Mengidentifikasi berbagai hidangan khas Indonesia melalui kamera real-time, unggahan foto, maupun pemindaian video menggunakan model deteksi objek YOLOv8 yang dikalibrasi khusus.",
    specLabel: "Input Didukung",
    specValue: "Live Stream · JPG/PNG · MP4",
  },
  {
    index: "02",
    tag: "TELEMETRI GIZI",
    title: "Kuantifikasi Makro & Mikronutrien",
    desc: "Setiap hidangan yang terdeteksi dipetakan langsung ke basis data komposisi pangan untuk menghitung kalori, protein, karbohidrat, lemak, serat, dan gula secara proporsional.",
    specLabel: "Parameter",
    specValue: "Energi (kkal) · P / K / L · Serat & Gula",
  },
  {
    index: "03",
    tag: "PENDAMPINGAN KLINIS",
    title: "NutriCoach AI & Eskalasi Ahli Gizi",
    desc: "Asisten gizi kontekstual yang mengevaluasi riwayat asupan harian Anda dan secara otomatis mengarahkan kasus klinis ke Ahli Gizi terdaftar melalui sesi konsultasi real-time.",
    specLabel: "Protokol",
    specValue: "AI Triage + Konsultasi WebSocket",
  },
];

const protocolSteps = [
  {
    code: "TAHAP 01",
    title: "Akuisisi Citra Hidangan",
    desc: "Arahkan kamera perangkat secara langsung ke piring makan atau unggah dokumentasi foto dan video makanan sebelum dikonsumsi.",
    artifact: "Frame terkalibrasi & lokalisasi bounding box",
  },
  {
    code: "TAHAP 02",
    title: "Verifikasi Komposisi & Takaran",
    desc: "Sistem mencocokkan label hidangan terhadap tabel komposisi gizi Indonesia dan menampilkan rincian makronutrien per porsi standar.",
    artifact: "Profil kalori, protein, karbohidrat, lemak, serat",
  },
  {
    code: "TAHAP 03",
    title: "Pencatatan Rekam Gizi & Evaluasi",
    desc: "Simpan hasil analisis ke jurnal harian untuk memantau tren defisit/surplus kalori atau diskusikan langsung bersama NutriCoach dan Ahli Gizi.",
    artifact: "Log harian, grafik mingguan & rujukan klinis",
  },
];

const benchmarks = [
  {
    metric: "98.5%",
    label: "Presisi Identifikasi",
    detail: "Akurasi pengenalan visual pada pengujian hidangan Nusantara",
  },
  {
    metric: "500+",
    label: "Indeks Pangan Lokal",
    detail: "Basis data nutrisi mencakup makanan pokok, lauk, dan jajanan",
  },
  {
    metric: "<120ms",
    label: "Inferensi Real-Time",
    detail: "Deteksi kamera langsung berlatensi rendah via WebSocket",
  },
  {
    metric: "2-Tier",
    label: "Arsitektur Konsultasi",
    detail: "Kombinasi asisten AI instan dan rujukan Ahli Gizi Klinik",
  },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface text-on-surface">
      {/* ── NAVBAR ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 border-b ${
          scrolled
            ? "bg-surface/92 backdrop-blur-md border-surface-high py-3"
            : "bg-surface/80 backdrop-blur-sm border-transparent py-4"
        }`}
      >
        <div className="max-w-[1240px] mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 no-underline text-on-surface">
            <Image
              src="/jimamet_logo.webp"
              alt="Jimamet Logo"
              width={36}
              height={36}
              className="object-contain"
            />
            <span className="font-headline text-[19px] font-bold tracking-tight text-primary">
              Jimamet
            </span>
            <span className="w-px h-4 bg-outline-variant hidden sm:inline-block" />
            <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-outline hidden sm:inline-block">
              Clinical Nutrition
            </span>
          </Link>

          <nav
            className={`${
              mobileMenuOpen
                ? "flex fixed inset-0 bg-surface flex-col justify-center items-center gap-6 z-50"
                : "hidden md:flex items-center gap-8"
            }`}
          >
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Kapabilitas
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Protokol Kerja
            </a>
            <a
              href="#stats"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Standar Data
            </a>
            <div className="flex flex-col md:flex-row items-center gap-3 md:ml-2 md:pl-5 md:border-l md:border-surface-high">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-semibold text-on-surface px-3.5 py-2 rounded-md hover:bg-surface-container transition-colors"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex items-center justify-center px-4 py-2.5 bg-primary hover:bg-primary-container text-on-primary rounded-md font-headline text-[13px] font-semibold transition-colors"
              >
                Mulai Analisis
              </Link>
            </div>
          </nav>

          <button
            className="flex md:hidden items-center justify-center w-9 h-9 bg-transparent border border-surface-high rounded-md cursor-pointer z-[60]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="pt-32 pb-20 lg:pt-36 lg:pb-24 border-b border-surface-high">
        <div className="max-w-[1240px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          <div className="lg:col-span-7 flex flex-col items-start">
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 bg-surface-lowest border border-surface-high rounded-sm font-mono text-[11px] font-medium text-on-surface-variant mb-6">
              <span className="text-primary font-semibold tracking-wider">SYS // NUTRI-VISION v2.4</span>
              <span className="text-outline-variant">·</span>
              <span>YOLOv8 + Basis Data Gizi Indonesia</span>
            </div>

            <h1 className="font-headline text-4xl sm:text-5xl lg:text-[54px] font-bold leading-[1.08] tracking-[-0.03em] text-on-surface mb-5">
              Pemantauan nutrisi klinis dengan{" "}
              <span className="font-serif italic font-normal text-primary text-[1.08em]">
                presisi terukur.
              </span>
            </h1>

            <p className="text-base sm:text-[17px] leading-[1.65] text-on-surface-variant max-w-[540px] mb-8">
              Jimamet menggabungkan deteksi visual hidangan Nusantara secara real-time dengan
              pencatatan makronutrien terstruktur dan akses konsultasi langsung bersama Ahli Gizi.
            </p>

            <div className="flex flex-wrap items-center gap-3 mb-12 w-full sm:w-auto">
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-primary hover:bg-primary-container text-on-primary rounded-md font-headline text-sm font-semibold transition-all hover:-translate-y-px"
              >
                Buat Akun Pasien
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-surface-lowest hover:bg-surface-low text-on-surface border border-surface-high hover:border-outline rounded-md font-headline text-sm font-semibold transition-colors"
              >
                Masuk ke Portal
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 w-full pt-6 border-t border-surface-high">
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[10px] font-semibold tracking-widest text-outline uppercase">
                  DETEKSI OBJEK
                </span>
                <span className="text-[13px] font-semibold text-on-surface">
                  Kamera Live, Foto & Video
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[10px] font-semibold tracking-widest text-outline uppercase">
                  VALIDASI DATA
                </span>
                <span className="text-[13px] font-semibold text-on-surface">
                  Tabel Komposisi Pangan
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[10px] font-semibold tracking-widest text-outline uppercase">
                  PENDAMPINGAN
                </span>
                <span className="text-[13px] font-semibold text-on-surface">
                  AI & Ahli Gizi Klinik
                </span>
              </div>
            </div>
          </div>

          {/* ── Right Column: Clinical Specimen Frame ── */}
          <div className="lg:col-span-5 w-full">
            <div className="bg-surface-lowest border border-surface-high rounded-lg overflow-hidden shadow-md">
              <div className="flex items-center justify-between px-4 py-3 bg-surface-low border-b border-surface-high">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-macro-fiber" />
                  <span className="font-mono text-[11px] font-semibold text-on-surface-variant tracking-wider">
                    SAMPEL ANALISIS // ID-042
                  </span>
                </div>
                <span className="font-mono text-[11px] font-semibold text-primary px-2 py-0.5 bg-primary-fixed rounded-sm">
                  98.4% CONFIDENCE
                </span>
              </div>

              <div className="relative bg-surface-container aspect-[16/10] overflow-hidden">
                <Image
                  src="/hero-nutrition.png"
                  alt="Visualisasi deteksi nutrisi makanan"
                  width={600}
                  height={420}
                  priority
                  className="w-full h-full object-cover block"
                />
                <div className="absolute left-3.5 bottom-3.5 right-3.5 flex items-center justify-between px-3.5 py-2.5 bg-inverse-surface/88 backdrop-blur-md border border-white/12 rounded-md text-inverse-on-surface">
                  <span className="font-headline text-[13px] font-semibold">
                    Hidangan Seimbang Terdeteksi
                  </span>
                  <span className="font-mono text-[11px] text-primary-fixed-dim">
                    Estimasi porsi: 380g
                  </span>
                </div>
              </div>

              <div className="p-5 flex flex-col gap-4">
                <div className="flex items-baseline justify-between pb-3.5 border-b border-surface-container">
                  <div>
                    <span className="block font-mono text-[10px] font-semibold tracking-widest text-outline mb-1">
                      ESTIMASI ENERGI
                    </span>
                    <div className="font-mono text-[28px] font-semibold text-on-surface leading-none tracking-tight tabular-nums">
                      524 <small className="text-[13px] font-medium text-outline">kkal</small>
                    </div>
                  </div>
                  <div className="font-mono text-[11px] font-medium text-on-surface-variant px-2.5 py-1 bg-surface-low border border-surface-high rounded-sm">
                    26% dari target 2.000 kkal
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="w-2 h-2 rounded-[2px] shrink-0 bg-macro-protein" />
                      <span className="text-on-surface-variant font-medium flex-1">Protein</span>
                      <span className="font-mono font-semibold text-on-surface text-xs tabular-nums">
                        32.4g
                      </span>
                    </div>
                    <div className="h-1 bg-surface-container rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-macro-protein" style={{ width: "64%" }} />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="w-2 h-2 rounded-[2px] shrink-0 bg-macro-carbs" />
                      <span className="text-on-surface-variant font-medium flex-1">Karbohidrat</span>
                      <span className="font-mono font-semibold text-on-surface text-xs tabular-nums">
                        54.0g
                      </span>
                    </div>
                    <div className="h-1 bg-surface-container rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-macro-carbs" style={{ width: "52%" }} />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="w-2 h-2 rounded-[2px] shrink-0 bg-macro-fat" />
                      <span className="text-on-surface-variant font-medium flex-1">Lemak</span>
                      <span className="font-mono font-semibold text-on-surface text-xs tabular-nums">
                        16.8g
                      </span>
                    </div>
                    <div className="h-1 bg-surface-container rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-macro-fat" style={{ width: "38%" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CAPABILITIES ── */}
      <section id="features" className="py-24 bg-surface border-b border-surface-high">
        <div className="max-w-[1240px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-end mb-14">
            <div className="lg:col-span-7">
              <span className="block font-mono text-[11px] font-semibold tracking-widest uppercase text-primary mb-2.5">
                01 // ARSITEKTUR PLATFORM
              </span>
              <h2 className="font-headline text-2xl sm:text-3xl lg:text-[34px] font-bold leading-[1.16] tracking-[-0.025em] text-on-surface">
                Dirancang untuk akurasi pencatatan gizi harian.
              </h2>
            </div>
            <p className="lg:col-span-5 text-[15px] leading-[1.65] text-on-surface-variant">
              Menggantikan pencatatan manual yang rumit dengan pengenalan visual otomatis dan
              parameter gizi yang terstandarisasi.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 bg-surface-high border border-surface-high rounded-lg overflow-hidden gap-px">
            {capabilities.map((item) => (
              <article
                key={item.index}
                className="bg-surface-lowest p-8 flex flex-col justify-between min-h-[290px]"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-mono text-[13px] font-semibold text-primary">
                      {item.index}
                    </span>
                    <span className="font-mono text-[10px] font-semibold tracking-wider text-outline px-2 py-1 bg-surface-low rounded-sm">
                      {item.tag}
                    </span>
                  </div>
                  <h3 className="font-headline text-xl font-bold text-on-surface tracking-tight mb-3">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-[1.65] text-on-surface-variant mb-7">
                    {item.desc}
                  </p>
                </div>
                <div className="pt-4 border-t border-surface-container flex items-center justify-between gap-3">
                  <span className="font-mono text-[11px] text-outline">{item.specLabel}</span>
                  <span className="font-mono text-[11px] font-semibold text-on-surface">
                    {item.specValue}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROTOCOL / HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 bg-surface-low border-b border-surface-high">
        <div className="max-w-[1240px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            <div className="lg:col-span-5 lg:sticky lg:top-28">
              <span className="block font-mono text-[11px] font-semibold tracking-widest uppercase text-primary mb-2.5">
                02 // PROTOKOL ANALISIS
              </span>
              <h2 className="font-headline text-2xl sm:text-3xl lg:text-[34px] font-bold leading-[1.16] tracking-[-0.025em] text-on-surface">
                Dari bidikan kamera hingga rekam nutrisi klinis.
              </h2>
              <p className="text-[15px] leading-[1.65] text-on-surface-variant mt-4">
                Setiap analisis melewati tiga tahapan terstruktur untuk memastikan estimasi kalori
                dan makronutrien dapat dipertanggungjawabkan secara praktis.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 mt-6 font-headline text-sm font-bold text-primary hover:gap-3 transition-all"
              >
                Coba Analisis Sekarang
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </div>

            <div className="lg:col-span-7 flex flex-col border-t border-surface-high">
              {protocolSteps.map((step) => (
                <div
                  key={step.code}
                  className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-3 sm:gap-6 py-7 border-b border-surface-high"
                >
                  <div className="pt-1">
                    <span className="font-mono text-xs font-semibold text-primary tracking-wider">
                      {step.code}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-headline text-xl font-bold text-on-surface mb-2 tracking-tight">
                      {step.title}
                    </h3>
                    <p className="text-[15px] leading-[1.6] text-on-surface-variant mb-3.5">
                      {step.desc}
                    </p>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface-lowest border border-surface-high rounded-sm font-mono text-[11px] text-on-surface-variant">
                      <span className="font-semibold text-primary">OUTPUT:</span>
                      <span>{step.artifact}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── BENCHMARKS / STATS ── */}
      <section id="stats" className="py-20 bg-primary text-on-primary">
        <div className="max-w-[1240px] mx-auto px-6">
          <div className="mb-12 max-w-[580px]">
            <span className="block font-mono text-[11px] font-semibold tracking-widest text-primary-fixed-dim mb-2.5">
              03 // PARAMETER & CAKUPAN
            </span>
            <h2 className="font-headline text-2xl sm:text-3xl font-bold leading-snug tracking-tight text-white">
              Spesifikasi teknis yang mendukung pemantauan nutrisi Anda.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-white/15">
            {benchmarks.map((b, idx) => (
              <div
                key={b.label}
                className={`py-7 pr-6 ${
                  idx < benchmarks.length - 1 ? "lg:border-r lg:border-white/15" : ""
                } ${idx > 0 ? "lg:pl-7" : ""} border-b sm:border-b-0 border-white/12`}
              >
                <div className="font-mono text-3xl sm:text-4xl font-semibold text-white tracking-tight mb-2 tabular-nums">
                  {b.metric}
                </div>
                <div className="font-headline text-[15px] font-semibold text-primary-fixed mb-1.5">
                  {b.label}
                </div>
                <p className="text-[13px] leading-relaxed text-white/70">{b.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-surface border-b border-surface-high">
        <div className="max-w-[1240px] mx-auto px-6">
          <div className="bg-surface-lowest border border-surface-high rounded-lg p-8 sm:p-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="max-w-[580px]">
              <span className="block font-mono text-[11px] font-semibold tracking-widest uppercase text-primary mb-2.5">
                MULAI PEMANTAUAN
              </span>
              <h2 className="font-headline text-2xl sm:text-3xl font-bold text-on-surface tracking-tight mb-2.5">
                Kelola asupan gizi harian dengan data yang terukur.
              </h2>
              <p className="text-[15px] leading-relaxed text-on-surface-variant">
                Buat akun gratis untuk mengakses deteksi makanan berbasis kamera, log nutrisi
                harian, serta konsultasi terintegrasi dengan Ahli Gizi.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0 w-full sm:w-auto">
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-primary hover:bg-primary-container text-on-primary rounded-md font-headline text-sm font-semibold transition-colors"
              >
                Daftar Akun Gratis
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3.5 bg-surface-lowest hover:bg-surface-low text-on-surface border border-surface-high rounded-md font-headline text-sm font-semibold transition-colors"
              >
                Masuk ke Akun
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="pt-14 pb-9 bg-surface-low text-on-surface-variant">
        <div className="max-w-[1240px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-10 border-b border-surface-high">
            <div className="lg:col-span-5">
              <div className="flex items-center gap-2.5">
                <Image
                  src="/jimamet_logo.webp"
                  alt="Jimamet Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                />
                <span className="font-headline text-lg font-bold text-on-surface">Jimamet</span>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-outline max-w-[340px]">
                Platform analisis nutrisi dan telemetri diet berbasis visi komputer untuk pemantauan
                kesehatan klinis maupun mandiri.
              </p>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2.5">
                <h4 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-on-surface mb-1">
                  Platform
                </h4>
                <a href="#features" className="text-[13px] text-outline hover:text-on-surface transition-colors">
                  Kapabilitas
                </a>
                <a href="#how-it-works" className="text-[13px] text-outline hover:text-on-surface transition-colors">
                  Protokol Kerja
                </a>
                <a href="#stats" className="text-[13px] text-outline hover:text-on-surface transition-colors">
                  Standar Data
                </a>
              </div>
              <div className="flex flex-col gap-2.5">
                <h4 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-on-surface mb-1">
                  Akses
                </h4>
                <Link href="/login" className="text-[13px] text-outline hover:text-on-surface transition-colors">
                  Masuk Pasien
                </Link>
                <Link href="/register" className="text-[13px] text-outline hover:text-on-surface transition-colors">
                  Registrasi Baru
                </Link>
                <Link href="/login" className="text-[13px] text-outline hover:text-on-surface transition-colors">
                  Portal Ahli Gizi
                </Link>
              </div>
              <div className="flex flex-col gap-2.5">
                <h4 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-on-surface mb-1">
                  Informasi
                </h4>
                <a href="#features" className="text-[13px] text-outline hover:text-on-surface transition-colors">
                  Metodologi YOLOv8
                </a>
                <a href="#stats" className="text-[13px] text-outline hover:text-on-surface transition-colors">
                  Basis Data Gizi
                </a>
                <a href="#how-it-works" className="text-[13px] text-outline hover:text-on-surface transition-colors">
                  Panduan Penggunaan
                </a>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-outline">
            <span>© {new Date().getFullYear()} Jimamet Clinical Nutrition System.</span>
            <span className="font-mono text-[11px] tracking-wider">
              INDONESIAN FOOD NUTRITION TELEMETRY
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
