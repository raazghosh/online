"use client";

import * as React from "react";
import { ShieldCheck } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { motion } from "framer-motion";

export function CTA() {
  const handleScrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section className="py-20 relative z-10 overflow-hidden">
      {/* Background ambient orbs */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 w-full h-[200px] bg-primary/10 blur-[100px] -z-10 rounded-full" />

      <div className="max-w-[1280px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card className="relative p-10 sm:p-16 border-border/80 bg-surface/20 flex flex-col items-center text-center gap-6 overflow-hidden shadow-2xl">
            {/* Top icon */}
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/10">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div className="space-y-3 max-w-2xl">
              <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight leading-none">
                Ready to Run a Secure Election?
              </h2>
              <p className="text-sm sm:text-base text-foreground/60 leading-relaxed">
                Join thousands of universities, non-profits, associations, and municipal organizations already trusting SecureVote for verified democratic governance.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => handleScrollTo("simulator")}
                className="w-full sm:w-auto"
              >
                Get Started
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => handleScrollTo("faq")}
                className="w-full sm:w-auto"
              >
                Book Demo
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
