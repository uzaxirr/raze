import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import FeatureCarousel from "@/components/FeatureCarousel";

import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="relative w-full min-h-svh bg-cream">
      <section className="relative">
        <Nav />
        <Hero />
      </section>
      <FeatureCarousel />
      <section className="relative min-h-svh overflow-hidden bg-cream flex flex-col max-[900px]:min-h-0 max-[900px]:pt-[72px]">
        {/* CTA - centered */}
        <div className="flex-1 flex items-center justify-center">
          <CTASection />
        </div>
        {/* Footer - always at bottom */}
        <div className="mt-auto md:absolute md:inset-x-0 md:bottom-0">
          <Footer />
        </div>
      </section>
    </main>
  );
}
