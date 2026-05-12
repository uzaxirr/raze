import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import FeatureCarousel from "@/components/FeatureCarousel";
import HowItWorks from "@/components/HowItWorks";
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
        {/* How it works - positioned in upper half on desktop */}
        <div className="flex-1 flex items-center justify-center md:absolute md:inset-x-0 md:top-[calc(50%-253px/2-209.5px)]">
          <HowItWorks />
        </div>
        {/* CTA - positioned in lower half on desktop */}
        <div className="flex items-center justify-center md:absolute md:inset-x-0 md:top-[calc(50%-169px/2+121.5px)]">
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
