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
  Bell,
  Mail,
  AlertCircle
} from "lucide-react";
import { useVotingStore } from "@/store/useVotingStore";
import { Button } from "@/components/ui/button";
import {
  apiSendVerification,
  apiVerifyEmail,
  apiSendOrgVerification,
  apiVerifyOrgEmail,
  apiAadhaarGenerateOtp,
  apiAadhaarVerifyOtp,
  apiOrgVerifyStart,
  apiOrgVerifySubmitRegistration,
  apiOrgVerifySubmitDomain,
  apiOrgVerifyDns,
  apiOrgVerifyStatus,
  apiOrgVerifyRecheck,
  apiRecheckVerification
} from "@/lib/api";

export default function OnboardingPage() {
  const router = useRouter();
  const user = useVotingStore((state) => state.user);
  const isInitialized = useVotingStore((state) => state.isInitialized);
  const initializeSession = useVotingStore((state) => state.initializeSession);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Step 1: Profile Setup
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");

  // Step 2: Identity & Email Verification
  const [emailOtp, setEmailOtp] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpSuccess, setEmailOtpSuccess] = useState(false);

  const [idType, setIdType] = useState<"aadhaar" | "voter_id">("aadhaar");
  const [idNumber, setIdNumber] = useState("");
  const [aadhaarOtp, setAadhaarOtp] = useState("");
  const [aadhaarOtpSent, setAadhaarOtpSent] = useState(false);
  const [aadhaarReferenceId, setAadhaarReferenceId] = useState("");
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [aadhaarData, setAadhaarData] = useState<{
    name: string;
    care_of: string;
    gender: string;
    photo?: string;
  } | null>(null);

  // Step 3: Organization Details & MCA Pipeline
  const [isOrg, setIsOrg] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState("Educational");

  // MCA Pipeline states
  const [orgVerifyStep, setOrgVerifyStep] = useState<"not_started" | "registration_number" | "domain" | "dns" | "verified">("not_started");
  const [orgRegNumber, setOrgRegNumber] = useState("");
  const [orgDomain, setOrgDomain] = useState("");
  const [dnsToken, setDnsToken] = useState("");
  const [mcaResults, setMcaResults] = useState<any>(null);

  // Step 4: Preferences
  const [timezone, setTimezone] = useState("UTC+5:30 (IST)");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [securityLogs, setSecurityLogs] = useState(true);

  // Step 5: Dashboard Access
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  const [missingChecks, setMissingChecks] = useState<string[]>([]);

  useEffect(() => {
    if (!isInitialized) {
      initializeSession();
    } else {
      if (!user) {
        router.push("/login");
      } else {
        setFullName(user.username || "");
        setIsOrg(user.role === "admin");
        if (user.role === "admin" && user.orgName) {
          setOrgName(user.orgName);
        }
        if (user.emailVerified) {
          setEmailOtpSuccess(true);
        }

        // Pre-fill Aadhaar or Voter ID from registration cache if available
        const cachedAadhaar = localStorage.getItem(`aadhaar_${user.email}`);
        const cachedVoterId = localStorage.getItem(`voter_id_${user.email}`);
        if (cachedAadhaar) {
          setIdNumber(cachedAadhaar);
          setIdType("aadhaar");
        } else if (cachedVoterId) {
          setIdNumber(cachedVoterId);
          setIdType("voter_id");
        }
      }
    }
  }, [isInitialized, user, initializeSession, router]);

  // Check Org verification pipeline status when entering Step 3
  useEffect(() => {
    if (step === 3 && user?.role === "admin" && orgVerifyStep === "not_started") {
      setLoading(true);
      apiOrgVerifyStatus()
        .then((res) => {
          if (res.is_verified) {
            setOrgVerifyStep("verified");
          } else if (res.request) {
            setOrgVerifyStep(res.request.current_step);
            if (res.mca) {
              setOrgRegNumber(res.mca.registration_number || "");
            }
            if (res.domain) {
              setOrgDomain(res.domain.domain || "");
              setDnsToken(res.domain.token || "");
            }
          }
        })
        .catch(() => {
          // No verification started yet
          setOrgVerifyStep("not_started");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [step, user, orgVerifyStep]);

  const handleSendEmailOtp = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      if (user?.role === "admin") {
        await apiSendOrgVerification();
      } else {
        await apiSendVerification();
      }
      setEmailOtpSent(true);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to send email verification OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!emailOtp) return;
    setLoading(true);
    setErrorMessage("");
    try {
      if (user?.role === "admin") {
        await apiVerifyOrgEmail(emailOtp);
      } else {
        await apiVerifyEmail(emailOtp);
      }
      setEmailOtpSuccess(true);
      await initializeSession();
    } catch (err: any) {
      setErrorMessage(err.message || "Invalid email OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendAadhaarOtp = async () => {
    if (!idNumber) return;
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await apiAadhaarGenerateOtp(idNumber);
      setAadhaarReferenceId(res.reference_id);
      setAadhaarOtpSent(true);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to send Aadhaar OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAadhaarOtp = async () => {
    if (!aadhaarOtp || !aadhaarReferenceId) return;
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await apiAadhaarVerifyOtp(aadhaarReferenceId, aadhaarOtp);
      setAadhaarData(res);
      setVerificationSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || "Invalid Aadhaar OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartOrgVerify = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await apiOrgVerifyStart();
      setOrgVerifyStep(res.request.current_step);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to start organization verification.");
    } finally {
      setLoading(false);
    }
  };

  const handleOrgSubmitReg = async () => {
    if (!orgRegNumber) return;
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await apiOrgVerifySubmitRegistration(orgRegNumber);
      setMcaResults(res.results);
      setOrgVerifyStep(res.next_step.step);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit registration number.");
    } finally {
      setLoading(false);
    }
  };

  const handleOrgSubmitDomain = async () => {
    if (!orgDomain) return;
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await apiOrgVerifySubmitDomain(orgDomain);
      setDnsToken(res.domain_verification.token);
      setOrgVerifyStep(res.next_step.step);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit official domain.");
    } finally {
      setLoading(false);
    }
  };

  const handleOrgVerifyDns = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await apiOrgVerifyDns();
      if (res.verified) {
        setOrgVerifyStep("verified");
      } else {
        setErrorMessage(res.message || "DNS TXT record verification failed. Double check and try again.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "DNS record check failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinishOnboarding = async () => {
    setIsFinalizing(true);
    setFinalizeError(null);
    setMissingChecks([]);
    try {
      if (user?.role === "admin") {
        const res = await apiOrgVerifyRecheck();
        if (res.all_passed) {
          await initializeSession();
          router.push("/feed");
        } else {
          setFinalizeError("Organization credentials verification checks failed.");
          setMissingChecks(
            res.results
              ? Object.entries(res.results)
                  .filter(([_, r]: any) => r.status !== "passed")
                  .map(([k, r]: any) => `${k}: ${r.message || "failed check"}`)
              : ["Verify registration details and DNS configuration."]
          );
          setIsFinalizing(false);
        }
      } else {
        const res = await apiRecheckVerification();
        if (res.is_verified) {
          await initializeSession();
          router.push("/feed");
        } else {
          setFinalizeError("Individual verification checks failed.");
          setMissingChecks(res.missing || ["Complete email and Aadhaar OTP verification first."]);
          setIsFinalizing(false);
        }
      }
    } catch (err: any) {
      setFinalizeError(err.message || "Failed to recheck verification status.");
      setIsFinalizing(false);
    }
  };

  const handleNext = () => {
    if (step < 5) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  const stepsList = [
    { num: 1, label: "Profile", icon: User },
    { num: 2, label: "Identity", icon: Shield },
    { num: 3, label: "Organization", icon: Building },
    { num: 4, label: "Preferences", icon: Settings },
    { num: 5, label: "Ready", icon: CheckCircle },
  ];

  const isContinueDisabled =
    (step === 2 && user?.role === "voter" && !verificationSuccess) ||
    (step === 3 && user?.role === "admin" && orgVerifyStep !== "verified");

  return (
    <div className="relative min-h-screen bg-[#050816] text-white flex flex-col justify-between select-none overflow-x-hidden">
      {/* Glow Effects */}
      <div className="absolute top-[10%] left-[-15%] w-[50vw] h-[50vw] rounded-full glow-primary-lg pointer-events-none -z-10" />
      <div className="absolute bottom-[10%] right-[-15%] w-[50vw] h-[50vw] rounded-full glow-accent-lg pointer-events-none -z-10" />
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

        <div className="w-full bg-card border border-white/10 rounded-3xl p-6 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden min-h-[420px] flex flex-col justify-between">
          <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full glow-primary-sm pointer-events-none -z-10" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full glow-accent-sm pointer-events-none -z-10" />

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
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-white/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/70">Mobile Number</label>
                    <input
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-white/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-semibold text-white/70">Short Bio</label>
                    <textarea
                      placeholder="Tell us about yourself or your role..."
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full p-4 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-white/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all resize-none"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Identity / Email Verification */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {!emailOtpSuccess ? (
                  /* Email verification sub-flow */
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                        <Mail className="text-primary w-6 h-6" /> Verify Email Address
                      </h2>
                      <p className="text-sm text-white/50 mt-1">
                        Before identity verification, we must verify ownership of your registered email address.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                      <div className="text-sm">
                        <span className="text-white/60">Verification code will be sent to: </span>
                        <span className="font-semibold text-primary">{user?.email}</span>
                      </div>

                      {errorMessage && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2.5 text-red-400 text-xs">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{errorMessage}</span>
                        </div>
                      )}

                      {!emailOtpSent ? (
                        <Button
                          onClick={handleSendEmailOtp}
                          disabled={loading}
                          className="w-full h-11 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs"
                        >
                          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Send Verification OTP
                        </Button>
                      ) : (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-white/70">6-Digit Verification Code</label>
                            <input
                              type="text"
                              maxLength={6}
                              placeholder="e.g. 123456"
                              value={emailOtp}
                              onChange={(e) => setEmailOtp(e.target.value)}
                              className="w-full h-12 px-4 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-white/30 text-center text-lg font-mono tracking-widest focus:border-primary focus:outline-none"
                            />
                          </div>
                          <div className="flex gap-3">
                            <Button
                              onClick={handleVerifyEmailOtp}
                              disabled={loading || emailOtp.length < 4}
                              className="flex-1 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs"
                            >
                              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                              Verify OTP
                            </Button>
                            <Button
                              variant="glass"
                              onClick={handleSendEmailOtp}
                              disabled={loading}
                              className="h-11 rounded-xl border-white/10 text-white/70 hover:bg-white/5 font-semibold text-xs"
                            >
                              Resend
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Aadhaar / ID Verification sub-flow */
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                        <Shield className="text-primary w-6 h-6" /> Identity Verification
                      </h2>
                      <p className="text-sm text-white/50 mt-1">
                        SecureVote requires identity verification to ensure a one-person-one-vote policy.
                      </p>
                    </div>

                    {errorMessage && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2.5 text-red-400 text-xs">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    {user?.role === "admin" ? (
                      <div className="bg-primary/10 border border-primary/20 rounded-xl p-5 text-center space-y-3">
                        <Building className="w-8 h-8 text-primary mx-auto" />
                        <h3 className="text-sm font-bold text-white">Organization Account</h3>
                        <p className="text-xs text-white/60 max-w-md mx-auto leading-relaxed">
                          Aadhaar Identity Verification is only required for individual voter accounts. For organizations, please proceed to Step 3 to configure corporate credentials.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex gap-3">
                            <button
                              onClick={() => {
                                setIdType("aadhaar");
                                setVerificationSuccess(false);
                                setIdNumber("");
                                setAadhaarOtpSent(false);
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

                          {idType === "voter_id" ? (
                            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] text-xs text-white/50 space-y-2 leading-relaxed">
                              <p className="font-semibold text-white/80">Voter ID Verification Offline</p>
                              <p>
                                Decentralized ZK Aadhaar OKYC is the designated identity provider for secure live authentication. Voter ID verification is currently unavailable. Please use Aadhaar Card.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-white/70">Aadhaar Card Number</label>
                                <input
                                  type="text"
                                  placeholder="e.g. 123412341234"
                                  value={idNumber}
                                  onChange={(e) => setIdNumber(e.target.value)}
                                  disabled={aadhaarOtpSent || verificationSuccess}
                                  className="w-full h-11 px-4 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-white/30 focus:border-primary focus:outline-none font-mono tracking-wider text-sm"
                                />
                              </div>

                              {!aadhaarOtpSent && !verificationSuccess && (
                                <Button
                                  onClick={handleSendAadhaarOtp}
                                  disabled={loading || idNumber.length !== 12}
                                  className="w-full h-11 rounded-xl bg-primary text-white font-bold text-xs"
                                >
                                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                  Generate Aadhaar OTP
                                </Button>
                              )}

                              {aadhaarOtpSent && !verificationSuccess && (
                                <div className="space-y-3 pt-1">
                                  <div className="space-y-1">
                                    <label className="text-xs font-semibold text-white/70">6-Digit Aadhaar OTP</label>
                                    <input
                                      type="text"
                                      maxLength={6}
                                      placeholder="xxxxxx"
                                      value={aadhaarOtp}
                                      onChange={(e) => setAadhaarOtp(e.target.value)}
                                      className="w-full h-11 px-4 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-white/30 text-center font-mono tracking-widest text-lg focus:border-primary focus:outline-none"
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={handleVerifyAadhaarOtp}
                                      disabled={loading || aadhaarOtp.length !== 6}
                                      className="flex-1 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs"
                                    >
                                      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                      Verify OTP
                                    </Button>
                                    <Button
                                      variant="glass"
                                      onClick={handleSendAadhaarOtp}
                                      disabled={loading}
                                      className="h-11 rounded-xl border-white/10 text-white/70 hover:bg-white/5 font-semibold text-xs"
                                    >
                                      Resend
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Scanner / Upload Mock Copy and Status */}
                        <div className="flex flex-col justify-center">
                          {verificationSuccess ? (
                            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 space-y-4">
                              <div className="flex items-center gap-3 text-emerald-400">
                                <CheckCircle className="w-6 h-6 shrink-0" />
                                <div>
                                  <p className="font-bold text-sm">Identity Verified</p>
                                  <p className="text-[10px] opacity-80">ZK Cryptographic Proof signed.</p>
                                </div>
                              </div>
                              <div className="border-t border-emerald-500/10 pt-3 flex gap-4 items-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                {aadhaarData?.photo && (
                                  <img
                                    src={`data:image/jpeg;base64,${aadhaarData.photo}`}
                                    alt="Aadhaar photo"
                                    className="w-16 h-20 rounded-md object-cover border border-white/10 bg-white/5 shadow-md shrink-0"
                                  />
                                )}
                                <div className="space-y-1.5 text-xs text-white/70 font-mono">
                                  <div>
                                    <span className="text-white/40">Name:</span> {aadhaarData?.name}
                                  </div>
                                  <div>
                                    <span className="text-white/40">Care Of:</span> {aadhaarData?.care_of}
                                  </div>
                                  <div>
                                    <span className="text-white/40">Gender:</span> {aadhaarData?.gender}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-white/[0.01] hover:bg-white/[0.03] transition-all relative overflow-hidden group min-h-[160px]">
                              <Upload className="w-8 h-8 text-white/40 group-hover:text-primary transition-all mb-2" />
                              <p className="text-xs font-bold text-white/75">Upload Scanned Copy (Optional)</p>
                              <p className="text-[10px] text-white/40 mt-1">PDF, JPG, or PNG up to 5MB</p>
                              <input type="file" disabled accept="image/*,application/pdf" className="absolute inset-0 opacity-0 cursor-not-allowed" />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3: Organization Details & MCA Pipeline */}
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
                    className={`border p-5 rounded-2xl text-left transition-all ${
                      !isOrg
                        ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(49,107,243,0.15)] text-white"
                        : "bg-white/5 border-white/10 text-white/30 opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <User className="w-6 h-6 mb-2 text-primary" />
                    <h3 className="text-sm font-bold">Individual / Voter</h3>
                    <p className="text-[11px] opacity-70 mt-1">Cast votes, take polls, participate in community decisions.</p>
                  </div>

                  <div
                    className={`border p-5 rounded-2xl text-left transition-all ${
                      isOrg
                        ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(49,107,243,0.15)] text-white"
                        : "bg-white/5 border-white/10 text-white/30 opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <Building className="w-6 h-6 mb-2 text-primary" />
                    <h3 className="text-sm font-bold">Organization / Admin</h3>
                    <p className="text-[11px] opacity-70 mt-1">Create elections, manage candidate rosters, invite voters.</p>
                  </div>
                </div>

                {/* MCA Pipeline for Organization Account */}
                {isOrg ? (
                  <div className="space-y-4 border-t border-white/5 pt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">MCA & Domain Verification Pipeline</h3>
                      <span className="text-[10px] bg-primary/20 border border-primary/30 px-2.5 py-0.5 rounded-full text-primary font-mono font-semibold">
                        STEP: {orgVerifyStep.toUpperCase()}
                      </span>
                    </div>

                    {errorMessage && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2.5 text-red-400 text-xs">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    {orgVerifyStep === "not_started" && (
                      <div className="p-5 rounded-xl border border-white/5 bg-white/[0.01] text-center space-y-3">
                        <p className="text-xs text-white/70">
                          Initialize the corporate registry verification pipeline to verify your business credentials.
                        </p>
                        <Button
                          onClick={handleStartOrgVerify}
                          disabled={loading}
                          className="h-10 px-6 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold text-xs"
                        >
                          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Start Verification Pipeline
                        </Button>
                      </div>
                    )}

                    {orgVerifyStep === "registration_number" && (
                      <div className="space-y-3 p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-white/70">Business Registration Number (LLPIN or CIN)</label>
                          <input
                            type="text"
                            placeholder="e.g. ABC-1234 or U12345MH2024PLC123456"
                            value={orgRegNumber}
                            onChange={(e) => setOrgRegNumber(e.target.value)}
                            className="w-full h-11 px-4 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-white/30 text-sm font-mono"
                          />
                        </div>
                        <Button
                          onClick={handleOrgSubmitReg}
                          disabled={loading || !orgRegNumber}
                          className="w-full h-11 rounded-xl bg-primary text-white font-bold text-xs"
                        >
                          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Submit Registration ID
                        </Button>
                      </div>
                    )}

                    {orgVerifyStep === "domain" && (
                      <div className="space-y-3 p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                        {mcaResults && (
                          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-lg flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4" />
                            <span>MCA Master Records Found & Active.</span>
                          </div>
                        )}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-white/70">Official Business Domain</label>
                          <input
                            type="text"
                            placeholder="e.g. acme.com"
                            value={orgDomain}
                            onChange={(e) => setOrgDomain(e.target.value)}
                            className="w-full h-11 px-4 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-white/30 text-sm"
                          />
                        </div>
                        <Button
                          onClick={handleOrgSubmitDomain}
                          disabled={loading || !orgDomain}
                          className="w-full h-11 rounded-xl bg-primary text-white font-bold text-xs"
                        >
                          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Submit Official Domain
                        </Button>
                      </div>
                    )}

                    {orgVerifyStep === "dns" && (
                      <div className="space-y-4 p-5 rounded-xl border border-white/5 bg-white/[0.01]">
                        <p className="text-xs text-white/70 leading-relaxed">
                          To complete ownership verification, add the following TXT record to your domain&apos;s DNS:
                        </p>
                        <div className="space-y-2 font-mono text-[11px] bg-black/40 p-4 rounded-lg border border-white/10 text-white/80 select-text">
                          <div>
                            <span className="text-white/40">Record Type:</span> TXT
                          </div>
                          <div>
                            <span className="text-white/40">Record Name:</span> _e-voting-verify.{orgDomain}
                          </div>
                          <div className="break-all">
                            <span className="text-white/40">Record Value:</span> {dnsToken}
                          </div>
                          <div>
                            <span className="text-white/40">TTL:</span> 300 (or default)
                          </div>
                        </div>
                        <Button
                          onClick={handleOrgVerifyDns}
                          disabled={loading}
                          className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md"
                        >
                          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Verify DNS TXT Record
                        </Button>
                      </div>
                    )}

                    {orgVerifyStep === "verified" && (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 text-center space-y-3">
                        <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                        <h3 className="text-sm font-bold text-emerald-400">Organization Identity Verified</h3>
                        <p className="text-xs text-white/60 max-w-md mx-auto leading-relaxed">
                          MCA lookup checks passed, and domain ownership has been successfully confirmed. You may now continue to the next step.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">Affiliated Organization (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. SecureVote Tech"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        className="w-full h-11 px-3 rounded-lg bg-white/[0.03] border border-white/10 text-white placeholder-white/30 text-xs focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
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
                        onChange={(e) => setTimezone(e.target.value)}
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
                        onChange={(e) => setEmailNotifications(e.target.checked)}
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
                        onChange={(e) => setSecurityLogs(e.target.checked)}
                        className="rounded border-white/10 bg-white/5 text-primary focus:ring-0 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 5: Dashboard Access / Finalize */}
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

                {!isFinalizing && finalizeError ? (
                  <div className="space-y-4 max-w-md">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
                      <AlertCircle className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-white">Verification Failed</h3>
                      <p className="text-xs text-white/50 leading-relaxed">{finalizeError}</p>
                    </div>

                    {missingChecks.length > 0 && (
                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-left text-xs font-mono text-red-400/90 space-y-1.5">
                        <p className="text-white/60 font-semibold mb-1 uppercase tracking-wider text-[9px]">Pending Checks:</p>
                        {missingChecks.map((check, idx) => (
                          <div key={idx} className="flex gap-2 items-start">
                            <span className="shrink-0">•</span>
                            <span>{check}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                      <CheckCircle className="w-10 h-10 text-emerald-400" />
                    </div>

                    <div className="space-y-2 max-w-md">
                      <h2 className="text-2xl font-bold tracking-tight text-white">Onboarding Complete!</h2>
                      <p className="text-sm text-white/50 leading-relaxed">
                        Welcome to SecureVote. Your identity has been cryptographically verified, and your digital voting keys have been generated successfully.
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
                  </>
                )}
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
                disabled={isContinueDisabled}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:shadow-[0_0_20px_rgba(49,107,243,0.3)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleFinishOnboarding}
                disabled={isFinalizing}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-xs hover:shadow-[0_0_30px_rgba(49,107,243,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
