import Link from "next/link";
import Image from "next/image";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { InteractiveMealShowcase } from "@/components/landing/InteractiveMealShowcase";
import { FaqAccordion } from "@/components/landing/FaqAccordion";
import { FEATURES, STEPS, FOOD_CATEGORIES, STATS } from "@/lib/landing-data";

export default function HomePage() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-surface text-on-surface antialiased">
      {/* ── CLIENT NAVBAR (Smooth scroll & mobile drawer) ── */}
      <LandingNavbar />

      {/* ── HERO SECTION (SSR Rendered) ── */}
      <section className="pt-32 pb-20 lg:pt-38 lg:pb-28 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[380px] bg-primary-fixed/20 blur-[130px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-[1200px] mx-auto px-5 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 flex flex-col items-start">
              <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-extrabold leading-[1.12] tracking-[-0.03em] text-on-surface mb-5">
                Cek nutrisi makanan cukup dengan{" "}
                <span className="text-primary font-serif italic font-normal underline decoration-primary-fixed-dim decoration-wavy decoration-2 underline-offset-4">
                  sekali foto.
                </span>
              </h1>

              <p className="text-base sm:text-lg leading-[1.65] text-on-surface-variant max-w-[560px] mb-8 font-normal">
                Tak perlu repot menimbang dan mencatat manual. Cukup arahkan kamera ke piring Anda, Jimamet langsung mengenali hidangan, menghitung kalori, serta menyediakan pendampingan bersama Ahli Gizi.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto">
                <Link
                  href="/login?tab=register"
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-primary hover:bg-primary-hover text-on-primary rounded-xl font-headline text-sm font-semibold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>Mulai Sekarang — Gratis</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
                <a
                  href="#cara-kerja"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-surface-lowest hover:bg-surface-low text-on-surface border border-surface-high hover:border-outline-variant rounded-xl font-headline text-sm font-semibold transition-colors shadow-xs"
                >
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

      {/* ── STATS STRIP ── */}
      <section className="py-12 bg-surface-lowest border-y border-surface-high">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col">
                <div className="text-3xl sm:text-4xl font-extrabold text-primary tracking-tight mb-1">{stat.value}</div>
                <div className="font-headline text-sm font-bold text-on-surface mb-1">{stat.label}</div>
                <p className="text-xs leading-relaxed text-on-surface-variant">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES / KEUNGGULAN ── */}
      <section id="fitur" className="py-24 bg-surface scroll-mt-20">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6">
          <div className="max-w-[680px] mb-16">
            <span className="inline-block text-xs font-bold tracking-wider uppercase text-primary mb-2">Keunggulan Jimamet</span>
            <h2 className="font-headline text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-on-surface mb-4">Semua kemudahan untuk menjaga pola makan sehat keluarga.</h2>
            <p className="text-base text-on-surface-variant leading-relaxed">Didesain sederhana agar mudah digunakan siapa saja. Anda tidak perlu lagi mengingat atau menghitung kalori manual setiap kali menyantap makanan.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {FEATURES.map((item, idx) => (
              <div key={item.title} className="bg-surface-lowest p-7 sm:p-8 rounded-2xl border border-surface-high hover:border-outline-variant shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-surface-low flex items-center justify-center border border-surface-high text-primary font-bold mb-5">
                    {idx === 0 && (
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                    )}
                    {idx === 1 && (
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    )}
                    {idx === 2 && (
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                    )}
                    {idx === 3 && (
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                      </svg>
                    )}
                  </div>
                  <h3 className="font-headline text-xl font-bold text-on-surface tracking-tight mb-2.5">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-on-surface-variant">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS / CARA KERJA ── */}
      <section id="cara-kerja" className="py-24 bg-surface-low border-y border-surface-high scroll-mt-20">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6">
          <div className="text-center max-w-[640px] mx-auto mb-16">
            <span className="inline-block text-xs font-bold tracking-wider uppercase text-primary mb-2">Cara Penggunaan</span>
            <h2 className="font-headline text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-on-surface mb-4">Hanya 3 langkah praktis mengetahui kandungan gizi makanan Anda.</h2>
            <p className="text-base text-on-surface-variant leading-relaxed">Mulai dari mengambil foto hingga mendapatkan panduan dari ahli gizi, seluruh proses berjalan cepat dan mudah dipahami.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {STEPS.map((s) => (
              <div key={s.step} className="bg-surface-lowest p-7 rounded-2xl border border-surface-high shadow-xs relative flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center font-mono font-bold text-sm mb-5 shadow-xs">{s.step}</div>
                  <h3 className="font-headline text-lg font-bold text-on-surface tracking-tight mb-2.5">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-on-surface-variant mb-6">{s.desc}</p>
                </div>
                <div className="pt-4 border-t border-surface-container flex items-center gap-2 text-xs font-medium text-primary">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>{s.highlight}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/login?tab=register" className="inline-flex items-center gap-2 font-headline text-sm font-bold text-primary hover:text-primary-hover transition-colors">
              <span>Coba gratis sekarang tanpa kartu kredit</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── NUSANTARA FOOD CATEGORIES ── */}
      <section id="menu-nusantara" className="py-24 bg-surface scroll-mt-20">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end mb-14">
            <div className="lg:col-span-7">
              <span className="inline-block text-xs font-bold tracking-wider uppercase text-primary mb-2">Cakupan Menu</span>
              <h2 className="font-headline text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-on-surface">Dirancang khusus untuk makanan yang biasa Anda santap setiap hari.</h2>
            </div>
            <p className="lg:col-span-5 text-base text-on-surface-variant leading-relaxed">Bukan hanya makanan barat atau salad ala luar negeri. Jimamet mengenali menu warung, masakan rumahan, hingga makanan tradisional Indonesia.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FOOD_CATEGORIES.map((cat) => (
              <div key={cat.title} className="bg-surface-lowest p-6 rounded-2xl border border-surface-high shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-surface-low border border-surface-high flex items-center justify-center text-primary mb-4 font-bold text-sm">🍱</div>
                <h3 className="font-headline text-base font-bold text-on-surface mb-3.5 tracking-tight">{cat.title}</h3>
                <ul className="flex flex-col gap-2">
                  {cat.items.map((it) => (
                    <li key={it} className="text-xs text-on-surface-variant flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-macro-fiber shrink-0" />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ SECTION (SSR Accordion) ── */}
      <section id="faq" className="py-24 bg-surface-low border-t border-surface-high scroll-mt-20">
        <div className="max-w-[900px] mx-auto px-5 sm:px-6">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-bold tracking-wider uppercase text-primary mb-2">Pertanyaan yang Sering Diajukan</span>
            <h2 className="font-headline text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-on-surface mb-3">Ada pertanyaan seputar Jimamet?</h2>
            <p className="text-base text-on-surface-variant max-w-[560px] mx-auto">Berikut jawaban atas beberapa pertanyaan umum yang sering ditanyakan oleh pengguna baru.</p>
          </div>

          <FaqAccordion />
        </div>
      </section>

      {/* ── CALL TO ACTION BANNER ── */}
      <section className="py-20 bg-surface">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6">
          <div className="bg-primary text-on-primary rounded-3xl p-8 sm:p-14 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary-fixed-dim/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-macro-fiber/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-[620px]">
              <span className="inline-block text-xs font-bold tracking-widest uppercase text-primary-fixed-dim mb-3">Mulai Langkah Hidup Sehat</span>
              <h2 className="font-headline text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white mb-4">Makan lebih teratur, tahu gizinya, tanpa ribet menimbang.</h2>
              <p className="text-base sm:text-lg text-white/80 leading-relaxed mb-8">Daftar sekarang secara gratis. Arahkan kamera ponsel Anda ke piring makanan, dan biarkan Jimamet mengurus catatan nutrisi harian Anda.</p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                <Link href="/login?tab=register" className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-white text-primary hover:bg-primary-fixed rounded-xl font-headline text-sm font-bold shadow-md hover:shadow-lg transition-all">
                  <span>Daftar Akun Gratis</span>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
                <Link href="/login" className="inline-flex items-center justify-center px-6 py-3.5 bg-primary-container hover:bg-primary-hover text-white rounded-xl font-headline text-sm font-semibold border border-white/20 transition-colors">
                  Sudah Punya Akun? Masuk
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="pt-16 pb-12 bg-surface-low border-t border-surface-high text-on-surface-variant">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-surface-high">
            <div className="md:col-span-5 flex flex-col items-start">
              <Link href="/" className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-surface-lowest border border-surface-high flex items-center justify-center p-1">
                  <Image src="/jimamet_logo.webp" alt="Logo Jimamet" width={24} height={24} className="object-contain" />
                </div>
                <span className="font-headline text-xl font-extrabold text-primary">Jimamet</span>
              </Link>
              <p className="text-sm leading-relaxed text-outline max-w-[360px]">Platform pemantauan nutrisi dan pola makan sehat berbasis kamera cerdas, dirancang khusus untuk berbagai hidangan khas Indonesia.</p>
            </div>

            <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface mb-1 font-mono">Navigasi</span>
                <a href="#fitur" className="text-sm text-outline hover:text-primary transition-colors">
                  Keunggulan
                </a>
                <a href="#cara-kerja" className="text-sm text-outline hover:text-primary transition-colors">
                  Cara Kerja
                </a>
                <a href="#menu-nusantara" className="text-sm text-outline hover:text-primary transition-colors">
                  Menu Makanan
                </a>
                <a href="#faq" className="text-sm text-outline hover:text-primary transition-colors">
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
    </div>
  );
}
