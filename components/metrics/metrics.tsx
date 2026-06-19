"use client";

import * as React from "react";
import { useEffect, useState, useRef } from "react";
import { useInView } from "framer-motion";
import { Card } from "../ui/card";

interface CounterProps {
  value: string;
  suffix?: string;
  duration?: number;
}

function AnimatedCounter({ value, suffix = "", duration = 1.5 }: CounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;

    let start = 0;
    const end = parseFloat(value);
    if (isNaN(end)) return;

    const isFloat = value.includes(".");
    const totalFrames = duration * 60;
    const increment = end / totalFrames;
    let currentFrame = 0;

    const timer = setInterval(() => {
      currentFrame++;
      start += increment;
      if (currentFrame >= totalFrames) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 1000 / 60);

    return () => clearInterval(timer);
  }, [value, duration, isInView]);

  const isFloat = value.includes(".");

  return (
    <span ref={ref}>
      {isFloat ? count.toFixed(2) : Math.floor(count)}
      {suffix}
    </span>
  );
}

export function Metrics() {
  const metrics = [
    {
      value: "99.99",
      suffix: "%",
      label: "System Uptime",
      desc: "Distributed verification architecture ensures zero-downtime voting.",
    },
    {
      value: "16",
      suffix: "ms",
      label: "Verification Latency",
      desc: "Fast cryptographic signing creates instant, anonymous receipts.",
    },
    {
      value: "100",
      suffix: "%",
      label: "Audit Transparency",
      desc: "All ballots are verifiable using immutable hash audit chains.",
    },
  ];

  return (
    <section className="py-20 relative z-10 overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-6">
        <Card className="p-8 sm:p-12 relative overflow-hidden border-border/85 shadow-2xl">
          {/* Subtle background highlight */}
          <div className="absolute top-0 right-0 w-[300px] h-[300px] glow-primary-md -z-10 rounded-full" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 divide-y md:divide-y-0 md:divide-x divide-border">
            {metrics.map((metric, idx) => (
              <div
                key={metric.label}
                className={`flex flex-col items-center text-center px-4 ${
                  idx > 0 ? "pt-8 md:pt-0 md:pl-8" : "pb-8 md:pb-0"
                }`}
              >
                <h3 className="text-5xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-3">
                  <AnimatedCounter value={metric.value} suffix={metric.suffix} />
                </h3>
                <h4 className="text-base font-bold text-foreground mb-1.5 uppercase tracking-wide">
                  {metric.label}
                </h4>
                <p className="text-sm text-foreground/60 leading-relaxed max-w-xs">
                  {metric.desc}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}
