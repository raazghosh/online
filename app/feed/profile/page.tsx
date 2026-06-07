"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building,
  CreditCard,
  History,
  Zap,
  ArrowUpRight,
  Loader2,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVotingStore } from "@/store/useVotingStore";
import { apiGetMe, apiGetOrgMe } from "@/lib/api";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isInitialized } = useVotingStore();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [activePlan] = useState({
    name: "Enterprise Core",
    price: "$49 / month",
    billingCycle: "Billed monthly",
    features: ["Up to 10 Active Elections", "Unlimited Voters", "Team Management (up to 5 admins)", "Decentralized Auditing Nodes"]
  });

  const billingHistory = [
    { date: "May 04, 2026", invoice: "INV-2026-004", amount: "$49.00", status: "Paid" },
    { date: "Apr 04, 2026", invoice: "INV-2026-003", amount: "$49.00", status: "Paid" },
    { date: "Mar 04, 2026", invoice: "INV-2026-002", amount: "$49.00", status: "Paid" }
  ];

  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      try {
        if (user?.role === "admin") {
          const res = await apiGetOrgMe();
          setProfileData(res);
        } else if (user?.role === "voter") {
          const res = await apiGetMe();
          setProfileData(res);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (isInitialized && user) {
      fetchProfile();
    }
  }, [user, isInitialized, router]);

  if (!isInitialized || loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const isAdmin = user?.role === "admin";
  const displayName = isAdmin 
    ? (profileData?.OrgName || "SecureVote Org")
    : ((profileData?.FirstName && profileData?.LastName) 
        ? `${profileData.FirstName} ${profileData.LastName}` 
        : (user?.username || "Voter"));
  const displayId = isAdmin
    ? `SV-ORG-${profileData?.ID || "Pending"}`
    : `SV-VOTER-${profileData?.ID || "Pending"}`;
  const displayType = isAdmin
    ? (profileData?.OrgType || "Educational Institution")
    : (profileData?.IsTrusted ? "Trusted Voter" : "Standard Voter");
  const displayEmail = profileData?.Email || user?.email || "";

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="border-b border-white/5 pb-5">
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          {isAdmin ? (
            <Building className="text-primary w-6 h-6" />
          ) : (
            <User className="text-primary w-6 h-6" />
          )}
          {isAdmin ? "Organization Profile" : "Personal Profile"}
        </h1>
        <p className="text-xs text-white/50">
          {isAdmin 
            ? "Manage subscription, billing information, and institutional details."
            : "Manage subscription, billing information, and personal details."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Org/User details & Subscription */}
        <div className="lg:col-span-8 space-y-6">
          {/* Details */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              {isAdmin ? (
                <Building className="w-4 h-4 text-primary" />
              ) : (
                <User className="w-4 h-4 text-primary" />
              )}
              {isAdmin ? "Institutional details" : "Personal details"}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-white/40">{isAdmin ? "Institution Name" : "Full Name"}</span>
                <p className="font-bold text-white">{displayName}</p>
              </div>
              <div className="space-y-1">
                <span className="text-white/40">{isAdmin ? "Institution ID" : "Voter ID"}</span>
                <p className="font-bold text-white font-mono">{displayId}</p>
              </div>
              <div className="space-y-1">
                <span className="text-white/40">{isAdmin ? "Category / Type" : "Voter Tier"}</span>
                <p className="font-bold text-white">{displayType}</p>
              </div>
              <div className="space-y-1">
                <span className="text-white/40">{isAdmin ? "Official Contact Email" : "Email Address"}</span>
                <p className="font-bold text-white font-mono">{displayEmail}</p>
              </div>
            </div>
          </div>

          {/* Billing history table */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-primary" /> Billing & Invoice History
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/5 pb-2 text-white/40 text-[10px] uppercase tracking-wider">
                    <th className="py-2.5">Date</th>
                    <th>Invoice</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/80">
                  {billingHistory.map((inv, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.01] transition-all">
                      <td className="py-3">{inv.date}</td>
                      <td>{inv.invoice}</td>
                      <td>{inv.amount}</td>
                      <td>
                        <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold uppercase">
                          {inv.status}
                        </span>
                      </td>
                      <td>
                        <button className="text-primary hover:underline text-[10px] font-bold cursor-pointer inline-flex items-center gap-0.5">
                          PDF <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Subscription Plan details */}
        <div className="lg:col-span-4 space-y-6">
          {/* Active Plan info */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm space-y-4 hover:border-white/15 transition-all">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-primary" /> Active Plan
              </h3>
              <span className="text-[9px] px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/25 font-bold uppercase tracking-wider">
                Pro
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-2xl font-black text-white">{activePlan.name}</p>
              <p className="text-xs text-white/40 font-mono">{activePlan.price} • {activePlan.billingCycle}</p>
            </div>

            <div className="space-y-2 text-xs text-white/70">
              {activePlan.features.map((f, i) => (
                <p key={i} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>{f}</span>
                </p>
              ))}
            </div>

            <div className="pt-2">
              <Button className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-xs hover:shadow-[0_0_20px_rgba(49,107,243,0.3)] transition-all">
                Upgrade Subscription
              </Button>
            </div>
          </div>

          {/* Payment Card info */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm space-y-4 hover:border-white/15 transition-all">
            <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-primary" /> Payment Method
            </h3>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.01] border border-white/5">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-white/60" />
                <div className="text-xs font-mono">
                  <p className="font-bold text-white">Visa ending in 4242</p>
                  <p className="text-[10px] text-white/40">Expires 12/2028</p>
                </div>
              </div>
              <button className="text-xs font-bold text-primary hover:underline cursor-pointer">
                Edit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
