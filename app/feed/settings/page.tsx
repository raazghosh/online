"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  Lock,
  User,
  Bell,
  ShieldCheck,
  CheckCircle,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVotingStore } from "@/store/useVotingStore";

export default function SettingsPage() {
  const router = useRouter();
  const { user, isInitialized } = useVotingStore();
  const [activeTab, setActiveTab] = useState<"account" | "security" | "notifications">("account");

  // Account form states
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Security states
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [activeSessions, setActiveSessions] = useState([
    { device: "Chrome / Windows 11 (Current)", ip: "103.44.112.5", time: "Active now" },
    { device: "Safari / iPhone 15 Pro", ip: "192.168.1.42", time: "2 hours ago" }
  ]);

  // Notifications states
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [pushAlerts, setPushAlerts] = useState(true);

  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      setEmail(user.email);
      setUsername(user.username);
      setPhone(user.phone || "");
    }
  }, [user, isInitialized, router]);

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Persist username and phone keyed by the current user's email
    if (user?.email) {
      localStorage.setItem(`username_${user.email}`, username);
      localStorage.setItem(`phone_${user.email}`, phone);
    }
    setSuccessMsg("Account profile updated successfully.");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleSecuritySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("Security configuration updated.");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  if (!isInitialized) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none relative">
      {/* Header */}
      <div className="border-b border-white/5 pb-5">
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Settings className="text-primary w-6 h-6" /> Settings
        </h1>
        <p className="text-xs text-white/50">Manage profile data, verification methods, and system notifications.</p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center gap-2.5 text-xs">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 bg-white/5 border border-white/10 rounded-2xl p-2.5 backdrop-blur-sm space-y-1">
          {[
            { id: "account", label: "Account Profile", icon: User },
            { id: "security", label: "Security & 2FA", icon: Lock },
            { id: "notifications", label: "System Notifications", icon: Bell }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-left text-xs font-semibold transition-all ${
                  isActive ? "bg-primary/20 text-white font-bold border-l-2 border-primary" : "text-white/50 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab content panel */}
        <div className="lg:col-span-9 bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-sm">
          {activeTab === "account" && (
            <form onSubmit={handleAccountSubmit} className="space-y-6">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-primary" /> Profile settings
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/70">Username</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/70">Official Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-primary focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/70">Mobile number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-end">
                <Button type="submit" className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs">
                  Save Changes
                </Button>
              </div>
            </form>
          )}

          {activeTab === "security" && (
            <form onSubmit={handleSecuritySubmit} className="space-y-6">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" /> Password & Security Key
              </h2>

              <div className="space-y-4">
                {/* 2FA Toggle */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.01] border border-white/5">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white">Multi-factor Authentication (2FA)</p>
                    <p className="text-[10px] text-white/40 max-w-sm">
                      Require verification code from authenticator app for signing actions or logins.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={twoFactorEnabled}
                      onChange={e => setTwoFactorEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {/* Session list */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold text-white/70">Active Browser Sessions</h3>
                  <div className="space-y-2">
                    {activeSessions.map((session, i) => (
                      <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-white/[0.01] border border-white/5 text-[10px]">
                        <div className="space-y-0.5">
                          <p className="font-bold text-white/80">{session.device}</p>
                          <p className="text-white/30 font-mono">IP: {session.ip}</p>
                        </div>
                        <span className="text-white/40">{session.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </form>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" /> Notifications customization
              </h2>

              <div className="space-y-4">
                {[
                  { label: "Email Alerts", val: emailAlerts, setter: setEmailAlerts, desc: "Receive ballot receipts and audit completions." },
                  { label: "SMS Alerts", val: smsAlerts, setter: setSmsAlerts, desc: "Receive MFA codes and instant notifications." },
                  { label: "Web Push Notifications", val: pushAlerts, setter: setPushAlerts, desc: "Real-time validator sync alerts and reminders." }
                ].map((item, idx) => (
                  <label key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.01] border border-white/5 cursor-pointer">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white">{item.label}</p>
                      <p className="text-[10px] text-white/40">{item.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={item.val}
                      onChange={e => item.setter(e.target.checked)}
                      className="rounded border-white/10 bg-white/5 text-primary focus:ring-0 cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
