import { FOOD_CATEGORIES } from "@/lib/landing-data";

export function LandingCategoriesSection() {
  return (
    <section id="menu-nusantara" className="py-24 bg-surface scroll-mt-20">
      <div className="max-w-300 mx-auto px-5 sm:px-6">
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
  );
}
