import Link from "next/link";
import { STEPS } from "@/lib/landing-data";

export function LandingStepsSection() {
  return (
    <section id="cara-kerja" className="py-24 bg-surface-low border-y border-surface-high scroll-mt-24">
      <div className="max-w-300 mx-auto px-5 sm:px-6">
        <div className="text-center max-w-160 mx-auto mb-16">
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
  );
}
