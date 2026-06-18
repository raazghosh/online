"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  Vote,
  BarChart3,
  ShieldCheck,
  Building,
  Users,
  Settings,
  LogOut,
  Bell,
  Search,
  ChevronDown,
  Menu,
  X,
  Sun,
  Moon,
  Laptop,
  Check,
  Lock,
  User,
  ShieldAlert,
  Loader2
} from "lucide-react";
import { useVotingStore } from "@/store/useVotingStore";
import { Button } from "@/components/ui/button";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { motion, AnimatePresence } from "framer-motion";

export default function FeedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isInitialized, initializeSession } = useVotingStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // UX States
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isOrgSwitcherOpen, setIsOrgSwitcherOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState("Voter Account");

  // Mock Notifications
  const [notifications, setNotifications] = useState([
    { id: 1, text: "New election 'Tech Council 2026' created", time: "5 mins ago", read: false },
    { id: 2, text: "Identity verification approved by node AMS-01", time: "2 hours ago", read: false },
    { id: 3, text: "Results published for 'Spring Survey'", time: "1 day ago", read: true },
    { id: 4, text: "Team member 'Sarah Connor' assigned Admin role", time: "2 days ago", read: true },
  ]);

  useEffect(() => {
    setMounted(true);
    if (!isInitialized) {
      initializeSession();
    }
  }, [isInitialized, initializeSession]);

  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
    }
  }, [isInitialized, user, router]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // Prevent flash of protected layout content if unauthenticated or during initial session boot
  if (!mounted || !isInitialized || !user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm font-mono text-foreground/60">Verifying secure session...</p>
      </div>
    );
  }

  const navItems = [
    { label: "Dashboard", href: "/feed", icon: LayoutDashboard },
    { label: "Elections", href: "/feed/elections", icon: Vote },
    { label: "Polls", href: "/feed/polls", icon: BarChart3 },
    { label: "Verification", href: "/feed/verification", icon: ShieldCheck },
    { label: "Organization", href: "/feed/profile", icon: Building },
    { label: "Team Members", href: "/feed/team", icon: Users },
    { label: "Settings", href: "/feed/settings", icon: Settings },
  ];


  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative min-h-screen bg-background text-foreground flex select-none overflow-x-hidden">
      {/* Glow Effects */}
      <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-primary/5 via-accent/2 to-transparent pointer-events-none -z-10" />
      <div className="absolute top-[30%] left-[-10%] w-[35vw] h-[35vw] rounded-full bg-primary/3 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-[10%] right-[-10%] w-[35vw] h-[35vw] rounded-full bg-accent/3 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute inset-0 grid-bg opacity-[0.25] pointer-events-none -z-20" />

      {/* Sidebar Frame */}
      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-border bg-card/40 backdrop-blur-xl shrink-0 hidden lg:flex flex-col justify-between py-6 sticky top-0 h-screen z-30">
        <div className="space-y-8">
          {/* Logo */}
          <div className="px-6 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-sans font-bold text-lg tracking-tight">
              Secure<span className="text-primary">Vote</span>
            </span>
          </div>

          {/* Org Switcher */}
          <div className="px-4 relative">
            <button
              onClick={() => setIsOrgSwitcherOpen(!isOrgSwitcherOpen)}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-surface border border-border hover:bg-foreground/10 hover:border-border/80 transition-all text-left text-xs font-semibold"
            >
              <div className="flex items-center gap-2.5 truncate">
                <div className="relative w-6 h-6 shrink-0">
                  <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30 text-[10px] font-bold text-primary">
                    {selectedOrg[0]?.toUpperCase() || "V"}
                  </div>
                  {user?.isVerified && (
                    <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-background shadow-[0_0_4px_rgba(16,185,129,0.6)] flex items-center justify-center" title="Verified" />
                  )}
                </div>
                <span className="truncate">{selectedOrg}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 opacity-60 shrink-0 ml-1" />
            </button>

            {isOrgSwitcherOpen && (
              <div className="absolute left-4 right-4 top-full mt-2 bg-card border border-border rounded-2xl p-2 shadow-2xl z-40 space-y-1">
                {["Voter Account", "SecureVote Org", "University Board"].map((orgName) => (
                  <button
                    key={orgName}
                    onClick={() => {
                      setSelectedOrg(orgName);
                      setIsOrgSwitcherOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-all ${
                      selectedOrg === orgName ? "bg-primary/20 text-primary font-bold" : "text-foreground/60 hover:bg-surface hover:text-foreground"
                    }`}
                  >
                    <span>{orgName}</span>
                    {selectedOrg === orgName && <Check className="w-3.5 h-3.5 text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Nav Items */}
          <nav className="px-3 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");

              return (
                <button
                  key={item.label}
                  onClick={() => router.push(item.href)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-primary/10 border border-primary/20 text-primary shadow-[0_4px_15px_rgba(49,107,243,0.1)]"
                      : "border border-transparent text-foreground/50 hover:bg-surface hover:text-foreground"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-primary animate-pulse" : "text-foreground/50"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info & Logout */}
        <div className="px-3 space-y-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-foreground/[0.01] to-foreground/[0.04] border border-border space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-foreground/70 uppercase tracking-widest">Network Verified</span>
            </div>
            <p className="text-[10px] text-foreground/40 leading-normal">
              Consensus Node AMS-01 active. Latency 14ms.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer (Toggled by Hamburger Menu) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 w-64 border-r border-border bg-card z-50 flex flex-col justify-between py-6 lg:hidden"
            >
              <div className="space-y-8">
                {/* Header Logo */}
                <div className="px-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-sans font-bold text-base tracking-tight">SecureVote</span>
                  </div>
                  <button onClick={() => setIsSidebarOpen(false)} className="text-foreground/60 hover:text-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Nav Items */}
                <nav className="px-3 space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");

                    return (
                      <button
                        key={item.label}
                        onClick={() => {
                          router.push(item.href);
                          setIsSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                          isActive
                            ? "bg-primary/10 border border-primary/20 text-primary"
                            : "border border-transparent text-foreground/50 hover:bg-surface hover:text-foreground"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Logout */}
              <div className="px-3">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-border bg-background/60 backdrop-blur-xl px-4 lg:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            {/* Hamburger Button for mobile */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-surface border border-border text-foreground hover:bg-foreground/10"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Search Bar */}
            <div className="relative group max-w-xs hidden sm:block">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40 group-focus-within:text-primary transition-all" />
              <input
                type="text"
                placeholder="Search elections, audits, logs..."
                className="w-64 h-10 pl-10 pr-4 rounded-xl bg-surface border border-border text-xs placeholder-foreground/30 focus:bg-foreground/10 focus:border-primary focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-surface border border-border hover:bg-foreground/10 transition-all cursor-pointer text-foreground/80"
              title="Toggle Theme"
            >
              {mounted ? (
                theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  setIsProfileOpen(false);
                }}
                className="p-2.5 rounded-xl bg-surface border border-border hover:bg-foreground/10 transition-all cursor-pointer text-foreground/80 relative"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-card border border-border rounded-2xl p-4 shadow-2xl z-40 space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <h3 className="text-xs font-bold">Notifications</h3>
                    <button
                      onClick={() =>
                        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
                      }
                      className="text-[10px] font-semibold text-primary hover:underline"
                    >
                      Mark all as read
                    </button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-foreground/40 text-center py-4">No notifications</p>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          className={`p-2.5 rounded-xl border text-xs transition-all relative ${
                            n.read ? "bg-foreground/[0.01] border-border text-foreground/60" : "bg-primary/5 border-primary/20 text-foreground font-medium"
                          }`}
                        >
                          <p>{n.text}</p>
                          <span className="text-[9px] text-white/30 mt-1 block">{n.time}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="w-[1px] h-6 bg-border mx-1" />

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsNotificationsOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface border border-border hover:bg-foreground/10 hover:border-border/80 transition-all cursor-pointer"
              >
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="avatar" className="w-6 h-6 rounded-lg object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-xs font-extrabold text-white">
                    {user?.username ? user.username[0].toUpperCase() : "U"}
                  </div>
                )}
                <div className="text-left hidden sm:block">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[11px] font-bold tracking-tight text-foreground leading-tight">
                      {user?.username || "Demo User"}
                    </p>
                    <VerifiedBadge isVerified={user?.isVerified} size="xs" showLabel={false} />
                  </div>
                  <p className="text-[9px] text-foreground/40 leading-none">
                    {user?.role === "admin" ? "Organization Owner" : "Decentralized Voter"}
                  </p>
                </div>
                <ChevronDown className="w-3 h-3 text-foreground/40" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-card border border-border rounded-2xl p-2 shadow-2xl z-40 space-y-1">
                  <div className="px-3 py-2 border-b border-border mb-1 text-left">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-xs font-bold text-foreground truncate">{user?.username || "Demo User"}</p>
                      <VerifiedBadge isVerified={user?.isVerified} size="xs" />
                    </div>
                    <p className="text-[10px] text-foreground/40 truncate mt-0.5">{user?.email || "voter@securevote.io"}</p>
                  </div>
                  <button
                    onClick={() => {
                      router.push("/feed/settings");
                      setIsProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs text-foreground/70 hover:bg-surface hover:text-foreground"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>My Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      router.push("/feed/settings");
                      setIsProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs text-foreground/70 hover:bg-surface hover:text-foreground"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Account Settings</span>
                  </button>
                  <div className="border-t border-border my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs text-red-400 hover:bg-red-500/10"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
