"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useVotingStore, AuditLog } from "@/store/useVotingStore";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import {
  ShieldAlert,
  Server,
  Activity,
  UserCheck,
  TrendingUp,
  Cpu,
  Clock,
  RefreshCw,
  Dot,
  CheckCircle,
  FileCheck,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

export function LiveDashboard() {
  const [mounted, setMounted] = useState(false);
  const { votes, auditLogs, nodes, updateNodeLatency } = useVotingStore();
  const [activeTab, setActiveTab] = useState<"overview" | "nodes" | "logs">("overview");

  // Mount gate to prevent Recharts SSR hydration error
  useEffect(() => {
    setMounted(true);

    // Simulate node latency variations in the background
    const interval = setInterval(() => {
      nodes.forEach((node) => {
        if (node.status !== "offline") {
          const newLatency = Math.floor(10 + Math.random() * 40);
          updateNodeLatency(node.id, newLatency);
        }
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [nodes, updateNodeLatency]);

  if (!mounted) {
    return (
      <div className="py-24 max-w-[1280px] mx-auto px-6 text-center text-foreground/40">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-sm">Loading security consoles...</p>
      </div>
    );
  }

  // Chart data formatting
  const chartData = [
    { time: "08:00 AM", turnout: 1200, rate: 12 },
    { time: "10:00 AM", turnout: 2450, rate: 24 },
    { time: "12:00 PM", turnout: 4100, rate: 41 },
    { time: "02:00 PM", turnout: 5020, rate: 50 },
    { time: "04:00 PM", turnout: 5930, rate: 59 },
    { time: "06:00 PM", turnout: 6310, rate: 63 },
    { time: "08:00 PM", turnout: 6540, rate: 65 },
  ];

  const totalVotes = votes.YES + votes.NO + votes.ABSTAIN;
  const participationPercentage = ((totalVotes / 7800) * 100).toFixed(1);

  return (
    <section id="dashboard" className="py-24 relative z-10 overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-6">
        
        {/* Console Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
              <span className="text-xs font-bold uppercase tracking-wider text-green-400">
                Live Audit Console
              </span>
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight text-foreground">
              SecureVote Operations
            </h2>
          </div>

          {/* Tab Selection */}
          <div className="flex items-center gap-1.5 bg-surface p-1 rounded-xl border border-border">
            {(["overview", "nodes", "logs"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeTab === tab
                    ? "bg-primary text-white shadow-md"
                    : "text-foreground/60 hover:text-foreground hover:bg-surface"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Card 1: Votes Cast */}
          <Card className="p-6 border-border/80 bg-surface/35 flex flex-col justify-between">
            <div className="flex items-center justify-between text-foreground/50 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider">Total Ballots Cast</span>
              <FileCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-3xl font-extrabold text-foreground tracking-tight">
                {totalVotes.toLocaleString()}
              </h3>
              <p className="text-xs text-green-400 flex items-center gap-1 mt-1 font-semibold">
                <TrendingUp className="w-3 h-3" />
                +12.4% last hour
              </p>
            </div>
          </Card>

          {/* Card 2: Participation Rate */}
          <Card className="p-6 border-border/80 bg-surface/35 flex flex-col justify-between">
            <div className="flex items-center justify-between text-foreground/50 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider">Participation Rate</span>
              <UserCheck className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-3xl font-extrabold text-foreground tracking-tight">
                {participationPercentage}%
              </h3>
              <p className="text-xs text-foreground/40 mt-1 font-semibold">
                Of 7,800 Registered Voters
              </p>
            </div>
          </Card>

          {/* Card 3: Node Consensus Uptime */}
          <Card className="p-6 border-border/80 bg-surface/35 flex flex-col justify-between">
            <div className="flex items-center justify-between text-foreground/50 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider">Network Health</span>
              <Server className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="text-3xl font-extrabold text-foreground tracking-tight">
                {(nodes.filter(n => n.status !== "offline").length / nodes.length * 100).toFixed(0)}%
              </h3>
              <p className="text-xs text-foreground/40 mt-1 font-semibold">
                5 of 6 Nodes Online
              </p>
            </div>
          </Card>

          {/* Card 4: Security Shield Uptime */}
          <Card className="p-6 border-border/80 bg-surface/35 flex flex-col justify-between">
            <div className="flex items-center justify-between text-foreground/50 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider">Security Integrity</span>
              <ShieldAlert className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-3xl font-extrabold text-foreground tracking-tight">
                100%
              </h3>
              <p className="text-xs text-green-400 mt-1 font-semibold">
                AES-GCM Encryption Active
              </p>
            </div>
          </Card>

        </div>

        {/* Tab Components */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Turnout Area Chart */}
            <Card className="lg:col-span-8 p-6 border-border/80 bg-surface/20">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Turnout Statistics</h3>
                  <p className="text-xs text-foreground/40">Hourly aggregate ballot confirmations</p>
                </div>
              </div>
              
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="turnoutColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="time"
                      stroke="rgba(255,255,255,0.2)"
                      style={{ fontSize: "10px", fontFamily: "var(--font-sans)" }}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.2)"
                      style={{ fontSize: "10px", fontFamily: "var(--font-sans)" }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(5, 8, 22, 0.95)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: "12px",
                        fontSize: "12px",
                        color: "#fff",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="turnout"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#turnoutColor)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Voting Tallies Bar Chart */}
            <Card className="lg:col-span-4 p-6 border-border/80 bg-surface/20 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">Ballot Breakdown</h3>
                <p className="text-xs text-foreground/40 mb-6">Simulated election tallies</p>
              </div>

              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: "YES", count: votes.YES },
                    { name: "NO", count: votes.NO },
                    { name: "ABSTAIN", count: votes.ABSTAIN },
                  ]}>
                    <XAxis
                      dataKey="name"
                      stroke="rgba(255,255,255,0.2)"
                      style={{ fontSize: "10px", fontWeight: "bold" }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(5, 8, 22, 0.95)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: "12px",
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="var(--primary)"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 text-center border-t border-border/40 pt-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-green-400">YES</p>
                  <p className="text-base font-extrabold">{votes.YES}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-red-400">NO</p>
                  <p className="text-base font-extrabold">{votes.NO}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-amber-400">ABSTAIN</p>
                  <p className="text-base font-extrabold">{votes.ABSTAIN}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === "nodes" && (
          <Card className="p-6 border-border/80 bg-surface/20">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-foreground">Validator Nodes Status</h3>
              <p className="text-xs text-foreground/40">Multi-region consensus validator instances</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nodes.map((node) => (
                <Card
                  key={node.id}
                  className={`p-5 border-border bg-surface/30 flex flex-col justify-between h-[150px] relative overflow-hidden ${
                    node.status === "offline" ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground/60">{node.region}</span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                        node.status === "active"
                          ? "bg-green-500/10 border-green-500/20 text-green-400"
                          : node.status === "synced"
                          ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                          : "bg-red-500/10 border-red-500/20 text-red-400"
                      }`}
                    >
                      <Dot className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                      {node.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-foreground mt-2">{node.name}</h4>

                  <div className="grid grid-cols-3 gap-2 mt-4 text-[10px] border-t border-border/40 pt-3 text-foreground/50">
                    <div>
                      <p className="uppercase font-semibold">Latency</p>
                      <p className="text-xs font-bold text-foreground">
                        {node.status === "offline" ? "N/A" : `${node.latency}ms`}
                      </p>
                    </div>
                    <div>
                      <p className="uppercase font-semibold">Uptime</p>
                      <p className="text-xs font-bold text-foreground">{node.uptime}%</p>
                    </div>
                    <div>
                      <p className="uppercase font-semibold">Validated</p>
                      <p className="text-xs font-bold text-foreground">{node.votesValidated}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        )}

        {activeTab === "logs" && (
          <Card className="p-6 border-border/80 bg-surface/20">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-foreground">Blockchain Ledger Logs</h3>
                <p className="text-xs text-foreground/40">Audit chain transactions</p>
              </div>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-xl bg-surface/30 border border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-surface/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
                        log.type === "IDENTITY_VERIFIED"
                          ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                          : log.type === "VOTE_ENCRYPTED"
                          ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                          : log.type === "NODE_VALIDATED"
                          ? "bg-accent/10 border-accent/20 text-accent"
                          : "bg-green-500/10 border-green-500/20 text-green-400"
                      }`}
                    >
                      {log.type === "IDENTITY_VERIFIED" && <UserCheck className="w-4 h-4" />}
                      {log.type === "VOTE_ENCRYPTED" && <Clock className="w-4 h-4" />}
                      {log.type === "NODE_VALIDATED" && <Cpu className="w-4 h-4" />}
                      {log.type === "RECEIPT_GENERATED" && <CheckCircle className="w-4 h-4" />}
                    </div>

                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-foreground/80">{log.message}</p>
                      <p className="text-[10px] text-foreground/40">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  {log.hash && (
                    <span className="font-mono text-[10px] text-foreground/50 bg-[#050816] px-2.5 py-1 rounded-lg border border-border">
                      {log.hash.substring(0, 16)}...
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

      </div>
    </section>
  );
}
