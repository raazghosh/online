"use client";

import * as React from "react";
import { useState } from "react";
import { ShieldCheck, Github, Twitter, Linkedin, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/button";

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail("");
    setTimeout(() => setSubscribed(false), 5000);
  };

  return (
    <footer className="border-t border-border bg-background/50 backdrop-blur-md relative overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-6 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10">
          
          {/* Logo & Newsletter */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg">
                <ShieldCheck className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="font-sans font-bold text-lg tracking-tight text-foreground">
                Secure<span className="text-primary">Vote</span>
              </span>
            </div>
            
            <p className="text-sm text-foreground/60 leading-relaxed max-w-sm">
              Next-generation cryptographic voting platform designed to guarantee auditability, verify identities, and defend democratic integrity.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/60">
                Subscribe to our security briefings
              </label>
              
              <div className="flex gap-2 max-w-sm">
                {subscribed ? (
                  <div className="flex items-center gap-2 text-primary font-medium text-sm bg-primary/10 border border-primary/20 px-4 py-2.5 rounded-xl w-full">
                    <CheckCircle2 className="w-4.5 h-4.5" />
                    Subscribed successfully!
                  </div>
                ) : (
                  <>
                    <input
                      type="email"
                      required
                      placeholder="security@enterprise.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-surface border border-border text-foreground placeholder-foreground/30 focus:border-primary focus:outline-none text-sm transition-colors"
                    />
                    <Button type="submit" variant="primary" className="py-2.5 px-4">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </form>
          </div>

          {/* Links Column 1: Company */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Company</h4>
            <ul className="space-y-2.5">
              {["About Us", "Careers", "Press Kit", "Contact"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-foreground/60 hover:text-primary transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Column 2: Product */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Product</h4>
            <ul className="space-y-2.5">
              {["Features", "Dashboard", "Cryptography", "Pricing", "Integrations"].map((link) => (
                <li key={link}>
                  <a href={`#${link.toLowerCase()}`} className="text-sm text-foreground/60 hover:text-primary transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Column 3: Resources */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Resources</h4>
            <ul className="space-y-2.5">
              {["Documentation", "API Reference", "Whitepaper", "Security Audits", "Community"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-foreground/60 hover:text-primary transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Column 4: Legal */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Legal</h4>
            <ul className="space-y-2.5">
              {["Privacy Policy", "Terms of Service", "Compliance (GDPR)", "Audit Logs Verification"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-foreground/60 hover:text-primary transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-foreground/40 text-center sm:text-left">
            &copy; {new Date().getFullYear()} SecureVote Inc. All rights reserved. Encrypted end-to-end.
          </p>

          <div className="flex items-center gap-4 text-foreground/50">
            <a href="#" className="hover:text-primary transition-colors" title="Github">
              <Github className="w-4 h-4" />
            </a>
            <a href="#" className="hover:text-primary transition-colors" title="Twitter">
              <Twitter className="w-4 h-4" />
            </a>
            <a href="#" className="hover:text-primary transition-colors" title="LinkedIn">
              <Linkedin className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
