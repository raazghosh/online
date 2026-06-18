"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Vote,
  Users,
  Calendar,
  Lock,
  Plus,
  Trash2,
  Upload,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  FileText,
  UserCheck,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiCreatePoll, apiGetTeams, apiGetTeamMembers } from "@/lib/api";
import { useVotingStore } from "@/store/useVotingStore";
import { useEffect } from "react";

interface Candidate {
  name: string;
  bio: string;
}

export default function CreateElectionPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");

  // Form states
  // Step 1: Details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Council");

  // Step 2: Candidates
  const [candidates, setCandidates] = useState<Candidate[]>([
    { name: "", bio: "" }
  ]);

  // Step 3: Voters
  const [voterMethod, setVoterMethod] = useState<"manual" | "csv" | "team">("manual");
  const [manualVoters, setManualVoters] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [selectedTeamEmails, setSelectedTeamEmails] = useState<string[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false);

  useEffect(() => {
    if (voterMethod === "team" && teamMembers.length === 0) {
      const loadTeamMembers = async () => {
        setLoadingTeamMembers(true);
        try {
          const teams = await apiGetTeams();
          if (teams && teams.length > 0) {
            const members = await apiGetTeamMembers(teams[0].id);
            if (members) {
              const mapped = members.map((m: any) => {
                const userObj = m.user || {};
                const firstName = userObj.first_name || m.first_name || "";
                const lastName = userObj.last_name || m.last_name || "";
                let fullName = `${firstName} ${lastName}`.trim();
                if (!fullName) {
                  fullName = userObj.username || m.username || userObj.email || m.email || "Team Member";
                }
                return {
                  name: fullName,
                  email: userObj.email || m.email || ""
                };
              }).filter((m: any) => m.email);
              setTeamMembers(mapped);
              setSelectedTeamEmails(mapped.map((m: any) => m.email));
            }
          }
        } catch {
          // Fail silently
        } finally {
          setLoadingTeamMembers(false);
        }
      };
      loadTeamMembers();
    }
  }, [voterMethod, teamMembers.length]);

  // Step 4: Schedule
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timezone, setTimezone] = useState("UTC+5:30 (IST)");

  // Step 5: Publish/Submit UX
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  const handleAddCandidate = () => {
    setCandidates([...candidates, { name: "", bio: "" }]);
  };

  const handleRemoveCandidate = (index: number) => {
    setCandidates(candidates.filter((_, idx) => idx !== index));
  };

  const handleCandidateChange = (index: number, field: keyof Candidate, value: string) => {
    const updated = [...candidates];
    updated[index] = { ...updated[index], [field]: value };
    setCandidates(updated);
  };

  const handleNext = () => {
    if (step < 5) setStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(prev => prev - 1);
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    setErrorMessage("");
    try {
      const options = candidates.map(c => c.name.trim()).filter(Boolean);
      if (options.length < 2) {
        throw new Error("An election must have at least two choices/candidates.");
      }

      let finalStart: string | undefined = undefined;
      let finalEnd: string | undefined = undefined;

      if (startDate) {
        let startD = new Date(startDate);
        const minStart = new Date(Date.now() + 15000); // 15s safety buffer
        if (startD < minStart) {
          startD = minStart;
        }
        finalStart = startD.toISOString();

        if (endDate) {
          let endD = new Date(endDate);
          if (endD <= startD) {
            endD = new Date(startD.getTime() + 60000); // Bump end to 1 minute after start if invalid
          }
          finalEnd = endD.toISOString();
        }
      }

      // Parse voter invitations based on selected method
      let emailInvites: { email: string }[] = [];
      if (voterMethod === "manual") {
        emailInvites = manualVoters
          .split(/[\n,;]+/)
          .map(e => e.trim())
          .filter(e => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
          .map(email => ({ email }));
      } else if (voterMethod === "csv" && csvFile) {
        try {
          const text = await csvFile.text();
          emailInvites = text
            .split(/\r?\n/)
            .map(line => line.split(",")[0]?.trim())
            .filter(e => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
            .map(email => ({ email }));
        } catch {
          throw new Error("Failed to parse CSV file. Ensure it has email addresses in the first column.");
        }
      } else if (voterMethod === "team") {
        emailInvites = selectedTeamEmails.map(email => ({ email }));
      }

      const body = {
        title,
        description,
        options,
        allow_admin_vote: true, // Allow owner to cast votes/test
        voting_start_at: finalStart,
        voting_end_at: finalEnd,
        auto_start: false,
        visibility: emailInvites.length > 0 ? ("private" as const) : ("public" as const),
        email_invites: emailInvites.length > 0 ? emailInvites : undefined,
        client_request_id: `web-create-${Date.now()}`
      };

      const res = await apiCreatePoll(body);
      
      // Save to Zustand store
      useVotingStore.getState().addCreatedPollId(res.poll.id);

      setPublishSuccess(true);
      setTimeout(() => {
        router.push("/feed/elections");
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create election.");
    } finally {
      setIsPublishing(false);
    }
  };

  const stepLabels = [
    { num: 1, label: "Details" },
    { num: 2, label: "Candidates" },
    { num: 3, label: "Voters" },
    { num: 4, label: "Schedule" },
    { num: 5, label: "Publish" }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8 select-none">
      {/* Back button */}
      <div>
        <button
          onClick={() => router.push("/feed/elections")}
          className="flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Elections List
        </button>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Vote className="text-primary w-6 h-6" /> Create New Election
        </h1>
        <p className="text-xs text-white/50">Setup ballot choices, list voters, and launch decentralized elections.</p>
      </div>

      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Progress indicators */}
      <div className="grid grid-cols-5 gap-2 text-center">
        {stepLabels.map((s) => (
          <div key={s.num} className="space-y-2">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step >= s.num ? "bg-primary" : "bg-white/5"
              }`}
            />
            <span
              className={`text-[10px] font-bold uppercase tracking-wider block transition-colors ${
                step === s.num ? "text-primary" : "text-white/30"
              }`}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Multi-step Form Card */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl relative min-h-[380px] flex flex-col justify-between overflow-hidden">
        <div className="absolute -top-24 -right-24 w-40 h-40 rounded-full bg-primary/10 blur-[50px] pointer-events-none -z-10" />
        <div className="absolute -bottom-24 -left-24 w-40 h-40 rounded-full bg-accent/10 blur-[50px] pointer-events-none -z-10" />

        <AnimatePresence mode="wait">
          {/* Step 1: Details */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <h2 className="text-lg font-bold text-white flex items-center gap-1.5">
                <FileText className="w-5 h-5 text-primary" /> Step 1: Election Details
              </h2>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/70">Election Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Technology Advisory Council Election"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-white/30 text-xs focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/70">Category</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl bg-[#080c1c] border border-white/10 text-white text-xs focus:border-primary focus:outline-none appearance-none"
                    >
                      <option value="Council">Council Election</option>
                      <option value="Feedback">Feedback Poll</option>
                      <option value="Survey">Community Survey</option>
                      <option value="Resolution">Board Resolution</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/70">Description / Guidelines</label>
                  <textarea
                    rows={4}
                    placeholder="Provide details, voting instructions, or rules for this election..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full p-4 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-white/30 text-xs focus:border-primary focus:outline-none resize-none"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Candidates */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h2 className="text-lg font-bold text-white flex items-center gap-1.5">
                  <Users className="w-5 h-5 text-primary" /> Step 2: Candidates / Options
                </h2>
                <button
                  type="button"
                  onClick={handleAddCandidate}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Choice
                </button>
              </div>

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {candidates.map((cand, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-white/[0.01] border border-white/5 p-4 rounded-xl relative group">
                    <div className="sm:col-span-4 space-y-1">
                      <label className="text-[10px] text-white/40 uppercase font-semibold">Name / Option</label>
                      <input
                        type="text"
                        placeholder="Candidate Name"
                        value={cand.name}
                        onChange={e => handleCandidateChange(idx, "name", e.target.value)}
                        className="w-full h-10 px-3 rounded-lg bg-white/[0.03] border border-white/10 text-white text-xs focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-7 space-y-1">
                      <label className="text-[10px] text-white/40 uppercase font-semibold">Short Bio / Description</label>
                      <input
                        type="text"
                        placeholder="Designation, experience, or notes"
                        value={cand.bio}
                        onChange={e => handleCandidateChange(idx, "bio", e.target.value)}
                        className="w-full h-10 px-3 rounded-lg bg-white/[0.03] border border-white/10 text-white text-xs focus:border-primary focus:outline-none"
                      />
                    </div>
                    {candidates.length > 1 && (
                      <div className="sm:col-span-1 text-center pt-4 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => handleRemoveCandidate(idx)}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 3: Voters */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <h2 className="text-lg font-bold text-white flex items-center gap-1.5">
                <UserCheck className="w-5 h-5 text-primary" /> Step 3: Voter Registration
              </h2>

              <div className="grid grid-cols-3 gap-3 border-b border-white/5 pb-4">
                {[
                  { id: "manual", label: "Manual Entry", desc: "List emails manually" },
                  { id: "csv", label: "CSV Upload", desc: "Batch import spreadsheet" },
                  { id: "team", label: "Team Members", desc: "Import organization users" }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setVoterMethod(item.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      voterMethod === item.id
                        ? "bg-primary/20 border-primary text-white"
                        : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                    }`}
                  >
                    <p className="text-xs font-bold">{item.label}</p>
                    <p className="text-[9px] opacity-70 mt-0.5">{item.desc}</p>
                  </button>
                ))}
              </div>

              <div>
                {voterMethod === "manual" && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/70">Voter Email List</label>
                    <textarea
                      rows={5}
                      placeholder="voter1@email.com, voter2@email.com, voter3@email.com..."
                      value={manualVoters}
                      onChange={e => setManualVoters(e.target.value)}
                      className="w-full p-4 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-white/30 text-xs focus:border-primary focus:outline-none resize-none font-mono"
                    />
                    <p className="text-[10px] text-white/40">Separate emails with commas, semicolons or new lines.</p>
                  </div>
                )}

                {voterMethod === "csv" && (
                  <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-white/[0.01] hover:bg-white/[0.03] transition-all relative overflow-hidden group">
                    <Upload className="w-8 h-8 text-white/40 group-hover:text-primary transition-all mb-2" />
                    <p className="text-xs font-bold text-white/75">Choose CSV File</p>
                    <p className="text-[10px] text-white/40 mt-1">First column must contain voter email addresses</p>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={e => setCsvFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    {csvFile && (
                      <div className="absolute inset-0 bg-[#0c122c] flex items-center justify-center gap-2 p-4 text-xs font-semibold text-emerald-400">
                        <CheckCircle className="w-5 h-5" />
                        <span>{csvFile.name}</span>
                      </div>
                    )}
                  </div>
                )}

                {voterMethod === "team" && (
                  <div className="bg-white/[0.01] border border-white/5 p-4 rounded-xl space-y-3">
                    <p className="text-xs text-white/60">Select all team members to import as verified voters.</p>
                    {loadingTeamMembers ? (
                      <div className="flex items-center gap-2 text-white/40 text-[10px] py-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Loading team members...</span>
                      </div>
                    ) : teamMembers.length === 0 ? (
                      <p className="text-[10px] text-white/40 py-2">No team members found. Please configure your team first in the Team page.</p>
                    ) : (
                      <div className="space-y-2 max-h-36 overflow-y-auto">
                        {teamMembers.map((member, i) => (
                          <label key={i} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/5 cursor-pointer text-xs">
                            <input
                              type="checkbox"
                              checked={selectedTeamEmails.includes(member.email)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedTeamEmails([...selectedTeamEmails, member.email]);
                                } else {
                                  setSelectedTeamEmails(selectedTeamEmails.filter(email => email !== member.email));
                                }
                              }}
                              className="rounded border-white/10 bg-white/5 text-primary"
                            />
                            <span>{member.name} - <span className="text-white/40 font-mono">{member.email}</span></span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 4: Schedule */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <h2 className="text-lg font-bold text-white flex items-center gap-1.5">
                <Calendar className="w-5 h-5 text-primary" /> Step 4: Schedule & Zone
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/70">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-white/[0.03] border border-white/10 text-white text-xs focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/70">End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-white/[0.03] border border-white/10 text-white text-xs focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-semibold text-white/70">Time Zone</label>
                  <select
                    value={timezone}
                    onChange={e => setTimezone(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-[#080c1c] border border-white/10 text-white text-xs focus:border-primary focus:outline-none appearance-none"
                  >
                    <option value="UTC+5:30 (IST)">UTC+5:30 (IST) - India Standard Time</option>
                    <option value="UTC-5:00 (EST)">UTC-5:00 (EST) - Eastern Standard Time</option>
                    <option value="UTC+0:00 (GMT)">UTC+0:00 (GMT) - Greenwich Mean Time</option>
                    <option value="UTC+8:00 (SGT)">UTC+8:00 (SGT) - Singapore Standard Time</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 5: Publish/Preview */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-6 relative"
            >
              {isPublishing && (
                <div className="absolute inset-0 bg-[#050816]/95 backdrop-blur-md z-30 flex flex-col items-center justify-center gap-4 text-center">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent"
                    />
                    <Lock className="w-5 h-5 text-primary animate-pulse" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Initializing Cryptographic Consensus Ledger...</h3>
                  <p className="text-[10px] text-white/50 max-w-xs leading-normal">
                    Broadcasting election hashes to validator nodes SFO-02, AMS-01, and SGP-03.
                  </p>
                </div>
              )}

              {publishSuccess && (
                <div className="absolute inset-0 bg-[#050816] z-30 flex flex-col items-center justify-center gap-3 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Election Successfully Launched</h3>
                  <p className="text-xs text-white/50">Decentralized hashes generated and verified.</p>
                </div>
              )}

              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <CheckCircle className="w-5 h-5 text-primary" /> Step 5: Review & Publish
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Details Summary */}
                <div className="space-y-3 bg-white/[0.01] border border-white/5 p-4 rounded-xl">
                  <h3 className="font-bold text-white">Election Details</h3>
                  <div className="space-y-1.5 text-white/70">
                    <p><span className="text-white/40">Title:</span> {title || "Untitled Election"}</p>
                    <p><span className="text-white/40">Category:</span> {category}</p>
                    <p><span className="text-white/40">Schedule:</span> {startDate || "Immediate"} to {endDate || "Until Closed"}</p>
                    <p><span className="text-white/40">Time Zone:</span> {timezone}</p>
                  </div>
                </div>

                {/* Candidate/Options Summary */}
                <div className="space-y-3 bg-white/[0.01] border border-white/5 p-4 rounded-xl">
                  <h3 className="font-bold text-white">Candidates / Choices ({candidates.filter(c => c.name).length})</h3>
                  <div className="space-y-1 max-h-24 overflow-y-auto text-white/70">
                    {candidates.filter(c => c.name).map((cand, idx) => (
                      <p key={idx}>• {cand.name} <span className="text-white/40">({cand.bio})</span></p>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 p-4 rounded-2xl flex items-start gap-3">
                <Lock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-xs text-primary/80">
                  <p className="font-bold">Cryptographic Commitment</p>
                  <p className="text-[10px] opacity-90 mt-0.5">
                    Once published, election parameters are cryptographically anchored. Changing choices or dates is disabled.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Controls */}
        <div className="flex justify-between items-center mt-8 border-t border-white/5 pt-6">
          <button
            onClick={handleBack}
            disabled={step === 1 || isPublishing || publishSuccess}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all select-none cursor-pointer ${
              step === 1 || isPublishing || publishSuccess
                ? "opacity-30 cursor-not-allowed text-white/40"
                : "bg-white/5 border border-white/10 text-white/80 hover:bg-white/10"
            }`}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {step < 5 ? (
            <Button
              onClick={handleNext}
              disabled={step === 1 && !title}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:shadow-[0_0_20px_rgba(49,107,243,0.3)] transition-all cursor-pointer"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handlePublish}
              disabled={isPublishing || publishSuccess}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-xs hover:shadow-[0_0_30px_rgba(49,107,243,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              Publish Election <CheckCircle className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
