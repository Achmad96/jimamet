import Link from "next/link";

export function LandingCtaSection() {
  return (
    <section className="py-20 bg-surface">
      <div className="max-w-300 mx-auto px-5 sm:px-6">
        <div className="bg-primary text-on-primary rounded-3xl p-8 sm:p-14 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary-fixed-dim/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-macro-fiber/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-155">
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
  );
}
