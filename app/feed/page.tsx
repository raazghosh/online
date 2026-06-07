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
import { apiGetPoll, apiGetResults } from "@/lib/api";

export default function FeedDashboard() {
  const router = useRouter();
  const { user, createdPollIds, votedPollIds, isInitialized, initializeSession } = useVotingStore();
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
      const uniquePollIds = Array.from(new Set([...createdPollIds, ...votedPollIds]));
      if (uniquePollIds.length === 0) {
        setElections([]);
        setLoading(false);
        return;
      }

      try {
        const promises = uniquePollIds.map(async (id) => {
          try {
            const data = await apiGetPoll(id);
            let resultsData = null;
            try {
              resultsData = await apiGetResults(id);
            } catch {
              // Ignore results fetch failure if poll has not ended or no votes cast
            }
            return {
              id: data.id,
              name: data.title,
              status: data.status === "active" ? "Active" : data.status === "ended" ? "Completed" : "Scheduled",
              votes: resultsData?.total_votes || 0,
              totalVoters: data.options ? data.options.length * 100 : 0, // Mock total voter pool representation
              endDate: data.voting_end_at ? new Date(data.voting_end_at).toLocaleDateString() : "Manual",
            };
          } catch {
            return null; // Skip if poll does not exist
          }
        });

        const results = await Promise.all(promises);
        setElections(results.filter((e) => e !== null) as any[]);
      } catch {
        // Silent error
      } finally {
        setLoading(false);
      }
    };

    loadPolls();
  }, [isInitialized, user, createdPollIds, votedPollIds]);

  if (!mounted) return null;

  if (loading && elections.length === 0) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const activeElections = elections.filter((e) => e.status === "Active").length;
  const totalVotesCast = elections.reduce((sum, e) => sum + e.votes, 0);
  const totalVotersPool = elections.reduce((sum, e) => sum + e.totalVoters, 0);

  return (
    <div className="space-y-8 select-none">
      {/* Welcome Card & Info Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md relative overflow-hidden flex flex-col justify-between group hover:border-white/15 transition-all">
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
              <h1 className="text-3xl font-extrabold tracking-tight text-white">
                Welcome back, <span className="text-primary">{user?.username || "Voter"}</span>
              </h1>
              <p className="text-sm text-white/50 mt-1 max-w-md">
                Your dashboard is synchronized with 6 validator nodes. All cast ballots are end-to-end encrypted.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-6 mt-8">
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Active Elections</p>
              <p className="text-xl font-black text-white mt-1">{activeElections}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Total Votes Cast</p>
              <p className="text-xl font-black text-white mt-1">{totalVotesCast}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Global Status</p>
              <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[10px] font-bold mt-1 uppercase">
                Synced
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md flex flex-col justify-between hover:border-white/15 transition-all">
          <div>
            <h2 className="text-sm font-bold tracking-wider text-white/60 uppercase">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => router.push("/feed/elections/create")}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-primary/20 hover:text-primary transition-all text-center gap-2 group cursor-pointer"
              >
                <PlusCircle className="w-5 h-5 text-white/60 group-hover:text-primary group-hover:scale-110 transition-all" />
                <span className="text-xs font-semibold">New Election</span>
              </button>

              <button
                onClick={() => router.push("/feed/elections")}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-primary/20 hover:text-primary transition-all text-center gap-2 group cursor-pointer"
              >
                <Upload className="w-5 h-5 text-white/60 group-hover:text-primary group-hover:scale-110 transition-all" />
                <span className="text-xs font-semibold">Import Poll</span>
              </button>

              <button
                onClick={() => router.push("/feed/polls")}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-primary/20 hover:text-primary transition-all text-center gap-2 group cursor-pointer"
              >
                <UserPlus className="w-5 h-5 text-white/60 group-hover:text-primary group-hover:scale-110 transition-all" />
                <span className="text-xs font-semibold">Instant Polls</span>
              </button>

              <button
                onClick={() => router.push("/feed/results")}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-primary/20 hover:text-primary transition-all text-center gap-2 group cursor-pointer"
              >
                <Download className="w-5 h-5 text-white/60 group-hover:text-primary group-hover:scale-110 transition-all" />
                <span className="text-xs font-semibold">Get Results</span>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/5 text-center">
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
          { label: "Total Elections", val: elections.length.toString(), diff: "Registered polls", icon: Vote, color: "text-primary" },
          { label: "Total Options", val: totalVotersPool ? (totalVotersPool / 100).toString() : "0", diff: "Choices active", icon: Users, color: "text-accent" },
          { label: "Votes Cast", val: totalVotesCast.toLocaleString(), diff: "Aggregated results", icon: CheckSquare, color: "text-emerald-400" },
          { label: "Active Elections", val: activeElections.toString(), diff: "Accepting ballots", icon: Activity, color: "text-amber-400" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm flex items-center justify-between group hover:border-white/15 transition-all"
            >
              <div className="space-y-1">
                <span className="text-xs text-white/40 font-semibold">{stat.label}</span>
                <p className="text-2xl font-black text-white">{stat.val}</p>
                <span className="text-[10px] text-white/40 block">{stat.diff}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-white/10 transition-all">
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Elections Feed & Analytics Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Elections Feed */}
        <div className="lg:col-span-8 bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Recent Elections Feed</h2>
              <p className="text-xs text-white/40">Track and manage active or completed digital polls.</p>
            </div>
            <button
              onClick={() => router.push("/feed/elections")}
              className="text-xs font-bold text-primary hover:underline cursor-pointer"
            >
              View All Elections
            </button>
          </div>

          <div className="space-y-4">
            {elections.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl text-xs text-white/40 space-y-2">
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
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all gap-4"
                >
                  <div className="space-y-1.5 max-w-sm">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-white truncate">{elec.name}</h3>
                      <span
                        className={`text-[8px] px-2 py-0.5 rounded font-black uppercase shrink-0 ${
                          elec.status === "Active"
                            ? "bg-primary/20 text-primary border border-primary/25"
                            : elec.status === "Completed"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/25"
                            : "bg-white/5 text-white/50 border border-white/5"
                        }`}
                      >
                        {elec.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-white/40 font-mono">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> Votes: {elec.votes}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> End: {elec.endDate}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(elec.status === "Completed" ? `/feed/results?pollId=${elec.id}` : `/feed/elections?pollId=${elec.id}`)}
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-xs font-bold transition-all cursor-pointer"
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
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md hover:border-white/15 transition-all">
            <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center justify-between">
              <span>Turnout Trend</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </h3>

            {/* Turnout percentage graph mock */}
            <div className="mt-4 space-y-4">
              <div className="flex items-end justify-between h-20 px-2 pt-2 border-b border-white/5">
                {[45, 60, 52, 78, 84, 70, 92].map((val, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1.5 w-full">
                    <div
                      className="w-4 bg-gradient-to-t from-primary to-accent rounded-t-sm transition-all"
                      style={{ height: `${val}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[8px] text-white/30 font-mono">
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
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md hover:border-white/15 transition-all">
            <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-1.5 mb-4">
              <Activity className="w-4 h-4 text-primary animate-pulse" />
              <span>Activity Log</span>
            </h3>

            <div className="space-y-3">
              {notificationLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 text-xs border-b border-white/5 pb-2.5 last:border-b-0 last:pb-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-white/80 leading-normal truncate-2-lines">{log.text}</p>
                    <span className="text-[9px] text-white/30 block font-mono">{log.time}</span>
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
