"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Vote,
  PlusCircle,
  Search,
  Calendar,
  Users,
  Eye,
  Trash2,
  CheckCircle,
  FileText,
  Lock,
  ChevronDown,
  ArrowRight,
  TrendingUp,
  Cpu,
  RefreshCw,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ElectionsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  // Mock Elections
  const [elections, setElections] = useState([
    {
      id: "e1",
      title: "Engineering Council Election 2026",
      category: "Council",
      status: "Active",
      votes: 412,
      totalVoters: 500,
      startDate: "2026-06-01",
      endDate: "2026-06-08",
      candidates: [
        { name: "Alice Smith", votes: 210, bio: "Senior UX Designer" },
        { name: "Bob Johnson", votes: 202, bio: "Lead Frontend Engineer" }
      ],
      ledgerHash: "0x8f7e2a9b4c1d7632e8a7d0b"
    },
    {
      id: "e2",
      title: "Product Design Feedback Poll",
      category: "Feedback",
      status: "Active",
      votes: 128,
      totalVoters: 250,
      startDate: "2026-06-03",
      endDate: "2026-06-06",
      candidates: [
        { name: "Option A: Dark Theme", votes: 85, bio: "Classic deep black" },
        { name: "Option B: Light Theme", votes: 43, bio: "Premium glass white" }
      ],
      ledgerHash: "0x2a8e9b0d8e7f4c1e7a3b4c"
    },
    {
      id: "e3",
      title: "Executive Committee Survey",
      category: "Survey",
      status: "Scheduled",
      votes: 0,
      totalVoters: 150,
      startDate: "2026-06-10",
      endDate: "2026-06-15",
      candidates: [
        { name: "Yes", votes: 0, bio: "Accept the bylaws" },
        { name: "No", votes: 0, bio: "Reject and revise" }
      ],
      ledgerHash: "Pending Setup"
    },
    {
      id: "e4",
      title: "Annual General Meeting Resolution",
      category: "Resolution",
      status: "Completed",
      votes: 842,
      totalVoters: 900,
      startDate: "2026-05-28",
      endDate: "2026-06-02",
      candidates: [
        { name: "Passed", votes: 790, bio: "Overwhelming approval" },
        { name: "Failed", votes: 52, bio: "Minority opposition" }
      ],
      ledgerHash: "0xdf8a719cb02e8f7e2a9b4c"
    }
  ]);

  const [activeElectionDetails, setActiveElectionDetails] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setElections(prev => prev.filter(e => e.id !== id));
  };

  const filteredElections = elections.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || e.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || e.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Vote className="text-primary w-6 h-6" /> Election Management
          </h1>
          <p className="text-xs text-white/50">Create, monitor, and finalize cryptographic elections.</p>
        </div>

        <Button
          onClick={() => router.push("/feed/elections/create")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:shadow-[0_0_20px_rgba(49,107,243,0.3)] transition-all cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" /> Create Election
        </Button>
      </div>

      {/* Filter and Search controls */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Search */}
        <div className="md:col-span-6 relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-primary transition-all" />
          <input
            type="text"
            placeholder="Search elections by title or category..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/5 border border-white/5 text-xs placeholder-white/30 focus:bg-white/10 focus:border-primary focus:outline-none transition-all"
          />
        </div>

        {/* Status Dropdown */}
        <div className="md:col-span-4 relative">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full h-11 px-4 rounded-xl bg-[#080c1c] border border-white/5 text-xs text-white/60 focus:border-primary focus:outline-none appearance-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
        </div>

        {/* Refresh */}
        <div className="md:col-span-2">
          <button
            onClick={handleRefresh}
            className="w-full h-11 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-white/60 ${loading ? "animate-spin text-primary" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Election Grid / List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredElections.length === 0 ? (
          <div className="border border-white/5 rounded-3xl p-12 text-center bg-white/[0.01] space-y-4">
            <ShieldCheck className="w-12 h-12 text-white/20 mx-auto" />
            <h3 className="text-base font-bold text-white">No Elections Found</h3>
            <p className="text-xs text-white/40 max-w-sm mx-auto">
              We couldn&apos;t find any elections matching your search or filters. Create one to get started!
            </p>
          </div>
        ) : (
          filteredElections.map(elec => {
            const isDetailOpen = activeElectionDetails === elec.id;

            return (
              <div
                key={elec.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 backdrop-blur-sm space-y-4 hover:border-white/15 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-white">{elec.title}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/50 border border-white/5 uppercase font-bold">
                        {elec.category}
                      </span>
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
                    <div className="flex items-center gap-4 text-[10px] text-white/40 font-mono">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-primary" /> {elec.votes} / {elec.totalVoters} Votes Cast
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-primary" /> Start: {elec.startDate} | End: {elec.endDate}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveElectionDetails(isDetailOpen ? null : elec.id)}
                      className="px-4 h-10 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Eye className="w-4 h-4" /> {isDetailOpen ? "Hide" : "Details"}
                    </button>
                    {elec.status !== "Completed" && (
                      <button
                        onClick={() => handleDelete(elec.id)}
                        className="p-2.5 h-10 w-10 rounded-xl bg-red-500/10 border border-red-500/15 hover:bg-red-500/25 text-red-400 transition-all flex items-center justify-center cursor-pointer"
                        title="Delete Election"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Collapsible Details */}
                <AnimatePresence>
                  {isDetailOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden border-t border-white/5 pt-4 mt-4 space-y-4 text-xs"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Candidates Tally */}
                        <div className="space-y-3 bg-white/[0.01] border border-white/5 p-4 rounded-xl">
                          <h4 className="font-bold text-white flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-primary" /> Candidates & Options
                          </h4>
                          <div className="space-y-2.5">
                            {elec.candidates.map((cand, idx) => {
                              const pct = elec.votes > 0 ? Math.round((cand.votes / elec.votes) * 100) : 0;
                              return (
                                <div key={idx} className="space-y-1">
                                  <div className="flex justify-between text-[11px]">
                                    <span className="font-bold text-white/80">{cand.name} ({cand.bio})</span>
                                    <span className="font-mono text-white/60">{cand.votes} votes ({pct}%)</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Cryptographic Ledger Details */}
                        <div className="space-y-3 bg-white/[0.01] border border-white/5 p-4 rounded-xl flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-white flex items-center gap-1.5">
                              <Lock className="w-4 h-4 text-primary" /> Decentralized Consensus Proof
                            </h4>
                            <p className="text-[10px] text-white/50 mt-2 leading-relaxed">
                              Each ballotcast is encrypted locally via AES-GCM-256 before transport. The consensus ledger is signed by 6 validator nodes.
                            </p>
                          </div>

                          <div className="bg-black/40 border border-white/5 p-3 rounded-lg mt-4 font-mono text-[9px] text-white/60 space-y-1">
                            <div className="flex justify-between">
                              <span>Ledger Hash:</span>
                              <span className="text-primary truncate max-w-[150px]">{elec.ledgerHash}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Decentralized Sync:</span>
                              <span className="text-emerald-400 font-bold">100% Synced</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
