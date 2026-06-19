"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  ShieldCheck,
  Download,
  AlertCircle,
  Play,
  StopCircle,
  Loader2
} from "lucide-react";
import { useVotingStore } from "@/store/useVotingStore";
import { Button } from "@/components/ui/button";
import {
  apiGetPoll,
  apiGetResults,
  apiDeletePoll,
  apiStartPoll,
  apiEndPoll,
  apiCastVote,
  apiGetPolls,
  decodeJwt,
  parsePollDescription
} from "@/lib/api";

function ElectionsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useVotingStore((state) => state.user);
  const accessToken = useVotingStore((state) => state.accessToken);
  const createdPollIds = useVotingStore((state) => state.createdPollIds);
  const votedPollIds = useVotingStore((state) => state.votedPollIds);
  const addVotedPollId = useVotingStore((state) => state.addVotedPollId);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [elections, setElections] = useState<any[]>([]);
  const [activeElectionDetails, setActiveElectionDetails] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [importing, setImporting] = useState(false);

  // Decode current user ID from JWT
  let currentUserId = "";
  if (accessToken) {
    const decoded = decodeJwt(accessToken);
    currentUserId = decoded?.user_id || "";
  }

  // Pre-expand detail if pollId passed in URL query
  useEffect(() => {
    const pollIdParam = searchParams.get("pollId");
    if (pollIdParam) {
      setActiveElectionDetails(pollIdParam);
    }
  }, [searchParams]);

  const loadPolls = React.useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await apiGetPolls({ scope: "feed", limit: 100 });
      const pollsList = res.data || [];
      
      // Step 1: Populate list immediately
      const initialElections = pollsList.map((poll: any) => ({
        id: poll.id,
        title: poll.title,
        description: "Loading details...",
        category: "Standard",
        status: poll.status === "active" ? "Active" : poll.status === "ended" ? "Completed" : "Scheduled",
        votes: null,
        totalVoters: null,
        startDate: poll.voting_start_at ? new Date(poll.voting_start_at).toLocaleDateString() : "Manual",
        endDate: poll.voting_end_at ? new Date(poll.voting_end_at).toLocaleDateString() : "Manual",
        adminId: poll.admin_id,
        options: null,
        isPrivate: false,
        allowedEmails: [],
        candidates: null,
      }));
      setElections(initialElections);
      setLoading(false);

      // Step 2: Fetch detailed data in background
      const promises = pollsList.map(async (poll: any) => {
        try {
          const data = await apiGetPoll(poll.id);
          let resultsData = null;
          try {
            resultsData = await apiGetResults(poll.id);
          } catch {}

          const totalVotes = resultsData?.total_votes || 0;
          const parsed = parsePollDescription(data.description);
          return {
            id: data.id,
            description: parsed.description || "No description provided.",
            category: data.allow_admin_vote ? "Admin Allowed" : "Standard",
            votes: totalVotes,
            totalVoters: data.options ? data.options.length * 100 : 0,
            options: data.options || [],
            isPrivate: parsed.isPrivate,
            allowedEmails: parsed.allowedEmails,
            choicesHidden: resultsData?.choices_hidden || false,
            candidates: (data.options || []).map((opt: string) => {
              const count = resultsData?.votes?.[opt] || 0;
              return {
                name: opt,
                votes: count,
              };
            }),
          };
        } catch {
          return null;
        }
      });

      const bgData = await Promise.all(promises);

      // Step 3: Hydrate details dynamically
      setElections((prev) =>
        prev
          .map((item) => {
            const bgItem = bgData.find((d) => d && d.id === item.id);
            if (bgItem) {
              return {
                ...item,
                description: bgItem.description,
                category: bgItem.category,
                votes: bgItem.votes,
                totalVoters: bgItem.totalVoters,
                options: bgItem.options,
                isPrivate: bgItem.isPrivate,
                allowedEmails: bgItem.allowedEmails,
                choicesHidden: bgItem.choicesHidden,
                candidates: bgItem.candidates,
              };
            }
            return item;
          })
          .filter((e) => e !== null)
      );
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load election details.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadPolls();
    }
  }, [user, loadPolls]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this poll?")) return;
    setLoading(true);
    setErrorMessage("");
    try {
      await apiDeletePoll(id);
      
      // Clean up locally stored ID references
      const userEmail = user?.email;
      if (userEmail) {
        const createdStr = localStorage.getItem(`created_polls_${userEmail}`);
        if (createdStr) {
          const arr = JSON.parse(createdStr).filter((pid: string) => pid !== id);
          localStorage.setItem(`created_polls_${userEmail}`, JSON.stringify(arr));
        }
        const votedStr = localStorage.getItem(`voted_polls_${userEmail}`);
        if (votedStr) {
          const arr = JSON.parse(votedStr).filter((pid: string) => pid !== id);
          localStorage.setItem(`voted_polls_${userEmail}`, JSON.stringify(arr));
        }
      }

      // Update Zustand state directly and refresh the list
      useVotingStore.setState((state) => ({
        createdPollIds: state.createdPollIds.filter((pid) => pid !== id),
        votedPollIds: state.votedPollIds.filter((pid) => pid !== id),
      }));
      setElections((prev) => prev.filter((e) => e.id !== id));
      setLoading(false);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to delete poll.");
      setLoading(false);
    }
  };

  const handleStartPoll = async (id: string) => {
    setLoading(true);
    setErrorMessage("");
    try {
      await apiStartPoll(id);
      await loadPolls();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to start poll.");
      setLoading(false);
    }
  };

  const handleEndPoll = async (id: string) => {
    setLoading(true);
    setErrorMessage("");
    try {
      await apiEndPoll(id);
      await loadPolls();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to end poll.");
      setLoading(false);
    }
  };

  const handleVote = async (pollId: string, optionIdx: number) => {
    setLoading(true);
    setErrorMessage("");
    try {
      await apiCastVote(pollId, optionIdx);
      addVotedPollId(pollId);
      await loadPolls();
      alert("Vote cast successfully!");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to cast vote.");
      setLoading(false);
    }
  };

  const handleImportPoll = async () => {
    const trimmedId = searchQuery.trim();
    if (!trimmedId) return;
    setImporting(true);
    setErrorMessage("");
    try {
      const data = await apiGetPoll(trimmedId);
      
      // Access control check for import:
      const parsed = parsePollDescription(data.description);
      if (parsed.isPrivate && data.admin_id !== currentUserId) {
        const userEmail = user?.email?.toLowerCase();
        if (!userEmail || !parsed.allowedEmails.includes(userEmail)) {
          throw new Error("Access Denied: You are not authorized to view or participate in this private election.");
        }
      }

      addVotedPollId(data.id);
      setSearchQuery("");
      alert(`Successfully imported poll: ${data.title}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Could not find a poll with this ID.");
    } finally {
      setImporting(false);
    }
  };

  const isUuid = (str: string) => {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str.trim());
  };

  const filteredElections = elections.filter((e) => {
    // Access control check: If simulated private, user must be owner or allowed email
    if (e.isPrivate && e.adminId !== currentUserId) {
      const userEmail = user?.email?.toLowerCase();
      if (!userEmail || !e.allowedEmails.includes(userEmail)) {
        return false; // Hide from feed
      }
    }
    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || e.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 select-none">
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

      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Filter and Search controls */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Search */}
        <div className="md:col-span-6 relative group flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-primary transition-all" />
            <input
              type="text"
              placeholder="Search elections or enter Poll UUID to import..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/5 border border-white/5 text-xs placeholder-white/30 focus:bg-white/10 focus:border-primary focus:outline-none transition-all"
            />
          </div>
          {isUuid(searchQuery) && (
            <Button
              onClick={handleImportPoll}
              disabled={importing}
              className="h-11 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs"
            >
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Import"}
            </Button>
          )}
        </div>

        {/* Status Dropdown */}
        <div className="md:col-span-4 relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
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
            onClick={loadPolls}
            disabled={loading}
            className="w-full h-11 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-white/60 ${loading ? "animate-spin text-primary" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Election Grid / List */}
      <div className="grid grid-cols-1 gap-4">
        {loading && elections.length === 0 ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-card border border-white/10 rounded-2xl p-5 md:p-6 space-y-4 animate-pulse"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="h-5 bg-white/10 rounded w-1/3" />
                    <div className="h-4 bg-white/5 rounded w-16" />
                    <div className="h-4 bg-white/5 rounded w-12" />
                  </div>
                  <div className="h-4 bg-white/5 rounded w-1/2" />
                  <div className="flex items-center gap-4 text-[10px] text-white/40 pt-1">
                    <div className="h-3 bg-white/5 rounded w-20" />
                    <div className="h-3 bg-white/5 rounded w-36" />
                  </div>
                </div>
                <div className="h-10 w-24 bg-white/5 rounded-xl" />
              </div>
            </div>
          ))
        ) : filteredElections.length === 0 ? (
          <div className="border border-white/5 rounded-3xl p-12 text-center bg-white/[0.01] space-y-4">
            <ShieldCheck className="w-12 h-12 text-white/20 mx-auto" />
            <h3 className="text-base font-bold text-white">No Elections Found</h3>
            <p className="text-xs text-white/40 max-w-sm mx-auto">
              We couldn&apos;t find any elections matching your search or filters. Create or import one to get started!
            </p>
          </div>
        ) : (
          filteredElections.map((elec) => {
            const isDetailOpen = activeElectionDetails === elec.id;
            const isOwner = elec.adminId === currentUserId;
            const canVote = elec.status === "Active" && !votedPollIds.includes(elec.id) && (!isOwner || elec.category === "Admin Allowed");

            return (
              <div
                key={elec.id}
                className="bg-card border border-white/10 rounded-2xl p-5 md:p-6 space-y-4 hover:border-white/15 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-white">{elec.title}</h3>
                      {elec.votes === null ? (
                        <div className="h-4 w-12 bg-white/10 rounded animate-pulse" />
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/50 border border-white/5 uppercase font-bold">
                          {elec.category}
                        </span>
                      )}
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
                    {elec.description === "Loading details..." ? (
                      <div className="h-4 bg-white/5 rounded animate-pulse w-1/2 mt-1" />
                    ) : (
                      <p className="text-xs text-white/50">{elec.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-[10px] text-white/40 font-mono pt-1">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-primary" /> {elec.votes === null ? (
                          <span className="inline-block w-8 h-3 bg-white/10 rounded animate-pulse align-middle" />
                        ) : `${elec.votes} Votes Cast`}
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
                    {isOwner && (
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
                          {elec.candidates === null ? (
                            <div className="space-y-2 py-2">
                              <div className="h-6 bg-white/5 rounded animate-pulse w-full" />
                              <div className="h-6 bg-white/5 rounded animate-pulse w-5/6" />
                            </div>
                          ) : elec.choicesHidden ? (
                            <div className="space-y-4 py-2">
                              <div className="space-y-2">
                                {elec.candidates.map((cand: any, idx: number) => (
                                  <div key={idx} className="flex justify-between text-[11px] items-center border-b border-white/5 pb-2 last:border-b-0 last:pb-0">
                                    <span className="font-bold text-white/80">{cand.name}</span>
                                    {canVote && (
                                      <button
                                        onClick={() => handleVote(elec.id, idx)}
                                        className="px-2 py-0.5 rounded bg-primary text-white text-[10px] font-bold hover:bg-primary/80 transition-all cursor-pointer"
                                      >
                                        Vote
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                              <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-[10px] text-primary leading-normal flex items-start gap-2">
                                <Lock className="w-4 h-4 shrink-0 text-primary mt-0.5" />
                                <span>Zero-Knowledge Encryption Active. Ballots are encrypted locally. Results will be decrypted and validated by consensus validator nodes once the voting period closes.</span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              {elec.candidates.map((cand: any, idx: number) => {
                                const pct = elec.votes > 0 ? Math.round((cand.votes / elec.votes) * 100) : 0;
                                return (
                                  <div key={idx} className="space-y-1">
                                    <div className="flex justify-between text-[11px] items-center">
                                      <span className="font-bold text-white/80">{cand.name}</span>
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-white/60">{cand.votes} votes ({pct}%)</span>
                                        {canVote && (
                                          <button
                                            onClick={() => handleVote(elec.id, idx)}
                                            className="px-2 py-0.5 rounded bg-primary text-white text-[10px] font-bold hover:bg-primary/80 transition-all cursor-pointer"
                                          >
                                            Vote
                                          </button>
                                        )}
                                      </div>
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
                          )}
                        </div>

                        {/* Cryptographic Ledger Details & Admin controls */}
                        <div className="space-y-3 bg-white/[0.01] border border-white/5 p-4 rounded-xl flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-white flex items-center gap-1.5">
                              <Lock className="w-4 h-4 text-primary" /> Consensus & Administration
                            </h4>
                            <p className="text-[10px] text-white/50 mt-2 leading-relaxed">
                              Each ballot cast is encrypted locally. The consensus ledger is signed by 6 validator nodes.
                            </p>
                          </div>

                          {isOwner && (
                            <div className="flex gap-2 pt-2">
                              {elec.status === "Scheduled" && (
                                <Button
                                  onClick={() => handleStartPoll(elec.id)}
                                  className="flex-1 h-9 rounded-lg bg-primary text-white text-[11px] font-bold flex items-center justify-center gap-1"
                                >
                                  <Play className="w-3.5 h-3.5" /> Start Voting
                                </Button>
                              )}
                              {elec.status === "Active" && (
                                <Button
                                  onClick={() => handleEndPoll(elec.id)}
                                  className="flex-1 h-9 rounded-lg bg-red-500 hover:bg-red-600 text-white text-[11px] font-bold flex items-center justify-center gap-1"
                                >
                                  <StopCircle className="w-3.5 h-3.5" /> Close Voting
                                </Button>
                              )}
                              {elec.status === "Completed" && (
                                <Button
                                  onClick={() => router.push(`/feed/results?pollId=${elec.id}`)}
                                  className="flex-1 h-9 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center gap-1"
                                >
                                  <Download className="w-3.5 h-3.5" /> View Ledger Results
                                </Button>
                              )}
                            </div>
                          )}

                          <div className="bg-black/40 border border-white/5 p-3 rounded-lg mt-2 font-mono text-[9px] text-white/60 space-y-1">
                            <div className="flex justify-between">
                              <span>Poll UUID:</span>
                              <span className="text-white select-all truncate max-w-[150px]">{elec.id}</span>
                            </div>
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

export default function ElectionsPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <ElectionsPageContent />
    </React.Suspense>
  );
}
