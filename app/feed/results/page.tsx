"use client";

import * as React from "react";
import { useState } from "react";
import {
  BarChart3,
  Download,
  Calendar,
  Users,
  CheckCircle,
  FileText,
  Lock,
  ChevronDown,
  TrendingUp,
  Cpu,
  RefreshCw,
  Printer
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ResultsPage() {
  const [selectedElection, setSelectedElection] = useState("e4");
  const [isExporting, setIsExporting] = useState(false);

  // Mock Elections with detailed results
  const electionsResults = {
    e4: {
      title: "Annual General Meeting Resolution",
      category: "Resolution",
      status: "Completed",
      totalVoters: 900,
      votesCast: 842,
      turnout: "93.5%",
      completionRate: "99.8%",
      verifiedPercent: "100%",
      date: "May 28 - Jun 2, 2026",
      options: [
        { label: "Passed: Approve Bylaw Amendment 2A", votes: 790, rank: 1 },
        { label: "Failed: Reject Bylaw Amendment 2A", votes: 52, rank: 2 }
      ],
      auditTrail: [
        { node: "SFO-02 (San Francisco)", latency: "28ms", validations: 22140 },
        { node: "AMS-01 (Amsterdam)", latency: "14ms", validations: 14890 },
        { node: "SGP-03 (Singapore)", latency: "42ms", validations: 11090 }
      ],
      ledgerHash: "0xdf8a719cb02e8f7e2a9b4ca1b238f9024f9c2d1b7"
    },
    e1: {
      title: "Engineering Council Election 2026",
      category: "Council",
      status: "Active (Interim Results)",
      totalVoters: 500,
      votesCast: 412,
      turnout: "82.4%",
      completionRate: "99.1%",
      verifiedPercent: "100%",
      date: "Jun 1 - Jun 8, 2026",
      options: [
        { label: "Alice Smith (Senior UX Designer)", votes: 210, rank: 1 },
        { label: "Bob Johnson (Lead Frontend Engineer)", votes: 202, rank: 2 }
      ],
      auditTrail: [
        { node: "AMS-01 (Amsterdam)", latency: "14ms", validations: 12050 },
        { node: "LHR-05 (London)", latency: "18ms", validations: 9450 }
      ],
      ledgerHash: "0x8f7e2a9b4c1d7632e8a7d0b1a2e8c84b1d7f3c4d"
    }
  };

  const currentResult = electionsResults[selectedElection as keyof typeof electionsResults] || electionsResults.e4;

  const handleExport = (type: "pdf" | "csv") => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert(`${type.toUpperCase()} exported successfully!`);
    }, 1500);
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="text-primary w-6 h-6" /> Results & Audits
          </h1>
          <p className="text-xs text-white/50">Analyze participation metrics and export authenticated reports.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleExport("pdf")}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold transition-all text-white/80 cursor-pointer disabled:opacity-50"
          >
            <Printer className="w-4 h-4 text-white/60" /> Export PDF
          </button>
          <button
            onClick={() => handleExport("csv")}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold transition-all text-white/80 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-white/60" /> Export CSV
          </button>
        </div>
      </div>

      {/* Selector dropdown */}
      <div className="max-w-md relative">
        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">Select Election</label>
        <select
          value={selectedElection}
          onChange={e => setSelectedElection(e.target.value)}
          className="w-full h-12 px-4 rounded-xl bg-[#080c1c] border border-white/5 text-xs text-white focus:border-primary focus:outline-none appearance-none cursor-pointer"
        >
          <option value="e4">Annual General Meeting Resolution (Completed)</option>
          <option value="e1">Engineering Council Election 2026 (Active)</option>
        </select>
        <ChevronDown className="absolute right-4 top-[38px] w-4 h-4 text-white/40 pointer-events-none" />
      </div>

      {/* Main Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Votes Count & Ranking */}
        <div className="lg:col-span-8 bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm space-y-6">
          <div className="border-b border-white/5 pb-4">
            <h2 className="text-base font-bold text-white">Ballot Tallies & Rankings</h2>
            <p className="text-xs text-white/40">{currentResult.title}</p>
          </div>

          <div className="space-y-6">
            {currentResult.options.map((opt, idx) => {
              const pct = currentResult.votesCast > 0 ? Math.round((opt.votes / currentResult.votesCast) * 100) : 0;
              return (
                <div key={idx} className="space-y-2.5 p-4 rounded-2xl bg-white/[0.01] border border-white/5">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-black text-primary">
                        #{opt.rank}
                      </div>
                      <span className="font-bold text-white">{opt.label}</span>
                    </div>
                    <span className="font-mono text-white/70 font-semibold">{opt.votes} votes ({pct}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Participation Stats & Audit Logs */}
        <div className="lg:col-span-4 space-y-6">
          {/* Participation Metrics */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm space-y-4">
            <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">Participation Metrics</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl text-center">
                <span className="text-[10px] text-white/40 block">Voter Turnout</span>
                <span className="text-lg font-black text-white mt-1 block">{currentResult.turnout}</span>
              </div>
              <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl text-center">
                <span className="text-[10px] text-white/40 block">Completion Rate</span>
                <span className="text-lg font-black text-white mt-1 block">{currentResult.completionRate}</span>
              </div>
              <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl text-center col-span-2">
                <span className="text-[10px] text-white/40 block">Decentralized Verifications</span>
                <span className="text-lg font-black text-emerald-400 mt-1 block">{currentResult.verifiedPercent} Verified</span>
              </div>
            </div>
          </div>

          {/* Audit Node Ledger */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm space-y-4">
            <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-primary" /> Consensus Ledger Nodes
            </h3>

            <div className="space-y-3 font-mono text-[9px] text-white/60">
              {currentResult.auditTrail.map((node, i) => (
                <div key={i} className="flex justify-between border-b border-white/5 pb-2 last:border-b-0 last:pb-0">
                  <div className="space-y-0.5">
                    <p className="font-bold text-white/80">{node.node}</p>
                    <p className="text-[8px] text-white/30">Total Validations: {node.validations}</p>
                  </div>
                  <span className="text-emerald-400 font-bold shrink-0">{node.latency}</span>
                </div>
              ))}

              <div className="bg-black/30 border border-white/5 p-3 rounded-lg mt-4 text-[8px] space-y-1">
                <div className="flex justify-between">
                  <span>Audit Trail Commit:</span>
                  <span className="text-primary truncate max-w-[120px]">{currentResult.ledgerHash}</span>
                </div>
                <div className="flex justify-between">
                  <span>Protocol:</span>
                  <span>AES-256 ZK Consensus</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
