"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sun, Moon, Laptop, ShieldCheck, User, LogOut } from "lucide-react";
import { useVotingStore } from "@/store/useVotingStore";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

export function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState<"login" | "register" | null>(null);
  
  // Auth Form State
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const { theme, setTheme } = useTheme();
  const { user, login, logout, register } = useVotingStore();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!mounted) return null;

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email) return;
    if (showAuthModal === "login") {
      login(username, email);
    } else {
      register(username, email);
    }
    setShowAuthModal(null);
    setUsername("");
    setEmail("");
  };

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${
          scrolled
            ? "py-3 glassmorphism border-border/80 shadow-[0_10px_30px_rgba(0,0,0,0.15)]"
            : "py-5 bg-transparent border-transparent"
        }`}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="max-w-[1280px] mx-auto px-6 flex items-center justify-between">
          {/* Left: Logo */}
          <a href="#" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-sans font-bold text-xl tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent group-hover:text-primary transition-colors duration-300">
              Secure<span className="text-primary">Vote</span>
            </span>
          </a>

          {/* Center: Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {["Features", "Dashboard", "Simulator", "Pricing", "FAQ"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                onClick={(e) => handleNavClick(e, item.toLowerCase())}
                className="text-sm font-medium text-foreground/75 hover:text-primary transition-colors duration-200"
              >
                {item}
              </a>
            ))}
          </nav>

          {/* Right: Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Theme Toggle */}
            <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-border">
              <button
                onClick={() => setTheme("light")}
                className={`p-1.5 rounded-lg transition-colors ${
                  theme === "light" ? "bg-white text-primary shadow-sm" : "text-foreground/60 hover:text-foreground"
                }`}
                title="Light Mode"
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`p-1.5 rounded-lg transition-colors ${
                  theme === "dark" ? "bg-primary text-white shadow-sm" : "text-foreground/60 hover:text-foreground"
                }`}
                title="Dark Mode"
              >
                <Moon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTheme("system")}
                className={`p-1.5 rounded-lg transition-colors ${
                  theme === "system" ? "bg-white text-primary dark:bg-primary dark:text-white shadow-sm" : "text-foreground/60 hover:text-foreground"
                }`}
                title="System Theme"
              >
                <Laptop className="w-4 h-4" />
              </button>
            </div>

            {/* Auth States */}
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground/80 flex items-center gap-1 bg-surface py-1.5 px-3 rounded-lg border border-border">
                  <User className="w-3.5 h-3.5 text-primary" />
                  {user.username}
                </span>
                <Button variant="ghost" size="sm" onClick={logout} className="flex items-center gap-1 text-xs">
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </Button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setShowAuthModal("login")}
                  className="text-sm font-medium text-foreground/75 hover:text-primary transition-colors cursor-pointer"
                >
                  Log In
                </button>
                <Button variant="primary" size="sm" onClick={() => setShowAuthModal("register")}>
                  Register
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-surface border border-border text-foreground hover:text-primary transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </motion.header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl md:hidden flex flex-col pt-24 px-6 border-l border-border"
          >
            <div className="flex flex-col gap-6 text-lg font-medium">
              {["Features", "Dashboard", "Simulator", "Pricing", "FAQ"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  onClick={(e) => handleNavClick(e, item.toLowerCase())}
                  className="py-2 border-b border-border/40 text-foreground/80 hover:text-primary"
                >
                  {item}
                </a>
              ))}
            </div>

            {/* Actions for Mobile */}
            <div className="mt-8 flex flex-col gap-4">
              {user ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 bg-surface p-3 rounded-xl border border-border">
                    <User className="w-5 h-5 text-primary" />
                    <span className="font-semibold">{user.username}</span>
                  </div>
                  <Button variant="secondary" onClick={logout} className="w-full">
                    Logout
                  </Button>
                </div>
              ) : (
                <>
                  <Button variant="secondary" onClick={() => { setMobileMenuOpen(false); setShowAuthModal("login"); }}>
                    Log In
                  </Button>
                  <Button variant="primary" onClick={() => { setMobileMenuOpen(false); setShowAuthModal("register"); }}>
                    Register
                  </Button>
                </>
              )}

              {/* Mobile Theme Toggle */}
              <div className="flex justify-around items-center bg-surface p-2 rounded-xl border border-border mt-4">
                <button
                  onClick={() => setTheme("light")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                    theme === "light" ? "bg-white text-primary shadow" : "text-foreground/60"
                  }`}
                >
                  <Sun className="w-4 h-4" /> Light
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                    theme === "dark" ? "bg-primary text-white shadow" : "text-foreground/60"
                  }`}
                >
                  <Moon className="w-4 h-4" /> Dark
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Modals (Login/Register) */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-md"
            >
              <Card className="shadow-2xl relative border-border/80 bg-background/95">
                <button
                  onClick={() => setShowAuthModal(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg text-foreground/50 hover:text-foreground hover:bg-surface transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                <h3 className="text-xl font-bold tracking-tight mb-2 text-foreground">
                  {showAuthModal === "login" ? "Welcome Back to SecureVote" : "Create Your Secure Account"}
                </h3>
                <p className="text-sm text-foreground/60 mb-6">
                  {showAuthModal === "login"
                    ? "Enter credentials to access your secure election dashboard."
                    : "Register to configure ballots and participate in global elections."}
                </p>

                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/60 mb-1.5">
                      Username / Organization Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acme Corporation"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-foreground placeholder-foreground/30 focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/60 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-foreground placeholder-foreground/30 focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>

                  <Button type="submit" variant="primary" className="w-full py-3 mt-2">
                    {showAuthModal === "login" ? "Sign In" : "Register Credentials"}
                  </Button>
                </form>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
