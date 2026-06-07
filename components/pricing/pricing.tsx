"use client";

import * as React from "react";
import { Check, ShieldCheck } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { motion } from "framer-motion";

export function Pricing() {
  const plans = [
    {
      name: "Starter",
      price: "$49",
      period: "/month",
      desc: "Perfect for local clubs, cooperatives, and small communities.",
      features: [
        "Up to 500 registered voters",
        "Email identity verification",
        "Client-side cryptographic sealing",
        "Digital ballot verification receipts",
        "Standard email support (24h)",
      ],
      popular: false,
      cta: "Start Free Trial",
    },
    {
      name: "Professional",
      price: "$199",
      period: "/month",
      desc: "Tailored for growing corporate boards and regional NGOs.",
      features: [
        "Up to 5,000 registered voters",
        "Advanced biometric (FaceID) verification",
        "Distributed node consensus logs",
        "Live operations dashboard console",
        "Priority Slack support (4h)",
      ],
      popular: true,
      cta: "Get Started Now",
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      desc: "Built for municipal governments, global unions, and institutions.",
      features: [
        "Unlimited registered voters",
        "NFC passport & physical ID verification",
        "Dedicated validator node instance hosting",
        "Custom API & webhook integrations",
        "Dedicated account manager & 99.99% SLA",
      ],
      popular: false,
      cta: "Contact Enterprise Sales",
    },
  ];

  return (
    <section id="pricing" className="py-24 relative z-10 overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-6">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold uppercase tracking-wider text-primary">
            Pricing Plans
          </span>
          <h2 className="text-4xl sm:text-[48px] font-extrabold tracking-tight text-foreground leading-tight">
            Transparent Pricing for Secure Elections
          </h2>
          <p className="text-sm sm:text-base text-foreground/60 leading-relaxed">
            Select the tier that matches your voter demographic scale and compliance thresholds.
          </p>
        </div>

        {/* Pricing Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="flex"
            >
              <Card
                className={`w-full p-8 border flex flex-col justify-between hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 relative ${
                  plan.popular
                    ? "border-primary bg-primary/5 shadow-[0_20px_50px_rgba(49,107,243,0.15)]"
                    : "border-border/80 bg-surface/20"
                }`}
                glow={plan.popular}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <span className="absolute top-4 right-4 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Most Popular
                  </span>
                )}

                <div className="space-y-6">
                  {/* Plan Meta */}
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                    <p className="text-xs text-foreground/50 mt-1.5 min-h-[40px]">
                      {plan.desc}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl sm:text-5xl font-black text-foreground tracking-tight">
                      {plan.price}
                    </span>
                    <span className="text-xs font-semibold text-foreground/50">
                      {plan.period}
                    </span>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-3.5 border-t border-border/40 pt-6">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/75 leading-relaxed">
                        <Check className="w-4.5 h-4.5 text-primary shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Call to action */}
                <div className="mt-8">
                  <Button
                    variant={plan.popular ? "primary" : "glass"}
                    className="w-full py-3"
                    onClick={() => {
                      const simulator = document.getElementById("simulator");
                      if (simulator) {
                        simulator.scrollIntoView({ behavior: "smooth", block: "start" });
                      }
                    }}
                  >
                    {plan.cta}
                  </Button>
                </div>

              </Card>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
