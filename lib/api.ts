// Base URLs
export const AUTH_API_URL =
  typeof window !== "undefined"
    ? "/api/auth"
    : (process.env.NEXT_PUBLIC_AUTH_API_URL || "https://auth-service-production-25af.up.railway.app");
export const VOTE_API_URL =
  typeof window !== "undefined"
    ? "/api/vote"
    : (process.env.NEXT_PUBLIC_VOTE_API_URL || "https://vote-service-production.up.railway.app");

// In-memory token storage (also synced with Zustand store)
let inMemoryAccessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

let onTokenRefreshed: ((token: string | null) => void) | null = null;
let onAuthFailure: (() => void) | null = null;

export function registerAuthCallbacks(callbacks: {
  onTokenRefreshed?: (token: string | null) => void;
  onAuthFailure?: () => void;
}) {
  if (callbacks.onTokenRefreshed) onTokenRefreshed = callbacks.onTokenRefreshed;
  if (callbacks.onAuthFailure) onAuthFailure = callbacks.onAuthFailure;
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

export function setAccessToken(token: string | null) {
  inMemoryAccessToken = token;
}

// Decode JWT helper
export function decodeJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const binaryString = typeof window !== "undefined"
      ? window.atob(base64)
      : Buffer.from(base64, "base64").toString("binary");
    const jsonPayload = decodeURIComponent(
      binaryString
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

// Check if token is near expiration (< 60s remaining)
export function isTokenExpiredOrExpiring(token: string | null): boolean {
  if (!token) return true;
  const decoded = decodeJwt(token);
  if (!decoded || !decoded.exp) return true;
  const nowInSecs = Math.floor(Date.now() / 1000);
  return decoded.exp - nowInSecs < 60; // expires in less than 60 seconds
}

// Gather actual device details for fingerprinting
export function getDeviceInfo() {
  if (typeof window === "undefined") return undefined;
  return {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    platform: window.navigator.platform || "Unknown",
    screen_size: `${window.screen.width}x${window.screen.height}`,
    language: window.navigator.language || "en-US",
    canvas_hash: "a1b2c3d4e5", // Constant value for consistency
  };
}

// Fetch helper with interceptors for silent token refresh and 401 handling
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // 1. Silent Refresh Check: check if current token is expiring
  if (
    inMemoryAccessToken &&
    isTokenExpiredOrExpiring(inMemoryAccessToken) &&
    !url.includes("/auth/refresh") &&
    !url.includes("/auth/logout")
  ) {
    await apiRefresh();
  }

  // 2. Build headers
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (inMemoryAccessToken) {
    headers.set("Authorization", `Bearer ${inMemoryAccessToken}`);
  }

  const fetchOptions: RequestInit = {
    ...options,
    credentials: "include", // Required for HttpOnly cookies
    headers,
  };

  let response = await fetch(url, fetchOptions);

  // 3. Retry on 401: attempt silent refresh exactly once
  if (
    response.status === 401 &&
    !url.includes("/auth/login") &&
    !url.includes("/auth/org/login") &&
    !url.includes("/auth/refresh")
  ) {
    const refreshedToken = await apiRefresh();
    if (refreshedToken) {
      // Rebuild headers with the new token so the retry is authenticated
      const retryHeaders = new Headers(options.headers);
      if (!retryHeaders.has("Content-Type") && !(options.body instanceof FormData)) {
        retryHeaders.set("Content-Type", "application/json");
      }
      retryHeaders.set("Authorization", `Bearer ${refreshedToken}`);
      response = await fetch(url, { ...fetchOptions, headers: retryHeaders });
    } else {
      // Refresh failed, clear session and redirect to login
      if (onAuthFailure) {
        onAuthFailure();
      }
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  }

  return response;
}

// Standardized error wrapper
export async function handleApiResponse(response: Response) {
  if (!response.ok) {
    let errorMsg = "An unexpected error occurred.";
    let errorCode = "INTERNAL_SERVER_ERROR";
    try {
      const data = await response.json();
      if (data.error) {
        errorMsg = data.error.message || data.error || errorMsg;
        errorCode = data.error.code || errorCode;
      } else if (data.message) {
        errorMsg = data.message;
      }
    } catch {
      // Response was not JSON or had no readable error
    }
    throw { message: errorMsg, code: errorCode, status: response.status };
  }
  return response.json();
}

// Silently Refresh Access Token
export async function apiRefresh(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${AUTH_API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Refresh token expired or revoked");
      }
      const data = await res.json();
      if (data.access_token) {
        setAccessToken(data.access_token);
        if (onTokenRefreshed) {
          onTokenRefreshed(data.access_token);
        }
        return data.access_token;
      }
      return null;
    } catch (err) {
      setAccessToken(null);
      if (onTokenRefreshed) {
        onTokenRefreshed(null);
      }
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ==========================================
// AUTH SERVICE ENDPOINTS
// ==========================================

// Individual Registration
export async function registerIndividual(body: any) {
  const payload = {
    ...body,
    device_info: getDeviceInfo(),
  };
  const res = await authFetch(`${AUTH_API_URL}/auth/register`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return handleApiResponse(res);
}

// Individual Login
export async function loginIndividual(body: any) {
  const payload = {
    ...body,
    device_info: getDeviceInfo(),
  };
  const res = await authFetch(`${AUTH_API_URL}/auth/login`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await handleApiResponse(res);
  if (data.access_token) {
    setAccessToken(data.access_token);
  }
  return data;
}

// Organization Registration
export async function registerOrganization(body: any) {
  const payload = {
    ...body,
    device_info: getDeviceInfo(),
  };
  const res = await authFetch(`${AUTH_API_URL}/auth/org/register`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return handleApiResponse(res);
}

// Organization Login
export async function loginOrganization(body: any) {
  const payload = {
    ...body,
    device_info: getDeviceInfo(),
  };
  const res = await authFetch(`${AUTH_API_URL}/auth/org/login`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await handleApiResponse(res);
  if (data.access_token) {
    setAccessToken(data.access_token);
  }
  return data;
}

// Logout
export async function apiLogout() {
  const res = await authFetch(`${AUTH_API_URL}/auth/logout`, {
    method: "POST",
  });
  setAccessToken(null);
  return handleApiResponse(res).catch(() => ({ message: "Logout complete" }));
}

// Get Profile User
export async function apiGetMe() {
  const res = await authFetch(`${AUTH_API_URL}/auth/me`, {
    method: "GET",
  });
  return handleApiResponse(res);
}

// Get Profile Org
export async function apiGetOrgMe() {
  const res = await authFetch(`${AUTH_API_URL}/auth/org/me`, {
    method: "GET",
  });
  return handleApiResponse(res);
}

// Send OTP email (User)
export async function apiSendVerification() {
  const res = await authFetch(`${AUTH_API_URL}/auth/send-verification`, {
    method: "POST",
  });
  return handleApiResponse(res);
}

// Verify OTP email (User)
export async function apiVerifyEmail(otp: string) {
  const res = await authFetch(`${AUTH_API_URL}/auth/verify-email`, {
    method: "POST",
    body: JSON.stringify({ otp }),
  });
  return handleApiResponse(res);
}

// Send OTP email (Org)
export async function apiSendOrgVerification() {
  const res = await authFetch(`${AUTH_API_URL}/auth/org/send-verification`, {
    method: "POST",
  });
  return handleApiResponse(res);
}

// Verify OTP email (Org)
export async function apiVerifyOrgEmail(otp: string) {
  const res = await authFetch(`${AUTH_API_URL}/auth/org/verify-email`, {
    method: "POST",
    body: JSON.stringify({ otp }),
  });
  return handleApiResponse(res);
}

// Get Sessions
export async function apiGetSessions() {
  const res = await authFetch(`${AUTH_API_URL}/auth/sessions`, {
    method: "GET",
  });
  return handleApiResponse(res);
}

// ==========================================
// AADHAAR VERIFICATION ENDPOINTS
// ==========================================

export async function apiAadhaarGenerateOtp(aadhaarNumber: string) {
  const res = await authFetch(`${AUTH_API_URL}/auth/aadhaar/generate-otp`, {
    method: "POST",
    body: JSON.stringify({ aadhaar_number: aadhaarNumber }),
  });
  return handleApiResponse(res);
}

export async function apiAadhaarVerifyOtp(referenceId: string, otp: string) {
  const res = await authFetch(`${AUTH_API_URL}/auth/aadhaar/verify-otp`, {
    method: "POST",
    body: JSON.stringify({ reference_id: referenceId, otp }),
  });
  return handleApiResponse(res);
}

export async function apiAadhaarStatus() {
  const res = await authFetch(`${AUTH_API_URL}/auth/aadhaar/status`, {
    method: "GET",
  });
  return handleApiResponse(res);
}

export async function apiGetVerifiedStatus() {
  const res = await authFetch(`${AUTH_API_URL}/auth/me/verified`, {
    method: "GET",
  });
  return handleApiResponse(res);
}

export async function apiRecheckVerification() {
  const res = await authFetch(`${AUTH_API_URL}/auth/me/recheck-verification`, {
    method: "POST",
  });
  return handleApiResponse(res);
}

// ==========================================
// ORG VERIFICATION PIPELINE ENDPOINTS
// ==========================================

export async function apiOrgVerifyStart() {
  const res = await authFetch(`${AUTH_API_URL}/auth/org/verify/start`, {
    method: "POST",
  });
  return handleApiResponse(res);
}

export async function apiOrgVerifySubmitRegistration(registrationNumber: string) {
  const res = await authFetch(
    `${AUTH_API_URL}/auth/org/verify/submit-registration-number`,
    {
      method: "POST",
      body: JSON.stringify({ registration_number: registrationNumber }),
    }
  );
  return handleApiResponse(res);
}

export async function apiOrgVerifySubmitDomain(domain: string) {
  const res = await authFetch(`${AUTH_API_URL}/auth/org/verify/submit-domain`, {
    method: "POST",
    body: JSON.stringify({ domain }),
  });
  return handleApiResponse(res);
}

export async function apiOrgVerifyDns() {
  const res = await authFetch(`${AUTH_API_URL}/auth/org/verify/verify-dns`, {
    method: "POST",
  });
  return handleApiResponse(res);
}

export async function apiOrgVerifyStatus() {
  const res = await authFetch(`${AUTH_API_URL}/auth/org/verify/status`, {
    method: "GET",
  });
  return handleApiResponse(res);
}

export async function apiOrgVerifyRecheck() {
  const res = await authFetch(`${AUTH_API_URL}/auth/org/verify/recheck`, {
    method: "POST",
  });
  return handleApiResponse(res);
}

// ==========================================
// VOTE SERVICE ENDPOINTS
// ==========================================

export async function apiCreatePoll(body: {
  title: string;
  description?: string;
  options: string[];
  allow_admin_vote?: boolean;
  voting_start_at?: string;
  voting_end_at?: string;
  duration_minutes?: number;
  auto_start?: boolean;
  visibility?: "public" | "private" | "team";
  email_invites?: { email: string; name?: string }[];
  client_request_id?: string;
}) {
  const res = await authFetch(`${VOTE_API_URL}/vote/v1/polls`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return handleApiResponse(res);
}

export async function apiGetPoll(pollId: string) {
  const res = await authFetch(`${VOTE_API_URL}/vote/v1/polls/${pollId}`, {
    method: "GET",
  });
  return handleApiResponse(res);
}

export async function apiStartPoll(pollId: string) {
  const res = await authFetch(`${VOTE_API_URL}/vote/v1/polls/${pollId}/start`, {
    method: "POST",
  });
  return handleApiResponse(res);
}

export async function apiEndPoll(pollId: string) {
  const res = await authFetch(`${VOTE_API_URL}/vote/v1/polls/${pollId}/end`, {
    method: "POST",
  });
  return handleApiResponse(res);
}

export async function apiCastVote(pollId: string, optionIdx: number) {
  const res = await authFetch(`${VOTE_API_URL}/vote/v1/polls/${pollId}/vote`, {
    method: "POST",
    body: JSON.stringify({ poll_id: pollId, option_idx: optionIdx }),
  });
  return handleApiResponse(res);
}

export async function apiGetResults(pollId: string) {
  const res = await authFetch(`${VOTE_API_URL}/vote/v1/polls/${pollId}/results`, {
    method: "GET",
  });
  return handleApiResponse(res);
}

export async function apiDeletePoll(pollId: string) {
  const res = await authFetch(`${VOTE_API_URL}/vote/v1/polls/${pollId}`, {
    method: "DELETE",
  });
  return handleApiResponse(res);
}

// ==========================================
// TEAM SERVICE ENDPOINTS
// ==========================================

export async function apiGetTeams() {
  const res = await authFetch(`${AUTH_API_URL}/auth/v1/teams`, {
    method: "GET",
  });
  return handleApiResponse(res);
}

export async function apiCreateTeam(body: { name: string; description?: string }) {
  const res = await authFetch(`${AUTH_API_URL}/auth/v1/teams`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return handleApiResponse(res);
}

export async function apiGetTeamDetails(teamId: string) {
  const res = await authFetch(`${AUTH_API_URL}/auth/v1/teams/${teamId}`, {
    method: "GET",
  });
  return handleApiResponse(res);
}

export async function apiDeleteTeam(teamId: string) {
  const res = await authFetch(`${AUTH_API_URL}/auth/v1/teams/${teamId}`, {
    method: "DELETE",
  });
  return handleApiResponse(res);
}

export async function apiGetTeamMembers(teamId: string) {
  const res = await authFetch(`${AUTH_API_URL}/auth/v1/teams/${teamId}/members`, {
    method: "GET",
  });
  return handleApiResponse(res);
}

export async function apiAddTeamMember(teamId: string, body: { email: string; role: string }) {
  const res = await authFetch(`${AUTH_API_URL}/auth/v1/teams/${teamId}/members`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return handleApiResponse(res);
}

export async function apiRemoveTeamMember(teamId: string, userId: string) {
  const res = await authFetch(`${AUTH_API_URL}/auth/v1/teams/${teamId}/members/${userId}`, {
    method: "DELETE",
  });
  return handleApiResponse(res);
}

export async function apiUpdateTeamMemberRole(teamId: string, userId: string, role: string) {
  const res = await authFetch(`${AUTH_API_URL}/auth/v1/teams/${teamId}/members/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
  return handleApiResponse(res);
}

export async function apiSearchUsers(query: string) {
  const res = await authFetch(`${AUTH_API_URL}/auth/users/search?q=${encodeURIComponent(query)}&limit=1`, {
    method: "GET",
  });
  return handleApiResponse(res);
}

export function parsePollDescription(rawDescription: string = "") {
  const match = rawDescription.match(/\n\n\[Metadata: ({[\s\S]*?})\]$/);
  if (match) {
    try {
      const metadata = JSON.parse(match[1]);
      const cleanDesc = rawDescription.replace(/\n\n\[Metadata: ({[\s\S]*?})\]$/, "");
      return {
        description: cleanDesc,
        isPrivate: !!metadata.private,
        allowedEmails: metadata.allowed_emails || [],
      };
    } catch {
      // ignore
    }
  }
  return {
    description: rawDescription,
    isPrivate: false,
    allowedEmails: [],
  };
}



