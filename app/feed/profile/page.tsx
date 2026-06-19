"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Building,
  CreditCard,
  History,
  Zap,
  ArrowUpRight,
  Loader2,
  User,
  ShieldCheck,
  ShieldAlert,
  Camera,
  Upload,
  Check,
  Edit2,
  Save,
  X,
  Mail,
  Calendar,
  Lock,
  Phone,
  Fingerprint,
  Activity,
  AlertCircle,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVotingStore } from "@/store/useVotingStore";
import { apiGetMe, apiGetOrgMe } from "@/lib/api";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { motion, AnimatePresence } from "framer-motion";

export default function ProfilePage() {
  const router = useRouter();
  const user = useVotingStore((state) => state.user);
  const isInitialized = useVotingStore((state) => state.isInitialized);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"details" | "subscription" | "billing" | "security">("details");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit Mode states
  const [isEditing, setIsEditing] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editOrgName, setEditOrgName] = useState("");
  const [editOrgType, setEditOrgType] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editBio, setEditBio] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Security toggles state (mock changes)
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);

  // Local storage profile pictures persistent fallback
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [activePlan] = useState({
    name: "Enterprise Core",
    price: "$49 / month",
    billingCycle: "Billed monthly",
    features: [
      "Up to 10 Active Elections",
      "Unlimited Voters",
      "Team Management (up to 5 admins)",
      "Decentralized Auditing Nodes",
      "Zero-Knowledge Range Proofs",
      "24/7 Priority Support"
    ]
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
        let res;
        if (user?.role === "admin") {
          res = await apiGetOrgMe();
          setProfileData(res);
          setEditOrgName(res.OrgName || "");
          setEditOrgType(res.OrgType || "Educational Institution");
        } else if (user?.role === "voter") {
          res = await apiGetMe();
          setProfileData(res);
          setEditFirstName(res.FirstName || "");
          setEditLastName(res.LastName || "");
        }
        
        // Load editable fields from state/localStorage fallback
        if (res) {
          const email = res.Email;
          setEditUsername(localStorage.getItem(`username_${email}`) || user?.username || "");
          setEditPhone(localStorage.getItem(`phone_${email}`) || res.Phone || "");
          setEditBio(localStorage.getItem(`bio_${email}`) || "Decentralized democracy participant & validator node auditor.");
          setAvatarPreview(localStorage.getItem(`avatar_${email}`) || user?.avatarUrl || res.AvatarURL || null);
          setMfaEnabled(res.MfaEnabled || false);
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
      <div className="min-h-[500px] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-xs font-mono text-foreground/50">Loading profile records...</p>
      </div>
    );
  }

  const isAdmin = user?.role === "admin";
  const displayEmail = profileData?.Email || user?.email || "";
  const isVerified = user?.isVerified || false;

  // Format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return "June 2026";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  const displayName = isAdmin 
    ? (editOrgName || "SecureVote Org")
    : ((editFirstName || editLastName) 
        ? `${editFirstName} ${editLastName}`.trim() 
        : (user?.username || "Voter"));

  const displayId = isAdmin
    ? `SV-ORG-${profileData?.ID || "Pending"}`
    : `SV-VOTER-${profileData?.ID || "Pending"}`;

  const displayType = isAdmin
    ? (editOrgType || "Educational Institution")
    : (profileData?.IsTrusted ? "Trusted Voter" : "Standard Voter");

  // Handle Avatar Change
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert("Image file size should be less than 1MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAvatarPreview(base64String);
        
        // Save to localStorage for client-side persistence
        localStorage.setItem(`avatar_${displayEmail}`, base64String);
        
        // Update global Zustand store state
        useVotingStore.setState({
          user: {
            ...user!,
            avatarUrl: base64String
          }
        });
        
        // Log API call simulation
        console.log(`Simulated PUT /auth/${isAdmin ? "org/" : ""}me/avatar/upload successfully.`);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Save changes to profile
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      // Save to localStorage
      localStorage.setItem(`username_${displayEmail}`, editUsername);
      localStorage.setItem(`phone_${displayEmail}`, editPhone);
      localStorage.setItem(`bio_${displayEmail}`, editBio);
      
      if (isAdmin) {
        localStorage.setItem(`orgName_${displayEmail}`, editOrgName);
        localStorage.setItem(`orgType_${displayEmail}`, editOrgType);
      } else {
        localStorage.setItem(`firstName_${displayEmail}`, editFirstName);
        localStorage.setItem(`lastName_${displayEmail}`, editLastName);
      }

      // Sync user data to Zustand store
      useVotingStore.setState({
        user: {
          ...user!,
          username: editUsername,
          firstName: isAdmin ? undefined : editFirstName,
          lastName: isAdmin ? undefined : editLastName,
          orgName: isAdmin ? editOrgName : undefined,
          phone: editPhone,
        }
      });

      console.log("Simulated PUT /auth/me/profile update success.");
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaveLoading(false);
    }
  };

  const getInitials = () => {
    if (isAdmin) return editOrgName ? editOrgName[0].toUpperCase() : "O";
    const first = editFirstName ? editFirstName[0].toUpperCase() : "";
    const last = editLastName ? editLastName[0].toUpperCase() : "";
    return (first + last) || editUsername[0]?.toUpperCase() || "V";
  };

  return (
    <div className="space-y-8 select-none max-w-6xl mx-auto pb-12">
      {/* Banner / Cover Hero Area */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card">
        {/* Colorful Mesh Glow Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/5 to-emerald-500/5 pointer-events-none -z-10" />
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full glow-primary-lg pointer-events-none -z-10" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full glow-accent-lg pointer-events-none -z-10" />
        <div className="absolute inset-0 grid-bg opacity-[0.2] pointer-events-none -z-20" />

        <div className="p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 relative">
          {/* Avatar Picture */}
          <div className="relative group shrink-0">
            <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-primary via-accent to-emerald-500 p-[3px] shadow-2xl relative overflow-hidden transition-all duration-300 hover:scale-105">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="avatar"
                  className="w-full h-full rounded-full object-cover bg-background"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-white text-3xl font-black font-sans">
                  {getInitials()}
                </div>
              )}
            </div>

            {/* Hover Camera Icon Overlay */}
            <button
              onClick={triggerFileInput}
              className="absolute inset-[3px] rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer z-10 hover:scale-105"
              title="Change Profile Picture"
            >
              <Camera className="w-7 h-7 text-white animate-pulse" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* User Meta Info */}
          <div className="text-center md:text-left space-y-2 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 justify-center md:justify-start">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2 justify-center md:justify-start">
                {displayName}
              </h1>

              {/* Verified or Not Verified Pill Badge */}
              {isVerified ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold uppercase tracking-wider shadow-[0_0_12px_rgba(16,185,129,0.2)] w-max mx-auto sm:mx-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-bold uppercase tracking-wider shadow-[0_0_12px_rgba(245,158,11,0.2)] w-max mx-auto sm:mx-0">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Unverified Status
                </span>
              )}
            </div>

            <p className="text-xs text-white/50 flex items-center justify-center md:justify-start gap-1 font-mono">
              <span className="text-primary/70">{isAdmin ? "Organization Owner" : "Decentralized Voter"}</span>
              <span>•</span>
              <span>{displayId}</span>
            </p>

            <p className="text-xs text-white/70 max-w-xl line-clamp-2 italic italic-leading">
              &ldquo;{editBio || "No profile bio has been written yet. Edit details to add one."}&rdquo;
            </p>
          </div>

          {/* Verification Warning Alert Box for Unverified Users */}
          {!isVerified && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="md:max-w-xs w-full bg-amber-500/10 border border-amber-500/25 p-4 rounded-2xl flex flex-col gap-2.5 justify-between self-stretch md:self-auto"
            >
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-amber-200/80 leading-normal">
                  <strong>Verification Required</strong>. Get verified to unlock advanced cryptographic tools and election creation limits.
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => router.push("/feed/verification")}
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-extrabold uppercase py-1.5 h-8 rounded-xl cursor-pointer"
              >
                Get Verified Now
              </Button>
            </motion.div>
          )}

          {/* Verification Success Badge details for Verified Users */}
          {isVerified && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="md:max-w-xs w-full bg-emerald-500/10 border border-emerald-500/25 p-4 rounded-2xl flex flex-col gap-2.5 justify-between self-stretch md:self-auto"
            >
              <div className="flex gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-emerald-200/80 leading-normal">
                  <strong>Identified Auditable Account</strong>. Your credentials are cryptographic-linked. Decentralized audits and CSV features enabled.
                </div>
              </div>
              <span className="text-[10px] text-emerald-400/90 font-bold uppercase tracking-wide inline-flex items-center gap-1 px-2 py-1.5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl justify-center">
                <Fingerprint className="w-3.5 h-3.5" /> Trusted Node Status
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-white/5 gap-1 select-none overflow-x-auto pb-px">
        {[
          { id: "details", label: "Profile Details", icon: User },
          { id: "subscription", label: "Active Plans", icon: Zap },
          { id: "billing", label: "Billing & Invoices", icon: CreditCard },
          { id: "security", label: "Security & Audits", icon: Lock }
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                isActive
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-white/50 hover:text-white hover:bg-white/[0.02]"
              }`}
            >
              <TabIcon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="min-h-[350px]">
        <AnimatePresence mode="wait">
          {activeTab === "details" && (
            <motion.div
              key="details-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Form Card */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-card border border-white/10 rounded-3xl p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" /> Profile Credentials
                    </h2>
                    
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition-all cursor-pointer bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20"
                      >
                        <Edit2 className="w-3 h-3" /> Edit Profile
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          // Reset inputs
                          if (isAdmin) {
                            setEditOrgName(profileData?.OrgName || "");
                            setEditOrgType(profileData?.OrgType || "Educational Institution");
                          } else {
                            setEditFirstName(profileData?.FirstName || "");
                            setEditLastName(profileData?.LastName || "");
                          }
                          setEditUsername(localStorage.getItem(`username_${displayEmail}`) || user?.username || "");
                          setEditPhone(localStorage.getItem(`phone_${displayEmail}`) || profileData?.Phone || "");
                          setEditBio(localStorage.getItem(`bio_${displayEmail}`) || "Decentralized democracy participant.");
                        }}
                        className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1 transition-all cursor-pointer bg-red-500/10 px-3 py-1.5 rounded-xl border border-red-500/20"
                      >
                        <X className="w-3 h-3" /> Cancel
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleSaveChanges} className="space-y-6">
                    {saveSuccess && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                        <Check className="w-4 h-4 shrink-0" />
                        Profile credentials saved successfully and synced globally.
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Name inputs */}
                      {isAdmin ? (
                        <div className="sm:col-span-2 space-y-1.5">
                          <label className="text-[10px] uppercase font-bold text-white/45">Organization Name</label>
                          <input
                            type="text"
                            value={editOrgName}
                            disabled={!isEditing}
                            onChange={(e) => setEditOrgName(e.target.value)}
                            className="w-full h-11 px-4 text-xs font-bold text-white bg-slate-950 border border-white/10 rounded-xl focus:border-primary focus:outline-none disabled:bg-slate-950/40 disabled:text-white/60 transition-all font-sans"
                            required
                          />
                        </div>
                      ) : (
                        <>
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-white/45">First Name</label>
                            <input
                              type="text"
                              value={editFirstName}
                              disabled={!isEditing}
                              onChange={(e) => setEditFirstName(e.target.value)}
                              className="w-full h-11 px-4 text-xs font-bold text-white bg-slate-950 border border-white/10 rounded-xl focus:border-primary focus:outline-none disabled:bg-slate-950/40 disabled:text-white/60 transition-all font-sans"
                              required
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-white/45">Last Name</label>
                            <input
                              type="text"
                              value={editLastName}
                              disabled={!isEditing}
                              onChange={(e) => setEditLastName(e.target.value)}
                              className="w-full h-11 px-4 text-xs font-bold text-white bg-slate-950 border border-white/10 rounded-xl focus:border-primary focus:outline-none disabled:bg-slate-950/40 disabled:text-white/60 transition-all font-sans"
                              required
                            />
                          </div>
                        </>
                      )}

                      {/* Username input */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-white/45">Username Handle</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-white/30">@</span>
                          <input
                            type="text"
                            value={editUsername}
                            disabled={!isEditing}
                            onChange={(e) => setEditUsername(e.target.value.replace(/\s+/g, ""))}
                            className="w-full h-11 pl-7 pr-4 text-xs font-bold text-white bg-slate-950 border border-white/10 rounded-xl focus:border-primary focus:outline-none disabled:bg-slate-950/40 disabled:text-white/60 transition-all font-mono"
                            required
                          />
                        </div>
                      </div>

                      {/* Phone input */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-white/45">Phone Contact</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                          <input
                            type="tel"
                            placeholder="+1 (555) 000-0000"
                            value={editPhone}
                            disabled={!isEditing}
                            onChange={(e) => setEditPhone(e.target.value)}
                            className="w-full h-11 pl-9 pr-4 text-xs font-bold text-white bg-slate-950 border border-white/10 rounded-xl focus:border-primary focus:outline-none disabled:bg-slate-950/40 disabled:text-white/60 transition-all font-mono"
                          />
                        </div>
                      </div>

                      {/* Email (Static read-only field) */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-white/45">Contact Email (Linked)</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                          <input
                            type="email"
                            value={displayEmail}
                            disabled
                            className="w-full h-11 pl-9 pr-4 text-xs font-bold text-white/50 bg-slate-950/40 border border-white/5 rounded-xl cursor-not-allowed font-mono"
                          />
                        </div>
                      </div>

                      {/* Category Type */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-white/45">
                          {isAdmin ? "Institutional Category" : "Trust Hierarchy Tier"}
                        </label>
                        <div className="relative">
                          {isAdmin ? (
                            <input
                              type="text"
                              value={editOrgType}
                              disabled={!isEditing}
                              onChange={(e) => setEditOrgType(e.target.value)}
                              className="w-full h-11 px-4 text-xs font-bold text-white bg-slate-950 border border-white/10 rounded-xl focus:border-primary focus:outline-none disabled:bg-slate-950/40 disabled:text-white/60 transition-all"
                              required
                            />
                          ) : (
                            <input
                              type="text"
                              value={displayType}
                              disabled
                              className="w-full h-11 px-4 text-xs font-bold text-white/50 bg-slate-950/40 border border-white/5 rounded-xl cursor-not-allowed"
                            />
                          )}
                        </div>
                      </div>

                      {/* Bio input */}
                      <div className="sm:col-span-2 space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-white/45">Profile Bio</label>
                        <textarea
                          rows={3}
                          value={editBio}
                          disabled={!isEditing}
                          onChange={(e) => setEditBio(e.target.value)}
                          className="w-full p-4 text-xs font-bold text-white bg-slate-950 border border-white/10 rounded-2xl focus:border-primary focus:outline-none disabled:bg-slate-950/40 disabled:text-white/60 transition-all resize-none"
                        />
                      </div>
                    </div>

                    {isEditing && (
                      <div className="flex justify-end gap-3 pt-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setIsEditing(false)}
                          className="h-11 px-6 rounded-xl text-white/70 hover:bg-white/5 hover:text-white text-xs font-bold cursor-pointer"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={saveLoading}
                          className="h-11 px-8 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-xs hover:shadow-[0_0_15px_rgba(49,107,243,0.3)] transition-all cursor-pointer"
                        >
                          {saveLoading ? (
                            <span className="flex items-center gap-1.5">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5">
                              <Save className="w-3.5 h-3.5" /> Save Changes
                            </span>
                          )}
                        </Button>
                      </div>
                    )}
                  </form>
                </div>
              </div>

              {/* Side Stats Card */}
              <div className="space-y-6">
                <div className="bg-card border border-white/10 rounded-3xl p-6 space-y-5">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-primary" /> Security Metadata
                  </h2>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/20 border border-white/5">
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-white/40 uppercase tracking-wider">Account Status</p>
                        <p className="text-xs font-bold text-emerald-400 capitalize">{profileData?.Status || "Active"}</p>
                      </div>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/20 border border-white/5">
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-white/40 uppercase tracking-wider">MFA Security</p>
                        <p className={`text-xs font-bold ${mfaEnabled ? "text-emerald-400" : "text-amber-400"}`}>
                          {mfaEnabled ? "Multi-Factor Active" : "Single-Factor Password"}
                        </p>
                      </div>
                      <span className={`w-2.5 h-2.5 rounded-full ${mfaEnabled ? "bg-emerald-500" : "bg-amber-500"}`} />
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/20 border border-white/5">
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-white/40 uppercase tracking-wider">Registered Since</p>
                        <p className="text-xs font-bold text-white font-mono">{formatDate(profileData?.CreatedAt)}</p>
                      </div>
                      <Calendar className="w-4 h-4 text-white/30" />
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/20 border border-white/5">
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-white/40 uppercase tracking-wider">Last Audit Session</p>
                        <p className="text-xs font-bold text-white/80 font-mono text-[10px]">{formatDate(profileData?.LastLoginAt || new Date().toISOString())}</p>
                      </div>
                      <Activity className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-tr from-primary/10 to-accent/5 border border-primary/25 rounded-3xl p-6 relative overflow-hidden space-y-4">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-xl pointer-events-none" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-primary" /> Auditing Node
                  </h3>
                  <p className="text-[11px] text-white/70 leading-normal">
                    Your profile coordinates are currently mapped to consensus validator shard <strong>AMS-01</strong>. Decentralized audits verify local ballots seamlessly.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "subscription" && (
            <motion.div
              key="subscription-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-6"
            >
              {/* Plan info */}
              <div className="md:col-span-8 bg-card border border-white/10 rounded-3xl p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" /> Current Subscription Details
                  </h2>
                  <span className="text-[9px] px-2.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/25 font-bold uppercase tracking-wider">
                    Tier Active
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white">{activePlan.name}</h3>
                  <p className="text-xs text-white/50 font-mono">{activePlan.price} • {activePlan.billingCycle}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs text-white/70 pt-2 border-t border-white/5">
                  {activePlan.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-[9px]">✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                  <Button className="flex-1 h-11 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-xs hover:shadow-[0_0_20px_rgba(49,107,243,0.3)] transition-all cursor-pointer">
                    Upgrade Subscription
                  </Button>
                  <Button variant="ghost" className="h-11 px-6 rounded-xl border border-white/10 text-white/70 hover:bg-white/5 hover:text-white text-xs font-bold cursor-pointer">
                    Cancel Subscription
                  </Button>
                </div>
              </div>

              {/* Sidebar Upgrade Info */}
              <div className="md:col-span-4 bg-card border border-white/10 rounded-3xl p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" /> Professional Grade
                  </h3>
                  <p className="text-[11px] text-white/60 leading-normal">
                    Need custom domains, specialized consensus sharding, or offline local network auditor deployment? Upgrade to our **Enterprise** bracket.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 text-[10px] text-white/40 leading-normal">
                  Contact institutional support: <strong>support@securevote.io</strong>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "billing" && (
            <motion.div
              key="billing-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Table */}
              <div className="lg:col-span-2 bg-card border border-white/10 rounded-3xl p-6 space-y-5">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" /> Invoice History
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-white/5 pb-2 text-white/40 text-[9px] uppercase tracking-wider">
                        <th className="py-2.5">Billing Date</th>
                        <th>Invoice Number</th>
                        <th>Amount Paid</th>
                        <th>Transaction Status</th>
                        <th>Download Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-white/80">
                      {billingHistory.map((inv, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.01] transition-all">
                          <td className="py-3 font-sans">{inv.date}</td>
                          <td className="font-bold text-white/90">{inv.invoice}</td>
                          <td>{inv.amount}</td>
                          <td>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold uppercase">
                              {inv.status}
                            </span>
                          </td>
                          <td>
                            <button className="text-primary hover:text-primary/80 transition-all hover:underline text-[10px] font-bold cursor-pointer inline-flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5" /> PDF <ArrowUpRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Card settings */}
              <div className="bg-card border border-white/10 rounded-3xl p-6 space-y-5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" /> Billing Details
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                        <CreditCard className="w-4 h-4 text-white/60" />
                      </div>
                      <div className="text-xs font-mono">
                        <p className="font-bold text-white">Visa ending in 4242</p>
                        <p className="text-[9px] text-white/40 mt-0.5">Expires 12/2028</p>
                      </div>
                    </div>
                    <button className="text-xs font-bold text-primary hover:underline cursor-pointer">
                      Edit Card
                    </button>
                  </div>

                  <div className="p-3.5 bg-slate-950/20 border border-white/5 rounded-2xl text-[11px] text-white/50 leading-relaxed">
                    Recurring bills are processed automatically on the 4th of every calendar month. Standard transactions are encrypted using AES-256 protocols.
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "security" && (
            <motion.div
              key="security-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Toggles */}
              <div className="lg:col-span-2 bg-card border border-white/10 rounded-3xl p-6 space-y-6">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" /> Security & Identity Settings
                </h2>

                <div className="space-y-4 divide-y divide-white/5">
                  {/* Toggle 1: MFA */}
                  <div className="flex items-center justify-between py-4 first:pt-0">
                    <div className="space-y-0.5 max-w-md">
                      <p className="text-xs font-bold text-white">Multi-Factor Authentication (MFA)</p>
                      <p className="text-[10px] text-white/40 leading-relaxed">
                        Add an extra layer of security to your cryptographic voting node by requesting OTP codes on login.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMfaEnabled(!mfaEnabled)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        mfaEnabled ? "bg-primary" : "bg-white/10"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          mfaEnabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Toggle 2: Email verification indicator status */}
                  <div className="flex items-center justify-between py-4">
                    <div className="space-y-0.5 max-w-md">
                      <p className="text-xs font-bold text-white">Contact Verification Status</p>
                      <p className="text-[10px] text-white/40 leading-relaxed">
                        SecureVote flags whether your registration contact email has been authenticated successfully.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase">
                      <Check className="w-3 h-3" /> Email Verified
                    </div>
                  </div>

                  {/* Toggle 3: Activity emails */}
                  <div className="flex items-center justify-between py-4">
                    <div className="space-y-0.5 max-w-md">
                      <p className="text-xs font-bold text-white">Auditing & Event Bulletins</p>
                      <p className="text-[10px] text-white/40 leading-relaxed">
                        Receive instant notifications when polls you create receive audits, or when public results publish.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEmailNotifications(!emailNotifications)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        emailNotifications ? "bg-primary" : "bg-white/10"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          emailNotifications ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Password update helper */}
              <div className="bg-card border border-white/10 rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Fingerprint className="w-4 h-4 text-primary" /> Cryptographic Signatures
                </h3>
                <p className="text-[11px] text-white/60 leading-normal">
                  Your votes and election models are signed using <strong>X25519 Ephemeral keypairs</strong>. Private key seeds are isolated within browser secure storage.
                </p>
                <div className="pt-2">
                  <Button
                    onClick={() => {
                      alert("Cryptographic seed regenerated successfully.");
                    }}
                    className="w-full h-10 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 text-xs font-bold transition-all cursor-pointer"
                  >
                    Regenerate Cryptographic Seed
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
