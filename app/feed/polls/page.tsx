"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  PlusCircle,
  TrendingUp,
  Download,
  Trash2,
  Lock,
  Calendar,
  CheckCircle,
  XCircle,
  HelpCircle,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useVotingStore } from "@/store/useVotingStore";
import { Button } from "@/components/ui/button";
import {
  apiGetPoll,
  apiGetResults,
  apiCreatePoll,
  apiEndPoll,
  apiDeletePoll,
  apiCastVote,
  apiGetPolls
} from "@/lib/api";

interface OptionTally {
  label: string;
  votes: number;
}

interface UIInstancePoll {
  id: string;
  question: string;
  category: string;
  status: "active" | "closed";
  options: OptionTally[] | null;
  endDate: string;
  ballotMode?: string;
  choicesHidden?: boolean;
}

export default function PollsPage() {
  const router = useRouter();
  const user = useVotingStore((state) => state.user);
  const createdPollIds = useVotingStore((state) => state.createdPollIds);
  const votedPollIds = useVotingStore((state) => state.votedPollIds);

  const [polls, setPolls] = useState<UIInstancePoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Create poll fields
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newCategory, setNewCategory] = useState("Workplace");
  const [newOptions, setNewOptions] = useState<string[]>(["", ""]);
  const [submitting, setSubmitting] = useState(false);

  const loadPolls = React.useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await apiGetPolls({ scope: "feed", limit: 100 });
      const pollsList = res.data || [];

      // Step 1: Render basic polls list instantly
      const initialPolls = pollsList.map((poll: any) => ({
        id: poll.id,
        question: poll.title,
        category: "General",
        status: poll.status === "active" ? ("active" as const) : ("closed" as const),
        options: null,
        endDate: poll.voting_end_at ? new Date(poll.voting_end_at).toLocaleDateString() : "Manual Close",
        ballotMode: poll.ballot_mode || "legacy_plaintext",
        choicesHidden: false,
      }));
      setPolls(initialPolls);
      setLoading(false);

      // Step 2: Fetch detailed options & results in background
      const promises = pollsList.map(async (poll: any) => {
        try {
          const data = await apiGetPoll(poll.id);
          let resultsData = null;
          try {
            resultsData = await apiGetResults(poll.id);
          } catch {}

          const formattedOptions = (data.options || []).map((opt: string) => ({
            label: opt,
            votes: resultsData?.votes?.[opt] || 0,
          }));

          return {
            id: data.id,
            category: data.description && data.description.startsWith("Category: ")
              ? data.description.replace("Category: ", "")
              : "General",
            options: formattedOptions,
            ballotMode: data.ballot_mode || "legacy_plaintext",
            choicesHidden: resultsData?.choices_hidden || false,
          };
        } catch {
          return null;
        }
      });

      const bgData = await Promise.all(promises);

      // Step 3: Populate options dynamically
      setPolls((prev) =>
        prev
          .map((item) => {
            const bgItem = bgData.find((d) => d && d.id === item.id);
            if (bgItem) {
              return {
                ...item,
                category: bgItem.category,
                options: bgItem.options,
                ballotMode: bgItem.ballotMode,
                choicesHidden: bgItem.choicesHidden,
              };
            }
            return item;
          })
          .filter((p) => p !== null)
      );
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load polls.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadPolls();
    }
  }, [user, loadPolls]);

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...newOptions];
    updated[idx] = val;
    setNewOptions(updated);
  };

  const handleAddOption = () => {
    setNewOptions([...newOptions, ""]);
  };

  const handleRemoveOption = (idx: number) => {
    setNewOptions(newOptions.filter((_, i) => i !== idx));
  };

  const handleCreatePollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOptions = newOptions.filter((o) => o.trim());
    if (!newQuestion || cleanOptions.length < 2) return;

    setSubmitting(true);
    setErrorMessage("");
    try {
      const body = {
        title: newQuestion,
        description: `Category: ${newCategory}`,
        options: cleanOptions,
        allow_admin_vote: true,
        auto_start: true, // Start immediately for instant polls
        duration_minutes: 10080, // Run for 7 days
      };

      const res = await apiCreatePoll(body);
      
      // Save created poll ID to store
      useVotingStore.getState().addCreatedPollId(res.poll.id);

      setShowCreateModal(false);
      setNewQuestion("");
      setNewOptions(["", ""]);
      await loadPolls();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to launch instant poll.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClosePoll = async (id: string) => {
    setLoading(true);
    setErrorMessage("");
    try {
      await apiEndPoll(id);
      await loadPolls();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to close poll.");
      setLoading(false);
    }
  };

  const handleVote = async (pollId: string, optionIdx: number) => {
    setLoading(true);
    setErrorMessage("");
    try {
      await apiCastVote(pollId, optionIdx);
      useVotingStore.getState().addVotedPollId(pollId);
      await loadPolls();
      alert("Vote cast successfully!");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to cast vote.");
      setLoading(false);
    }
  };

  const handleDeletePoll = async (id: string) => {
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
      setPolls((prev) => prev.filter((p) => p.id !== id));
      setLoading(false);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to delete poll.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 select-none relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="text-primary w-6 h-6" /> Poll Management
          </h1>
          <p className="text-xs text-white/50">Run instant community or corporate polls with encrypted tallies.</p>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:shadow-[0_0_20px_rgba(49,107,243,0.3)] transition-all cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" /> Create Instant Poll
        </Button>
      </div>

      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Poll list */}
      {loading && polls.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-card border border-white/10 rounded-3xl p-6 flex flex-col justify-between space-y-6 animate-pulse"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-5 bg-white/5 rounded w-16" />
                  <div className="h-4 bg-white/5 rounded w-12" />
                </div>
                <div className="h-5 bg-white/10 rounded w-2/3" />
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-white/5 rounded w-full" />
                <div className="h-1.5 bg-white/5 rounded-full w-full" />
                <div className="h-4 bg-white/5 rounded w-5/6" />
                <div className="h-1.5 bg-white/5 rounded-full w-5/6" />
              </div>
              <div className="flex items-center justify-between border-t border-white/5 pt-4">
                <div className="h-3 bg-white/5 rounded w-24" />
                <div className="h-3 bg-white/5 rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : polls.length === 0 ? (
        <div className="border border-white/5 rounded-3xl p-12 text-center bg-white/[0.01] space-y-4">
          <BarChart3 className="w-12 h-12 text-white/20 mx-auto" />
          <h3 className="text-base font-bold text-white">No Polls Found</h3>
          <p className="text-xs text-white/40 max-w-sm mx-auto">
            We couldn&apos;t find any polls under your account. Launch an instant poll to get started!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {polls.map((poll) => {
            const totalVotes = poll.options ? poll.options.reduce((sum, o) => sum + o.votes, 0) : 0;
            const canVote = poll.status === "active" && !votedPollIds.includes(poll.id);

            return (
              <div
                key={poll.id}
                className="bg-card border border-white/10 rounded-3xl p-6 flex flex-col justify-between space-y-6 hover:border-white/15 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    {poll.options === null ? (
                      <div className="h-5 w-16 bg-white/5 rounded animate-pulse" />
                    ) : (
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-white/5 text-white/60 border border-white/5 font-bold uppercase tracking-wider">
                        {poll.category}
                      </span>
                    )}
                    <span
                      className={`text-[8px] px-2 py-0.5 rounded font-black uppercase border ${
                        poll.status === "active"
                          ? "bg-primary/20 text-primary border-primary/25"
                          : "bg-white/5 text-white/40 border-white/5"
                      }`}
                    >
                      {poll.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white leading-snug">{poll.question}</h3>
                </div>

                <div className="space-y-3">
                  {poll.options === null ? (
                    <div className="space-y-3 py-1">
                      <div className="space-y-2">
                        <div className="h-4 bg-white/5 rounded animate-pulse w-full" />
                        <div className="h-1.5 bg-white/5 rounded-full animate-pulse w-full" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-white/5 rounded animate-pulse w-5/6" />
                        <div className="h-1.5 bg-white/5 rounded-full animate-pulse w-5/6" />
                      </div>
                    </div>
                  ) : poll.choicesHidden ? (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        {poll.options.map((opt, idx) => (
                          <div key={idx} className="flex justify-between items-center border-b border-white/5 pb-2 last:border-b-0 last:pb-0 text-xs">
                            <span className="text-white/80">{opt.label}</span>
                            {canVote && (
                              <button
                                onClick={() => handleVote(poll.id, idx)}
                                className="px-2 py-0.5 rounded bg-primary text-white text-[10px] font-bold hover:bg-primary/80 transition-all cursor-pointer"
                              >
                                Vote
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-[10px] text-primary leading-normal flex items-start gap-1.5">
                        <Lock className="w-3.5 h-3.5 shrink-0 text-primary mt-0.5" />
                        <span>Encrypted Zero-Knowledge Tallies active. Results decrypted after close.</span>
                      </div>
                    </div>
                  ) : (
                    poll.options.map((opt, idx) => {
                      const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                      return (
                        <div key={idx} className="space-y-1 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-white/80">{opt.label}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-white/40 font-mono">{opt.votes} votes ({pct}%)</span>
                              {canVote && (
                                <button
                                  onClick={() => handleVote(poll.id, idx)}
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
                    })
                  )}
                </div>

                {/* Footer info & operations */}
                <div className="flex items-center justify-between border-t border-white/5 pt-4 text-[10px] text-white/40">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-primary" /> Ends: {poll.endDate}
                  </span>

                  <div className="flex items-center gap-2">
                    {poll.status === "active" ? (
                      <button
                        onClick={() => handleClosePoll(poll.id)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/15 hover:bg-amber-500/20 text-amber-400 font-bold transition-all cursor-pointer text-[9px] uppercase tracking-wider"
                      >
                        Close Poll
                      </button>
                    ) : (
                      <button
                        onClick={() => router.push(`/feed/results?pollId=${poll.id}`)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/15 hover:bg-emerald-500/20 text-emerald-400 font-bold transition-all cursor-pointer flex items-center gap-1 text-[9px] uppercase tracking-wider"
                      >
                        <Download className="w-3 h-3" /> Results
                      </button>
                    )}
                    <button
                      onClick={() => handleDeletePoll(poll.id)}
                      className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/15 hover:bg-red-500/20 text-red-400 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Instant Poll */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#0c122c] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-40 h-40 rounded-full bg-primary/20 blur-[55px] pointer-events-none -z-10" />

            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                <HelpCircle className="w-5 h-5 text-primary animate-pulse" /> Create Instant Poll
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-white/40 hover:text-white transition-all"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePollSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/70">Poll Question</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Which project management framework should we adopt?"
                  value={newQuestion}
                  onChange={e => setNewQuestion(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/70">Category</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-[#080c1c] border border-white/10 text-white text-xs focus:border-primary focus:outline-none"
                >
                  <option value="Workplace">Workplace</option>
                  <option value="Design">Design</option>
                  <option value="Finance">Finance</option>
                  <option value="HR / Policy">HR / Policy</option>
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white/70">Poll Choices</label>
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-[10px] font-bold text-primary hover:underline"
                  >
                    + Add Choice
                  </button>
                </div>

                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {newOptions.map((opt, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        required
                        placeholder={`Choice #${idx + 1}`}
                        value={opt}
                        onChange={e => handleOptionChange(idx, e.target.value)}
                        className="flex-1 h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:border-primary focus:outline-none"
                      />
                      {newOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-white/5 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold transition-all text-white/80"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:shadow-[0_0_20px_rgba(49,107,243,0.3)] transition-all"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5 inline-block" /> : null}
                  Launch Instant Poll
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
