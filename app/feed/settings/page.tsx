"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  Settings,
  User,
  CheckCircle,
  Loader2,
  AlertCircle,
  Camera,
  Trash2,
  Github,
  Twitter,
  Linkedin,
  Instagram,
  Globe,
  Smartphone,
  History,
  Lock
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useVotingStore } from "@/store/useVotingStore";
import {
  apiGetSessions,
  apiRevokeSession,
  apiUpdateProfile,
  apiUpdateSocialLinks,
  apiDeleteAccount,
  apiUploadAvatar
} from "@/lib/api";

export default function SettingsPage() {
  const router = useRouter();
  const user = useVotingStore((state) => state.user);
  const isInitialized = useVotingStore((state) => state.isInitialized);
  const logout = useVotingStore((state) => state.logout);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tabs navigation: Keep only backend-supported functional tabs
  const [activeTab, setActiveTab] = useState<"identity" | "sessions" | "danger">("identity");
  
  // UI states
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Sessions state
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Deletion state
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletePassword, setDeletePassword] = useState("");

  // Social Links state (initialized from user)
  const [github, setGithub] = useState("");
  const [twitter, setTwitter] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [instagram, setInstagram] = useState("");
  const [website, setWebsite] = useState("");

  // React Hook Form for Profile Identity
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile
  } = useForm({
    defaultValues: {
      displayName: "",
      username: "",
      bio: ""
    }
  });

  // Initialize and synchronize states from Zustand store
  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      resetProfile({
        displayName: user.displayName || user.username || "",
        username: user.username || "",
        bio: user.bio || ""
      });
      setAvatarPreview(user.avatarUrl || null);

      // Map social links from user profile
      const gh = user.socialLinks?.find(l => l.platform === "github")?.handle || "";
      const tw = user.socialLinks?.find(l => l.platform === "twitter")?.handle || "";
      const li = user.socialLinks?.find(l => l.platform === "linkedin")?.handle || "";
      const insta = user.socialLinks?.find(l => l.platform === "instagram")?.handle || "";
      const web = user.socialLinks?.find(l => l.platform === "website")?.handle || "";
      setGithub(gh);
      setTwitter(tw);
      setLinkedin(li);
      setInstagram(insta);
      setWebsite(web);
    }
  }, [user, isInitialized, router, resetProfile]);

  // Load active browser/device sessions
  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await apiGetSessions();
      if (res && res.sessions) {
        setSessions(res.sessions);
      } else {
        setSessions([]);
      }
    } catch (err: any) {
      console.error("Failed to load active sessions", err);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (activeTab === "sessions" && user) {
      fetchSessions();
    }
  }, [activeTab, user]);

  const parseUserAgent = (ua: string) => {
    if (!ua) return "Unknown Browser / Device";
    let browser = "Browser";
    if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Safari")) browser = "Safari";
    else if (ua.includes("Edge")) browser = "Edge";
    else if (ua.includes("Opera")) browser = "Opera";

    let os = "Unknown OS";
    if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Macintosh") || ua.includes("Mac OS")) os = "macOS";
    else if (ua.includes("iPhone")) os = "iPhone";
    else if (ua.includes("iPad")) os = "iPad";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("Linux")) os = "Linux";

    return `${browser} on ${os}`;
  };

  // Profile submission handler
  const onProfileSave = async (data: any) => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      // 1. Call apiUpdateProfile (supported by backend for bio and username)
      await apiUpdateProfile({
        display_name: data.displayName,
        bio: data.bio
      });

      // 2. Persist to local storage for backward compatibility & mock sync
      if (user?.email) {
        localStorage.setItem(`username_${user.email}`, data.username);
        localStorage.setItem(`bio_${user.email}`, data.bio);
        localStorage.setItem(`display_name_${user.email}`, data.displayName);
      }

      // 3. Update Zustand Store user reference
      useVotingStore.setState({
        user: {
          ...user!,
          username: data.username,
          displayName: data.displayName,
          bio: data.bio
        }
      });

      setSuccessMsg("Account profile details updated successfully.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update profile settings.");
    } finally {
      setLoading(false);
    }
  };

  // Social Links submission handler
  const onSocialLinksSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const links = [
        { platform: "github", handle: github },
        { platform: "twitter", handle: twitter },
        { platform: "linkedin", handle: linkedin },
        { platform: "instagram", handle: instagram },
        { platform: "website", handle: website }
      ].filter(l => l.handle.trim() !== "");

      // Call apiUpdateSocialLinks (supported by backend)
      await apiUpdateSocialLinks(links);

      if (user?.email) {
        localStorage.setItem(`social_links_${user.email}`, JSON.stringify(links));
      }

      useVotingStore.setState({
        user: {
          ...user!,
          socialLinks: links
        }
      });

      setSuccessMsg("Social networks integration saved successfully.");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save social integrations.");
    } finally {
      setLoading(false);
    }
  };

  // Avatar Upload handler
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      setErrorMsg("Image file size should be less than 1MB");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      const res = await apiUploadAvatar(file);
      setAvatarPreview(res.avatar_url);

      if (user?.email) {
        localStorage.setItem(`avatar_${user.email}`, res.avatar_url);
      }

      useVotingStore.setState({
        user: {
          ...user!,
          avatarUrl: res.avatar_url
        }
      });
      setSuccessMsg("Profile photograph updated successfully.");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload avatar image.");
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const resetAvatar = () => {
    setAvatarPreview(null);
    if (user?.email) {
      localStorage.removeItem(`avatar_${user.email}`);
    }
    useVotingStore.setState({
      user: {
        ...user!,
        avatarUrl: undefined
      }
    });
    setSuccessMsg("Profile photograph reset to initials.");
  };

  // Sessions actions
  const handleRevokeSession = async (sessionId: string) => {
    try {
      await apiRevokeSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      setSuccessMsg("Active session revoked successfully.");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to revoke active session.");
    }
  };

  // Account deletion
  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmText !== "DELETE MY ACCOUNT") {
      setErrorMsg("Please enter the exact confirmation phrase");
      return;
    }
    if (!deletePassword) {
      setErrorMsg("Password confirmation is required to delete your account");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      // Call apiDeleteAccount (supported by backend)
      await apiDeleteAccount(deletePassword);
      
      // Clean local storage user files
      if (user?.email) {
        localStorage.removeItem(`username_${user.email}`);
        localStorage.removeItem(`phone_${user.email}`);
        localStorage.removeItem(`avatar_${user.email}`);
        localStorage.removeItem(`bio_${user.email}`);
        localStorage.removeItem(`display_name_${user.email}`);
        localStorage.removeItem(`social_links_${user.email}`);
      }
      
      await logout();
      router.push("/");
    } catch (err: any) {
      setErrorMsg(err.message || "Account deletion failed. Check your password credentials.");
      setLoading(false);
    }
  };

  const getInitials = () => {
    if (!user) return "U";
    if (user.role === "admin" && user.orgName) return user.orgName[0].toUpperCase();
    if (user.displayName) {
      const parts = user.displayName.split(" ");
      return parts.map(p => p[0]).join("").toUpperCase().slice(0, 2);
    }
    return user.username ? user.username[0].toUpperCase() : "U";
  };

  if (!isInitialized) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none relative max-w-6xl mx-auto pb-12">
      {/* Background glow filters */}
      <div className="absolute top-[-10%] left-[-10%] w-[30vw] h-[30vw] rounded-full glow-primary-lg pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30vw] h-[30vw] rounded-full glow-accent-lg pointer-events-none -z-10" />

      {/* Header Banner */}
      <div className="border-b border-white/5 pb-5">
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Settings className="text-primary w-6 h-6" /> Account Settings
        </h1>
        <p className="text-xs text-white/50">Manage profile data, active secure login sessions, and social connections integrated directly with the backend database.</p>
      </div>

      {/* Alerts system */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center gap-2.5 text-xs">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span className="font-medium">{successMsg}</span>
          <button onClick={() => setSuccessMsg("")} className="ml-auto text-emerald-400 hover:text-emerald-300 font-bold px-1.5 cursor-pointer">×</button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center gap-2.5 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-medium">{errorMsg}</span>
          <button onClick={() => setErrorMsg("")} className="ml-auto text-red-400 hover:text-red-300 font-bold px-1.5 cursor-pointer">×</button>
        </div>
      )}

      {/* Navigation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 bg-card border border-white/10 rounded-2xl p-2.5 space-y-1">
          {[
            { id: "identity", label: "Profile Identity", icon: User },
            { id: "sessions", label: "Active Sessions", icon: History },
            { id: "danger", label: "Danger Zone", icon: Trash2 }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                  isActive 
                    ? "bg-primary/20 text-white font-bold border-l-2 border-primary shadow-[0_4px_12px_rgba(49,107,243,0.1)]" 
                    : "text-white/50 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-primary animate-pulse" : "text-white/50"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panels */}
        <div className="lg:col-span-9 bg-card border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 glow-primary-sm pointer-events-none" />

          {/* TAB 1: PROFILE IDENTITY */}
          {activeTab === "identity" && (
            <div className="space-y-8">
              
              {/* Profile Photo Upload section */}
              <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl bg-white/[0.01] border border-white/5">
                <div className="relative group shrink-0">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary via-accent to-emerald-500 p-[3px] shadow-2xl relative overflow-hidden transition-all duration-300 hover:scale-105">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="avatar"
                        className="w-full h-full rounded-full object-cover bg-background"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-white text-2xl font-black font-sans">
                        {getInitials()}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={triggerFileInput}
                    className="absolute inset-[3px] rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer z-10"
                    title="Upload image"
                  >
                    <Camera className="w-6 h-6 text-white animate-pulse" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                <div className="text-center sm:text-left space-y-2">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Profile Photograph</h3>
                  <p className="text-[10px] text-white/40 max-w-xs leading-normal">
                    JPG, PNG, or WebP. Max size of 1MB. Drop files on the cursor icon or choose local drive directories.
                  </p>
                  <div className="flex gap-2 justify-center sm:justify-start pt-1">
                    <button
                      onClick={triggerFileInput}
                      className="px-3.5 py-1.5 bg-primary hover:bg-primary/85 text-white font-bold text-[10px] rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-md shadow-primary/20"
                    >
                      <Camera className="w-3 h-3" /> Upload New
                    </button>
                    {avatarPreview && (
                      <button
                        onClick={resetAvatar}
                        className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-red-400 font-bold text-[10px] rounded-xl border border-white/5 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Details Form */}
              <form onSubmit={handleProfileSubmit(onProfileSave)} className="space-y-6">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-2">
                  <User className="w-4 h-4 text-primary" /> Profile Credentials
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-white/60">Display Name</label>
                    <input
                      type="text"
                      {...registerProfile("displayName", {
                        required: "Display name is required",
                        minLength: { value: 2, message: "Display name must be at least 2 characters" },
                        maxLength: { value: 50, message: "Display name cannot exceed 50 characters" }
                      })}
                      className={`w-full h-11 px-4 rounded-xl bg-white/5 border ${profileErrors.displayName ? "border-red-500/50" : "border-white/10"} text-white text-xs focus:border-primary focus:outline-none transition-all font-sans`}
                      placeholder="e.g. John Doe"
                    />
                    {profileErrors.displayName && (
                      <p className="text-[9px] text-red-400">{profileErrors.displayName.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-white/60">Username handle</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-white/30">@</span>
                      <input
                        type="text"
                        {...registerProfile("username", {
                          required: "Username is required",
                          minLength: { value: 3, message: "Username must be at least 3 characters" },
                          maxLength: { value: 30, message: "Username cannot exceed 30 characters" },
                          validate: (v) => /^[a-zA-Z0-9_]+$/.test(v) || "Username can only contain letters, numbers, and underscores"
                        })}
                        className={`w-full h-11 pl-7 pr-4 rounded-xl bg-white/5 border ${profileErrors.username ? "border-red-500/50" : "border-white/10"} text-white text-xs focus:border-primary focus:outline-none transition-all font-mono`}
                        placeholder="username"
                      />
                    </div>
                    {profileErrors.username && (
                      <p className="text-[9px] text-red-400">{profileErrors.username.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-white/60">Official Email</label>
                    <input
                      type="email"
                      disabled
                      value={user?.email || ""}
                      className="w-full h-11 px-4 rounded-xl bg-slate-950/40 border border-white/5 text-white/40 text-xs cursor-not-allowed font-mono"
                    />
                    <p className="text-[9px] text-white/35 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5 text-primary" /> Static linked address (Not mutable)
                    </p>
                  </div>


                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-white/60">Biography description</label>
                    <textarea
                      rows={3}
                      {...registerProfile("bio", {
                        maxLength: { value: 200, message: "Bio cannot exceed 200 characters" }
                      })}
                      className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white text-xs focus:border-primary focus:outline-none transition-all resize-none font-sans"
                      placeholder="Share a short summary about your roles or organizations..."
                    />
                    {profileErrors.bio && (
                      <p className="text-[9px] text-red-400">{profileErrors.bio.message}</p>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex justify-end">
                  <Button type="submit" disabled={loading} className="px-6 py-2.5 rounded-xl bg-primary text-white font-extrabold text-xs cursor-pointer shadow-lg shadow-primary/10">
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Profile"}
                  </Button>
                </div>
              </form>

              {/* Social Links Panel */}
              <form onSubmit={onSocialLinksSave} className="space-y-6 pt-4 border-t border-white/5">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-2">
                  <Globe className="w-4 h-4 text-primary" /> Social Networks Integration
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-white/60 flex items-center gap-1.5">
                      <Github className="w-3.5 h-3.5" /> GitHub
                    </label>
                    <input
                      type="text"
                      value={github}
                      onChange={(e) => setGithub(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-primary focus:outline-none transition-all font-mono"
                      placeholder="github-username"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-white/60 flex items-center gap-1.5">
                      <Twitter className="w-3.5 h-3.5" /> Twitter / X
                    </label>
                    <input
                      type="text"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-primary focus:outline-none transition-all font-mono"
                      placeholder="twitter-handle"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-white/60 flex items-center gap-1.5">
                      <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                    </label>
                    <input
                      type="text"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-primary focus:outline-none transition-all font-mono"
                      placeholder="linkedin-profile"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-white/60 flex items-center gap-1.5">
                      <Instagram className="w-3.5 h-3.5" /> Instagram
                    </label>
                    <input
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-primary focus:outline-none transition-all font-mono"
                      placeholder="instagram-handle"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-white/60 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" /> Personal Website
                    </label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-primary focus:outline-none transition-all font-mono"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex justify-end">
                  <Button type="submit" disabled={loading} className="px-6 py-2.5 rounded-xl bg-primary text-white font-extrabold text-xs cursor-pointer shadow-lg shadow-primary/10">
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Social Links"}
                  </Button>
                </div>
              </form>

            </div>
          )}

          {/* TAB 2: ACTIVE SESSIONS */}
          {activeTab === "sessions" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" /> Active Login Sessions
                </h2>
              </div>

              {loadingSessions ? (
                <div className="flex items-center gap-2 text-white/40 text-[10px] py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>Querying active login sessions...</span>
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-[10px] text-white/40 py-2">No other active sessions found.</p>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => {
                    // Current session checking: robust client-side check matching either id flag or current browser UA
                    const isCurrent = session.id.includes("current") || 
                                      (typeof window !== "undefined" && session.user_agent === window.navigator.userAgent);
                    return (
                      <div key={session.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-2xl bg-white/[0.01] border border-white/5 gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-primary" />
                            <p className="text-xs font-bold text-white/95">{parseUserAgent(session.user_agent)}</p>
                            {isCurrent && (
                              <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/25">CURRENT DEVICE</span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-white/35 font-mono">
                            <span>IP: {session.ip_address}</span>
                            {session.city && (
                              <>
                                <span>•</span>
                                <span>Location: {session.city}, {session.country}</span>
                              </>
                            )}
                            <span>•</span>
                            <span>Active: {new Date(session.last_seen_at).toLocaleString()}</span>
                          </div>
                        </div>
                        {!isCurrent ? (
                          <button
                            onClick={() => handleRevokeSession(session.id)}
                            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:text-red-300 rounded-xl text-[10px] font-bold transition-all cursor-pointer w-full sm:w-auto text-center"
                          >
                            Revoke Shard
                          </button>
                        ) : (
                          <span className="text-[10px] text-white/30 font-semibold italic select-none px-3">Active session</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DANGER ZONE */}
          {activeTab === "danger" && (
            <div className="space-y-6">
              <h2 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-2 border-b border-red-500/10 pb-2">
                <Trash2 className="w-4 h-4 text-red-500" /> Danger Zone
              </h2>

              <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/10 space-y-4">
                <div className="space-y-1.5">
                  <h3 className="text-xs font-bold text-white">Permanently Delete Account</h3>
                  <p className="text-[10px] text-white/40 leading-relaxed">
                    Once clicked, your cryptographic key hashes, Aadhaar verified links, created polls, and voting receipts are scheduled for permanent deletion.
                    This process is irreversible. Standard sharding nodes will reject consensus logging for your user ID immediately.
                  </p>
                </div>

                {/* Account Deletion confirmation form */}
                <form onSubmit={handleDeleteAccount} className="space-y-4 pt-2 border-t border-white/5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/60">
                      Type <span className="font-mono text-red-400 font-extrabold select-all">DELETE MY ACCOUNT</span> to confirm:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Type confirmation phrase..."
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      className="w-full h-10 px-4 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-red-500 focus:outline-none transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/60">Enter account password to verify:</label>
                    <input
                      type="password"
                      required
                      placeholder="Password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      className="w-full h-10 px-4 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-red-500 focus:outline-none transition-all font-mono"
                    />
                  </div>

                  <div className="pt-2 flex justify-start">
                    <button
                      type="submit"
                      disabled={loading || deleteConfirmText !== "DELETE MY ACCOUNT"}
                      className="px-5 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-xs rounded-xl shadow-lg shadow-red-500/10 cursor-pointer flex items-center gap-1.5"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-3.5 h-3.5" /> Permanently Delete My Account
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
