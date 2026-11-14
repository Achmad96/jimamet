import { FEATURES } from "@/lib/landing-data";

export function LandingFeaturesSection() {
  return (
    <section id="fitur" className="py-24 bg-surface scroll-mt-24">
      <div className="max-w-300 mx-auto px-5 sm:px-6">
        <div className="max-w-170 mb-16">
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
  );
}
