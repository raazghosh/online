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
  AlertCircle
} from "lucide-react";
import { useVotingStore } from "@/store/useVotingStore";
import { Button } from "@/components/ui/button";

export default function FeedDashboard() {
  const router = useRouter();
  const { user } = useVotingStore();
  const [mounted, setMounted] = useState(false);

  // Mock states for recent elections
  const [elections, setElections] = useState([
    { id: "e1", name: "Engineering Council Election 2026", status: "Active", votes: 412, totalVoters: 500, endDate: "2026-06-08" },
    { id: "e2", name: "Product Design Feedback Poll", status: "Active", votes: 128, totalVoters: 250, endDate: "2026-06-06" },
    { id: "e3", name: "Executive Committee Survey", status: "Scheduled", votes: 0, totalVoters: 150, endDate: "2026-06-12" },
    { id: "e4", name: "Annual General Meeting Resolution", status: "Completed", votes: 842, totalVoters: 900, endDate: "2026-06-02" },
  ]);

  // Mock Notification logs
  const notificationLogs = [
    { id: 1, text: "Election 'Tech Council 2026' was created by Admin.", time: "10 mins ago", type: "create" },
    { id: 2, text: "Your Identity Verification was approved.", time: "1 hour ago", type: "verify" },
    { id: 3, text: "Voting Simulator completed block validator handshake.", time: "3 hours ago", type: "system" },
    { id: 4, text: "Annual General Meeting Resolution ended with 93% turnout.", time: "1 day ago", type: "end" },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-8">
      {/* Welcome Card & Info Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md relative overflow-hidden flex flex-col justify-between group hover:border-white/15 transition-all">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-[60px] pointer-events-none -z-10 group-hover:scale-110 transition-transform duration-500" />
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Identity ZK-Verified</span>
            </div>
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
              <p className="text-xl font-black text-white mt-1">2</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Total Votes Cast</p>
              <p className="text-xl font-black text-white mt-1">1,382</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Global Status</p>
              <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[10px] font-bold mt-1 uppercase">
                Active
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
                <span className="text-xs font-semibold">Upload Voters</span>
              </button>

              <button
                onClick={() => router.push("/feed/team")}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-primary/20 hover:text-primary transition-all text-center gap-2 group cursor-pointer"
              >
                <UserPlus className="w-5 h-5 text-white/60 group-hover:text-primary group-hover:scale-110 transition-all" />
                <span className="text-xs font-semibold">Invite Team</span>
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
              Verify Organization Profile <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Elections", val: "12", diff: "+2 this month", icon: Vote, color: "text-primary" },
          { label: "Total Voters", val: "1,420", diff: "+124 registered", icon: Users, color: "text-accent" },
          { label: "Votes Cast", val: "842", diff: "84.2% participation", icon: CheckSquare, color: "text-emerald-400" },
          { label: "Active Elections", val: "2", diff: "Ending soon", icon: Activity, color: "text-amber-400" },
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
              <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-white/10 transition-all`}>
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
            {elections.map((elec) => (
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
                      <Users className="w-3 h-3" /> {elec.votes} / {elec.totalVoters} Voters
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> End: {elec.endDate}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push(elec.status === "Completed" ? "/feed/results" : "/feed/elections")}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-xs font-bold transition-all cursor-pointer"
                  >
                    {elec.status === "Completed" ? "View Results" : "Manage"}
                  </button>
                  <button
                    onClick={() => router.push("/feed/elections")}
                    className="p-2 rounded-xl bg-primary/10 border border-primary/15 hover:bg-primary/25 text-primary text-xs font-bold transition-all cursor-pointer"
                    title="Audit Ledger"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
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
                  <p className="text-[10px] opacity-80 mt-0.5">Participation is high in university segments.</p>
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
