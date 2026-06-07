import { Navbar } from "@/components/navbar/navbar";
import { Hero } from "@/components/hero/hero";
import { TrustedBy } from "@/components/trusted-by/trusted-by";
import { Metrics } from "@/components/metrics/metrics";
import { Features } from "@/components/features/features";
import { LiveDashboard } from "@/components/dashboard/dashboard";
import { VotingSimulator } from "@/components/voting-simulator/voting-simulator";
import { Testimonials } from "@/components/testimonials/testimonials";
import { Pricing } from "@/components/pricing/pricing";
import { FAQ } from "@/components/faq/faq";
import { CTA } from "@/components/cta/cta";
import { Footer } from "@/components/footer/footer";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-background">
      {/* Global Background Glow Layers */}
      <div className="absolute top-0 inset-x-0 h-[800px] bg-gradient-to-b from-primary/5 via-accent/2 to-transparent pointer-events-none -z-10" />
      <div className="absolute top-[2000px] left-[-20%] w-[50vw] h-[50vw] rounded-full bg-primary/3 blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-[3500px] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-accent/4 blur-[130px] pointer-events-none -z-10" />

      {/* Main Content */}
      <Navbar />
      
      <main className="relative z-10">
        <Hero />
        <TrustedBy />
        <Metrics />
        <Features />
        <LiveDashboard />
        <VotingSimulator />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTA />
      </main>

      <Footer />
    </div>
  );
}
