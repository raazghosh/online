"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Shield, ShieldCheck, KeyRound, Activity, Globe, CheckCircle2, Lock } from "lucide-react";
import { Button } from "../ui/button";

export function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const floatTransition = {
    duration: 6,
    ease: "easeInOut",
    repeat: Infinity,
    repeatType: "reverse" as const,
  };

  const handleScrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section className="relative min-h-screen pt-32 pb-20 flex items-center justify-center overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[20%] left-[10%] w-[30vw] h-[30vw] rounded-full bg-primary/10 blur-[120px] animate-pulse-slow z-0 pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[35vw] h-[35vw] rounded-full bg-accent/80 blur-[130px] opacity-[0.06] animate-pulse-slow z-0 pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 grid-bg opacity-[0.4] z-0 pointer-events-none" />

      <div className="max-w-[1280px] w-full mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center relative z-10">
        
        {/* Left Side: Copy */}
        <motion.div
          className="lg:col-span-6 space-y-8 text-center lg:text-left"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="inline-flex justify-center lg:justify-start">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-surface border border-border text-xs font-semibold tracking-wider uppercase text-foreground/80 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              Trusted by 10,000+ Organizations
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="text-5xl sm:text-6xl lg:text-[72px] font-extrabold tracking-tight leading-[1.05] text-foreground"
          >
            Secure Digital{" "}
            <span className="block mt-1 bg-gradient-to-r from-primary via-secondary to-accent bg-[length:200%_auto] animate-gradient bg-clip-text text-transparent">
              Voting
            </span>
            For Modern Democracy
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={itemVariants}
            className="text-base sm:text-lg text-foreground/75 leading-relaxed max-w-xl mx-auto lg:mx-0"
          >
            Enterprise-grade secure voting platform with identity verification, end-to-end encryption, transparent audits, and real-time election management.
          </motion.p>

          {/* Action Buttons */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <Button variant="primary" size="lg" onClick={() => handleScrollTo("simulator")}>
              Get Started
            </Button>
            <Button variant="secondary" size="lg" onClick={() => handleScrollTo("faq")}>
              Schedule Demo
            </Button>
          </motion.div>
        </motion.div>

        {/* Right Side: Animated Orb System & Floating Cards */}
        <div className="lg:col-span-6 flex items-center justify-center relative min-h-[480px] select-none">
          {/* Inner Glow Center */}
          <div className="absolute w-[180px] h-[180px] rounded-full bg-primary/20 blur-[60px] z-0" />

          {/* Orbiting Rings container */}
          <div className="relative w-[340px] h-[340px] flex items-center justify-center">
            
            {/* Outer Orbit Ring */}
            <div className="absolute inset-0 rounded-full border border-border/40 animate-orbit" />

            {/* Inner Orbit Ring */}
            <div className="absolute w-[240px] h-[240px] rounded-full border border-border/60 animate-orbit-reverse" />

            {/* Center Conic Gradient Orb */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 25, ease: "linear", repeat: Infinity }}
              className="absolute w-[140px] h-[140px] rounded-full bg-gradient-to-tr from-primary via-accent to-secondary p-[3px] shadow-[0_0_50px_rgba(49,107,243,0.4)]"
            >
              <div className="w-full h-full rounded-full bg-[#050816] flex items-center justify-center">
                <Shield className="w-10 h-10 text-primary" />
              </div>
            </motion.div>

            {/* Orbiting Validator Node 1 */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary shadow-[0_0_12px_#316BF3] flex items-center justify-center">
              <span className="absolute w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            </div>

            {/* Orbiting Validator Node 2 */}
            <div className="absolute bottom-12 left-6 w-3 h-3 rounded-full bg-accent shadow-[0_0_10px_#A855F7]" />

            {/* Orbiting Validator Node 3 */}
            <div className="absolute bottom-6 right-16 w-3.5 h-3.5 rounded-full bg-secondary shadow-[0_0_10px_#60A5FA]" />
          </div>

          {/* Floating Card 1: Verified Vote */}
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: -15 }}
            transition={floatTransition}
            className="absolute top-4 -left-12 sm:-left-4 z-20"
          >
            <div className="glassmorphism p-3.5 rounded-2xl border border-white/10 flex items-center gap-3 shadow-xl max-w-[170px]">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center border border-green-500/20">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-foreground/50 uppercase tracking-wide">Ballot Signature</p>
                <p className="text-xs font-bold text-foreground">Verified Vote</p>
              </div>
            </div>
          </motion.div>

          {/* Floating Card 2: Encryption Active */}
          <motion.div
            initial={{ y: -10 }}
            animate={{ y: 15 }}
            transition={{ ...floatTransition, delay: 0.5 }}
            className="absolute top-12 -right-12 sm:-right-4 z-20"
          >
            <div className="glassmorphism p-3.5 rounded-2xl border border-white/10 flex items-center gap-3 shadow-xl max-w-[180px]">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                <Lock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-foreground/50 uppercase tracking-wide">AES-GCM 256</p>
                <p className="text-xs font-bold text-foreground">Encryption Active</p>
              </div>
            </div>
          </motion.div>

          {/* Floating Card 3: Live Vote Count */}
          <motion.div
            initial={{ y: -15 }}
            animate={{ y: 15 }}
            transition={{ ...floatTransition, delay: 1 }}
            className="absolute bottom-8 -left-10 sm:-left-2 z-20"
          >
            <div className="glassmorphism p-3.5 rounded-2xl border border-white/10 flex items-center gap-3 shadow-xl max-w-[170px]">
              <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center border border-secondary/20">
                <Activity className="w-4 h-4 text-secondary" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-foreground/50 uppercase tracking-wide">Nodes Synced</p>
                <p className="text-xs font-bold text-foreground">Live Audit logs</p>
              </div>
            </div>
          </motion.div>

          {/* Floating Card 4: Global Nodes */}
          <motion.div
            initial={{ y: 15 }}
            animate={{ y: -20 }}
            transition={{ ...floatTransition, delay: 1.5 }}
            className="absolute bottom-4 -right-10 sm:-right-2 z-20"
          >
            <div className="glassmorphism p-3.5 rounded-2xl border border-white/10 flex items-center gap-3 shadow-xl max-w-[170px]">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center border border-accent/20">
                <Globe className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-foreground/50 uppercase tracking-wide">Consensus</p>
                <p className="text-xs font-bold text-foreground">Distributed validation</p>
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
