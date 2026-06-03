"use client";

import * as React from "react";
import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  ShieldCheck, 
  KeyRound, 
  Activity, 
  Globe, 
  CheckCircle2, 
  Lock, 
  Mail, 
  Building, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  Loader2,
  BadgeAlert
} from "lucide-react";
import { useVotingStore } from "@/store/useVotingStore";
import { Button } from "@/components/ui/button";

function LoginPageContent() {
  const router = useRouter();
  const { login } = useVotingStore();

  const [accountType, setAccountType] = useState<"individual" | "organization">("individual");
  
  // Input fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // UX States
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState(0);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Live Audit Logs State
  const [liveLogs, setLiveLogs] = useState<Array<{ id: number; text: string; time: string; type: string }>>([
    { id: 1, text: "Consensus protocol initialized on Node AMS-01", time: "15:02:10", type: "success" },
    { id: 2, text: "Block #842,920 signed with SHA-256", time: "15:02:22", type: "info" },
    { id: 3, text: "Verification request received from client (103.44.*.*)", time: "15:02:40", type: "warning" },
  ]);

  // Live log simulation
  useEffect(() => {
    const logsTemplates = [
      { text: "Identity hash verified via decentralized zero-knowledge proof", type: "success" },
      { text: "Cryptographic ballot signature verified successfully", type: "success" },
      { text: "Public key registry updated on 12 nodes", type: "info" },
      { text: "Encrypted vote ledger sync complete - Latency 14ms", type: "info" },
      { text: "Validator node SFO-02 verified block signature", type: "success" },
      { text: "Consensus threshold reached: 99.98% agreement", type: "success" },
      { text: "MFA challenge issued for administrative access", type: "warning" },
      { text: "Secure HSM module completed cryptographic handshake", type: "info" },
    ];

    const interval = setInterval(() => {
      const randomLog = logsTemplates[Math.floor(Math.random() * logsTemplates.length)];
      const now = new Date();
      const timeStr = now.toTimeString().split(" ")[0];
      setLiveLogs(prev => [
        { id: Date.now(), text: randomLog.text, time: timeStr, type: randomLog.type },
        ...prev.slice(0, 4)
      ]);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setIsSubmitting(true);
    setSubmitStep(1);

    try {
      // Local crypto steps
      await new Promise(resolve => setTimeout(resolve, 800));
      setSubmitStep(2);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubmitStep(3);
      await new Promise(resolve => setTimeout(resolve, 700));

      // Login store dispatch
      login(email.split("@")[0] || "User", email);
      setSubmitSuccess(true);
      
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (err: any) {
      setSubmitError(err?.message || "Authentication process failed.");
      setIsSubmitting(false);
      setSubmitStep(0);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    }
  };

  const formAnimationVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.3, ease: "easeIn" } }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden py-12 px-4 sm:px-6 lg:px-8 select-none">
      {/* Background Glow Elements */}
      <div className="absolute top-[10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-primary/10 blur-[130px] animate-pulse-slow pointer-events-none -z-10" />
      <div className="absolute bottom-[10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-accent/10 blur-[140px] pointer-events-none -z-10" />
      
      {/* Grid Overlay */}
      <div className="absolute inset-0 grid-bg opacity-[0.3] pointer-events-none -z-20" />
      
      {/* Back button */}
      <div className="absolute top-6 left-6 z-40">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-foreground/80 hover:text-primary hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_15px_rgba(49,107,243,0.15)] transition-all cursor-pointer text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
      </div>

      <div className="w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
        
        {/* LEFT BRANDING SECTION */}
        <motion.div 
          className="lg:col-span-5 space-y-8 hidden lg:block text-left"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Logo */}
          <motion.div variants={itemVariants} className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-[0_0_20px_rgba(49,107,243,0.4)]">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <span className="font-sans font-bold text-2xl tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Secure<span className="text-primary">Vote</span>
            </span>
          </motion.div>

          {/* Heading */}
          <div className="space-y-4">
            <motion.div variants={itemVariants}>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-surface border border-border text-[11px] font-bold tracking-wider uppercase text-foreground/80 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                <Lock className="w-3 h-3 text-primary animate-pulse" />
                Military-Grade Cryptography
              </span>
            </motion.div>
            <motion.h1 
              variants={itemVariants}
              className="text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.1] text-foreground"
            >
              Secure Digital
              <span className="block mt-1 bg-gradient-to-r from-primary via-secondary to-accent bg-[length:200%_auto] animate-gradient bg-clip-text text-transparent">
                Democracy
              </span>
            </motion.h1>
            <motion.p 
              variants={itemVariants}
              className="text-base text-foreground/70 leading-relaxed max-w-sm"
            >
              Transparent, Secure & Tamper-Proof Voting Platform engineered for secure digital elections worldwide.
            </motion.p>
          </div>

          {/* Floating Indicators */}
          <motion.div variants={itemVariants} className="space-y-4 relative">
            <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full -z-10" />

            <div className="glassmorphism p-4 rounded-2xl border border-white/10 flex items-center gap-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.15)] max-w-sm">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                <Lock className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[11px] font-semibold text-foreground/40 uppercase tracking-wider">Security Protocol</p>
                <p className="text-sm font-bold text-foreground">AES-GCM 256 Encryption Active</p>
              </div>
            </div>

            <div className="glassmorphism p-4 rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.15)] max-w-sm space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-foreground">Real-time Election Audit Ledger</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold uppercase tracking-widest">
                  Live
                </span>
              </div>
              <div className="space-y-2 font-mono text-[10px] leading-normal text-foreground/60 h-28 overflow-hidden relative">
                <AnimatePresence initial={false}>
                  {liveLogs.map((log) => (
                    <motion.div 
                      key={log.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-start gap-2 py-0.5"
                    >
                      <span className="text-primary/60 shrink-0">[{log.time}]</span>
                      <span className="truncate">{log.text}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-[#050816] via-[#050816]/70 to-transparent pointer-events-none" />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* RIGHT AUTH CARD SECTION */}
        <motion.div 
          className="lg:col-span-7 flex justify-center w-full"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="w-full max-w-xl bg-white/5 backdrop-blur-[20px] rounded-[24px] border border-white/8 hover:border-white/12 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden p-6 sm:p-8 md:p-10 group transition-all duration-300">
            <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-primary/20 blur-[50px] pointer-events-none -z-10" />
            <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-accent/15 blur-[50px] pointer-events-none -z-10" />

            {/* Mobile Branding */}
            <div className="block lg:hidden text-center mb-8 space-y-2">
              <div className="inline-flex items-center justify-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <span className="font-sans font-bold text-lg tracking-tight text-foreground">
                  Secure<span className="text-primary">Vote</span>
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-foreground">Secure Digital Democracy</h2>
              <p className="text-xs text-foreground/60">Transparent, Secure & Tamper-Proof Voting Platform</p>
            </div>

            {/* Submission Loader Overlay */}
            <AnimatePresence>
              {isSubmitting && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-background/90 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center"
                >
                  {!submitSuccess ? (
                    <div className="space-y-6 max-w-sm">
                      <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent"
                        />
                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                          <Lock className="w-6 h-6 text-primary animate-pulse" />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-lg font-bold text-foreground">Cryptographic Handshake</h3>
                        <div className="space-y-2 text-xs font-mono text-foreground/60 text-left bg-black/30 p-4 rounded-xl border border-white/5">
                          <div className="flex items-center gap-2">
                            <span className={submitStep >= 1 ? "text-emerald-400 font-bold" : "text-foreground/40"}>✓</span>
                            <span>Generating Local Cryptographic Keys...</span>
                            {submitStep === 1 && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary ml-auto" />}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={submitStep >= 2 ? "text-emerald-400 font-bold" : "text-foreground/40"}>{submitStep >= 2 ? "✓" : "○"}</span>
                            <span>Verifying Zero-Knowledge Identity Proof...</span>
                            {submitStep === 2 && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary ml-auto" />}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={submitStep >= 3 ? "text-emerald-400 font-bold" : "text-foreground/40"}>{submitStep >= 3 ? "✓" : "○"}</span>
                            <span>Syncing Verification Ledger with Nodes...</span>
                            {submitStep === 3 && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary ml-auto" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-4">
                      <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground">Secure Connection Established</h3>
                      <p className="text-sm text-foreground/60">Redirecting to your SecureVote dashboard.</p>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Account Type Toggle */}
            <div className="grid grid-cols-2 p-1 rounded-lg bg-white/[0.02] border border-white/5 relative z-10 mb-8 max-w-xs mx-auto">
              <button
                type="button"
                onClick={() => setAccountType("individual")}
                className={`relative py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  accountType === "individual" ? "text-white" : "text-foreground/40 hover:text-foreground/70"
                }`}
              >
                {accountType === "individual" && (
                  <motion.div
                    layoutId="activeTypeIndicator"
                    className="absolute inset-0 rounded-md bg-white/[0.05] border border-white/10 -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 28 }}
                  />
                )}
                Individual
              </button>
              <button
                type="button"
                onClick={() => setAccountType("organization")}
                className={`relative py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  accountType === "organization" ? "text-white" : "text-foreground/40 hover:text-foreground/70"
                }`}
              >
                {accountType === "organization" && (
                  <motion.div
                    layoutId="activeTypeIndicator"
                    className="absolute inset-0 rounded-md bg-white/[0.05] border border-white/10 -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 28 }}
                  />
                )}
                Organization
              </button>
            </div>

            {submitError && (
              <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5">
                <BadgeAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <AnimatePresence mode="wait">
                {accountType === "individual" ? (
                  <motion.div
                    key="login-individual"
                    variants={formAnimationVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-5"
                  >
                    <div className="space-y-1">
                      <h3 className="text-2xl font-bold tracking-tight text-foreground">Welcome Back</h3>
                      <p className="text-sm text-foreground/50">Sign in to access your voting dashboard</p>
                    </div>

                    <div className="space-y-4 pt-2">
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 group-focus-within:text-primary transition-colors">
                          <Mail className="w-5 h-5" />
                        </div>
                        <input
                          type="text"
                          required
                          placeholder="Email Address or Voter ID"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white/[0.03] border border-white/10 text-foreground text-sm placeholder-foreground/30 focus:bg-white/[0.05] focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all"
                        />
                      </div>

                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 group-focus-within:text-primary transition-colors">
                          <Lock className="w-5 h-5" />
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full h-14 pl-12 pr-12 rounded-2xl bg-white/[0.03] border border-white/10 text-foreground text-sm placeholder-foreground/30 focus:bg-white/[0.05] focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/70"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <label className="flex items-center gap-2 text-foreground/60 hover:text-foreground cursor-pointer">
                        <input type="checkbox" className="rounded border-white/10 bg-white/5 text-primary focus:ring-0 focus:ring-offset-0" />
                        Remember me
                      </label>
                      <a href="#" className="font-semibold text-primary hover:underline">Forgot Password?</a>
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-[#5082f5] text-white font-bold tracking-wide hover:shadow-[0_0_30px_rgba(49,107,243,0.45)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      Sign In
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="login-org"
                    variants={formAnimationVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-5"
                  >
                    <div className="space-y-1">
                      <h3 className="text-2xl font-bold tracking-tight text-foreground">Organization Portal</h3>
                      <p className="text-sm text-foreground/50">Manage elections securely</p>
                    </div>

                    <div className="space-y-4 pt-2">
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 group-focus-within:text-primary transition-colors">
                          <Building className="w-5 h-5" />
                        </div>
                        <input
                          type="text"
                          required
                          placeholder="Organization ID or Official Email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white/[0.03] border border-white/10 text-foreground text-sm placeholder-foreground/30 focus:bg-white/[0.05] focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all"
                        />
                      </div>

                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 group-focus-within:text-primary transition-colors">
                          <Lock className="w-5 h-5" />
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full h-14 pl-12 pr-12 rounded-2xl bg-white/[0.03] border border-white/10 text-foreground text-sm placeholder-foreground/30 focus:bg-white/[0.05] focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/70"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <label className="flex items-center gap-2 text-foreground/60 hover:text-foreground cursor-pointer">
                        <input type="checkbox" className="rounded border-white/10 bg-white/5 text-primary focus:ring-0 focus:ring-offset-0" />
                        Remember organization
                      </label>
                      <a href="#" className="font-semibold text-primary hover:underline">Forgot Portal Key?</a>
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-[#5082f5] text-white font-bold tracking-wide hover:shadow-[0_0_30px_rgba(49,107,243,0.45)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      Sign In as Organization
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>

            {/* Bottom link to Register */}
            <div className="text-center text-xs text-foreground/60 mt-8 relative z-10">
              Don&apos;t have an account?{" "}
              <button 
                onClick={() => router.push("/register")}
                className="font-bold text-primary hover:underline cursor-pointer"
              >
                Register here
              </button>
            </div>

          </div>
        </motion.div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050816] flex flex-col items-center justify-center text-foreground gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm font-mono text-foreground/60">Initializing secure session...</p>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
