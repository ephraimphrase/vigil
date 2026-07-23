import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { Pipeline } from "@/components/landing/PipeLine";
import { Features } from "@/components/landing/Features";
import { DecisionLogic } from "@/components/landing/DecisionLogic";
import { SignalsTracked } from "@/components/landing/SignalsTracked";
import { FAQ } from "@/components/landing/Faq";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/Layouts/Footer";

// ─── MAIN ─────────────────────────────────────
export default function LandingPage() {
  return (
    <main className="relative z-10 min-h-screen">
      <Nav />
      <Hero />
      <Pipeline />
      <Features />
      <DecisionLogic />
      <SignalsTracked />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}