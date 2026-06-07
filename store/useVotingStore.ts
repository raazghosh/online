import { create } from "zustand";
import {
  apiGetMe,
  apiGetOrgMe,
  apiLogout,
  apiRefresh,
  decodeJwt,
  loginIndividual,
  loginOrganization,
  registerIndividual,
  registerOrganization,
  setAccessToken,
  registerAuthCallbacks,
} from "@/lib/api";

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
  emailVerified?: boolean;
  firstName?: string;
  lastName?: string;
  orgName?: string;
  phone?: string;
}

interface VotingState {
  // Authentication state
  user: UserSession | null;
  accessToken: string | null;
  isInitialized: boolean;
  setAccessToken: (token: string | null) => void;
  initializeSession: () => Promise<void>;
  login: (payload: { email: string; password?: string; accountType: "individual" | "organization" }) => Promise<void>;
  logout: () => Promise<void>;
  register: (payload: { email: string; password?: string; accountType: "individual" | "organization"; first_name?: string; last_name?: string; org_name?: string }) => Promise<void>;

  // Local Poll tracking
  createdPollIds: string[];
  votedPollIds: string[];
  addCreatedPollId: (pollId: string) => void;
  addVotedPollId: (pollId: string) => void;
  fetchPollIdsFromStorage: (email: string) => void;

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

// ---- Shared helper: build UserSession from API profile ----
async function buildUserDetails(
  accountType: string
): Promise<UserSession> {
  if (accountType === "organization") {
    const profile = await apiGetOrgMe();
    const savedUsername = typeof window !== "undefined" ? localStorage.getItem(`username_${profile.Email}`) : null;
    const savedPhone = typeof window !== "undefined" ? localStorage.getItem(`phone_${profile.Email}`) : null;
    return {
      username: savedUsername || profile.OrgName || "Org Owner",
      email: profile.Email,
      role: "admin",
      isVerified: profile.IsVerified,
      orgName: profile.OrgName,
      emailVerified: profile.EmailVerified,
      phone: savedPhone || "",
    };
  } else {
    const profile = await apiGetMe();
    const savedUsername = typeof window !== "undefined" ? localStorage.getItem(`username_${profile.Email}`) : null;
    const savedPhone = typeof window !== "undefined" ? localStorage.getItem(`phone_${profile.Email}`) : null;
    return {
      username: savedUsername || `${profile.FirstName} ${profile.LastName}`.trim() || "Voter",
      email: profile.Email,
      role: "voter",
      isVerified: profile.IsVerified,
      firstName: profile.FirstName,
      lastName: profile.LastName,
      emailVerified: profile.EmailVerified,
      phone: savedPhone || "",
    };
  }
}
// -----------------------------------------------------------

export const useVotingStore = create<VotingState>((set, get) => ({
  user: null,
  accessToken: null,
  isInitialized: false,
  createdPollIds: [],
  votedPollIds: [],

  setAccessToken: (token) => {
    set({ accessToken: token });
    setAccessToken(token);
  },

  initializeSession: async () => {
    try {
      const token = await apiRefresh();
      if (token) {
        set({ accessToken: token });
        const decoded = decodeJwt(token);
        const accountType = decoded?.account_type;
        const userDetails = await buildUserDetails(accountType);
        set({ user: userDetails });
        get().fetchPollIdsFromStorage(userDetails.email);
      }
    } catch (err) {
      set({ user: null, accessToken: null });
    } finally {
      set({ isInitialized: true });
    }
  },

  login: async ({ email, password, accountType }) => {
    let tokenData;
    if (accountType === "organization") {
      tokenData = await loginOrganization({ email, password });
    } else {
      tokenData = await loginIndividual({ email, password });
    }

    if (tokenData && tokenData.access_token) {
      set({ accessToken: tokenData.access_token });
      const decoded = decodeJwt(tokenData.access_token);
      const userDetails = await buildUserDetails(decoded?.account_type);
      set({ user: userDetails });
      get().fetchPollIdsFromStorage(userDetails.email);
    }
  },

  logout: async () => {
    try {
      await apiLogout();
    } catch (err) {
      // Ignore API errors
    } finally {
      set({ user: null, accessToken: null, createdPollIds: [], votedPollIds: [] });
    }
  },

  register: async (payload) => {
    if (payload.accountType === "organization") {
      await registerOrganization({
        org_name: payload.org_name,
        email: payload.email,
        password: payload.password,
      });
    } else {
      await registerIndividual({
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: payload.email,
        password: payload.password,
      });
    }
  },

  addCreatedPollId: (pollId) => {
    const userEmail = get().user?.email;
    if (!userEmail) return;
    const current = get().createdPollIds;
    if (!current.includes(pollId)) {
      const updated = [...current, pollId];
      set({ createdPollIds: updated });
      localStorage.setItem(`created_polls_${userEmail}`, JSON.stringify(updated));
    }
  },

  addVotedPollId: (pollId) => {
    const userEmail = get().user?.email;
    if (!userEmail) return;
    const current = get().votedPollIds;
    if (!current.includes(pollId)) {
      const updated = [...current, pollId];
      set({ votedPollIds: updated });
      localStorage.setItem(`voted_polls_${userEmail}`, JSON.stringify(updated));
    }
  },

  fetchPollIdsFromStorage: (email) => {
    try {
      const createdStr = localStorage.getItem(`created_polls_${email}`);
      const votedStr = localStorage.getItem(`voted_polls_${email}`);
      set({
        createdPollIds: createdStr ? JSON.parse(createdStr) : [],
        votedPollIds: votedStr ? JSON.parse(votedStr) : [],
      });
    } catch {
      set({ createdPollIds: [], votedPollIds: [] });
    }
  },

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

// Register auth callbacks to receive state changes from the API client without circular imports
registerAuthCallbacks({
  onTokenRefreshed: (token) => {
    useVotingStore.setState({ accessToken: token });
  },
  onAuthFailure: () => {
    useVotingStore.setState({ user: null, accessToken: null, createdPollIds: [], votedPollIds: [] });
  },
});

