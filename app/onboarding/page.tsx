"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Shield,
  Building,
  Settings,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Upload,
  Lock,
  Loader2,
  Check,
  Globe,
  Bell
} from "lucide-react";
import { useVotingStore } from "@/store/useVotingStore";
import { Button } from "@/components/ui/button";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, login } = useVotingStore();
  const [step, setStep] = useState(1);

  // Step 1: Profile Setup
  const [fullName, setFullName] = useState(user?.username || "");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");

  // Step 2: Identity Verification
  const [idType, setIdType] = useState<"aadhaar" | "voter_id">("aadhaar");
  const [idNumber, setIdNumber] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  // Step 3: Organization Details
  const [isOrg, setIsOrg] = useState(user?.email?.includes("admin") || false);
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState("Educational");
  const [orgSize, setOrgSize] = useState("10-50");

  // Step 4: Preferences
  const [timezone, setTimezone] = useState("UTC+5:30 (IST)");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [securityLogs, setSecurityLogs] = useState(true);

  // Step 5: Dashboard Access
  const [isFinalizing, setIsFinalizing] = useState(false);

  useEffect(() => {
    // If not logged in, mock log in a default user for demo purposes so it doesn't break
    if (!user) {
      login("Demo User", "voter@securevote.io");
    }
  }, [user, login]);

  const handleNext = () => {
    if (step < 5) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  const startVerificationMock = () => {
    if (!idNumber) return;
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setVerificationSuccess(true);
    }, 2500);
  };

  const handleFinishOnboarding = () => {
    setIsFinalizing(true);
    setTimeout(() => {
      // Direct user to feed
      router.push("/feed");
    }, 3000);
  };

  const stepsList = [
    { num: 1, label: "Profile", icon: User },
    { num: 2, label: "Identity", icon: Shield },
    { num: 3, label: "Organization", icon: Building },
    { num: 4, label: "Preferences", icon: Settings },
    { num: 5, label: "Ready", icon: CheckCircle },
  ];

  return (
    <div className="relative min-h-screen bg-[#050816] text-white flex flex-col justify-between select-none overflow-x-hidden">
      {/* Glow Effects */}
      <div className="absolute top-[10%] left-[-15%] w-[50vw] h-[50vw] rounded-full bg-primary/10 blur-[130px] pointer-events-none -z-10" />
      <div className="absolute bottom-[10%] right-[-15%] w-[50vw] h-[50vw] rounded-full bg-accent/10 blur-[140px] pointer-events-none -z-10" />
      <div className="absolute inset-0 grid-bg opacity-[0.2] pointer-events-none -z-20" />

      {/* Top Header */}
      <header className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.01] backdrop-blur-md relative z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-sans font-bold text-lg tracking-tight">
            Secure<span className="text-primary">Vote</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/60 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
          <Lock className="w-3.5 h-3.5 text-primary" />
          <span>AES-256 Secured Session</span>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative z-10 max-w-4xl mx-auto w-full">
        {/* Step Indicator */}
        <div className="w-full flex items-center justify-between mb-10 max-w-lg">
          {stepsList.map((s, idx) => {
            const Icon = s.icon;
            const isCompleted = step > s.num;
            const isActive = step === s.num;

            return (
              <React.Fragment key={s.num}>
                <div className="flex flex-col items-center gap-2 relative z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 ${
                      isCompleted
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                        : isActive
                        ? "bg-primary/20 border-primary text-white shadow-[0_0_15px_rgba(49,107,243,0.3)]"
                        : "bg-white/5 border-white/10 text-white/40"
                    }`}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span
                    className={`hidden sm:inline-block text-[10px] md:text-xs font-semibold tracking-wider transition-colors ${
                      isActive ? "text-white" : "text-white/40"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < stepsList.length - 1 && (
                  <div className="flex-1 h-[2px] bg-white/5 mx-2 relative -top-0 sm:-top-3">
                    <div
                      className="absolute inset-y-0 left-0 bg-primary transition-all duration-500"
                      style={{ width: step > s.num ? "100%" : "0%" }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Form Card */}
        <div className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 md:p-10 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden min-h-[420px] flex flex-col justify-between">
          <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-primary/10 blur-[60px] pointer-events-none -z-10" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-accent/10 blur-[60px] pointer-events-none -z-10" />

          <AnimatePresence mode="wait">
            {/* Step 1: Profile */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                    <User className="text-primary w-6 h-6" /> Set Up Your Profile
                  </h2>
                  <p className="text-sm text-white/50 mt-1">Please provide your personal information to start.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/70">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Arnab"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-white/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/70">Mobile Number</label>
                    <input
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-white/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-semibold text-white/70">Short Bio</label>
                    <textarea
                      placeholder="Tell us about yourself or your role..."
                      rows={3}
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      className="w-full p-4 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-white/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all resize-none"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Identity Verification */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                    <Shield className="text-primary w-6 h-6" /> Identity Verification
                  </h2>
                  <p className="text-sm text-white/50 mt-1">
                    SecureVote requires identity verification to ensure a one-person-one-vote policy.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setIdType("aadhaar");
                          setVerificationSuccess(false);
                          setIdNumber("");
                        }}
                        className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                          idType === "aadhaar"
                            ? "bg-primary/20 border-primary text-white"
                            : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                        }`}
                      >
                        Aadhaar Card
                      </button>
                      <button
                        onClick={() => {
                          setIdType("voter_id");
                          setVerificationSuccess(false);
                          setIdNumber("");
                        }}
                        className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                          idType === "voter_id"
                            ? "bg-primary/20 border-primary text-white"
                            : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                        }`}
                      >
                        Voter ID Card
                      </button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-white/70">
                        {idType === "aadhaar" ? "Aadhaar Card Number" : "Voter Card Number"}
                      </label>
                      <input
                        type="text"
                        placeholder={idType === "aadhaar" ? "xxxx xxxx xxxx" : "ABCxxxxxxx"}
                        value={idNumber}
                        onChange={e => setIdNumber(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-white/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-mono tracking-wider"
                      />
                    </div>
                  </div>

                  <div className="border-2 border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-white/[0.01] hover:bg-white/[0.03] transition-all relative overflow-hidden group">
                    <Upload className="w-8 h-8 text-white/40 group-hover:text-primary transition-all mb-2" />
                    <p className="text-xs font-bold text-white/75">Upload Scanned Copy</p>
                    <p className="text-[10px] text-white/40 mt-1">PDF, JPG, or PNG up to 5MB</p>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={e => setUploadedFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    {uploadedFile && (
                      <div className="absolute inset-0 bg-[#0c122c] flex items-center justify-center gap-2 p-4 text-xs font-semibold text-emerald-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="truncate">{uploadedFile.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  {!verificationSuccess ? (
                    <Button
                      onClick={startVerificationMock}
                      disabled={isVerifying || !idNumber}
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-xs"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Performing ZK Identity Verification...
                        </>
                      ) : (
                        "Verify Decentrally"
                      )}
                    </Button>
                  ) : (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3 text-emerald-400 text-xs">
                      <CheckCircle className="w-5 h-5 shrink-0" />
                      <div>
                        <p className="font-bold">Identity Decentrally Authenticated</p>
                        <p className="text-[10px] opacity-80">ZK Cryptographic Proof hash verified and signed.</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 3: Organization details */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                    <Building className="text-primary w-6 h-6" /> Organization Affiliation
                  </h2>
                  <p className="text-sm text-white/50 mt-1">
                    Are you representing an organization, or participating as an individual voter?
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div
                    onClick={() => setIsOrg(false)}
                    className={`border p-5 rounded-2xl cursor-pointer text-left transition-all ${
                      !isOrg
                        ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(49,107,243,0.15)] text-white"
                        : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                    }`}
                  >
                    <User className="w-6 h-6 mb-2 text-primary" />
                    <h3 className="text-sm font-bold">Individual / Voter</h3>
                    <p className="text-[11px] opacity-70 mt-1">Cast votes, take polls, participate in community decisions.</p>
                  </div>

                  <div
                    onClick={() => setIsOrg(true)}
                    className={`border p-5 rounded-2xl cursor-pointer text-left transition-all ${
                      isOrg
                        ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(49,107,243,0.15)] text-white"
                        : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                    }`}
                  >
                    <Building className="w-6 h-6 mb-2 text-primary" />
                    <h3 className="text-sm font-bold">Organization / Admin</h3>
                    <p className="text-[11px] opacity-70 mt-1">Create elections, manage candidate rosters, invite voters.</p>
                  </div>
                </div>

                {isOrg && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2"
                  >
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">Organization Name</label>
                      <input
                        type="text"
                        placeholder="e.g. SecureVote Tech"
                        value={orgName}
                        onChange={e => setOrgName(e.target.value)}
                        className="w-full h-11 px-3 rounded-lg bg-white/[0.03] border border-white/10 text-white placeholder-white/30 text-xs focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">Type</label>
                      <select
                        value={orgType}
                        onChange={e => setOrgType(e.target.value)}
                        className="w-full h-11 px-3 rounded-lg bg-[#080c1c] border border-white/10 text-white text-xs focus:border-primary focus:outline-none appearance-none"
                      >
                        <option value="Educational">Educational</option>
                        <option value="Corporate">Corporate</option>
                        <option value="NGO / Society">NGO / Society</option>
                        <option value="Government">Government</option>
                      </select>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Step 4: Preferences */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                    <Settings className="text-primary w-6 h-6" /> System Preferences
                  </h2>
                  <p className="text-sm text-white/50 mt-1">Customize your interaction with SecureVote.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-white/70 flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-primary" /> Time Zone
                      </label>
                      <select
                        value={timezone}
                        onChange={e => setTimezone(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl bg-[#080c1c] border border-white/10 text-white text-xs focus:border-primary focus:outline-none"
                      >
                        <option value="UTC+5:30 (IST)">UTC+5:30 (IST) - India</option>
                        <option value="UTC-5:00 (EST)">UTC-5:00 (EST) - USA East</option>
                        <option value="UTC+0:00 (GMT)">UTC+0:00 (GMT) - London</option>
                        <option value="UTC+8:00 (SGT)">UTC+8:00 (SGT) - Singapore</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4 bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs font-bold text-white/80 flex items-center gap-2">
                        <Bell className="w-4 h-4 text-primary" /> Email Notifications
                      </span>
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={e => setEmailNotifications(e.target.checked)}
                        className="rounded border-white/10 bg-white/5 text-primary focus:ring-0 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs font-bold text-white/80 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-primary" /> Real-time Security Audits
                      </span>
                      <input
                        type="checkbox"
                        checked={securityLogs}
                        onChange={e => setSecurityLogs(e.target.checked)}
                        className="rounded border-white/10 bg-white/5 text-primary focus:ring-0 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 5: Dashboard Access */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="space-y-8 text-center flex flex-col items-center justify-center py-6 relative"
              >
                <AnimatePresence>
                  {isFinalizing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-background/95 backdrop-blur-md z-30 flex flex-col items-center justify-center gap-4 text-center"
                    >
                      <div className="relative w-20 h-20 flex items-center justify-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent"
                        />
                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                          <Lock className="w-6 h-6 text-primary animate-pulse" />
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-white">Generating Cryptographic Identity Seal...</h3>
                      <p className="text-xs text-white/50 max-w-xs leading-relaxed">
                        Decrypting user configuration keys and registering public identity with consensus nodes.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                  <CheckCircle className="w-10 h-10 text-emerald-400" />
                </div>

                <div className="space-y-2 max-w-md">
                  <h2 className="text-2xl font-bold tracking-tight text-white">Onboarding Complete!</h2>
                  <p className="text-sm text-white/50 leading-relaxed">
                    Welcome to SecureVote. Your identity has been cryptographic-verified, and your digital voting keys have
                    been generated successfully.
                  </p>
                </div>

                <div className="w-full max-w-sm p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 text-left font-mono text-[10px] text-white/60">
                  <div className="flex justify-between">
                    <span>Identity Status:</span>
                    <span className="text-emerald-400 font-bold">VERIFIED</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Consensus Node:</span>
                    <span>AMS-01 (Amsterdam)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cryptographic Path:</span>
                    <span className="truncate max-w-[180px]">secp256k1://9193bceca953abdc...</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="flex justify-between items-center mt-8 border-t border-white/5 pt-6 relative z-10">
            <button
              onClick={handleBack}
              disabled={step === 1 || isFinalizing}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all select-none cursor-pointer ${
                step === 1 || isFinalizing
                  ? "opacity-30 cursor-not-allowed text-white/40"
                  : "bg-white/5 border border-white/10 text-white/80 hover:bg-white/10"
              }`}
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            {step < 5 ? (
              <Button
                onClick={handleNext}
                disabled={step === 2 && !verificationSuccess}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:shadow-[0_0_20px_rgba(49,107,243,0.3)] transition-all cursor-pointer"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleFinishOnboarding}
                disabled={isFinalizing}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-xs hover:shadow-[0_0_30px_rgba(49,107,243,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-[10px] text-white/30 border-t border-white/5 bg-white/[0.005]">
        © 2026 SecureVote. Powered by decentralized ZK consensus.
      </footer>
    </div>
  );
}
