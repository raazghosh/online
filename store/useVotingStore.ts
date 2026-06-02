import { create } from "zustand";

export interface AuditLog {
  id: string;
  type: "IDENTITY_VERIFIED" | "VOTE_ENCRYPTED" | "NODE_VALIDATED" | "RECEIPT_GENERATED";
  message: string;
  timestamp: string;
  hash?: string;
  nodeName?: string;
}

export interface ValidatorNode {
  id: string;
  name: string;
  region: string;
  status: "active" | "synced" | "offline";
  latency: number;
  uptime: number;
  votesValidated: number;
}

export interface UserSession {
  username: string;
  email: string;
  role: "admin" | "voter";
  isVerified: boolean;
}

interface VotingState {
  // Authentication state
  user: UserSession | null;
  login: (username: string, email: string) => void;
  logout: () => void;
  register: (username: string, email: string) => void;

  // Simulator steps: 0 = Idle, 1 = Verification, 2 = Encryption, 3 = Network Validation, 4 = Receipt
  simulatorStep: number;
  setSimulatorStep: (step: number) => void;
  simulatorChoice: "YES" | "NO" | "ABSTAIN" | null;
  setSimulatorChoice: (choice: "YES" | "NO" | "ABSTAIN") => void;
  voterVerificationData: {
    fullName: string;
    voterId: string;
    authMethod: "biometric" | "webauthn" | "government_id";
  } | null;
  setVoterVerificationData: (data: { fullName: string; voterId: string; authMethod: "biometric" | "webauthn" | "government_id" }) => void;
  generatedReceipt: {
    hash: string;
    proofId: string;
    timestamp: string;
  } | null;
  setGeneratedReceipt: (receipt: { hash: string; proofId: string; timestamp: string } | null) => void;

  // Global Election Tallies (Mock live updates)
  votes: {
    YES: number;
    NO: number;
    ABSTAIN: number;
  };
  incrementVote: (choice: "YES" | "NO" | "ABSTAIN") => void;

  // Logs and Node States
  auditLogs: AuditLog[];
  addAuditLog: (log: Omit<AuditLog, "id" | "timestamp">) => void;
  clearLogs: () => void;
  nodes: ValidatorNode[];
  updateNodeLatency: (nodeId: string, latency: number) => void;
}

export const useVotingStore = create<VotingState>((set) => ({
  user: null,
  login: (username, email) =>
    set({
      user: {
        username,
        email,
        role: email.includes("admin") ? "admin" : "voter",
        isVerified: true,
      },
    }),
  logout: () => set({ user: null }),
  register: (username, email) =>
    set({
      user: {
        username,
        email,
        role: "voter",
        isVerified: false,
      },
    }),

  simulatorStep: 0,
  setSimulatorStep: (step) => set({ simulatorStep: step }),
  simulatorChoice: null,
  setSimulatorChoice: (choice) => set({ simulatorChoice: choice }),
  voterVerificationData: null,
  setVoterVerificationData: (data) => set({ voterVerificationData: data }),
  generatedReceipt: null,
  setGeneratedReceipt: (receipt) => set({ generatedReceipt: receipt }),

  votes: {
    YES: 4280,
    NO: 1912,
    ABSTAIN: 348,
  },
  incrementVote: (choice) =>
    set((state) => ({
      votes: {
        ...state.votes,
        [choice]: state.votes[choice] + 1,
      },
    })),

  auditLogs: [
    {
      id: "log_1",
      type: "NODE_VALIDATED",
      message: "Block #842,912 verified by Amsterdam validator node.",
      timestamp: "2026-06-03T00:54:12Z",
      hash: "8f7e2a9b...4c1d",
      nodeName: "AMS-01",
    },
    {
      id: "log_2",
      type: "RECEIPT_GENERATED",
      message: "Cryptographic proof receipt generated for ballot voter_id_4492.",
      timestamp: "2026-06-03T00:55:04Z",
      hash: "2a8e9b0d...8e7f",
    },
    {
      id: "log_3",
      type: "VOTE_ENCRYPTED",
      message: "AES-GCM 256-bit encryption signature attached to voter transaction.",
      timestamp: "2026-06-03T00:57:44Z",
      hash: "df8a719c...b02e",
    },
  ],
  addAuditLog: (log) =>
    set((state) => ({
      auditLogs: [
        {
          ...log,
          id: `log_${Date.now()}`,
          timestamp: new Date().toISOString(),
        },
        ...state.auditLogs,
      ].slice(0, 50), // keep latest 50 logs
    })),
  clearLogs: () => set({ auditLogs: [] }),

  nodes: [
    {
      id: "node_1",
      name: "AMS-01 (Amsterdam)",
      region: "Europe",
      status: "active",
      latency: 14,
      uptime: 99.99,
      votesValidated: 14890,
    },
    {
      id: "node_2",
      name: "SFO-02 (San Francisco)",
      region: "US West",
      status: "active",
      latency: 28,
      uptime: 99.98,
      votesValidated: 22140,
    },
    {
      id: "node_3",
      name: "SGP-03 (Singapore)",
      region: "Asia Pacific",
      status: "active",
      latency: 42,
      uptime: 99.95,
      votesValidated: 11090,
    },
    {
      id: "node_4",
      name: "TKO-04 (Tokyo)",
      region: "Asia East",
      status: "synced",
      latency: 35,
      uptime: 99.99,
      votesValidated: 9840,
    },
    {
      id: "node_5",
      name: "LHR-05 (London)",
      region: "Europe West",
      status: "active",
      latency: 18,
      uptime: 99.99,
      votesValidated: 17290,
    },
    {
      id: "node_6",
      name: "SYD-06 (Sydney)",
      region: "Oceania",
      status: "offline",
      latency: 0,
      uptime: 98.42,
      votesValidated: 4092,
    },
  ],
  updateNodeLatency: (nodeId, latency) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              latency,
              status: latency > 0 ? (node.status === "offline" ? "active" : node.status) : "offline",
              votesValidated: latency > 0 ? node.votesValidated + 1 : node.votesValidated,
            }
          : node
      ),
    })),
}));
