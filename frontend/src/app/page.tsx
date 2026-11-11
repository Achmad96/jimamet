"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

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
    artifact: " Profil kalori, protein, karbohidrat, lemak, serat",
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
    <div className={styles.page}>
      {/* ── NAVBAR ── */}
      <header className={`${styles.navbar} ${scrolled ? styles.navScrolled : ""}`}>
        <div className={`${styles.navInner} container`}>
          <Link href="/" className={styles.logo}>
            <Image
              src="/jimamet_logo.webp"
              alt="Jimamet Logo"
              width={36}
              height={36}
              style={{ objectFit: "contain" }}
            />
            <span className={styles.logoText}>Jimamet</span>
            <span className={styles.logoDivider} />
            <span className={styles.logoSub}>Clinical Nutrition</span>
          </Link>

          <nav className={`${styles.navLinks} ${mobileMenuOpen ? styles.navOpen : ""}`}>
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>
              Kapabilitas
            </a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>
              Protokol Kerja
            </a>
            <a href="#stats" onClick={() => setMobileMenuOpen(false)}>
              Standar Data
            </a>
            <div className={styles.navAuthGroup}>
              <Link href="/login" className={styles.navLoginLink} onClick={() => setMobileMenuOpen(false)}>
                Masuk
              </Link>
              <Link href="/register" className={styles.navCta} onClick={() => setMobileMenuOpen(false)}>
                Mulai Analisis
              </Link>
            </div>
          </nav>

          <button
            className={styles.hamburger}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className={mobileMenuOpen ? styles.hamburgerOpen : ""} />
          </button>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={`${styles.heroInner} container`}>
          <div className={styles.heroContent}>
            <div className={styles.heroKicker}>
              <span className={styles.heroKickerCode}>SYS // NUTRI-VISION v2.4</span>
              <span className={styles.heroKickerSep}>·</span>
              <span>YOLOv8 + Basis Data Gizi Indonesia</span>
            </div>

            <h1 className={styles.heroTitle}>
              Pemantauan nutrisi klinis dengan{" "}
              <span className={styles.heroSerif}>presisi terukur.</span>
            </h1>

            <p className={styles.heroLead}>
              Jimamet menggabungkan deteksi visual hidangan Nusantara secara real-time dengan
              pencatatan makronutrien terstruktur dan akses konsultasi langsung bersama Ahli Gizi.
            </p>

            <div className={styles.heroActions}>
              <Link href="/register" className={styles.btnPrimary}>
                Buat Akun Pasien
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
              <Link href="/login" className={styles.btnOutline}>
                Masuk ke Portal
              </Link>
            </div>

            <div className={styles.heroSpecs}>
              <div className={styles.heroSpecItem}>
                <span className={styles.heroSpecLabel}>DETEKSI OBJEK</span>
                <span className={styles.heroSpecVal}>Kamera Live, Foto & Video</span>
              </div>
              <div className={styles.heroSpecItem}>
                <span className={styles.heroSpecLabel}>VALIDASI DATA</span>
                <span className={styles.heroSpecVal}>Tabel Komposisi Pangan</span>
              </div>
              <div className={styles.heroSpecItem}>
                <span className={styles.heroSpecLabel}>PENDAMPINGAN</span>
                <span className={styles.heroSpecVal}>AI & Ahli Gizi Klinik</span>
              </div>
            </div>
          </div>

          {/* ── Right Column: Clinical Specimen Frame ── */}
          <div className={styles.heroSpecimen}>
            <div className={styles.specimenCard}>
              <div className={styles.specimenHeader}>
                <div className={styles.specimenMeta}>
                  <span className={styles.specimenDot} />
                  <span className={styles.specimenCode}>SAMPEL ANALISIS // ID-042</span>
                </div>
                <span className={styles.specimenConfidence}>98.4% CONFIDENCE</span>
              </div>

              <div className={styles.specimenViewport}>
                <Image
                  src="/hero-nutrition.png"
                  alt="Visualisasi deteksi nutrisi makanan"
                  width={600}
                  height={420}
                  priority
                  className={styles.specimenImg}
                />
                <div className={styles.specimenOverlayTag}>
                  <span className={styles.overlayTagName}>Hidangan Seimbang Terdeteksi</span>
                  <span className={styles.overlayTagPortion}>Estimasi porsi: 380g</span>
                </div>
              </div>

              <div className={styles.specimenReadout}>
                <div className={styles.readoutPrimary}>
                  <div>
                    <span className={styles.readoutLabel}>ESTIMASI ENERGI</span>
                    <div className={styles.readoutCalories}>
                      524 <small>kkal</small>
                    </div>
                  </div>
                  <div className={styles.readoutTargetBadge}>26% dari target 2.000 kkal</div>
                </div>

                <div className={styles.readoutMacros}>
                  <div className={styles.readoutMacroItem}>
                    <div className={styles.readoutMacroTop}>
                      <span className={styles.macroDot} style={{ background: "var(--macro-protein)" }} />
                      <span className={styles.macroName}>Protein</span>
                      <span className={styles.macroVal}>32.4g</span>
                    </div>
                    <div className={styles.macroBar}>
                      <div style={{ width: "64%", background: "var(--macro-protein)" }} />
                    </div>
                  </div>

                  <div className={styles.readoutMacroItem}>
                    <div className={styles.readoutMacroTop}>
                      <span className={styles.macroDot} style={{ background: "var(--macro-carbs)" }} />
                      <span className={styles.macroName}>Karbohidrat</span>
                      <span className={styles.macroVal}>54.0g</span>
                    </div>
                    <div className={styles.macroBar}>
                      <div style={{ width: "52%", background: "var(--macro-carbs)" }} />
                    </div>
                  </div>

                  <div className={styles.readoutMacroItem}>
                    <div className={styles.readoutMacroTop}>
                      <span className={styles.macroDot} style={{ background: "var(--macro-fat)" }} />
                      <span className={styles.macroName}>Lemak</span>
                      <span className={styles.macroVal}>16.8g</span>
                    </div>
                    <div className={styles.macroBar}>
                      <div style={{ width: "38%", background: "var(--macro-fat)" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CAPABILITIES ── */}
      <section id="features" className={styles.capabilities}>
        <div className="container">
          <div className={styles.sectionHeaderRow}>
            <div>
              <span className={styles.sectionKicker}>01 // ARSITEKTUR PLATFORM</span>
              <h2 className={styles.sectionTitle}>
                Dirancang untuk akurasi pencatatan gizi harian.
              </h2>
            </div>
            <p className={styles.sectionDesc}>
              Menggantikan pencatatan manual yang rumit dengan pengenalan visual otomatis dan
              parameter gizi yang terstandarisasi.
            </p>
          </div>

          <div className={styles.capabilityGrid}>
            {capabilities.map((item) => (
              <article key={item.index} className={styles.capabilityCard}>
                <div className={styles.capabilityTop}>
                  <span className={styles.capabilityIndex}>{item.index}</span>
                  <span className={styles.capabilityTag}>{item.tag}</span>
                </div>
                <h3 className={styles.capabilityTitle}>{item.title}</h3>
                <p className={styles.capabilityBody}>{item.desc}</p>
                <div className={styles.capabilityFooter}>
                  <span className={styles.capabilitySpecLabel}>{item.specLabel}</span>
                  <span className={styles.capabilitySpecVal}>{item.specValue}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROTOCOL / HOW IT WORKS ── */}
      <section id="how-it-works" className={styles.protocol}>
        <div className="container">
          <div className={styles.protocolLayout}>
            <div className={styles.protocolIntro}>
              <span className={styles.sectionKicker}>02 // PROTOKOL ANALISIS</span>
              <h2 className={styles.sectionTitle}>
                Dari bidikan kamera hingga rekam nutrisi klinis.
              </h2>
              <p className={styles.sectionDesc}>
                Setiap analisis melewati tiga tahapan terstruktur untuk memastikan estimasi kalori
                dan makronutrien dapat dipertanggungjawabkan secara praktis.
              </p>
              <Link href="/register" className={styles.protocolLink}>
                Coba Analisis Sekarang
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </div>

            <div className={styles.protocolList}>
              {protocolSteps.map((step) => (
                <div key={step.code} className={styles.protocolRow}>
                  <div className={styles.protocolCodeCol}>
                    <span className={styles.protocolCode}>{step.code}</span>
                  </div>
                  <div className={styles.protocolBodyCol}>
                    <h3 className={styles.protocolStepTitle}>{step.title}</h3>
                    <p className={styles.protocolStepDesc}>{step.desc}</p>
                    <div className={styles.protocolArtifact}>
                      <span className={styles.artifactLabel}>OUTPUT:</span>
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
      <section id="stats" className={styles.benchmarks}>
        <div className="container">
          <div className={styles.benchmarksHeader}>
            <span className={styles.benchmarksKicker}>03 // PARAMETER & CAKUPAN</span>
            <h2 className={styles.benchmarksTitle}>
              Spesifikasi teknis yang mendukung pemantauan nutrisi Anda.
            </h2>
          </div>

          <div className={styles.benchmarksGrid}>
            {benchmarks.map((b) => (
              <div key={b.label} className={styles.benchmarkCell}>
                <div className={styles.benchmarkValue}>{b.metric}</div>
                <div className={styles.benchmarkLabel}>{b.label}</div>
                <p className={styles.benchmarkDetail}>{b.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={styles.ctaSection}>
        <div className="container">
          <div className={styles.ctaBox}>
            <div className={styles.ctaContent}>
              <span className={styles.sectionKicker}>MULAI PEMANTAUAN</span>
              <h2 className={styles.ctaHeading}>
                Kelola asupan gizi harian dengan data yang terukur.
              </h2>
              <p className={styles.ctaSubtext}>
                Buat akun gratis untuk mengakses deteksi makanan berbasis kamera, log nutrisi
                harian, serta konsultasi terintegrasi dengan Ahli Gizi.
              </p>
            </div>
            <div className={styles.ctaActions}>
              <Link href="/register" className={styles.btnPrimary}>
                Daftar Akun Gratis
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
              <Link href="/login" className={styles.btnOutline}>
                Masuk ke Akun
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerTop}>
            <div className={styles.footerBrand}>
              <div className={styles.logo}>
                <Image
                  src="/jimamet_logo.webp"
                  alt="Jimamet Logo"
                  width={32}
                  height={32}
                  style={{ objectFit: "contain" }}
                />
                <span className={styles.footerLogoText}>Jimamet</span>
              </div>
              <p className={styles.footerTagline}>
                Platform analisis nutrisi dan telemetri diet berbasis visi komputer untuk pemantauan
                kesehatan klinis maupun mandiri.
              </p>
            </div>

            <div className={styles.footerLinks}>
              <div className={styles.footerCol}>
                <h4>Platform</h4>
                <a href="#features">Kapabilitas</a>
                <a href="#how-it-works">Protokol Kerja</a>
                <a href="#stats">Standar Data</a>
              </div>
              <div className={styles.footerCol}>
                <h4>Akses</h4>
                <Link href="/login">Masuk Pasien</Link>
                <Link href="/register">Registrasi Baru</Link>
                <Link href="/login">Portal Ahli Gizi</Link>
              </div>
              <div className={styles.footerCol}>
                <h4>Informasi</h4>
                <a href="#features">Metodologi YOLOv8</a>
                <a href="#stats">Basis Data Gizi</a>
                <a href="#how-it-works">Panduan Penggunaan</a>
              </div>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <span>© {new Date().getFullYear()} Jimamet Clinical Nutrition System.</span>
            <span className={styles.footerMeta}>INDONESIAN FOOD NUTRITION TELEMETRY</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
