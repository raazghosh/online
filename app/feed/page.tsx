"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Vote,
  Users,
  CheckSquare,
  Activity,
  PlusCircle,
  Upload,
  UserPlus,
  Download,
  Calendar,
  ChevronRight,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useVotingStore } from "@/store/useVotingStore";
import { Button } from "@/components/ui/button";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { apiGetPoll, apiGetResults, apiGetPolls } from "@/lib/api";

export default function FeedDashboard() {
  const router = useRouter();
  const user = useVotingStore((state) => state.user);
  const createdPollIds = useVotingStore((state) => state.createdPollIds);
  const votedPollIds = useVotingStore((state) => state.votedPollIds);
  const isInitialized = useVotingStore((state) => state.isInitialized);
  const initializeSession = useVotingStore((state) => state.initializeSession);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [elections, setElections] = useState<any[]>([]);

  // Mock Notification logs
  const notificationLogs = [
    { id: 1, text: "Election validator handshake complete.", time: "10 mins ago", type: "system" },
    { id: 2, text: "ZK Identity proof registered on consensus nodes.", time: "1 hour ago", type: "verify" },
    { id: 3, text: "Audit log synchronization active.", time: "3 hours ago", type: "system" },
  ];

  useEffect(() => {
    setMounted(true);
    if (!isInitialized) {
      initializeSession();
    }
  }, [isInitialized, initializeSession]);

  useEffect(() => {
    if (!isInitialized || !user) return;

    const loadPolls = async () => {
      setLoading(true);
      try {
        const res = await apiGetPolls({ scope: "feed", limit: 20 });
        const list = res.data || [];
        
        // Step 1: Set basic poll info instantly to render listing immediately
        const initialElections = list.map((poll: any) => ({
          id: poll.id,
          name: poll.title,
          status: poll.status === "active" ? "Active" : poll.status === "ended" ? "Completed" : "Scheduled",
          votes: null,
          totalVoters: null,
          endDate: poll.voting_end_at ? new Date(poll.voting_end_at).toLocaleDateString() : "Manual",
        }));
        setElections(initialElections);
        setLoading(false);

        // Step 2: Query details and results in the background
        const promises = list.map(async (poll: any) => {
          let votes = 0;
          let totalVoters = 0;
          try {
            const resultsData = await apiGetResults(poll.id);
            votes = resultsData?.total_votes || 0;
          } catch {}
          try {
            const details = await apiGetPoll(poll.id);
            totalVoters = details.options ? details.options.length * 100 : 0;
          } catch {}
          return { id: poll.id, votes, totalVoters };
        });

        const bgData = await Promise.all(promises);

        // Step 3: Populate options/votes dynamically
        setElections((prev) =>
          prev.map((item) => {
            const bgItem = bgData.find((d) => d.id === item.id);
            if (bgItem) {
              return {
                ...item,
                votes: bgItem.votes,
                totalVoters: bgItem.totalVoters,
              };
            }
            return item;
          })
        );
      } catch {
        setLoading(false);
      }
    };

    loadPolls();
  }, [isInitialized, user]);

  if (!mounted) return null;

  const activeElections = elections.filter((e) => e.status === "Active").length;
  const totalVotesCast = elections.reduce((sum, e) => sum + (e.votes || 0), 0);
  const totalVotersPool = elections.reduce((sum, e) => sum + (e.totalVoters || 0), 0);
  const bgLoading = elections.length > 0 && elections.some((e) => e.votes === null);

  return (
    <div className="space-y-8 select-none">
      {/* Welcome Card & Info Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-card border border-border rounded-3xl p-6 md:p-8 relative overflow-hidden flex flex-col justify-between group hover:border-border/80 transition-all">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-[60px] pointer-events-none -z-10 group-hover:scale-110 transition-transform duration-500" />
          <div className="space-y-4">
            {user?.isVerified ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Identity ZK-Verified</span>
              </div>
            ) : (
              <button
                onClick={() => router.push("/feed/verification")}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition-all cursor-pointer"
              >
                <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
                <span>Verification Pending (Complete KYC)</span>
              </button>
            )}
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                Welcome back, <span className="text-primary">{user?.username || "Voter"}</span>
              </h1>
              {user?.isVerified && (
                <div className="mt-2">
                  <VerifiedBadge isVerified={user.isVerified} size="sm" />
                </div>
              )}
              <p className="text-sm text-foreground/50 mt-2 max-w-md">
                Your dashboard is synchronized with 6 validator nodes. All cast ballots are end-to-end encrypted.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-border pt-6 mt-8">
            <div>
              <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Active Elections</p>
              {loading ? (
                <div className="h-6 w-10 bg-foreground/10 rounded animate-pulse mt-1" />
              ) : (
                <p className="text-xl font-black text-foreground mt-1">{activeElections}</p>
              )}
            </div>
            <div>
              <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Total Votes Cast</p>
              {loading || bgLoading ? (
                <div className="h-6 w-12 bg-foreground/10 rounded animate-pulse mt-1" />
              ) : (
                <p className="text-xl font-black text-foreground mt-1">{totalVotesCast}</p>
              )}
            </div>
            <div>
              <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Global Status</p>
              <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[10px] font-bold mt-1 uppercase">
                Synced
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="lg:col-span-4 bg-card border border-border rounded-3xl p-6 flex flex-col justify-between hover:border-border/80 transition-all">
          <div>
            <h2 className="text-sm font-bold tracking-wider text-foreground/60 uppercase">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => router.push("/feed/elections/create")}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-surface border border-border hover:bg-foreground/10 hover:border-primary/20 hover:text-primary transition-all text-center gap-2 group cursor-pointer text-foreground"
              >
                <PlusCircle className="w-5 h-5 text-foreground/60 group-hover:text-primary group-hover:scale-110 transition-all" />
                <span className="text-xs font-semibold">New Election</span>
              </button>

              <button
                onClick={() => router.push("/feed/elections")}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-surface border border-border hover:bg-foreground/10 hover:border-primary/20 hover:text-primary transition-all text-center gap-2 group cursor-pointer text-foreground"
              >
                <Upload className="w-5 h-5 text-foreground/60 group-hover:text-primary group-hover:scale-110 transition-all" />
                <span className="text-xs font-semibold">Import Poll</span>
              </button>

              <button
                onClick={() => router.push("/feed/polls")}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-surface border border-border hover:bg-foreground/10 hover:border-primary/20 hover:text-primary transition-all text-center gap-2 group cursor-pointer text-foreground"
              >
                <UserPlus className="w-5 h-5 text-foreground/60 group-hover:text-primary group-hover:scale-110 transition-all" />
                <span className="text-xs font-semibold">Instant Polls</span>
              </button>

              <button
                onClick={() => router.push("/feed/results")}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-surface border border-border hover:bg-foreground/10 hover:border-primary/20 hover:text-primary transition-all text-center gap-2 group cursor-pointer text-foreground"
              >
                <Download className="w-5 h-5 text-foreground/60 group-hover:text-primary group-hover:scale-110 transition-all" />
                <span className="text-xs font-semibold">Get Results</span>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border text-center">
            <button
              onClick={() => router.push("/feed/verification")}
              className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              Verify Profile Status <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Elections", val: loading ? null : elections.length.toString(), diff: "Registered polls", icon: Vote, color: "text-primary" },
          { label: "Total Options", val: (loading || bgLoading) ? null : (totalVotersPool ? (totalVotersPool / 100).toString() : "0"), diff: "Choices active", icon: Users, color: "text-accent" },
          { label: "Votes Cast", val: (loading || bgLoading) ? null : totalVotesCast.toLocaleString(), diff: "Aggregated results", icon: CheckSquare, color: "text-emerald-400" },
          { label: "Active Elections", val: loading ? null : activeElections.toString(), diff: "Accepting ballots", icon: Activity, color: "text-amber-400" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between group hover:border-border/80 transition-all"
            >
              <div className="space-y-1">
                <span className="text-xs text-foreground/40 font-semibold">{stat.label}</span>
                {stat.val === null ? (
                  <div className="h-8 w-16 bg-foreground/10 rounded-lg animate-pulse mt-1" />
                ) : (
                  <p className="text-2xl font-black text-foreground">{stat.val}</p>
                )}
                <span className="text-[10px] text-foreground/40 block">{stat.diff}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center border border-border group-hover:border-border/80 transition-all">
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Elections Feed & Analytics Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Elections Feed */}
        <div className="lg:col-span-8 bg-card border border-border rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">Recent Elections Feed</h2>
              <p className="text-xs text-foreground/40">Track and manage active or completed digital polls.</p>
            </div>
            <button
              onClick={() => router.push("/feed/elections")}
              className="text-xs font-bold text-primary hover:underline cursor-pointer"
            >
              View All Elections
            </button>
          </div>

          <div className="space-y-4">
            {loading && elections.length === 0 ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-foreground/[0.02] border border-border gap-4 animate-pulse"
                >
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-foreground/10 rounded w-2/3" />
                    <div className="flex gap-3">
                      <div className="h-3 bg-foreground/5 rounded w-16" />
                      <div className="h-3 bg-foreground/5 rounded w-20" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-24 bg-foreground/5 rounded-xl" />
                    <div className="h-8 w-8 bg-foreground/5 rounded-xl" />
                  </div>
                </div>
              ))
            ) : elections.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-2xl text-xs text-foreground/40 space-y-2">
                <p>No active or registered polls found.</p>
                <Button
                  onClick={() => router.push("/feed/elections/create")}
                  className="h-9 px-4 rounded-lg bg-primary text-white text-xs font-semibold"
                >
                  Create Election
                </Button>
              </div>
            ) : (
              elections.map((elec) => (
                <div
                  key={elec.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-foreground/[0.02] border border-border hover:bg-foreground/[0.04] transition-all gap-4"
                >
                  <div className="space-y-1.5 max-w-sm">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-foreground truncate">{elec.name}</h3>
                      <span
                        className={`text-[8px] px-2 py-0.5 rounded font-black uppercase shrink-0 ${
                          elec.status === "Active"
                            ? "bg-primary/20 text-primary border border-primary/25"
                            : elec.status === "Completed"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/25"
                            : "bg-surface text-foreground/50 border border-border"
                        }`}
                      >
                        {elec.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-foreground/40 font-mono">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> Votes: {elec.votes === null ? (
                          <span className="inline-block w-8 h-3 bg-foreground/10 rounded animate-pulse mt-0.5 align-middle" />
                        ) : elec.votes}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> End: {elec.endDate}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(elec.status === "Completed" ? `/feed/results?pollId=${elec.id}` : `/feed/elections?pollId=${elec.id}`)}
                      className="px-4 py-2 rounded-xl bg-surface border border-border hover:bg-foreground/10 text-xs font-bold text-foreground transition-all cursor-pointer"
                    >
                      {elec.status === "Completed" ? "View Results" : "Manage"}
                    </button>
                    <button
                      onClick={() => router.push(`/feed/results?pollId=${elec.id}`)}
                      className="p-2 rounded-xl bg-primary/10 border border-primary/15 hover:bg-primary/25 text-primary text-xs font-bold transition-all cursor-pointer"
                      title="Audit Ledger"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Side Widget: Turnout Analytics & Notification Log */}
        <div className="lg:col-span-4 space-y-6">
          {/* Turnout Widget */}
          <div className="bg-card border border-border rounded-3xl p-6 hover:border-border/80 transition-all">
            <h3 className="text-xs font-bold text-foreground/60 uppercase tracking-wider flex items-center justify-between">
              <span>Turnout Trend</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </h3>

            {/* Turnout percentage graph mock */}
            <div className="mt-4 space-y-4">
              <div className="flex items-end justify-between h-20 px-2 pt-2 border-b border-border">
                {[45, 60, 52, 78, 84, 70, 92].map((val, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1.5 w-full">
                    <div
                      className="w-4 bg-gradient-to-t from-primary to-accent rounded-t-sm transition-all"
                      style={{ height: `${val}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[8px] text-foreground/30 font-mono">
                <span>Mon</span>
                <span>Wed</span>
                <span>Fri</span>
                <span>Sun</span>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/15 rounded-xl p-3.5 text-xs text-emerald-400 flex items-start gap-2.5">
                <TrendingUp className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Turnout increased by +12%</p>
                  <p className="text-[10px] opacity-80 mt-0.5">Participation is high in verified segments.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Ledger Feed */}
          <div className="bg-card border border-border rounded-3xl p-6 hover:border-border/80 transition-all">
            <h3 className="text-xs font-bold text-foreground/60 uppercase tracking-wider flex items-center gap-1.5 mb-4">
              <Activity className="w-4 h-4 text-primary animate-pulse" />
              <span>Activity Log</span>
            </h3>

            <div className="space-y-3">
              {notificationLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 text-xs border-b border-border pb-2.5 last:border-b-0 last:pb-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-foreground/80 leading-normal truncate-2-lines">{log.text}</p>
                    <span className="text-[9px] text-foreground/30 block font-mono">{log.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
