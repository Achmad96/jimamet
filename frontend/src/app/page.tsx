import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingHeroSection } from "@/components/landing/LandingHeroSection";
import { LandingStatsStrip } from "@/components/landing/LandingStatsStrip";
import { LandingFeaturesSection } from "@/components/landing/LandingFeaturesSection";
import { LandingStepsSection } from "@/components/landing/LandingStepsSection";
import { LandingCategoriesSection } from "@/components/landing/LandingCategoriesSection";
import { FaqAccordion } from "@/components/landing/FaqAccordion";
import { LandingCtaSection } from "@/components/landing/LandingCtaSection";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function HomePage() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-surface text-on-surface antialiased">
      {/* ── Client Navbar ── */}
      <LandingNavbar />

      {/* ── Hero Section with Interactive Widget ── */}
      <LandingHeroSection />

      {/* ── Stats Strip ── */}
      <LandingStatsStrip />

      {/* ── Features Section ── */}
      <LandingFeaturesSection />

      {/* ── How it Works Section ── */}
      <LandingStepsSection />

      {/* ── Nusantara Food Categories ── */}
      <LandingCategoriesSection />

      {/* ── FAQ Accordion Section ── */}
      <section id="faq" className="py-24 bg-surface-low border-t border-surface-high scroll-mt-24 relative">
        <span id="tanya-jawab" className="absolute -top-24" />
        <div className="max-w-255 mx-auto px-5 sm:px-6">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-bold tracking-wider uppercase text-primary mb-2">
              Pertanyaan yang Sering Diajukan
            </span>
            <h2 className="font-headline text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-on-surface mb-3">
              Ada pertanyaan seputar Jimamet?
            </h2>
            <p className="text-base text-on-surface-variant max-w-140 mx-auto">
              Berikut jawaban atas beberapa pertanyaan umum yang sering ditanyakan oleh pengguna baru.
            </p>
          </div>
          <FaqAccordion />
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <LandingCtaSection />

      {/* ── Footer ── */}
      <LandingFooter currentYear={currentYear} />
    </div>
  );
}
