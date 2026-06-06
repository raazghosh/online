"use client";

import * as React from "react";
import { useState } from "react";
import {
  ShieldCheck,
  Upload,
  CheckCircle,
  Clock,
  Loader2,
  Mail,
  Phone,
  Building,
  ArrowRight,
  ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerificationPage() {
  const [aadhaarVerified, setAadhaarVerified] = useState(true);
  const [voterVerified, setVoterVerified] = useState(true);
  const [orgVerified, setOrgVerified] = useState(false);

  // UX states for mock actions
  const [isVerifyingOrg, setIsVerifyingOrg] = useState(false);
  const [orgCode, setOrgCode] = useState("");

  const handleVerifyOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgCode) return;

    setIsVerifyingOrg(true);
    setTimeout(() => {
      setIsVerifyingOrg(false);
      setOrgVerified(true);
    }, 2000);
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="border-b border-white/5 pb-5">
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <ShieldCheck className="text-primary w-6 h-6" /> Verification Center
        </h1>
        <p className="text-xs text-white/50">Manage identity documents and organizational validations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Verification Status Cards */}
        <div className="lg:col-span-8 space-y-6">
          {/* Aadhaar Panel */}
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

              <span className="text-[9px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-bold uppercase tracking-wider">
                Verified
              </span>
            </div>

            <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex items-center justify-between text-xs text-white/60 font-mono">
              <span>Aadhaar hash:</span>
              <span className="text-white">sha256://8c4a92b...3f7a</span>
            </div>
          </div>

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
                    <p className="text-[10px] text-white/40">barnalichakrabarty8@gmail.com</p>
                  </div>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase">
                  Verified
                </span>
              </div>

              {/* Phone */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.01] border border-white/5">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-primary" />
                  <div className="text-xs">
                    <p className="font-bold text-white">Mobile Number</p>
                    <p className="text-[10px] text-white/40">+91 98765 43210</p>
                  </div>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase">
                  Verified
                </span>
              </div>
            </div>
          </div>

          {/* Org Verification Panel */}
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
                className={`text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                  orgVerified
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/25"
                }`}
              >
                {orgVerified ? "Verified" : "Pending Validation"}
              </span>
            </div>

            {!orgVerified ? (
              <form onSubmit={handleVerifyOrg} className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                <input
                  type="text"
                  required
                  placeholder="Enter Organization validation code"
                  value={orgCode}
                  onChange={e => setOrgCode(e.target.value)}
                  className="sm:col-span-3 h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs focus:border-primary focus:outline-none"
                />
                <Button
                  type="submit"
                  disabled={isVerifyingOrg || !orgCode}
                  className="h-11 rounded-xl bg-primary text-white text-xs font-bold transition-all"
                >
                  {isVerifyingOrg ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify Code"}
                </Button>
              </form>
            ) : (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-xs text-emerald-400">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <span>Affiliated successfully with &apos;University Board&apos;. Organization tools activated.</span>
              </div>
            )}
          </div>
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
