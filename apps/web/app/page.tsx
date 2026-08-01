import { Hero } from "@/components/Landing/Hero";
import { Pipeline } from "@/components/Landing/PipeLine";
import { Features } from "@/components/Landing/Features";
import { DecisionLogic } from "@/components/Landing/DecisionLogic";
import { SignalsTracked } from "@/components/Landing/SignalsTracked";
import { FAQ } from "@/components/Landing/Faq";
import { FinalCTA } from "@/components/Landing/FinalCTA";
import { Footer } from "@/components/Layouts/Footer";

// ─── MAIN ─────────────────────────────────────
export default function LandingPage() {
  return (
    <main className="relative z-10 min-h-screen">
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