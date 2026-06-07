"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Fingerprint, History, Eye, Cpu, Smartphone } from "lucide-react";
import { Card } from "../ui/card";

export function Features() {
  const featureList = [
    {
      icon: ShieldAlert,
      title: "End-to-End Encryption",
      desc: "Ballots are sealed on the client device using AES-GCM 256. Zero-knowledge proofs prevent tampered payloads.",
    },
    {
      icon: Fingerprint,
      title: "Identity Verification",
      desc: "Multi-factor verification linking biometrics, physical ID card checks, and secure WebAuthn credentials.",
    },
    {
      icon: History,
      title: "Real-Time Audit Logs",
      desc: "An immutable public ledger showing live verification, cryptographically signed block outputs.",
    },
    {
      icon: Eye,
      title: "Fraud Detection",
      desc: "AI monitoring flags anomalous voting patterns, duplicate credentials, and DDoS bot behavior.",
    },
    {
      icon: Cpu,
      title: "Distributed Validation",
      desc: "Network validation across independent server nodes ensuring double-spending prevention.",
    },
    {
      icon: Smartphone,
      title: "Mobile Voting",
      desc: "Fully responsive, accessible biometric voting from mobile browsers and dedicated native applications.",
    },
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <section id="features" className="py-24 relative z-10 overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-4xl sm:text-[48px] font-extrabold tracking-tight leading-tight text-foreground">
            Built for High-Trust Governance
          </h2>
          <p className="text-sm sm:text-base text-foreground/60 leading-relaxed">
            Every layer of SecureVote is engineered for cryptographic security, total transparent auditability, and fluid user experience.
          </p>
        </div>

        {/* Features Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {featureList.map((feat) => {
            const Icon = feat.icon;
            return (
              <motion.div key={feat.title} variants={cardVariants}>
                <Card className="h-full border-border/80 bg-surface/35 hover:-translate-y-2 hover:scale-[1.02] hover:border-primary/40 hover:shadow-[0_15px_40px_rgba(49,107,243,0.15)] transition-all duration-300 flex flex-col items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-foreground">{feat.title}</h3>
                    <p className="text-sm text-foreground/60 leading-relaxed">{feat.desc}</p>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

      </div>
    </section>
  );
}
