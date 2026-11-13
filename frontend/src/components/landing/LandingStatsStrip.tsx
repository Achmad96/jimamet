import { STATS } from "@/lib/landing-data";

export function LandingStatsStrip() {
  return (
    <section className="py-12 bg-surface-lowest border-y border-surface-high">
      <div className="max-w-300 mx-auto px-5 sm:px-6">
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
  );
}
