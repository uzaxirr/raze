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
      <section className="relative overflow-hidden bg-cream flex flex-col py-16 md:py-24">
        <CTASection />
        <div className="mt-16">
          <Footer />
        </div>
      </section>
    </main>
  );
}
