"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Fingerprint, KeyRound, Server, FileText, CheckCircle2, ArrowRight, RefreshCw, Cpu } from "lucide-react";
import { useVotingStore } from "@/store/useVotingStore";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

export function VotingSimulator() {
  const {
    simulatorStep,
    setSimulatorStep,
    simulatorChoice,
    setSimulatorChoice,
    voterVerificationData,
    setVoterVerificationData,
    generatedReceipt,
    setGeneratedReceipt,
    incrementVote,
    addAuditLog,
    nodes,
  } = useVotingStore();

  const [fullName, setFullName] = useState("");
  const [voterId, setVoterId] = useState("");
  const [authMethod, setAuthMethod] = useState<"biometric" | "webauthn" | "government_id">("biometric");

  // Step 2 Encryption logs state
  const [encryptionLogs, setEncryptionLogs] = useState<string[]>([]);
  
  // Step 3 Node confirmation simulation
  const [validatedNodes, setValidatedNodes] = useState<string[]>([]);

  useEffect(() => {
    if (simulatorStep === 0) {
      setFullName("");
      setVoterId(`SV-${Math.floor(100000 + Math.random() * 900000)}`);
      setEncryptionLogs([]);
      setValidatedNodes([]);
    }
  }, [simulatorStep]);

  // Step 2 Log Animation Simulator
  useEffect(() => {
    if (simulatorStep !== 2) return;
    setEncryptionLogs([]);
    const logs = [
      "Initializing secure ballot session...",
      "Acquiring ephemeral elliptic curve keypair...",
      "Encrypting ballot selection using AES-256-GCM...",
      "Formulating Zero-Knowledge (ZK) Range Proofs...",
      "Signing transaction payload with Voter Private Key...",
      "Encrypted ballot envelope ready for node distribution."
    ];
    let index = 0;
    const interval = setInterval(() => {
      if (index < logs.length) {
        setEncryptionLogs(prev => [...prev, logs[index]]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 800);
    return () => clearInterval(interval);
  }, [simulatorStep]);

  // Step 3 Node validation simulation
  useEffect(() => {
    if (simulatorStep !== 3) return;
    setValidatedNodes([]);
    const activeNodes = nodes.filter(n => n.status === "active");
    let index = 0;
    const interval = setInterval(() => {
      if (index < activeNodes.length) {
        const nodeId = activeNodes[index].id;
        setValidatedNodes(prev => [...prev, nodeId]);
        index++;
      } else {
        clearInterval(interval);
        // Automatically proceed to Step 4 once all active nodes validate
        setTimeout(() => {
          // Generate cryptograhic proof receipt
          const hashValue = "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
          const proofIdValue = `proof_${Math.floor(100000 + Math.random() * 900000)}`;
          const timeValue = new Date().toISOString();
          
          setGeneratedReceipt({
            hash: hashValue,
            proofId: proofIdValue,
            timestamp: timeValue,
          });

          // Write logs to Zustand Store
          addAuditLog({
            type: "IDENTITY_VERIFIED",
            message: `Voter ${fullName} (${voterId}) authenticated via ${authMethod}.`,
          });
          addAuditLog({
            type: "VOTE_ENCRYPTED",
            message: `Ballot selection encrypted. Hash signature: ${hashValue.substring(0, 10)}...`,
            hash: hashValue,
          });
          addAuditLog({
            type: "NODE_VALIDATED",
            message: `Ballot validated by ${activeNodes.length} decentralized nodes. Consensus reached.`,
            hash: hashValue,
          });
          addAuditLog({
            type: "RECEIPT_GENERATED",
            message: `Audit block successfully signed for selection ${simulatorChoice}.`,
            hash: hashValue,
          });

          // Increment global counter
          if (simulatorChoice) {
            incrementVote(simulatorChoice);
          }

          setSimulatorStep(4);
        }, 1000);
      }
    }, 700);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulatorStep]);

  const handleStartVoting = (choice: "YES" | "NO" | "ABSTAIN") => {
    setSimulatorChoice(choice);
    setSimulatorStep(1);
  };

  const handleIdentitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName) return;
    setVoterVerificationData({ fullName, voterId, authMethod });
    setSimulatorStep(2);
  };

  // Variants for step transition animation
  const stepVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <section id="simulator" className="py-24 relative z-10 overflow-hidden bg-surface/10 border-y border-border/50">
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 grid-bg opacity-[0.25] pointer-events-none" />

      <div className="max-w-[1280px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left Side: Content & Step Indicators */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold uppercase tracking-wider text-primary">
                Live Simulator
              </span>
              <h2 className="text-4xl sm:text-[48px] font-extrabold tracking-tight leading-none text-foreground">
                Cryptographic Ballot Box
              </h2>
              <p className="text-sm sm:text-base text-foreground/60 leading-relaxed">
                Experience how SecureVote processes democratic choices. Follow your ballot from client-side verification to blockchain consensus.
              </p>
            </div>

            {/* Workflow steps vertical indicator */}
            <div className="space-y-4">
              {[
                { step: 1, label: "Identity Verification", icon: Fingerprint },
                { step: 2, label: "Vote Encryption", icon: KeyRound },
                { step: 3, label: "Network Consensus", icon: Server },
                { step: 4, label: "Receipt Signing", icon: FileText },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = simulatorStep === item.step;
                const isCompleted = simulatorStep > item.step;
                return (
                  <div key={item.step} className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors duration-300 ${
                        isActive
                          ? "bg-primary text-white border-primary shadow-[0_0_15px_rgba(49,107,243,0.3)]"
                          : isCompleted
                          ? "bg-green-500/10 text-green-400 border-green-500/30"
                          : "bg-surface text-foreground/40 border-border"
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4
                        className={`text-sm font-bold transition-colors ${
                          isActive ? "text-foreground" : "text-foreground/50"
                        }`}
                      >
                        Step {item.step}: {item.label}
                      </h4>
                      <p className="text-xs text-foreground/40">
                        {item.step === 1 && "Decentralized identity claims"}
                        {item.step === 2 && "E2E client envelope sealing"}
                        {item.step === 3 && "Byzantine fault consensus verification"}
                        {item.step === 4 && "Zero-knowledge proof signing"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Side: Step Interface Card */}
          <div className="lg:col-span-7">
            <Card className="min-h-[420px] flex flex-col justify-between border-border/80 bg-card p-8 shadow-2xl relative">
              
              <AnimatePresence mode="wait">
                
                {/* STEP 0: Selection */}
                {simulatorStep === 0 && (
                  <motion.div
                    key="step0"
                    variants={stepVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-6 flex-1 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-foreground/45">Simulator Ballot Question</p>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-foreground leading-tight">
                        Should SecureVote become the standard for global nonprofit elections?
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
                      {[
                        { choice: "YES" as const, desc: "Approve standard", color: "hover:border-green-500/40 hover:bg-green-500/5 hover:text-green-400" },
                        { choice: "NO" as const, desc: "Reject standard", color: "hover:border-red-500/40 hover:bg-red-500/5 hover:text-red-400" },
                        { choice: "ABSTAIN" as const, desc: "Decline option", color: "hover:border-amber-500/40 hover:bg-amber-500/5 hover:text-amber-400" },
                      ].map((btn) => (
                        <button
                          key={btn.choice}
                          onClick={() => handleStartVoting(btn.choice)}
                          className={`p-6 rounded-2xl border border-border bg-surface/30 cursor-pointer flex flex-col items-center gap-2 transition-all duration-300 ${btn.color}`}
                        >
                          <span className="text-xl font-black tracking-wider">{btn.choice}</span>
                          <span className="text-xs text-foreground/40">{btn.desc}</span>
                        </button>
                      ))}
                    </div>

                    <p className="text-[11px] text-foreground/40 text-center">
                      *Participating in this demo simulates an encrypted voting chain on our mock ledger.
                    </p>
                  </motion.div>
                )}

                {/* STEP 1: Identity Verification */}
                {simulatorStep === 1 && (
                  <motion.div
                    key="step1"
                    variants={stepVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-6 flex-1 flex flex-col justify-between"
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary">Identity Check</p>
                      <h3 className="text-lg font-bold text-foreground">Verify Your Voter Registration</h3>
                    </div>

                    <form onSubmit={handleIdentitySubmit} className="space-y-4 my-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-1.5">
                            Full Name
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Alex Morgan"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-foreground placeholder-foreground/30 focus:border-primary focus:outline-none text-sm transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-1.5">
                            Voter ID
                          </label>
                          <input
                            type="text"
                            readOnly
                            value={voterId}
                            className="w-full px-4 py-2.5 rounded-xl bg-surface/50 border border-border text-foreground/60 focus:outline-none text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-2">
                          Authentication Credential
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { value: "biometric" as const, label: "FaceID / TouchID" },
                            { value: "webauthn" as const, label: "Security Key" },
                            { value: "government_id" as const, label: "Passport NFC" },
                          ].map((item) => (
                            <button
                              key={item.value}
                              type="button"
                              onClick={() => setAuthMethod(item.value)}
                              className={`p-3 rounded-xl border text-center text-xs font-semibold cursor-pointer transition-colors ${
                                authMethod === item.value
                                  ? "bg-primary/10 border-primary text-primary"
                                  : "bg-surface border-border text-foreground/60 hover:border-foreground/30"
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSimulatorStep(0)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" variant="primary" size="md" className="flex items-center gap-1.5">
                          Authenticate Identity
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* STEP 2: Vote Encryption */}
                {simulatorStep === 2 && (
                  <motion.div
                    key="step2"
                    variants={stepVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-6 flex-1 flex flex-col justify-between"
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary">Cryptographic Sealing</p>
                      <h3 className="text-lg font-bold text-foreground">Encrypting Ballot Envelope</h3>
                    </div>

                    <div className="bg-[#050816] rounded-xl border border-border p-4 font-mono text-xs text-green-400 space-y-2 max-h-[180px] overflow-y-auto">
                      {encryptionLogs.map((log, idx) => (
                        <div key={idx} className="flex gap-2">
                          <span className="text-green-500/40">{`>`}</span>
                          <p>{log}</p>
                        </div>
                      ))}
                      {encryptionLogs.length < 6 && (
                        <div className="flex items-center gap-1.5 text-green-400/60">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Generating keys...</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center bg-surface p-4 rounded-xl border border-border">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                        <span className="text-xs font-bold uppercase text-foreground/60">Selection</span>
                      </div>
                      <span className="font-extrabold text-sm text-foreground bg-primary/10 border border-primary/20 px-3 py-1 rounded-lg">
                        {simulatorChoice}
                      </span>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Button
                        variant="primary"
                        disabled={encryptionLogs.length < 6}
                        onClick={() => setSimulatorStep(3)}
                        className="flex items-center gap-1.5"
                      >
                        Distribute to Validators
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: Network Consensus */}
                {simulatorStep === 3 && (
                  <motion.div
                    key="step3"
                    variants={stepVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-6 flex-1 flex flex-col justify-between"
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary">Byzantine Fault Consensus</p>
                      <h3 className="text-lg font-bold text-foreground">Validating Signed Ballot Envelopes</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3 my-4">
                      {nodes.filter(n => n.status === "active").map((node) => {
                        const isNodeValidated = validatedNodes.includes(node.id);
                        return (
                          <div
                            key={node.id}
                            className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors duration-300 ${
                              isNodeValidated
                                ? "bg-green-500/10 border-green-500/30 text-green-400"
                                : "bg-surface border-border text-foreground/40"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Cpu className={`w-4 h-4 ${isNodeValidated ? "animate-pulse" : "opacity-40"}`} />
                              <span className="text-xs font-bold">{node.name.split(" ")[0]}</span>
                            </div>
                            <span className="text-[10px] uppercase font-semibold">
                              {isNodeValidated ? "Validated" : "Verifying..."}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-center gap-2 text-xs text-foreground/50">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
                      <span>Awaiting validator nodes signature thresholds...</span>
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: Receipt Generation */}
                {simulatorStep === 4 && (
                  <motion.div
                    key="step4"
                    variants={stepVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-6 flex-1 flex flex-col justify-between"
                  >
                    <div className="text-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center mx-auto shadow-lg shadow-green-500/10 mb-2">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-extrabold text-foreground">Ballot Verification Receipt</h3>
                      <p className="text-xs text-foreground/60">
                        Your vote has been cryptographically sealed and logged to the ledger.
                      </p>
                    </div>

                    <div className="bg-surface/50 border border-border rounded-xl p-4 font-mono text-xs space-y-2.5">
                      <div className="flex justify-between border-b border-border/40 pb-2">
                        <span className="text-foreground/40">BALLOT TALLY</span>
                        <span className="font-extrabold text-primary">{simulatorChoice}</span>
                      </div>
                      <div className="flex justify-between border-b border-border/40 pb-2">
                        <span className="text-foreground/40">RECEIPT HASH</span>
                        <span className="text-foreground/80 truncate max-w-[200px]" title={generatedReceipt?.hash}>
                          {generatedReceipt?.hash}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-border/40 pb-2">
                        <span className="text-foreground/40">PROOF ID</span>
                        <span className="text-foreground/80">{generatedReceipt?.proofId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/40">TIMESTAMP</span>
                        <span className="text-foreground/80">
                          {generatedReceipt ? new Date(generatedReceipt.timestamp).toLocaleString() : ""}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => setSimulatorStep(0)}
                      >
                        Vote Again
                      </Button>
                      <Button
                        variant="primary"
                        className="flex-1"
                        onClick={() => {
                          const dashboard = document.getElementById("dashboard");
                          if (dashboard) {
                            dashboard.scrollIntoView({ behavior: "smooth", block: "start" });
                          }
                        }}
                      >
                        View Dashboard Log
                      </Button>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </Card>
          </div>

        </div>
      </div>
    </section>
  );
}
