"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { Card } from "../ui/card";
import { motion } from "framer-motion";

export function Testimonials() {
  const testimonials = [
    {
      name: "Arjun Mehta",
      role: "VP of Governance",
      company: "Apex Tech Association",
      quote: "SecureVote revolutionized our internal board elections. The identity verification was smooth and the real-time cryptographic audit trail gave the entire committee immediate trust in the results.",
      rating: 5,
    },
    {
      name: "Sarah Jenkins",
      role: "Executive Director",
      company: "Green Democracy Foundation",
      quote: "Transparency was our number one concern. SecureVote delivered on every front—allowing our global delegates to verify their ballots independently while preserving total privacy.",
      rating: 5,
    },
    {
      name: "Rohan Das",
      role: "Operations Lead",
      company: "Cooperative Union",
      quote: "Our users voted in under 30 seconds. The biometric authentication integration and mobile compatibility were incredible. It solved our voter turnout problem overnight.",
      rating: 5,
    },
    {
      name: "Elena Rostova",
      role: "Chief of Compliance",
      company: "Euro-NGO Council",
      quote: "As an NGO handling multi-national memberships, cryptographic auditability was mandatory. SecureVote's zero-knowledge validation is state-of-the-art.",
      rating: 5,
    },
    {
      name: "Marcus Vance",
      role: "Student Body Advisor",
      company: "Pacific University",
      quote: "Enterprise-grade security at a pricing point that worked for our academic budget. The live dashboard was the highlight of the election night.",
      rating: 5,
    },
  ];

  return (
    <section className="py-24 relative z-10 overflow-hidden bg-surface/5">
      <div className="max-w-[1280px] mx-auto px-6">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold uppercase tracking-wider text-primary">
            Testimonials
          </span>
          <h2 className="text-4xl sm:text-[48px] font-extrabold tracking-tight text-foreground leading-tight">
            Endorsed by Trust Officers
          </h2>
          <p className="text-sm sm:text-base text-foreground/60 leading-relaxed">
            Read how organizations around the globe run secure, verified, and high-turnout elections.
          </p>
        </div>

        {/* Masonry Layout */}
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {testimonials.map((test, idx) => (
            <motion.div
              key={test.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="break-inside-avoid"
            >
              <Card className="border-border/80 bg-surface/20 hover:border-primary/30 transition-colors p-6 flex flex-col justify-between space-y-4">
                
                {/* Rating */}
                <div className="flex gap-1 text-amber-400">
                  {Array.from({ length: test.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-sm text-foreground/75 leading-relaxed font-medium italic">
                  "{test.quote}"
                </p>

                {/* Author Info */}
                <div className="flex items-center gap-3 border-t border-border/40 pt-4">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center font-bold text-white text-xs">
                    {test.name[0]}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{test.name}</h4>
                    <p className="text-[11px] text-foreground/45">
                      {test.role}, <span className="font-semibold text-foreground/60">{test.company}</span>
                    </p>
                  </div>
                </div>

              </Card>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
