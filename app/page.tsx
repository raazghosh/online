"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/navbar/navbar";
import { Hero } from "@/components/hero/hero";
import { TrustedBy } from "@/components/trusted-by/trusted-by";
import { Metrics } from "@/components/metrics/metrics";
import { Features } from "@/components/features/features";
import { Footer } from "@/components/footer/footer";

// Lazy load heavy below-the-fold components to reduce initial JS chunk size and optimize FCP/LCP
const LiveDashboard = dynamic(
  () => import("@/components/dashboard/dashboard").then((mod) => mod.LiveDashboard),
  {
    ssr: false,
    loading: () => (
      <div className="py-24 max-w-[1280px] mx-auto px-6 text-center text-foreground/40 animate-pulse">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm">Loading Live Audit Console...</p>
      </div>
    ),
  }
);

const VotingSimulator = dynamic(
  () => import("@/components/voting-simulator/voting-simulator").then((mod) => mod.VotingSimulator),
  { ssr: false }
);

const Testimonials = dynamic(
  () => import("@/components/testimonials/testimonials").then((mod) => mod.Testimonials),
  { ssr: false }
);

const Pricing = dynamic(
  () => import("@/components/pricing/pricing").then((mod) => mod.Pricing),
  { ssr: false }
);

const FAQ = dynamic(
  () => import("@/components/faq/faq").then((mod) => mod.FAQ),
  { ssr: false }
);

const CTA = dynamic(
  () => import("@/components/cta/cta").then((mod) => mod.CTA),
  { ssr: false }
);

export default function Home() {
  return (
    <div className="relative min-h-screen bg-background">
      {/* Global Background Glow Layers */}
      <div className="absolute top-0 inset-x-0 h-[800px] bg-gradient-to-b from-primary/5 via-accent/2 to-transparent pointer-events-none -z-10" />
      <div className="absolute top-[2000px] left-[-20%] w-[50vw] h-[50vw] rounded-full glow-primary-lg opacity-30 pointer-events-none -z-10" />
      <div className="absolute top-[3500px] right-[-10%] w-[45vw] h-[45vw] rounded-full glow-accent-lg opacity-40 pointer-events-none -z-10" />

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
