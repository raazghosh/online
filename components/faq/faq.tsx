"use client";

import * as React from "react";
import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { Card } from "../ui/card";
import { motion, AnimatePresence } from "framer-motion";

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItem({ question, answer, isOpen, onToggle }: FAQItemProps) {
  return (
    <Card
      className={`border transition-all duration-300 ${
        isOpen ? "border-primary/50 bg-surface/30" : "border-border/80 bg-surface/10 hover:border-foreground/20"
      } p-5 cursor-pointer`}
      onClick={onToggle}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <HelpCircle className={`w-5 h-5 shrink-0 ${isOpen ? "text-primary" : "text-foreground/40"}`} />
          <h3 className="text-sm sm:text-base font-bold text-foreground">{question}</h3>
        </div>
        <ChevronDown
          className={`w-4.5 h-4.5 text-foreground/50 transition-transform duration-300 shrink-0 ${
            isOpen ? "rotate-180 text-primary" : ""
          }`}
        />
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: "auto", opacity: 1, marginTop: 12 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="text-xs sm:text-sm text-foreground/60 leading-relaxed border-t border-border/40 pt-3">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export function FAQ() {
  const faqs = [
    {
      q: "How secure is SecureVote?",
      a: "SecureVote employs a defense-in-depth security architecture. Ballots are encrypted on the voter's device using AES-GCM 256 before transmission. Each ballot is verified by a multi-region decentralized network, making unauthorized manipulation statistically impossible.",
    },
    {
      q: "How is voter privacy protected?",
      a: "Voter privacy is guaranteed through zero-knowledge proofs and asymmetric encryption. The system decouples the authenticated identity validation layer from the cast ballot block. This means audit boards can verify that only registered voters cast ballots without exposing who voted for what.",
    },
    {
      q: "Can elections be audited?",
      a: "Yes, SecureVote features complete end-to-end auditability. Every voter receives a signed cryptographic receipt containing a unique ballot hash and proof ID. After the election, the final ledger blocks are opened for public inspection, allowing anyone to verify their vote is counted exactly as cast.",
    },
    {
      q: "Does it support mobile voting?",
      a: "Absolutely. SecureVote is fully optimized for responsive mobile web access and native mobile platforms. It integrates seamlessly with device-level secure enclaves, allowing voters to authenticate and cast ballots securely using built-in biometrics (FaceID / TouchID).",
    },
  ];

  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const handleToggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-24 relative z-10 overflow-hidden bg-surface/5">
      <div className="max-w-[760px] mx-auto px-6">
        
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold uppercase tracking-wider text-primary">
            Help Center
          </span>
          <h2 className="text-4xl font-extrabold tracking-tight text-foreground leading-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-foreground/60 leading-relaxed max-w-lg mx-auto">
            Find answers to common questions regarding security compliance, cryptographic verification, and operational setups.
          </p>
        </div>

        {/* Accordions */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <FAQItem
              key={faq.q}
              question={faq.q}
              answer={faq.a}
              isOpen={openIdx === idx}
              onToggle={() => handleToggle(idx)}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
