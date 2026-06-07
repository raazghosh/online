"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle,
  Clock,
  Loader2,
  Mail,
  Phone,
  Building,
  ArrowRight,
  ShieldAlert,
  AlertCircle
} from "lucide-react";
import { useVotingStore } from "@/store/useVotingStore";
import { Button } from "@/components/ui/button";
import {
  apiAadhaarStatus,
  apiOrgVerifyStatus,
  apiOrgVerifyStart,
  apiOrgVerifySubmitRegistration,
  apiOrgVerifySubmitDomain,
  apiOrgVerifyDns
} from "@/lib/api";

export default function VerificationPage() {
  const router = useRouter();
  const { user, isInitialized, initializeSession } = useVotingStore();

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Voter statuses
  const [aadhaarData, setAadhaarData] = useState<any>(null);
  const [isAadhaarVerified, setIsAadhaarVerified] = useState(false);

  // Org pipeline statuses
  const [orgData, setOrgData] = useState<any>(null);
  const [orgVerifyStep, setOrgVerifyStep] = useState<"not_started" | "registration_number" | "domain" | "dns" | "verified">("not_started");
  const [orgRegNumber, setOrgRegNumber] = useState("");
  const [orgDomain, setOrgDomain] = useState("");
  const [dnsToken, setDnsToken] = useState("");

  const fetchVerificationStatus = React.useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      if (user?.role === "voter") {
        try {
          const res = await apiAadhaarStatus();
          setAadhaarData(res);
          setIsAadhaarVerified(res.is_verified);
        } catch (err: any) {
          if (err.status === 404) {
            setIsAadhaarVerified(false);
          } else {
            setErrorMessage(err.message || "Failed to fetch Aadhaar verification status.");
          }
        }
      } else if (user?.role === "admin") {
        try {
          const res = await apiOrgVerifyStatus();
          setOrgData(res);
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
          } else {
            setOrgVerifyStep("not_started");
          }
        } catch (err: any) {
          setOrgVerifyStep("not_started");
        }
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isInitialized) {
      initializeSession();
      return;
    }

    if (!user) {
      router.push("/login");
      return;
    }

    fetchVerificationStatus();
  }, [isInitialized, user, initializeSession, router, fetchVerificationStatus]);

  const handleStartOrgVerify = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await apiOrgVerifyStart();
      setOrgVerifyStep(res.request.current_step);
      fetchVerificationStatus();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to start organization verification.");
      setLoading(false);
    }
  };

  const handleOrgSubmitReg = async () => {
    if (!orgRegNumber) return;
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await apiOrgVerifySubmitRegistration(orgRegNumber);
      setOrgVerifyStep(res.next_step.step);
      fetchVerificationStatus();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit registration number.");
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
      fetchVerificationStatus();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit domain.");
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
        await initializeSession();
        fetchVerificationStatus();
      } else {
        setErrorMessage(res.message || "DNS verification pending. Please verify TXT record is correctly added.");
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "DNS verification check failed.");
      setLoading(false);
    }
  };

  if (loading && !aadhaarData && orgVerifyStep === "not_started") {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="border-b border-white/5 pb-5">
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <ShieldCheck className="text-primary w-6 h-6" /> Verification Center
        </h1>
        <p className="text-xs text-white/50">Manage identity documents and organizational validations.</p>
      </div>

      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Verification Status Cards */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Aadhaar Panel (Voters only) */}
          {user?.role === "voter" && (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-white">Aadhaar Identity Verification</h3>
                    <p className="text-[10px] text-white/40">Verified via ZK-Proof against central registry.</p>
                  </div>
                </div>

                <span
                  className={`text-[9px] px-2.5 py-1 rounded-full border font-bold uppercase tracking-wider ${
                    isAadhaarVerified
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/25"
                  }`}
                >
                  {isAadhaarVerified ? "Verified" : "Unverified"}
                </span>
              </div>

              {isAadhaarVerified ? (
                <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-2 text-xs text-white/60 font-mono">
                  <div className="flex justify-between">
                    <span>Reference ID:</span>
                    <span className="text-white">{aadhaarData?.reference_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Registered Name:</span>
                    <span className="text-white">{aadhaarData?.name}</span>
                  </div>
                </div>
              ) : (
                <div className="pt-2 flex justify-between items-center bg-white/[0.01] border border-white/5 p-4 rounded-2xl">
                  <span className="text-xs text-white/50">Complete your identity validation to unlock secure voting.</span>
                  <Button
                    onClick={() => router.push("/onboarding")}
                    className="h-9 px-4 rounded-lg bg-primary text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    Start KYC <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Contact Verification Panel */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm space-y-4">
            <h3 className="text-sm font-bold text-white">Contact & Voter Registry Verification</h3>

            <div className="space-y-3">
              {/* Email */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.01] border border-white/5">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-primary" />
                  <div className="text-xs">
                    <p className="font-bold text-white">Email Address</p>
                    <p className="text-[10px] text-white/40">{user?.email}</p>
                  </div>
                </div>
                <span
                  className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                    user?.emailVerified
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  }`}
                >
                  {user?.emailVerified ? "Verified" : "Pending"}
                </span>
              </div>
            </div>
          </div>

          {/* Org Verification Panel (Organizations only) */}
          {user?.role === "admin" && (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Building className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-white">Organization Validation</h3>
                    <p className="text-[10px] text-white/40">Affiliate with verified educational or corporate boards.</p>
                  </div>
                </div>

                <span
                  className={`text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${
                    orgVerifyStep === "verified"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/25"
                  }`}
                >
                  {orgVerifyStep === "verified" ? "Verified" : "Pending Validation"}
                </span>
              </div>

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
                      className="w-full h-11 px-4 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-white/30 text-xs font-mono"
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
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/70">Official Business Domain</label>
                    <input
                      type="text"
                      placeholder="e.g. acme.com"
                      value={orgDomain}
                      onChange={(e) => setOrgDomain(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-white/30 text-xs"
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
                  <div className="space-y-2 font-mono text-[10px] bg-black/40 p-4 rounded-lg border border-white/10 text-white/80 select-text">
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
                    className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Verify DNS TXT Record
                  </Button>
                </div>
              )}

              {orgVerifyStep === "verified" && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-2 text-xs text-emerald-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 shrink-0" />
                    <span className="font-bold">Affiliated & Verified successfully</span>
                  </div>
                  {orgData?.mca && (
                    <div className="border-t border-emerald-500/10 pt-2 font-mono text-[10px] text-white/70 space-y-1">
                      <div>
                        <span className="text-white/40">Entity:</span> {orgData.mca.legal_name}
                      </div>
                      <div>
                        <span className="text-white/40">Reg ID:</span> {orgData.mca.registration_number}
                      </div>
                      <div>
                        <span className="text-white/40">Domain:</span> {orgData.domain?.domain}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Informative Side Card */}
        <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm space-y-4 hover:border-white/15 transition-all">
          <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-primary animate-pulse" /> ZK-Proof Architecture
          </h3>

          <div className="space-y-3.5 text-xs text-white/70 leading-relaxed">
            <p>
              SecureVote implements Zero-Knowledge proofs for identity validation. Your Aadhaar or Voter credentials
              are processed locally on your browser.
            </p>
            <p>
              Only the cryptographic commitment hash is broadcasted to the consensus nodes. Nobody—not even SecureVote administrators—can access your raw credentials.
            </p>
            <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl font-mono text-[9px] text-white/40 space-y-1">
              <div className="flex justify-between">
                <span>Proof Type:</span>
                <span>zk-SNARKs (groth16)</span>
              </div>
              <div className="flex justify-between">
                <span>Curve:</span>
                <span>BN254</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
