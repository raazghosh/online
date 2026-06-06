"use client";

import * as React from "react";
import { useState } from "react";
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
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Poll {
  id: string;
  question: string;
  category: string;
  status: "active" | "closed";
  options: { label: string; votes: number }[];
  endDate: string;
}

export default function PollsPage() {
  const router = useRouter();

  // Mock Polls
  const [polls, setPolls] = useState<Poll[]>([
    {
      id: "p1",
      question: "Which office working model do you prefer?",
      category: "Workplace",
      status: "active",
      options: [
        { label: "Fully Remote", votes: 45 },
        { label: "Hybrid (2-3 days office)", votes: 92 },
        { label: "Fully Onsite", votes: 14 }
      ],
      endDate: "2026-06-15"
    },
    {
      id: "p2",
      question: "Choose the theme color for our new voting simulator dashboard.",
      category: "Design",
      status: "active",
      options: [
        { label: "Cyberpunk Glow", votes: 68 },
        { label: "Glassmorphism Dark", votes: 112 },
        { label: "Minimalist Light", votes: 24 }
      ],
      endDate: "2026-06-08"
    },
    {
      id: "p3",
      question: "Approval for the Q3 corporate budget allocations.",
      category: "Finance",
      status: "closed",
      options: [
        { label: "Approve", votes: 154 },
        { label: "Disapprove", votes: 22 },
        { label: "Abstain", votes: 12 }
      ],
      endDate: "2026-05-30"
    }
  ]);

  // Create poll fields
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newCategory, setNewCategory] = useState("Workplace");
  const [newOptions, setNewOptions] = useState<string[]>(["", ""]);

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

  const handleCreatePollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion || newOptions.filter(o => o).length < 2) return;

    const formattedOptions = newOptions
      .filter(o => o)
      .map(o => ({ label: o, votes: 0 }));

    const newPoll: Poll = {
      id: `p_${Date.now()}`,
      question: newQuestion,
      category: newCategory,
      status: "active",
      options: formattedOptions,
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    };

    setPolls([newPoll, ...polls]);
    setShowCreateModal(false);
    setNewQuestion("");
    setNewOptions(["", ""]);
  };

  const handleClosePoll = (id: string) => {
    setPolls(prev =>
      prev.map(p => (p.id === id ? { ...p, status: "closed" as const } : p))
    );
  };

  const handleDeletePoll = (id: string) => {
    setPolls(prev => prev.filter(p => p.id !== id));
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

      {/* Poll list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {polls.map((poll) => {
          const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);

          return (
            <div
              key={poll.id}
              className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm flex flex-col justify-between space-y-6 hover:border-white/15 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-white/5 text-white/60 border border-white/5 font-bold uppercase tracking-wider">
                    {poll.category}
                  </span>
                  <span
                    className={`text-[8px] px-2 py-0.5 rounded font-black uppercase ${
                      poll.status === "active"
                        ? "bg-primary/20 text-primary border border-primary/25"
                        : "bg-white/5 text-white/40 border border-white/5"
                    }`}
                  >
                    {poll.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white leading-snug">{poll.question}</h3>
              </div>

              {/* Options details */}
              <div className="space-y-3">
                {poll.options.map((opt, idx) => {
                  const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                  return (
                    <div key={idx} className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-white/80">{opt.label}</span>
                        <span className="text-white/40 font-mono">{opt.votes} votes ({pct}%)</span>
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

              {/* Footer info & operations */}
              <div className="flex items-center justify-between border-t border-white/5 pt-4 text-[10px] text-white/40">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-primary" /> Ends: {poll.endDate}
                </span>

                <div className="flex items-center gap-2">
                  {poll.status === "active" ? (
                    <button
                      onClick={() => handleClosePoll(poll.id)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/15 hover:bg-amber-500/20 text-amber-400 font-bold transition-all cursor-pointer"
                    >
                      Close Poll
                    </button>
                  ) : (
                    <button
                      onClick={() => router.push("/feed/results")}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/15 hover:bg-emerald-500/20 text-emerald-400 font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> Export
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
                  className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:shadow-[0_0_20px_rgba(49,107,243,0.3)] transition-all"
                >
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
