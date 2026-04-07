import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import FeatureSlides from "@/components/FeatureSlides";
import CTAFooter from "@/components/CTAFooter";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen">
      <Nav />
      <Hero />
      <FeatureSlides />
      <CTAFooter />
    </main>
  );
}
