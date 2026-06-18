"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { GraduationCap, Heart, Users, Landmark } from "lucide-react";

export function TrustedBy() {
  const logos = [
    { name: "Government Bodies", icon: Landmark, desc: "Federal & Municipal" },
    { name: "Global Universities", icon: GraduationCap, desc: "Academic Boards" },
    { name: "Nonprofits & NGOs", icon: Heart, desc: "Community Trust" },
    { name: "Local Communities", icon: Users, desc: "Cooperatives & Unions" },
  ];

  return (
    <section className="py-12 border-y border-border/50 bg-surface/30 backdrop-blur-sm relative z-10 overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          
          {/* Label */}
          <div className="text-center lg:text-left space-y-1">
            <h3 className="text-2xl font-bold tracking-tight text-foreground">
              10,000+ Organizations
            </h3>
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground/40">
              Rely on SecureVote for trusted governance
            </p>
          </div>

          {/* Logo Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 w-full lg:w-auto">
            {logos.map((logo, idx) => {
              const Icon = logo.icon;
              return (
                <motion.div
                  key={logo.name}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center gap-3 px-5 py-3 rounded-xl bg-surface/40 border border-border/40 hover:border-primary/30 transition-colors group"
                >
                  <Icon className="w-5 h-5 text-foreground/40 group-hover:text-primary transition-colors" />
                  <div>
                    <h4 className="text-xs font-bold text-foreground/60 group-hover:text-foreground transition-colors">
                      {logo.name}
                    </h4>
                    <p className="text-[10px] text-foreground/45">
                      {logo.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
