# Web development

Documentation for **website and HTTP client integration** with Securevote APIs. There is no full web app in this monorepo — integration targets are custom frontends and [`securevote-share-web`](../../securevote-share-web) for share previews.

## API guide

The full web frontend API reference lives in one file (incremental split planned):

**[Web API guide](api-guide.md)** — auth, org, polls, dashboard, notifications, CORS, rate limits (~3,600 lines).

### Table of contents (api-guide.md)

1. Base URLs
2. Authentication overview (cookie + Bearer)
3. Token lifecycle (refresh & logout)
4. Environment variables
5. Global headers & error format
6. Auth service endpoints (user + org + Aadhaar + verification)
7. Vote service endpoints (polls, dashboard, notifications)
8. Authorization model (ABAC + PBAC)
9. Poll status flow
10. Sample frontend usage
11. CORS & cookie notes
12. Rate limits

## Web vs mobile auth

| Channel | Refresh storage | Endpoints |
|---------|-----------------|-----------|
| Web | HttpOnly cookies (`refresh_token_user` / `refresh_token_org`) | `/auth/login`, `/refresh`, `/logout` |
| Mobile | SecureStore JSON body | `/auth/mobile/*`, `/auth/org/mobile/*` |

See [ADR-001](../../decisions/001-mobile-native-auth.md). Refresh tokens are **not** interchangeable across channels.

## Share web

OG preview and guest deep links:

- Repo: external `securevote-share-web`
- Deploy: `share.securevote.co.in`
- ADRs: [016](../../decisions/016-shareable-links-and-previews.md), [017](../../decisions/017-universal-links-and-guest-deep-links.md)

## Changelog

API contract releases: [engineering/changelogs/api-web.md](../changelogs/api-web.md) (current: V 1.8.5+)

## Incremental split (TODO)

Phase 1 keeps a single `api-guide.md`. Future pages:

- `auth.md`, `organizations.md`, `polls.md`, `dashboard.md`, `notifications.md`, `share-preview.md`

Track progress in [planning/backlog/web.md](../planning/backlog/web.md).


[V 1.0.0] [Commit - 3c71156]  
[V 1.0.1] [Commit - b7d959c]  
[V 1.2.0] [Feature - Aadhaar Verification]  
[V 1.3.0] [Feature - Verification Check]  
[V 1.4.0] [Feature - Organizational Account]  
[V 1.4.1] [Security Fix - Security & Performance Hardening]  
[V 1.4.2] [Bug Fix - Organization Login / Refresh Tokens]  
[V 1.4.3] [Improvement - Organization Verification Step Errors]  
[V 1.5.0] [Feature - Mobile API and Poll Listing]  


# E-Voting Platform — Frontend API Guide

> Everything your frontend needs to integrate with the Auth Service and Vote Service.

---

## Table of Contents

1. [Base URLs](#1-base-urls)
2. [Authentication Overview](#2-authentication-overview)
3. [Token Lifecycle (Refresh & Logout)](#3-token-lifecycle-refresh--logout)
4. [Environment Variables](#4-environment-variables)
5. [Global Headers](#5-global-headers)
6. [Error Response Format](#6-error-response-format)
7. [Auth Service Endpoints](#7-auth-service-endpoints)
   - [Health Check](#71-health-check)
   - **User Endpoints**
     - [Register](#72-register)
     - [Login](#73-login)
     - [Refresh Token](#74-refresh-token)
     - [Logout](#75-logout)
     - [Get Current User (Me)](#76-get-current-user-me)
     - [Search Users](#761-search-users)
     - [Send Verification](#77-send-verification)
     - [Verify Email](#78-verify-email)
     - [Forgot Password](#781-forgot-password)
     - [List Sessions](#79-list-sessions)
     - [Aadhaar Verification](#710-aadhaar-verification)
         - [Generate Aadhaar OTP](#7101-generate-aadhaar-otp)
         - [Verify Aadhaar OTP](#7102-verify-aadhaar-otp)
         - [Get Aadhaar Status](#7103-get-aadhaar-status)
     - [Verification Check](#711-verification-check)
         - [Get Verified Status](#7111-get-verified-status)
         - [Recheck Verification](#7112-recheck-verification)
   - **Organization Endpoints**
     - [Organization Overview](#712-organization-endpoints)
         - [Register Organization](#7121-register-organization)
         - [Login Organization](#7122-login-organization)
         - [Get Current Organization (Org Me)](#7123-get-current-organization-org-me)
         - [Send Organization Verification](#7124-send-organization-verification)
         - [Verify Organization Email](#7125-verify-organization-email)
     - [Verified Organization Pipeline](#713-verified-organization-pipeline)
         - [Start Organization Verification](#7131-start-organization-verification)
         - [Submit Registration Number](#7132-submit-registration-number)
         - [Submit Domain](#7133-submit-domain)
         - [Verify DNS](#7134-verify-dns)
         - [Get Verification Status](#7135-get-verification-status)
         - [Recheck Organization Verification](#7136-recheck-organization-verification)
  8. [Vote Service Endpoints](#8-vote-service-endpoints)
   - [Health Check](#81-health-check)
   - [Create Poll](#82-create-poll)
   - [List Polls](#821-list-polls)
   - [Get Poll](#83-get-poll)
   - [Start Poll](#84-start-poll)
   - [End Poll](#85-end-poll)
   - [Vote on a Poll](#86-vote-on-a-poll)
   - [View Poll Results](#87-view-poll-results)
   - [Get Poll Tally](#875-get-poll-tally)
   - [Delete Poll](#88-delete-poll)
   - [Poll Dashboard APIs](#810-poll-dashboard-apis)
   - [Poll Manage Actions](#811-poll-manage-actions)
   - [Detailed Health](#812-detailed-health)
   - [Notifications](#89-notifications)
9. [Authorization Model (ABAC + PBAC)](#9-authorization-model)
10. [Poll Status Flow](#10-poll-status-flow)
11. [Sample Frontend Usage](#11-sample-frontend-usage)
12. [CORS & Cookie Notes](#12-cors--cookie-notes)
13. [Rate Limits](#13-rate-limits)

---

## 1. Base URLs

| Environment | Auth Service                                          | Vote Service                                      |
|-------------|-------------------------------------------------------|---------------------------------------------------|
| Production  | `https://auth-service-production-25af.up.railway.app` | `https://vote-service-production.up.railway.app`  |
| Development | `http://localhost:8080`                               | `http://localhost:8081`                           |

> **Tip:** Always read the base URL from an environment variable (see [Section 4](#4-environment-variables)) — never hardcode it.

---

## 2. Authentication Overview

All protected endpoints require a **JWT Bearer Token** in the `Authorization` header.

```
Authorization: Bearer <access_token>
```

### Token Details

| Property        | Value                         |
|-----------------|-------------------------------|
| Algorithm       | RS256 (RSA + SHA-256)         |
| Access Token TTL  | **15 minutes**              |
| Refresh Token TTL | **7 days**                  |
| Token storage   | `access_token`: JS memory; refresh JWT in `HttpOnly` cookie (`refresh_token_user` or `refresh_token_org`) |
| `token_use`     | `access` (Bearer) or `refresh` (cookie only) — refresh tokens are rejected on protected API routes |

The access token payload contains:

```json
{
  "user_id": "42",
  "account_type": "user",
  "token_use": "access",
  "iss": "auth-service",
  "iat": 1720000000,
  "exp": 1720000900
}
```

> Organizational tokens use `"account_type": "organization"` instead.

### How to use `account_type`

The `account_type` claim tells you whether the JWT belongs to a **user** or an **organization**. You **must** read this claim to decide which API endpoints to call and how to treat the session.

**Frontend — reading `account_type` from the JWT:**

JWT tokens are base64-encoded. Decode the payload (middle part) without a library:

```javascript
function getAccountType(token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  return payload.account_type; // "user" or "organization"
}
```

**How it affects your API calls:**

| account_type | Login endpoint | Me endpoint | Verify email endpoints | Other auth endpoints |
|---|---|---|---|---|
| `"user"` | `POST /auth/login` | `GET /auth/me` | `/auth/send-verification`, `/auth/verify-email` | All `/auth/*` routes (refresh, logout, sessions, aadhaar, etc.) |
| `"organization"` | `POST /auth/org/login` | `GET /auth/org/me` | `/auth/org/send-verification`, `/auth/org/verify-email` | Only shared `/auth/*` routes (refresh, logout, sessions) |

**Key rules:**
- **Refresh** (`POST /auth/refresh`) and **logout** (`POST /auth/logout`) are shared — they work for both account types; the correct refresh cookie is sent automatically.
- **Me** endpoints are separate — call `/auth/me` for users, `/auth/org/me` for organizations. Using the wrong account type returns `403 FORBIDDEN`.
- **Protected user routes** (`/auth/me`, Aadhaar, verification, etc.) require `account_type: "user"`. **Protected org routes** under `/auth/org/*` require `account_type: "organization"`.
- **Verification** is separate — call `/auth/send-verification` / `/auth/verify-email` for users, `/auth/org/send-verification` / `/auth/org/verify-email` for organizations.
- **Aadhaar** endpoints are user-only — organizations do not have Aadhaar verification.
- The `account_type` is automatically preserved during token refresh. You don't need to send it — the server reads it from the old JWT claims.

**`account_type` in the refresh token flow:**

When you call `POST /auth/refresh`, the server reads the `account_type` from the **old** JWT (before it expires) and writes it into the **new** JWT. The frontend always gets back a token with the same `account_type`.

**Backend / middleware (for context):**

The `account_type` is also set on the Gin context by the auth middleware. Any protected handler can read it via:
```go
accountType := c.GetString("account_type")
```
This is used internally to ensure correct routing and can be used by backend services that consume auth-service tokens for custom authorization logic.

---

## 3. Token Lifecycle (Refresh & Logout)

```
┌─────────┐        POST /auth/login         ┌──────────────┐
│ Frontend│ ──────────────────────────────► │  Auth Service│
│         │ ◄────── access_token (15 min) ── │              │
│         │ ◄── Set-Cookie: refresh_token_user ── │         │  (HttpOnly, Secure, SameSite=Strict)
└─────────┘      or refresh_token_org (7 days)  └──────────────┘
     │
     │  (access_token expires)
     ▼
┌─────────┐       POST /auth/refresh         ┌──────────────┐
│ Frontend│ ── no body, cookie auto-sent ───► │  Auth Service│
│         │ ◄──── new access_token ─────────  │              │
└─────────┘                                  └──────────────┘
     │
     │  (user logs out)
     ▼
┌─────────┐       POST /auth/logout          ┌──────────────┐
│ Frontend│ ── no body, cookie auto-sent ───► │  Auth Service│
│         │ ◄──── { message: "Logout..." } ─  │              │  (server clears cookie via Set-Cookie: max-age=-1)
└─────────┘                                  └──────────────┘
```

### Recommended Frontend Strategy

1. After login, store **only the `access_token` in memory** (a JS variable or React state). Do not store it in `localStorage`. The refresh JWT is an `HttpOnly` cookie (`refresh_token_user` for users, `refresh_token_org` for organizations) — you never see or touch it.
2. Use **access tokens only** in the `Authorization` header. Refresh tokens (`token_use: "refresh"`) are rejected on protected routes.
3. On every API call, check if the access token is **about to expire** (e.g., < 60 seconds remaining) and silently call `POST /auth/refresh` first — no body needed, the browser sends the cookie automatically.
4. If a `401` is returned from any protected route, attempt **one silent refresh**; if that also fails, redirect to login.
5. On logout, always call `POST /auth/logout` to **invalidate the refresh token server-side and clear the matching cookie**, then discard the in-memory access token.

### Google OAuth (web)

> See [ADR-032](../../decisions/032-google-oauth.md). Same Google ID-token trust boundary as mobile. Issues **web** tokens (`token_channel: "web"`) with the refresh JWT in an **HttpOnly cookie** — same response shape as `POST /auth/login` / `POST /auth/org/login`.

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/auth/oauth/google` | User Google sign-in / sign-up |
| `POST` | `/auth/org/oauth/google` | Organization Google sign-in / sign-up (`org_name` required on first signup) |

**User:** `POST /auth/oauth/google`

```json
{
  "id_token": "<Google ID token from Google Identity Services>",
  "device_fingerprint": "optional-stable-id",
  "device_info": {
    "platform": "ios",
    "timezone": "Asia/Kolkata",
    "language": "en",
    "app_version": "1.0.0"
  }
}
```

**Organization:** `POST /auth/org/oauth/google` — include `org_name` on **first** org signup (Google does not provide org name).

```json
{
  "id_token": "<Google ID token>",
  "org_name": "Acme Elections Pvt Ltd",
  "device_fingerprint": "optional-stable-id"
}
```

**Success — 200 OK**

```json
{
  "access_token": "eyJ..."
}
```

**Set-Cookie (automatic):** `refresh_token_user` (user) or `refresh_token_org` (organization) — `HttpOnly`, `Secure`, `SameSite=Strict`, 7-day TTL. The browser stores the refresh token; your app never reads it.

| Error code | When |
|------------|------|
| `INVALID_GOOGLE_TOKEN` | ID token invalid or wrong audience |
| `GOOGLE_EMAIL_NOT_VERIFIED` | Google account email not verified |
| `ORG_NAME_REQUIRED` | First org OAuth signup without `org_name` |
| `OAUTH_ACCOUNT` | Password login attempted on Google-only account |
| `RATE_LIMITED` | Too many attempts; honor `Retry-After` |

**Web integration checklist**

1. Create a **Web application** OAuth client in Google Cloud Console; set `GOOGLE_OAUTH_CLIENT_ID_WEB` on auth-service (see `.env.example`).
2. Load [Google Identity Services](https://developers.google.com/identity/gsi/web) (`gsi/client`) and initialize with your web client ID.
3. On credential callback, read `credential` (the Google **ID token** string).
4. `POST` the ID token to `/auth/oauth/google` or `/auth/org/oauth/google` with `credentials: 'include'` so the refresh cookie is stored.
5. Store `access_token` in memory only; use existing `POST /auth/refresh` (cookie auto-sent) and `POST /auth/logout` flows.
6. Decode JWT `account_type` (`user` vs `organization`) and route to `/auth/me` vs `/auth/org/me` as with password login.

**`@securevote/api-client`:** `authApi.loginWithGoogleWeb({ id_token, org_name?, device_fingerprint })` — returns `{ access_token }`; pass `credentials: 'include'` via the client (built into the method). Mobile apps should continue using `loginWithGoogle` (`/auth/mobile/oauth/google`).

Password login for OAuth-only accounts returns `400 OAUTH_ACCOUNT`.

### Mobile authentication (native apps)

> See [ADR-001](../../decisions/001-mobile-native-auth.md). Mobile tokens use JWT claim `token_channel: "mobile"`. Web cookie refresh rejects mobile refresh tokens and vice versa.

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/auth/mobile/login` | User login; returns `access_token`, `refresh_token`, `expires_in` (900) — no cookies |
| `POST` | `/auth/mobile/refresh` | Body `{ "refresh_token": "..." }`; rotates refresh |
| `POST` | `/auth/mobile/logout` | Body `{ "refresh_token": "..." }`; revokes session |
| `POST` | `/auth/org/mobile/login` | Organization login (same response shape) |
| `POST` | `/auth/org/mobile/refresh` | Org refresh |
| `POST` | `/auth/org/mobile/logout` | Org logout |
| `POST` | `/auth/mobile/oauth/google` | Google sign-in / sign-up (user); body `{ "id_token", "device_*" }` — see [ADR-032](../../decisions/032-google-oauth.md) |
| `POST` | `/auth/org/mobile/oauth/google` | Google sign-in / sign-up (org); body `{ "id_token", "org_name?" (required on first signup), "device_*" }` |

Password login for OAuth-only accounts returns `400 OAUTH_ACCOUNT`.

**Mobile client rules:** Store `refresh_token` in secure storage (e.g. iOS Keychain / Android Keystore via Expo SecureStore). Keep `access_token` in memory only. On `401`, call the matching mobile refresh endpoint once, then retry.

---

## 4. Environment Variables

Add these to your `.env` (or `.env.local`) file:

```
VITE_AUTH_API_URL=https://auth-service-production-25af.up.railway.app
VITE_VOTE_API_URL=https://vote-service-production.up.railway.app
```

> If you use Create React App, replace the `VITE_` prefix with `REACT_APP_`.

---

## 5. Global Headers

Every request to **any endpoint** should include:

| Header         | Value              | Notes                                 |
|----------------|--------------------|---------------------------------------|
| `Content-Type` | `application/json` | Required for all requests with a body |
| `Authorization`| `Bearer <token>`   | Required for all **protected** routes |
| `X-Device-Fingerprint` | Stable client/device fingerprint | Optional but recommended; used as one rate-limit dimension on auth and vote APIs |

### Timestamps

All timestamps returned in **any** response are **UTC** (ISO 8601, `Z` suffix — e.g. `"2024-07-10T09:00:00Z"`).  
Request body timestamps may include any UTC offset (e.g. `+05:30`); the server normalises them to UTC before storage and always responds with `Z`.

---

## 6. Error Response Format

### Auth Service Errors

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "email or password incorrect"
  }
}
```

| Error Code               | HTTP Status | Description                                                    |
|--------------------------|-------------|----------------------------------------------------------------|
| `INVALID_CREDENTIALS`    | 401         | Wrong email or password                                        |
| `USER_NOT_FOUND`         | 404         | User does not exist                                            |
| `EMAIL_ALREADY_EXISTS`   | 409         | Email is already linked to a personal or organization account (global uniqueness) |
| `INVALID_REQ_BODY`       | 400         | Malformed or missing request body                              |
| `INVALID_PASSWORD`       | 400         | Wrong password (legacy; login uses `INVALID_CREDENTIALS` only) |
| `FORBIDDEN`              | 403         | Wrong account type for route (e.g. org token on user endpoints) |
| `INVALID_OTP`            | 401         | Invalid or expired OTP                                         |
| `EMAIL_NOT_VERIFIED`     | 403         | Email not verified                                             |
| `ACCOUNT_SUSPENDED`      | 403         | Account has been suspended                                     |
| `ACCOUNT_DELETED`        | 403         | Account has been deleted                                       |
| `ACCOUNT_LOCKED`         | 429         | Account temporarily locked due to too many failed attempts     |
| `RATE_LIMITED`           | 429         | Too many requests, please try again later                      |
| `GENERATE_TOKEN`         | 500         | Server failed to generate JWT                                  |
| `INTERNAL_SERVER_ERROR`  | 500         | Unexpected server error                                        |
| `DISPOSABLE_EMAIL`       | 400         | Disposable email addresses are not allowed (reputation check) |
| `EMAIL_NOT_DELIVERABLE`  | 400         | Email address is not deliverable (SMTP/MX validation failed)  |
| `HIGH_RISK_EMAIL`        | 400         | Email address is flagged as high risk                          |
| `LOW_REPUTATION_SCORE`   | 400         | Email reputation score is too low                              |
| `AADHAAR_FEATURE_DISABLED` | 403         | Aadhaar verification feature is disabled                     |
| `AADHAAR_INVALID_OTP`     | 401         | Invalid Aadhaar OTP                                             |
| `AADHAAR_OTP_EXPIRED`     | 400         | OTP expired, please generate a new one                          |
| `AADHAAR_ALREADY_VERIFIED`| 409         | Aadhaar already verified                                        |
| `AADHAAR_VERIFICATION_FAILED` | 503     | Aadhaar verification service unavailable                        |
| `USER_NOT_VERIFIED`          | 403     | Verification incomplete — call `/auth/me/recheck-verification` for details |
| `USER_NOT_TRUSTED`           | 403     | Complete email verification to become a trusted user              |
| `AADHAAR_VERIFICATION_REQUIRED` | 403  | Complete Aadhaar verification to become a verified user         |
| `AADHAAR_NOT_FOUND`          | 404     | No Aadhaar verification on file — complete Aadhaar verification to become a verified user |
| `NAME_MISMATCH`              | 409     | Aadhaar name does not match registered name                     |
| `ORG_EMAIL_ALREADY_EXISTS`   | 409     | Legacy alias; registration now returns `EMAIL_ALREADY_EXISTS` for all email collisions |
| `ORGANIZATION_NOT_FOUND`     | 404     | Organization does not exist                                     |
| `ORG_NAME_REQUIRED`          | 400     | Organization name is required                                   |
| `ORG_NOT_TRUSTED`            | 403     | Organization email not verified, complete email verification first |
| `ORG_ALREADY_VERIFIED`       | 409     | Organization is already verified                                |
| `VERIFICATION_IN_PROGRESS`   | 409     | A verification request is already in progress                   |
| `NO_VERIFICATION_IN_PROGRESS`| 400     | No verification request in progress                             |
| `ORG_NOT_VERIFIED`           | 400     | Organization must be verified before recheck                    |
| `MCA_VERIFICATION_NOT_FOUND` | 404     | No MCA verification record on file for recheck                    |
| `INVALID_MCA_RESPONSE`       | 503     | MCA API returned an unparseable response (recheck)              |
| `UNKNOWN_ENTITY_TYPE`        | 400     | Stored registration number is not valid LLPIN or CIN (recheck)  |
| `INVALID_VERIFICATION_STEP`  | 400     | Current step does not match the requested operation             |
| `REGISTRATION_NUMBER_STEP_COMPLETE` | 409 | Registration number already verified — proceed to domain verification |
| `DOMAIN_STEP_COMPLETE`       | 409     | Domain already verified — proceed to DNS verification           |
| `MCA_SERVICE_UNAVAILABLE`    | 503     | MCA verification service unavailable, please try again later    |
| `INVALID_REGISTRATION_NUMBER`| 400     | Invalid business registration number (must be LLPIN or CIN)     |
| `REGISTRATION_NUMBER_NOT_FOUND` | 404  | Registration number not found in MCA records                    |
| `BUSINESS_NAME_MISMATCH`     | 409     | Business name does not match MCA records                        |
| `ORG_STATUS_NOT_ACTIVE`      | 400     | Business status is not Active in MCA records                    |
| `INCORPORATION_DATE_INVALID` | 400     | Invalid incorporation date format from MCA data                 |
| `INVALID_DOMAIN`             | 400     | Invalid domain format                                           |
| `EMAIL_DOMAIN_MISMATCH`      | 409     | Organization email domain does not match the submitted domain   |
| `DNS_VERIFICATION_FAILED`    | 400     | DNS TXT verification failed                                     |
| `DNS_TOKEN_NOT_FOUND`        | 404     | DNS TXT record not found — add the verification record to your domain |
| `DNS_ALREADY_VERIFIED`       | 409     | DNS already verified                                            |
| `ORG_VERIFICATION_EXPIRED`   | 403     | Organization verification has expired or feature is disabled    |

### Vote Service Errors

```json
{
  "error": "Poll is not active"
}
```

| HTTP Status | Description                                                                        |
|-------------|------------------------------------------------------------------------------------|
| 400         | Bad request (e.g., poll cannot be started, wrong poll ID, invalid time window)     |
| 401         | Missing or invalid Bearer token                                                    |
| 403         | Insufficient permissions — not the poll owner (ABAC), or voting window closed (PBAC) |
| 404         | Poll not found                                                                     |
| 409         | Conflict — user has already voted                                                  |
| 500         | Internal server error                                                              |

---

## 7. Auth Service Endpoints

### 7.1 Health Check

| Property  | Value       |
|-----------|-------------|
| Method    | `GET`       |
| Path      | `/health`   |
| Auth      | Not required |

**Success Response — 200 OK**
```json
{ "status": "ok" }
```

---

### User Endpoints

#### 7.2 Register

| Property  | Value              |
|-----------|--------------------|
| Method    | `POST`             |
| Path      | `/auth/register`   |
| Auth      | Not required       |
| Purpose   | Create a new user account |

> **Global email policy:** Each email may be linked to **one** account only — either a personal user **or** an organization, never both. Cross-type registration attempts return `409 EMAIL_ALREADY_EXISTS` with optional `existing_account_type` (`user` | `organization`) in the error object.

> **Email normalization:** `email` is trimmed and lowercased server-side (same as login).

**Required Headers**
```
Content-Type: application/json
```

**Request Body**

| Field                 | Type     | Required | Description                                    |
|-----------------------|----------|----------|------------------------------------------------|
| `first_name`          | string   | Yes      | User's first name                              |
| `last_name`           | string   | Yes      | User's last name                               |
| `email`               | string   | Yes      | Valid email address                            |
| `password`            | string   | Yes      | Plain-text password (hashed server-side)       |
| `device_fingerprint`  | string   | No       | Pre-computed device fingerprint hash           |
| `device_info`         | object   | No       | Device attributes for fingerprinting           |

> Use the actual name when you Register for your account. Because when you verify your account , we'll match the name you provided with the Aadhaar data we have on file.  
Example : `first_name` = "Raaz", `last_name` = "Ghosh" and In Aadhar Card Name = "Raaz Ghosh"

**`device_info` object fields:**

| Field         | Type   | Description                |
|---------------|--------|----------------------------|
| `timezone`    | string | User's IANA timezone       |
| `platform`    | string | Operating system           |
| `screen_size` | string | Screen resolution          |
| `language`    | string | Browser language code      |
| `canvas_hash` | string | Canvas fingerprint hash    |

**Example Request Body**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "voter@example.com",
  "password": "SecurePass123",
  "device_info": {
    "timezone": "America/New_York",
    "platform": "Windows",
    "screen_size": "1920x1080",
    "language": "en-US",
    "canvas_hash": "a1b2c3d4e5..."
  }
}
```

**Success Response — 201 Created**
```json
{
  "message": "User registered successfully. Verification email sent."
}
```

#### 7.2.1 Email Reputation Verification (This only for backend)

| Property  | Value                    |
|-----------|--------------------------|
| Trigger   | `POST /auth/register`    |
| Scope     | Registration **only**    |
| Service   | Abstract Email Reputation API |
| Data stored | `email_reputation_score`, `email_risk_status`, `email_checked_at` on the `users` table |

#### Overview

Email reputation verification checks the quality and risk level of an email address during registration. It is **not** performed during login.

The feature is controlled by the `EMAIL_REPUTATION_MODE` environment variable with three modes:

| Mode       | `env` value    | Behavior                                                                                   |
|------------|----------------|--------------------------------------------------------------------------------------------|
| Disabled   | `disabled`     | Skip all reputation checks. No external API calls. Used for local development and testing. |
| Monitor    | `monitor`      | Call Abstract API, log results, reject only technically invalid emails (SMTP/MX failures). Never reject based on risk scoring. Used for demos and beta. |
| Enforce    | `enforce`      | Strictly validate. Reject disposable, undeliverable, high-risk, and low-score emails. Used for production. |

#### Monitor Mode Behavior

In monitor mode, the following events are logged but do **not** block registration:

- Disposable email detected
- High risk address or domain
- Low reputation score (< 0.5)

Only **technically invalid** emails are rejected:
- `is_smtp_valid == false` — the mail server rejected the address
- `is_mx_valid == false` — the domain has no mail exchange records

#### Enforce Mode Behavior

In enforce mode, registration is rejected if any of the following are true:

| Condition                     | HTTP Status | Error Code               |
|-------------------------------|-------------|--------------------------|
| Email is disposable           | 400         | `DISPOSABLE_EMAIL`       |
| SMTP validation failed        | 400         | `EMAIL_NOT_DELIVERABLE`  |
| MX validation failed          | 400         | `EMAIL_NOT_DELIVERABLE`  |
| Address risk is "high"        | 400         | `HIGH_RISK_EMAIL`        |
| Domain risk is "high"         | 400         | `HIGH_RISK_EMAIL`        |
| Reputation score < 0.5        | 400         | `LOW_REPUTATION_SCORE`   |

#### Graceful Fallback

If the Abstract API is unreachable, times out, or returns an error, the system **never blocks registration**. The reputation status is recorded as `"unchecked"` and registration proceeds normally. This ensures that an external API outage does not prevent legitimate users from signing up.

#### Example Responses

**Registration blocked (enforce — disposable email)**
```json
{
  "success": false,
  "error": {
    "code": "DISPOSABLE_EMAIL",
    "message": "disposable email addresses are not allowed"
  }
}
```

**Registration blocked (enforce — low reputation score)**
```json
{
  "success": false,
  "error": {
    "code": "LOW_REPUTATION_SCORE",
    "message": "email reputation score is too low"
  }
}
```

**API failure (any mode — graceful fallback)**
```json
{
  "message": "User registered successfully.Login your account"
}
```

#### Environment Configuration

```env
# .env file — choose one mode:
# EMAIL_REPUTATION_MODE=disabled    # Local development — skip all checks
# EMAIL_REPUTATION_MODE=monitor     # Demo/beta — log-only, reject only undeliverable
# EMAIL_REPUTATION_MODE=enforce     # Production — strict validation
ABSTRACT_EMAIL_REPUTATION_KEY=your_abstract_api_key
EMAIL_REPUTATION_MODE=disabled
```

#### Security Notes

- Email reputation is **one layer** of a defense-in-depth strategy
- **OTP verification is still mandatory** regardless of reputation mode
- Single-device login (already implemented) operates independently
- Reputation checks run during registration **only** — login is unaffected
- In monitor mode, suspicious activity is logged for auditing without blocking onboarding

---

**Error Responses**

| Status | Code                      | Reason                                             |
|--------|---------------------------|----------------------------------------------------|
| 400    | `INVALID_REQ_BODY`        | Missing or malformed fields                        |
| 400    | `DISPOSABLE_EMAIL`        | Disposable email addresses are not allowed         |
| 400    | `EMAIL_NOT_DELIVERABLE`   | Email is not deliverable (SMTP/MX failed)          |
| 400    | `HIGH_RISK_EMAIL`         | Email flagged as high risk                         |
| 400    | `LOW_REPUTATION_SCORE`    | Email reputation score below threshold             |
| 409    | `EMAIL_ALREADY_EXISTS`    | Email already linked to a personal or organization account (`existing_account_type` optional) |
| 429    | `RATE_LIMITED`            | Too many registration attempts from this IP (10 per minute) |
| 500    | `INTERNAL_SERVER_ERROR`   | Failed to create user or send email                |

> **Email Reputation:** Registration includes an optional email reputation check via Abstract API. The behavior depends on the `EMAIL_REPUTATION_MODE` environment variable. See [section 7.10](#710-email-reputation-verification) for details. **Login does NOT perform reputation checks.**

---

#### 7.3 Login

| Property  | Value           |
|-----------|-----------------|
| Method    | `POST`          |
| Path      | `/auth/login`   |
| Auth      | Not required    |
| Purpose   | Authenticate a user and receive JWT tokens. Email verification is **not** required — users may log in before verifying their email. |

> **Email normalization:** `email` is trimmed and lowercased server-side before lookup (must match the address used at registration).

**Required Headers**
```
Content-Type: application/json
```

**Request Body**

| Field                 | Type     | Required | Description                                    |
|-----------------------|----------|----------|------------------------------------------------|
| `email`               | string   | Yes      | Registered email                               |
| `password`            | string   | Yes      | Account password                               |
| `device_fingerprint`  | string   | No       | Pre-computed device fingerprint hash           |
| `device_info`         | object   | No       | Device attributes for fingerprinting           |

**`device_info` object fields:**

| Field         | Type   | Description                |
|---------------|--------|----------------------------|
| `timezone`    | string | User's IANA timezone       |
| `platform`    | string | Operating system           |
| `screen_size` | string | Screen resolution          |
| `language`    | string | Browser language code      |
| `canvas_hash` | string | Canvas fingerprint hash    |

**Example Request Body**
```json
{
  "email": "voter@example.com",
  "password": "SecurePass123",
  "device_info": {
    "timezone": "America/New_York",
    "platform": "Windows",
    "screen_size": "1920x1080",
    "language": "en-US",
    "canvas_hash": "a1b2c3d4e5..."
  }
}
```

**Success Response — 200 OK**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

> The refresh JWT is **not** returned in the body. It is set as `Set-Cookie: refresh_token_user=...; HttpOnly; Secure; SameSite=Strict`. Your JS code never sees it.

> You **must** include `credentials: 'include'` (Fetch) or `withCredentials: true` (Axios) so the browser accepts and stores the cookie.

**Error Responses**

| Status | Code                   | Reason                                                    |
|--------|------------------------|-----------------------------------------------------------|
| 400    | `INVALID_REQ_BODY`     | Malformed body                                            |
| 401    | `INVALID_CREDENTIALS`  | Wrong email or password (same message for unknown email and wrong password) |
| 403    | `ACCOUNT_SUSPENDED`    | Account has been suspended                                |
| 403    | `ACCOUNT_DELETED`      | Account has been deleted                                  |
| 429    | `ACCOUNT_LOCKED`       | Too many failed attempts — account temporarily locked     |
| 429    | `RATE_LIMITED`         | Too many login attempts per email or IP (5 per minute)   |
| 500    | `INTERNAL_SERVER_ERROR`| Unexpected server error                                   |

---

#### 7.4 Refresh Token

| Property  | Value             |
|-----------|-------------------|
| Method    | `POST`            |
| Path      | `/auth/refresh`   |
| Auth      | Not required      |
| Purpose   | Get a new access token using the refresh token stored in the `HttpOnly` cookie |

**Required Headers**
```
(none beyond credentials)
```

> **No request body needed.** The browser automatically attaches `refresh_token_user` or `refresh_token_org` (or legacy `refresh_token`). You must send the request with `credentials: 'include'` (Fetch) or `withCredentials: true` (Axios).

> **Rate limit:** 30 refresh attempts per minute per IP.

**Success Response — 200 OK**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses**

| Status | Code                  | Reason                                      |
|--------|-----------------------|---------------------------------------------|
| 401    | —                     | Cookie missing (user never logged in)       |
| 401    | `INVALID_CREDENTIALS` | Token expired or revoked — redirect to login|
| 429    | `RATE_LIMITED`        | Too many refresh attempts from this IP    |

---

#### 7.5 Logout

| Property  | Value              |
|-----------|--------------------|  
| Method    | `POST`             |
| Path      | `/auth/logout`     |
| Auth      | Not required (HttpOnly refresh cookie) |
| Purpose   | Invalidate the refresh token server-side and clear the cookie |

**Required Headers**

> **No request body needed.** The browser automatically attaches the refresh cookie (`refresh_token_user` or `refresh_token_org`). Works for both user and organization sessions. Send with `credentials: 'include'` (Fetch) or `withCredentials: true` (Axios). Bearer token is optional and not validated on this route. You must send the request with `credentials: 'include'` (Fetch) or `withCredentials: true` (Axios). The server clears the matching cookie (`refresh_token_user` or `refresh_token_org`) via `Set-Cookie` with `max-age=-1`.

**Success Response — 200 OK**
```json
{
  "message": "Logout successful"
}
```

**Error Responses**

| Status | Reason                                      |
|--------|---------------------------------------------|
| 401    | Cookie missing or refresh token not found   |
| 401    | Missing or invalid access token             |

---

#### 7.6 Get Current User (Me)

| Property  | Value              |
|-----------|--------------------|
| Method    | `GET`              |
| Path      | `/auth/me`         |
| Auth      | **Required** (Bearer token with `account_type: "user"`) |
| Purpose   | Return the profile of the authenticated user |

**Required Headers**
```
Authorization: Bearer <access_token>
```

> Organization tokens receive `403 FORBIDDEN` on this route — use `/auth/org/me` instead.

**Success Response — 200 OK**
```json
{
  "ID": 42,
  "FirstName": "John",
  "LastName": "Doe",
  "Email": "voter@example.com",
  "EmailVerified": false,
  "IsVerified": false,
  "IsTrusted": false,
  "MfaEnabled": false,
  "Status": "active",
  "CreatedAt": "2024-07-10T08:00:00Z",
  "LastLoginAt": "2024-07-10T09:15:00Z",
  "AvatarURL": "https://{project}.supabase.co/storage/v1/object/public/avatars/users/42/1.png",
  "HasAvatar": true
}
```

#### 7.6.1 Pixel avatars

See [ADR-024](../../decisions/024-pixel-avatars-supabase-storage.md). Same contracts as the [mobile API guide §7.2.0](../mobile/api-guide.md#720-pixel-avatars-user-org-team): `GET/PUT/POST .../avatar/upload-url` and `POST .../avatar/upload` for user (`/auth/me/avatar`), organization (`/auth/org/me/avatar`), and team (`/auth/v1/teams/:teamId/avatar`). Poll feed list items may include `admin_avatar_url`. Public profiles include `avatar_url`.

**Error Responses**

| Status | Code / Reason                       |
|--------|-------------------------------------|
| 401    | Missing or invalid access token     |
| 403    | `FORBIDDEN` — organization token used on user route |
| 404    | `USER_NOT_FOUND` — user deleted     |

---

#### 7.6.2 Delete user account

| Property | Value |
|----------|-------|
| Method | `DELETE` |
| Path | `/auth/me` |
| Auth | **Required** (Bearer token with `account_type: "user"`) |

**Request body**
```json
{ "password": "current-password" }
```

**Success — 202 Accepted**
```json
{
  "success": true,
  "status": "deleting",
  "account_type": "user",
  "account_id": "42"
}
```

**Error responses**

| Status | Code | When |
|--------|------|------|
| 401 | `INVALID_CREDENTIALS` | Wrong password |
| 409 | `SOLE_TEAM_OWNER` | User is sole owner of an active team |

Polls created by the account are purged asynchronously. Login returns `403 ACCOUNT_DELETED` after deletion starts.

---

#### 7.6.1 Search Users

| Property | Value |
|----------|-------|
| Method | `GET` |
| Path | `/auth/users/search?q=<query>&limit=10` |
| Auth | **Required** (Bearer token — user or organization) |
| Purpose | Search active users by name or email for tagging and mobile Search tab |

`q` must contain at least 2 characters. `limit` defaults to `10` and is capped at `20`. The current subject is excluded from results.

**Success Response — 200 OK**
```json
{
  "data": [
    {
      "id": 43,
      "first_name": "Ada",
      "last_name": "Lovelace",
      "email": "ada@example.com",
      "is_trusted": true,
      "is_verified": false
    }
  ]
}
```

---

#### 7.6.2 Public User Profile

| Property | Value |
|----------|-------|
| Method | `GET` |
| Path | `/auth/users/:id` |
| Auth | **Required** (Bearer token — user or organization) |
| Purpose | Basic public profile for mobile Search profile screen |

Returns **404** (`USER_NOT_FOUND`) when the user does not exist or is not `active`. Response never includes email, government-ID fields, or verification artifacts beyond boolean badges.

**Success Response — 200 OK**
```json
{
  "id": 43,
  "first_name": "Ada",
  "last_name": "Lovelace",
  "username": "ada",
  "bio": "Mathematician and writer.",
  "avatar_url": "https://{project}.supabase.co/storage/v1/object/public/avatars/users/43/1.png",
  "social_links": [{ "platform": "github", "handle": "ada", "url": "https://github.com/ada" }],
  "follower_count": 12,
  "following_count": 8,
  "is_following": false,
  "is_trusted": true,
  "is_verified": false
}
```

`is_following` is present when the viewer is authenticated. Email and government-ID fields are never returned.

#### 7.6.2a Profile social (bio, username, follows, social links)

See [ADR-026](../../decisions/026-subject-follow-graph.md), [ADR-027](../../decisions/027-profile-bio-usernames.md), [ADR-028](../../decisions/028-structured-social-links.md), [028-username-profile-urls](../../decisions/028-username-profile-urls.md). Full mobile client notes: [mobile API guide §7.2.0](../mobile/api-guide.md#profile-social-bio-username-follows-social-links).

| Method | Path | Notes |
|--------|------|-------|
| `PUT` | `/auth/me/profile` | Body may include `bio`, `username` |
| `PUT` | `/auth/org/me/profile` | Same for organization session |
| `PUT` | `/auth/me/social-links` | Replace-all `{ links: [{ platform, handle }] }` |
| `PUT` | `/auth/org/me/social-links` | Same for org |
| `PUT` | `/auth/me/follower-privacy` | `follower_list_visibility`: `full` \| `count_only` (verified or trusted) |
| `PUT` | `/auth/org/me/follower-privacy` | Same for org |
| `POST` | `/auth/subjects/:account_type/:id/follow` | Follow user or org (**idempotent**) |
| `DELETE` | `/auth/subjects/:account_type/:id/follow` | Unfollow (**idempotent**) |
| `GET` | `/auth/subjects/:account_type/:id/followers` | Privacy-gated list |
| `GET` | `/auth/subjects/:account_type/:id/following` | Following list |
| `DELETE` | `/auth/me/followers/:account_type/:id` | Remove follower (`is_verified` users only) |
| `GET` | `/vote/v1/subjects/:account_type/:id/stats` | `{ polls_created, votes_cast }` |

Username helpers and share URLs are documented in [§8.11](#811-poll-manage-actions) (profile share links + username resolver routes).

---

#### 7.6.3 Internal Public User Summaries

| Property | Value |
|----------|-------|
| Method | `POST` |
| Path | `/auth/internal/users/public-summaries` |
| Auth | `X-Internal-Token` (service-to-service) |
| Purpose | Bulk-resolve public-safe user fields for vote-service enrichment |

**Request**
```json
{
  "user_ids": ["43", "44"]
}
```

**Success Response — 200 OK**
```json
{
  "users": [
    {
      "id": "43",
      "first_name": "Ada",
      "last_name": "Lovelace",
      "is_trusted": true,
      "is_verified": false
    }
  ]
}
```

Only active users are returned. No email or gov-ID fields.

---

#### 7.6.4 Public Organization Profile

| Property | Value |
|----------|-------|
| Method | `GET` |
| Path | `/auth/org/:id` |
| Auth | **Required** (Bearer token — user or organization) |
| Purpose | Basic public profile for mobile Search organization profile screen |

Returns **404** (`ORGANIZATION_NOT_FOUND`) when the organization does not exist or is not `active`. Response never includes email, registration ID, official domain, or verification artifacts beyond boolean badges.

**Success Response — 200 OK**
```json
{
  "id": 5,
  "org_name": "Acme Corp",
  "is_trusted": true,
  "is_verified": false
}
```

---

#### 7.6.5 Internal Subject Public Summaries

| Property | Value |
|----------|-------|
| Method | `POST` |
| Path | `/auth/internal/subjects/public-summaries` |
| Auth | `X-Internal-Token` (service-to-service) |
| Purpose | Bulk-resolve public-safe fields for users and organizations (vote-service tag recommendations) |

**Request**
```json
{
  "subjects": [
    { "id": "43", "account_type": "user" },
    { "id": "5", "account_type": "organization" }
  ]
}
```

**Success Response — 200 OK**
```json
{
  "subjects": [
    {
      "id": "43",
      "account_type": "user",
      "first_name": "Ada",
      "last_name": "Lovelace",
      "is_trusted": true,
      "is_verified": false
    },
    {
      "id": "5",
      "account_type": "organization",
      "org_name": "Acme Corp",
      "is_trusted": true,
      "is_verified": false
    }
  ]
}
```

Only active subjects are returned. No email or gov-ID fields.

---

#### 7.6.6 Location sharing and nearby discovery

| Property | Value |
|----------|-------|
| Purpose | Opt-in proximity discovery for users and organizations |

**Location sharing toggle**

| Method | Path | Auth |
|--------|------|------|
| `PUT` | `/auth/me/location-sharing` | User |
| `PUT` | `/auth/org/me/location-sharing` | Organization |

**Request**
```json
{ "enabled": true }
```

**Response — 200 OK**
```json
{
  "sharing_enabled": true,
  "consent_at": "2026-06-11T12:00:00Z"
}
```

**Location update**

| Method | Path | Auth |
|--------|------|------|
| `PUT` | `/auth/me/location` | User |
| `PUT` | `/auth/org/me/location` | Organization |

**Request**
```json
{ "latitude": 12.97, "longitude": 77.59 }
```

**Response — 200 OK**
```json
{ "message": "location updated" }
```

Rate limit: **1 request per 30 seconds** per subject (`429 RATE_LIMITED`).

**Sharing status**

| Method | Path |
|--------|------|
| `GET` | `/auth/me/location-sharing` |
| `GET` | `/auth/org/me/location-sharing` |

**Nearby subjects**

| Property | Value |
|----------|-------|
| Method | `GET` |
| Path | `/auth/subjects/nearby` |
| Auth | **Required** (user or organization token) |

Viewer must have `sharing_enabled` or receives `403 LOCATION_SHARING_REQUIRED`.

| Query param | Default | Max |
|-------------|---------|-----|
| `latitude`, `longitude` | required | — |
| `radius_km` | 10 | 50 |
| `limit` | 20 | 50 |

Rate limit: **60 requests per minute** per viewer.

**Success Response — 200 OK**
```json
{
  "mode": "within_radius",
  "radius_km": 10,
  "results": [
    {
      "id": "42",
      "account_type": "user",
      "display_name": "Jane Doe",
      "email": "jane@example.com",
      "avatar_url": "https://{project}.supabase.co/storage/v1/object/public/avatars/users/42/1.png",
      "is_trusted": true,
      "is_verified": false,
      "distance_km": 1.2
    }
  ]
}
```

**`mode` values**

| Value | Meaning |
|-------|---------|
| `within_radius` | At least one sharer within `radius_km` |
| `nearest_fallback` | Zero in radius; nearest global sharers returned |
| `empty` | No eligible sharers |

Organization rows omit `email`. Peer coordinates are never returned.

See [ADR-015](../../decisions/015-nearby-subject-discovery.md).

---

#### 7.7 Send Verification
Notes : For now , Only 'priyadarsanf2@gmail.com' this Email is accepted for verification Testing. Same for send OTP and verify OTP.  
Email : priyadarsanf2@gmail.com  
Password : 123456

| Property  | Value                    |
|-----------|--------------------------|
| Method    | `POST`                   |
| Path      | `/auth/send-verification`|
| Auth      | **Required** (Bearer token) |
| Purpose   | Send a 6-digit OTP verification code to the authenticated user's email |

**Required Headers**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

> **No request body needed.** The server uses the authenticated user's email from the JWT token.

**Success Response — 200 OK**
```json
{
  "message": "Verification email sent"
}
```

**Error Responses**

| Status | Code               | Reason                                                       |
|--------|--------------------|--------------------------------------------------------------|
| 400    | `INVALID_REQ_BODY` | Malformed body                                               |
| 401    | —                  | Missing or invalid access token                              |
| 429    | `RATE_LIMITED`     | Maximum 3 OTP requests per 2-minute window exceeded          |
| 500    | —                  | Failed to send email (Resend API error)                      |

**Example Request**
```bash
curl -X POST https://auth-service/auth/send-verification \
  -H "Authorization: Bearer <access_token>"
```

---

#### 7.8 Verify Email

| Property  | Value                    |
|-----------|--------------------------|
| Method    | `POST`                   |
| Path      | `/auth/verify-email`     |
| Auth      | **Required** (Bearer token) |
| Purpose   | Verify the authenticated user's email using the OTP sent to their inbox |

**Required Headers**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**

| Field | Type   | Required | Description                      |
|-------|--------|----------|----------------------------------|
| `otp` | string | Yes      | 6-digit code received via email  |

**Example Request Body**
```json
{
  "otp": "483291"
}
```

**Success Response — 200 OK**
```json
{
  "message": "Email verified successfully"
}
```

**Error Responses**

| Status | Code               | Reason                                                       |
|--------|--------------------|--------------------------------------------------------------|
| 400    | `INVALID_REQ_BODY` | Missing or malformed `otp` field                              |
| 401    | —                  | Missing or invalid access token                              |
| 401    | `INVALID_OTP`      | Invalid or expired OTP                                       |
| 429    | `RATE_LIMITED`     | Maximum 5 verification attempts per 2-minute window exceeded |

**Example Request**
```bash
curl -X POST https://auth-service/auth/verify-email \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"otp": "483291"}'
```

---

#### 7.8.1 Forgot Password

Password reset is a three-step flow for users and organizations (no auth required). Requesting a new code **invalidates** any previous unused reset codes for that email.

| Step | Method | Path | Purpose |
|------|--------|------|---------|
| 1 | `POST` | `/auth/forgot-password/send-otp` | Send a 6-digit reset code to the email |
| 2 | `POST` | `/auth/forgot-password/verify-otp` | Verify the code; returns a short-lived `reset_token` |
| 3 | `POST` | `/auth/forgot-password/reset` | Set a new password using `reset_token` |

**Send OTP — request body**

```json
{ "email": "user@example.com" }
```

**Send OTP — success — 200 OK**

```json
{
  "message": "If this email is registered, a reset code has been sent."
}
```

Always returns `200` when the body is valid (no email enumeration).

**Verify OTP — request body**

```json
{
  "email": "user@example.com",
  "otp": "483291"
}
```

**Verify OTP — success — 200 OK**

```json
{
  "reset_token": "<opaque-token>",
  "message": "OTP verified. You can now reset your password."
}
```

**Reset — request body**

```json
{
  "reset_token": "<opaque-token>",
  "new_password": "NewSecurePass123"
}
```

**Reset — success — 200 OK**

```json
{
  "message": "Password reset successfully. Please sign in with your new password."
}
```

**Error responses (verify / reset)**

| Status | Code | Reason |
|--------|------|--------|
| 400 | `INVALID_REQ_BODY` | Missing or malformed fields |
| 401 | `INVALID_OTP` | Wrong or expired code (verify step) |
| 401 | `INVALID_RESET_TOKEN` | Wrong or expired `reset_token` (reset step) |
| 400 | `SAME_PASSWORD` | New password matches the current password |
| 429 | `RATE_LIMITED` | Too many send or verify attempts |

---

#### 7.9 List Sessions

| Property  | Value                |
|-----------|----------------------|
| Method    | `GET`                |
| Path      | `/auth/sessions`     |
| Auth      | **Required** (Bearer token) |
| Purpose   | List all active sessions (refresh tokens) for the authenticated account (user or organization), ordered by last activity |

**Required Headers**
```
Authorization: Bearer <access_token>
```

**Success Response — 200 OK**
```json
{
  "sessions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "account_type": "user",
      "user_id": "42",
      "device_fingerprint": "abc123...",
      "ip_address": "203.0.113.42",
      "country": "",
      "city": "",
      "user_agent": "Mozilla/5.0 ...",
      "expires_at": "2024-07-17T09:15:00Z",
      "created_at": "2024-07-10T09:15:00Z",
      "updated_at": "2024-07-10T09:15:00Z",
      "last_seen_at": "2024-07-10T09:15:00Z"
    }
  ]
}
```

**Error Responses**

| Status | Code | Reason                              |
|--------|------|-------------------------------------|
| 401    | —    | Missing or invalid access token     |
| 500    | `INTERNAL_SERVER_ERROR` | Unexpected server error |

> Works for both `account_type: "user"` and `"organization"` access tokens. Organization sessions use the same path; each item includes `account_type` and `user_id` (JWT subject id for that account).

---

#### 7.10 Aadhaar Verification

Aadhaar verification uses the Sandbox.co.in OKYC API to verify a user's identity via OTP sent to their Aadhaar-linked mobile number.

| Property | Value |
|----------|-------|
| Trigger | Optional — controlled by `AADHAAR_VERIFICATION_MODE` environment variable |
| Dependency | User must have `email_verified = true` before proceeding |
| Service | Sandbox.co.in Aadhaar OKYC API |
| Data stored | `user_aadhaar_verifications` table + `is_aadhaar_verified` / `aadhaar_verified_at` on `users` table |

#### Prerequisite: Email Verification

Aadhaar verification **requires** the user to have verified their email first. If `email_verified` is `false`, the API returns:

```json
{
  "success": false,
  "error": {
    "code": "EMAIL_NOT_VERIFIED",
    "message": "email not verified"
  }
}
```

#### Feature Modes

Controlled by the `AADHAAR_VERIFICATION_MODE` environment variable:

| Mode | Value | Behavior |
|------|-------|----------|
| Disabled | `disabled` | All Aadhaar endpoints return `AADHAAR_FEATURE_DISABLED`. No external API calls. |
| Monitor | `monitor` | Feature active. On API failure, logs the error and falls back gracefully (operation may succeed with limited data). |
| Enforce | `enforce` | Feature active. Strict mode — API failure blocks the operation entirely. |

#### Session Resumption

The `reference_id` from OTP generation is stored in the database. Users can navigate away and return — the `GET /auth/aadhaar/status` endpoint returns any pending verification, allowing the frontend to resume the flow.

---

#### 7.10.1 Generate Aadhaar OTP

| Property | Value |
|----------|-------|
| Method | `POST` |
| Path | `/auth/aadhaar/generate-otp` |
| Auth | **Required** (Bearer token) |
| Purpose | Send an OTP to the mobile number registered with the provided Aadhaar number |

**Required Headers**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `aadhaar_number` | string | Yes | 12-digit Aadhaar number |

**Example Request Body**
```json
{
  "aadhaar_number": "123412341234"
}
```

**Success Response — 200 OK**
```json
{
  "reference_id": "1234567",
  "message": "OTP sent to Aadhaar-linked mobile number"
}
```

**Error Responses**

| Status | Code | Reason |
|--------|------|--------|
| 400 | `INVALID_REQ_BODY` | Missing or malformed `aadhaar_number` |
| 401 | — | Missing or invalid access token |
| 403 | `EMAIL_NOT_VERIFIED` | User must verify their email first |
| 403 | `AADHAAR_FEATURE_DISABLED` | Feature is disabled in current mode |
| 409 | `AADHAAR_ALREADY_VERIFIED` | User already verified |
| 503 | `AADHAAR_VERIFICATION_FAILED` | Sandbox API unavailable (enforce mode) |

---

#### 7.10.2 Verify Aadhaar OTP

| Property | Value |
|----------|-------|
| Method | `POST` |
| Path | `/auth/aadhaar/verify-otp` |
| Auth | **Required** (Bearer token) |
| Purpose | Verify the OTP and retrieve e-KYC data from Aadhaar |

**Required Headers**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reference_id` | string | Yes | Reference ID received from the Generate OTP response |
| `otp` | string | Yes | 6-digit OTP received on Aadhaar-linked mobile |

**Example Request Body**
```json
{
  "reference_id": "1234567",
  "otp": "123456"
}
```

**Success Response — 200 OK**
```json
{
  "message": "Aadhaar verified successfully",
  "status": "VALID",
  "name": "John Doe",
  "care_of": "S/O: Johnny Doe",
  "full_address": "Mangal Kanaka Niwas, Main Cross 3rd, Bengaluru, Bengaluru-Karnataka, India",
  "date_of_birth": "21-04-1985",
  "gender": "M",
  "photo": "/9j/4AAQSk.......mj/2Q=="
}
```
> **Photo**: The Photo is a base64-encoded string representing the user's photo.  
  > **How to use it** : Decode the base64 string and use it as an image source in your application.

**Error Responses**

| Status | Code | Reason |
|--------|------|--------|
| 400 | `INVALID_REQ_BODY` | Missing or malformed fields |
| 400 | `AADHAAR_OTP_EXPIRED` | OTP expired — generate a new one via `/generate-otp` |
| 401 | — | Missing or invalid access token |
| 401 | `AADHAAR_INVALID_OTP` | Invalid OTP — user can retry |
| 403 | `EMAIL_NOT_VERIFIED` | User must verify their email first |
| 403 | `AADHAAR_FEATURE_DISABLED` | Feature is disabled in current mode |
| 503 | `AADHAAR_VERIFICATION_FAILED` | Sandbox API unavailable (enforce mode) |

> **OTP Retry**: If the OTP is invalid, the user may re-enter it. There is no strict retry limit enforced by this service (UIDAI governs retry limits on their side).
>
> **OTP Expired**: Return `AADHAAR_OTP_EXPIRED` — user must call `/generate-otp` again to start a fresh session.
>
> **Invalid Reference ID**: The reference_id returned from `POST /auth/aadhaar/generate-otp` is stored server-side. If the user provides an unknown reference_id, the request will fail with `AADHAAR_VERIFICATION_FAILED`. Use `GET /auth/aadhaar/status` to retrieve the correct reference_id.

---

#### 7.10.3 Get Aadhaar Status

| Property | Value |
|----------|-------|
| Method | `GET` |
| Path | `/auth/aadhaar/status` |
| Auth | **Required** (Bearer token) |
| Purpose | Retrieve the latest Aadhaar verification record for the authenticated user |

**Required Headers**
```
Authorization: Bearer <access_token>
```

**Success Response — 200 OK (verified)**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "reference_id": "1234567",
  "status": "VALID",
  "name": "John Doe",
  "is_verified": true,
  "created_at": "2024-07-10T10:00:00Z",
  "updated_at": "2024-07-10T10:05:00Z"
}
```

**Success Response — 200 OK (pending)**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "reference_id": "1234567",
  "status": "PENDING",
  "name": "",
  "is_verified": false,
  "created_at": "2024-07-10T10:00:00Z",
  "updated_at": "2024-07-10T10:00:00Z"
}
```

**Error Responses**

| Status | Code | Reason |
|--------|------|--------|
| 401 | — | Missing or invalid access token |
| 403 | `USER_NOT_TRUSTED` | Email not verified — complete email verification to become a trusted user |
| 403 | `AADHAAR_FEATURE_DISABLED` | Feature is disabled in current mode |
| 404 | `AADHAAR_NOT_FOUND` | No Aadhaar verification record found — complete Aadhaar verification to become a verified user |

---

#### 7.11 Verification Check

The verification check evaluates whether a user meets all conditions required for full platform access. A user is considered "fully verified" only when all 5 conditions are satisfied.

| Property | Value |
|----------|-------|
| Trigger | Manual — the frontend can call the recheck endpoint at any time |
| Dependency | Both `/auth/me/verified` and `/auth/me/recheck-verification` require authentication |
| Data read | `is_verified` on the `users` table (simple check) or all verification fields (recheck) |

#### Verification Conditions

| # | Condition | Source | Detail |
|---|-----------|--------|--------|
| 1 | Email verified | `users.email_verified` | User must have verified their email via OTP |
| 2 | Reputation score ≥ 0.5 | `users.email_reputation_score` | Email must have a good reputation score |
| 3 | Risk status = "low" | `users.email_risk_status` | Email must not be flagged as high risk |
| 4 | Aadhaar verified | `users.is_aadhaar_verified` | User must have completed Aadhaar e-KYC |
| 5 | Name match | `user_aadhaar_verifications.name` vs `users.first_name + last_name` | Aadhaar name must match the registered name (case-insensitive, whitespace-normalized) |

If a user passes all 5 checks, `is_verified` is set to `true` in the database and the user is granted full platform access.

---

#### 7.11.1 Get Verified Status

| Property | Value |
|----------|-------|
| Method | `GET` |
| Path | `/auth/me/verified` |
| Auth | **Required** (Bearer token) |
| Purpose | Simple check of the `is_verified` field. Returns immediately without re-evaluating conditions. |

**Required Headers**
```
Authorization: Bearer <access_token>
```

**Success Response — 200 OK**
```json
{
  "is_verified": true,
  "is_trusted": true
}
```

**Error Responses**

| Status | Code | Reason |
|--------|------|--------|
| 401 | — | Missing or invalid access token |
| 403 | `USER_NOT_TRUSTED` | Email not verified — complete email verification to become a trusted user |
| 403 | `AADHAAR_VERIFICATION_REQUIRED` | Aadhaar not verified — complete Aadhaar verification to become a verified user |
| 403 | `USER_NOT_VERIFIED` | Trusted and Aadhaar verified but other checks failed — call `/auth/me/recheck-verification` for details |

---

#### 7.11.2 Recheck Verification

| Property | Value |
|----------|-------|
| Method | `POST` |
| Path | `/auth/me/recheck-verification` |
| Auth | **Required** (Bearer token) |
| Purpose | Re-evaluate all 5 verification conditions, update `is_verified` in the DB if all pass, and return a detailed breakdown. Always returns 200. |

**Required Headers**
```
Authorization: Bearer <access_token>
```

> **No request body needed.** The server evaluates conditions from the authenticated user's existing data.

**Success Response — 200 OK (all checks pass)**
```json
{
  "is_verified": true,
  "checks": {
    "email_verified": true,
    "email_reputation": {
      "good": true,
      "score": 0.85
    },
    "email_risk": {
      "good": true,
      "status": "low"
    },
    "is_aadhaar_verified": true,
    "name_match": {
      "good": true,
      "registered_name": "John Doe",
      "aadhaar_name": "John Doe"
    }
  }
}
```

**Success Response — 200 OK (some checks fail)**
```json
{
  "is_verified": false,
  "checks": {
    "email_verified": true,
    "email_reputation": {
      "good": false,
      "score": 0.3
    },
    "email_risk": {
      "good": false,
      "status": "high"
    },
    "is_aadhaar_verified": false,
    "name_match": {
      "good": false,
      "registered_name": "John Doe",
      "aadhaar_name": ""
    }
  },
  "missing": [
    "email reputation score is 0.30 (need >= 0.5)",
    "email risk status is 'high' (need 'low')",
    "aadhaar not verified",
    "aadhaar verification record not found or name empty"
  ]
}
```

**Error Responses**

| Status | Code | Reason |
|--------|------|--------|
| 401 | — | Missing or invalid access token |

---

### Organization Endpoints

#### 7.12 Organization Endpoints

Organizational accounts are fully separated from user accounts with their own table, registration, login, and email verification flow. The email verification and email reputation mechanisms are the same as user accounts — only the naming and endpoints differ.

| Property | Value |
|----------|-------|
| Auth | Separate endpoints under `/auth/org/*` |
| Email verification | Same OTP-based flow as user accounts |
| Email reputation | Same Abstract API check as user accounts |
| JWT account_type | `"organization"` |

---

#### 7.12.1 Register Organization

| Property | Value |
|----------|-------|
| Method | `POST` |
| Path | `/auth/org/register` |
| Auth | Not required |
| Purpose | Create a new organizational account |

> **Global email policy:** Same as [user registration](#72-register) — one email globally across account types.

**Required Headers**
```
Content-Type: application/json
```

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `org_name` | string | Yes | Organization name |
| `email` | string | Yes | Valid email address |
| `password` | string | Yes | Plain-text password (hashed server-side) |
| `device_fingerprint` | string | No | Pre-computed device fingerprint hash |
| `device_info` | object | No | Device attributes for fingerprinting |

**`device_info` object fields:**

| Field | Type | Description |
|-------|------|-------------|
| `timezone` | string | User's IANA timezone |
| `platform` | string | Operating system |
| `screen_size` | string | Screen resolution |
| `language` | string | Browser language code |
| `canvas_hash` | string | Canvas fingerprint hash |

**Example Request Body**
```json
{
  "org_name": "Acme Corp",
  "email": "admin@acme.com",
  "password": "SecurePass123"
}
```

**Success Response — 201 Created**
```json
{
  "message": "Organization registered successfully. Login your account"
}
```

**Error Responses**

| Status | Code | Reason |
|--------|------|--------|
| 400 | `INVALID_REQ_BODY` | Missing or malformed fields |
| 400 | `ORG_NAME_REQUIRED` | Organization name is required |
| 400 | `DISPOSABLE_EMAIL` | Disposable email addresses are not allowed |
| 400 | `EMAIL_NOT_DELIVERABLE` | Email is not deliverable (SMTP/MX failed) |
| 400 | `HIGH_RISK_EMAIL` | Email flagged as high risk |
| 400 | `LOW_REPUTATION_SCORE` | Email reputation score below threshold |
| 409 | `EMAIL_ALREADY_EXISTS` | Email already linked to a personal or organization account (`existing_account_type` optional) |
| 429 | `RATE_LIMITED` | Too many registration attempts from this IP (10 per minute) |
| 500 | `INTERNAL_SERVER_ERROR` | Failed to create organization or send email |

> **Email normalization:** `email` is trimmed and lowercased server-side.

> Email reputation verification works identically to user registration — see [Section 7.2.1](#721-email-reputation-verification-this-only-for-backend) for details.

---

#### 7.12.2 Login Organization

| Property | Value |
|----------|-------|
| Method | `POST` |
| Path | `/auth/org/login` |
| Auth | Not required |
| Purpose | Authenticate as an organization and receive JWT tokens |

**Required Headers**
```
Content-Type: application/json
```

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Registered organization email |
| `password` | string | Yes | Organization account password |
| `device_fingerprint` | string | No | Pre-computed device fingerprint hash |
| `device_info` | object | No | Device attributes for fingerprinting |

**Example Request Body**
```json
{
  "email": "admin@acme.com",
  "password": "SecurePass123"
}
```

**Success Response — 200 OK**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

> The refresh JWT is set as `Set-Cookie: refresh_token_org=...` (`HttpOnly`). See [Section 7.3](#73-login) for the same flow as user login.

> **Email normalization:** `email` is trimmed and lowercased server-side.

**Error Responses**

| Status | Code | Reason |
|--------|------|--------|
| 400 | `INVALID_REQ_BODY` | Malformed body |
| 401 | `INVALID_CREDENTIALS` | Wrong email or password (same message for unknown email and wrong password) |
| 403 | `ACCOUNT_SUSPENDED` | Organization account has been suspended |
| 403 | `ACCOUNT_DELETED` | Organization account has been deleted |
| 429 | `ACCOUNT_LOCKED` | Too many failed attempts — account temporarily locked |
| 429 | `RATE_LIMITED` | Too many login attempts per email or IP (5 per minute) |
| 500 | `INTERNAL_SERVER_ERROR` | Unexpected server error |

---

#### 7.12.3 Get Current Organization (Org Me)

| Property | Value |
|----------|-------|
| Method | `GET` |
| Path | `/auth/org/me` |
| Auth | **Required** (Bearer token with `account_type: "organization"`) |
| Purpose | Return the profile of the authenticated organization |

**Required Headers**
```
Authorization: Bearer <access_token>
```

> User tokens receive `403 FORBIDDEN` on this route — use `/auth/me` instead.

**Success Response — 200 OK**
```json
{
  "ID": 1,
  "OrgName": "Acme Corp",
  "Email": "admin@acme.com",
  "EmailVerified": false,
  "IsVerified": false,
  "IsTrusted": false,
  "MfaEnabled": false,
  "Status": "active",
  "VerifiedAt": null,
  "CreatedAt": "2024-07-10T08:00:00Z",
  "LastLoginAt": null
}
```

**Error Responses**

| Status | Code / Reason |
|--------|--------|
| 401 | Missing or invalid access token |
| 403 | `FORBIDDEN` — user token used on organization route |
| 404 | `ORGANIZATION_NOT_FOUND` — organization deleted |

---

#### 7.12.3.1 Delete organization account

| Property | Value |
|----------|-------|
| Method | `DELETE` |
| Path | `/auth/org/me` |
| Auth | **Required** (Bearer token with `account_type: "organization"`) |

**Request body**
```json
{ "password": "current-password" }
```

**Success — 202 Accepted**
```json
{
  "success": true,
  "status": "deleting",
  "account_type": "organization",
  "account_id": "1"
}
```

**Error responses**

| Status | Code | When |
|--------|------|------|
| 401 | `INVALID_CREDENTIALS` | Wrong password |
| 409 | `OWNS_TEAMS` | Organization still owns active teams |

---

#### 7.12.4 Send Organization Verification

| Property | Value |
|----------|-------|
| Method | `POST` |
| Path | `/auth/org/send-verification` |
| Auth | **Required** (Bearer token) |
| Purpose | Send a 6-digit OTP verification code to the authenticated organization's email |

**Required Headers**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

> **No request body needed.** The server uses the authenticated organization's email from the JWT token.

**Success Response — 200 OK**
```json
{
  "message": "Organization verification email sent"
}
```

**Error Responses**

| Status | Code | Reason |
|--------|------|--------|
| 401 | — | Missing or invalid access token |
| 429 | `RATE_LIMITED` | Maximum 3 OTP requests per 2-minute window exceeded |
| 500 | — | Failed to send email (Resend API error) |

---

#### 7.12.5 Verify Organization Email

| Property | Value |
|----------|-------|
| Method | `POST` |
| Path | `/auth/org/verify-email` |
| Auth | **Required** (Bearer token) |
| Purpose | Verify the authenticated organization's email using the OTP sent to their inbox |

**Required Headers**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `otp` | string | Yes | 6-digit code received via email |

**Example Request Body**
```json
{
  "otp": "483291"
}
```

**Success Response — 200 OK**
```json
{
  "message": "Organization email verified successfully"
}
```

**Error Responses**

| Status | Code | Reason |
|--------|------|--------|
| 400 | `INVALID_REQ_BODY` | Missing or malformed `otp` field |
| 401 | — | Missing or invalid access token |
| 401 | `INVALID_OTP` | Invalid or expired OTP |
| 429 | `RATE_LIMITED` | Maximum 5 verification attempts per 2-minute window exceeded |

---

#### 7.13 Verified Organization Pipeline

The Verified Organization Pipeline transforms a **Trusted Organization** (email-verified) into a **Verified Organization** through a multi-step process that validates business registration, legal status, and domain ownership.

```
   ┌──────────────────────────────────────────────────────────────────┐
   │                   VERIFIED ORGANIZATION PIPELINE                 │
   │                                                                  │
   │  [Trusted Org]                                                    │
   │   (email verified)                                               │
   │       │                                                          │
   │       ▼                                                          │
   │  ┌──────────────────────┐                                        │
   │  │ Step 1: Registration │──► MCA API lookup (Sandbox)           │
   │  │ Number Submission    │    Validates LLPIN or CIN format       │
   │  └──────────┬───────────┘    Returns full MCA record             │
   │             │                                                    │
   │             ▼                                                    │
   │  ┌──────────────────────┐                                        │
   │  │ Step 2: MCA Checks   │──► Business name match                 │
   │  │ (automatic)          │──► LLP/Company status = "Active"       │
   │  └──────────┬───────────┘──► Incorporation date valid            │
   │             │                                                    │
   │             ▼                                                    │
   │  ┌──────────────────────┐                                        │
   │  │ Step 3: Domain       │──► Domain format validation            │
   │  │ Submission           │──► Email domain match check            │
   │  └──────────┬───────────┘──► Generates DNS verification token    │
   │             │                                                    │
   │             ▼                                                    │
   │  ┌──────────────────────┐                                        │
   │  │ Step 4: DNS TXT      │──► Looks up _e-voting-verify.<domain>  │
   │  │ Verification         │──► Matches TXT record value            │
   │  └──────────┬───────────┘                                        │
   │             │                                                    │
   │             ▼                                                    │
   │  ┌──────────────────────┐                                        │
   │  │ ✅ Verified!         │   verified_at timestamp saved          │
   │  └──────────────────────┘   Full platform access granted         │
   └──────────────────────────────────────────────────────────────────┘
```

#### Feature Modes

| Mode | `ORG_VERIFICATION_MODE` | Behavior |
|------|------------------------|----------|
| Disabled | `disabled` | All endpoints return `ORG_VERIFICATION_EXPIRED`. No MCA API calls. Default. |
| Monitor | `monitor` | Steps proceed on API failure with failed step results logged. Pipeline continues. |
| Enforce | `enforce` | Strict validation: API failure blocks the step and may expire the verification. |

#### Prerequisites

1. Organization must be **Trusted** (email verified via `POST /auth/org/verify-email`) — returns `ORG_NOT_TRUSTED` otherwise
2. Organization must **not already be verified** — returns `ORG_ALREADY_VERIFIED` otherwise
3. Only **one active verification** request allowed at a time — returns `VERIFICATION_IN_PROGRESS` otherwise

#### Environment Configuration

```env
ORG_VERIFICATION_MODE=disabled   # Local development
ORG_VERIFICATION_MODE=monitor    # Demo/beta — graceful fallback
ORG_VERIFICATION_MODE=enforce    # Production — strict validation
SANDBOX_BASE_URL=https://test-api.sandbox.co.in
```

---

#### 7.13.1 Start Organization Verification

| Property | Value |
|----------|-------|
| Method | `POST` |
| Path | `/auth/org/verify/start` |
| Auth | **Required** (Bearer token, organization account) |
| Purpose | Initialize the verification pipeline. Returns the current step and instructions. |

**Required Headers**
```
Authorization: Bearer <access_token>
```

> **No request body needed.**

**Success Response — 200 OK**
```json
{
  "message": "Organization verification started",
  "request": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "current_step": "registration_number",
    "status": "in_progress"
  },
  "instructions": "Submit your business registration number (LLPIN for LLP or CIN for company)."
}
```

**Error Responses**

| Status | Code | Reason |
|--------|------|--------|
| 401 | — | Missing or invalid access token |
| 403 | `ORG_NOT_TRUSTED` | Organization email not verified — complete email verification first |
| 403 | `ORG_VERIFICATION_EXPIRED` | Feature is disabled in current mode |
| 409 | `ORG_ALREADY_VERIFIED` | Organization is already verified |
| 409 | `VERIFICATION_IN_PROGRESS` | A verification request is already active |

---

#### 7.13.2 Submit Registration Number

| Property | Value |
|----------|-------|
| Method | `POST` |
| Path | `/auth/org/verify/submit-registration-number` |
| Auth | **Required** (Bearer token, organization account) |
| Purpose | Submit an LLPIN (for LLPs) or CIN (for companies) for MCA lookup. Returns MCA data and step-by-step verification results. |

**Required Headers**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `registration_number` | string | Yes | LLPIN (`ABC-1234`) or CIN (`U12345MH2024PLC123456`) format |

**LLPIN Format:** `ABC-1234` (3 letters, hyphen, 4 digits)

**CIN Format:** `U12345MH2024PLC123456` (1 letter, 5 digits, 1 letter, 4 digits, 3 letters, 6 digits, 1 letter, 4 digits)

**Example Request Body**
```json
{
  "registration_number": "ABC-1234"
}
```

**Success Response — 200 OK (LLP Entity)**
```json
{
  "message": "Registration number submitted",
  "results": {
    "registration_number": { "status": "passed" },
    "business_name": { "status": "passed" },
    "entity_status": { "status": "passed" },
    "incorporation_date": { "status": "passed" }
  },
  "organization": {
    "official_domain": "acme.com",
    "registration_id": "ABC-1234",
    "org_type": "llp"
  },
  "next_step": {
    "step": "domain",
    "instructions": "Submit your official business domain."
  }
}
```

**Success Response — 200 OK (Company Entity)**
```json
{
  "message": "Registration number submitted",
  "results": {
    "registration_number": { "status": "passed" },
    "business_name": { "status": "passed" },
    "entity_status": { "status": "passed" },
    "incorporation_date": { "status": "passed" }
  },
  "organization": {
    "official_domain": "acme.com",
    "registration_id": "U12345MH2024PLC123456",
    "org_type": "company"
  },
  "next_step": {
    "step": "domain",
    "instructions": "Submit your official business domain."
  }
}
```

**Success Response — 200 OK (Some checks fail, monitor mode)**
```json
{
  "message": "Registration number submitted",
  "results": {
    "registration_number": { "status": "passed" },
    "business_name": {
      "status": "failed",
      "message": "Business name 'Acme Corp' does not match MCA record 'Acme Solutions Pvt Ltd'"
    },
    "entity_status": {
      "status": "failed",
      "message": "Company status is 'Under Process', expected 'Active'"
    },
    "incorporation_date": { "status": "passed" }
  },
  "organization": {
    "official_domain": "acme.com",
    "registration_id": "U12345MH2024PLC123456",
    "org_type": "company"
  },
  "next_step": {
    "step": "domain",
    "instructions": "Submit your official business domain."
  }
}
```

**MCA Data Reference (stored server-side):**

| Field | Source | Description |
|-------|--------|-------------|
| `legal_name` | MCA | Registered LLP or Company name |
| `status` | MCA | Derived status — `active` or `inactive` |
| `status_type` | MCA | Entity type — `CIN` (company) or `LLPIN` (LLP) |
| `roc_code` | MCA | Registrar of Companies code |
| `registered_address` | MCA | Registered office address |
| `email_id` | MCA | Registered email address |
| `date_of_incorporation` | MCA | Incorporation date |

> The `organizations` table is also auto-populated with `official_domain` (extracted from MCA email_id), `registration_id` (CIN or LLPIN), and `org_type` (`llp` or `company`).

**Error Responses**

| Status | Code | Reason |
|--------|------|--------|
| 400 | `INVALID_REQ_BODY` | Missing or malformed `registration_number` field |
| 400 | `NO_VERIFICATION_IN_PROGRESS` | No active verification request — call `/start` first |
| 400 | `INVALID_VERIFICATION_STEP` | Current step is not `registration_number` (e.g. domain not submitted yet) |
| 409 | `REGISTRATION_NUMBER_STEP_COMPLETE` | Registration number already verified — proceed to domain verification (`submit-domain`) |
| 400 | `INVALID_REGISTRATION_NUMBER` | Format does not match LLPIN or CIN pattern |
| 400 | `ORG_STATUS_NOT_ACTIVE` | LLP/Company status is not "Active" (enforce mode) |
| 400 | `INCORPORATION_DATE_INVALID` | Incorporation date format is invalid (enforce mode) |
| 401 | — | Missing or invalid access token |
| 404 | `REGISTRATION_NUMBER_NOT_FOUND` | Registration number not found in MCA records (enforce mode) |
| 409 | `BUSINESS_NAME_MISMATCH` | Business name does not match MCA records (enforce mode) |
| 503 | `MCA_SERVICE_UNAVAILABLE` | MCA API unavailable, please try again later (enforce mode) |

---

#### 7.13.3 Submit Domain

| Property | Value |
|----------|-------|
| Method | `POST` |
| Path | `/auth/org/verify/submit-domain` |
| Auth | **Required** (Bearer token, organization account) |
| Purpose | Submit the official business domain. The domain must match the organization email's domain. Returns a DNS verification token. |

**Required Headers**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `domain` | string | Yes | Official business domain (e.g., `acme.com`) |

> The domain is automatically sanitized: `www.` prefix, `http://`/`https://` protocol, and path suffixes are stripped. Only the root domain is stored.

**Example Request Body**
```json
{
  "domain": "acme.com"
}
```

**Success Response — 200 OK**
```json
{
  "message": "Domain submitted successfully",
  "results": {
    "domain_format": { "status": "passed" },
    "email_domain_match": { "status": "passed" }
  },
  "domain_verification": {
    "domain": "acme.com",
    "token": "e-voting-verify=a1b2c3d4e5f6a7b8-1717200000"
  },
  "next_step": {
    "step": "dns",
    "instructions": "Add the following TXT record to your DNS:\n  Record name: _e-voting-verify.acme.com\n  Record value: e-voting-verify=a1b2c3d4e5f6a7b8-1717200000\n  TTL: 300 (or default)\n\nThen call the verify-dns endpoint to confirm."
  }
}
```

**DNS Setup Instructions**

To complete domain verification, add a **TXT record** to your domain's DNS configuration:

| Field | Value |
|-------|-------|
| Record type | `TXT` |
| Record name | `_e-voting-verify` (or `_e-voting-verify.yourdomain.com` depending on your DNS provider) |
| Record value | The `token` from the domain_verification response (e.g., `e-voting-verify=a1b2c3d4e5f6a7b8-1717200000`) |
| TTL | `300` (5 minutes) or your provider's default |

> **DNS Propagation:** Changes may take a few minutes to propagate. Most providers update within 1-5 minutes. No need to wait longer — the verify-dns endpoint performs a live lookup.

**Error Responses**

| Status | Code | Reason |
|--------|------|--------|
| 400 | `INVALID_REQ_BODY` | Missing or malformed `domain` field |
| 400 | `NO_VERIFICATION_IN_PROGRESS` | No active verification request — call `/start` first |
| 400 | `INVALID_VERIFICATION_STEP` | Current step is not `domain` (e.g. registration number not submitted yet) |
| 409 | `DOMAIN_STEP_COMPLETE` | Domain already verified — proceed to DNS verification (`verify-dns`) |
| 400 | `INVALID_DOMAIN` | Domain format is invalid (enforce mode) |
| 401 | — | Missing or invalid access token |
| 409 | `EMAIL_DOMAIN_MISMATCH` | Email domain does not match submitted domain (enforce mode) |

---

#### 7.13.4 Verify DNS

| Property | Value |
|----------|-------|
| Method | `POST` |
| Path | `/auth/org/verify/verify-dns` |
| Auth | **Required** (Bearer token, organization account) |
| Purpose | Perform a live DNS TXT record lookup to confirm domain ownership. Must be called after adding the TXT record from the domain submission step. |

**Required Headers**
```
Authorization: Bearer <access_token>
```

> **No request body needed.** The server looks up `_e-voting-verify.<submitted-domain>` TXT record and matches it against the stored token.

**Success Response — 200 OK (verified)**
```json
{
  "message": "DNS verification successful. Organization is now verified.",
  "verified": true
}
```

**Success Response — 200 OK (TXT record not found or token mismatch)**
```json
{
  "message": "DNS TXT record not found at _e-voting-verify.acme.com. Please add the record and try again.",
  "verified": false,
  "retry": true
}
```

> **Note:** If the TXT record exists but the token doesn't match, the response will indicate the mismatch. Double-check that you copied the token exactly. DNS verification is case-sensitive.

**Error Responses**

| Status | Code | Reason |
|--------|------|--------|
| 400 | `NO_VERIFICATION_IN_PROGRESS` | No active verification request — call `/start` first |
| 400 | `INVALID_VERIFICATION_STEP` | Current step is not `dns` — submit domain first |
| 401 | — | Missing or invalid access token |
| 409 | `DNS_ALREADY_VERIFIED` | DNS already verified for this domain |

---

#### 7.13.5 Get Verification Status

| Property | Value |
|----------|-------|
| Method | `GET` |
| Path | `/auth/org/verify/status` |
| Auth | **Required** (Bearer token, organization account) |
| Purpose | Retrieve the full verification status including step-by-step results, MCA data, and domain verification records. |

**Required Headers**
```
Authorization: Bearer <access_token>
```

**Success Response — 200 OK (fully verified)**
```json
{
  "is_verified": true,
  "is_trusted": true,
  "verified_at": "2026-06-01T10:30:00Z",
  "request": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "org_id": 1,
    "status": "completed",
    "current_step": "dns",
    "created_at": "2026-06-01T10:00:00Z",
    "updated_at": "2026-06-01T10:30:00Z"
  },
  "mca": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "org_id": 1,
    "registration_number": "ABC-1234",
    "legal_name": "Acme Corp LLP",
    "status": "active",
    "status_type": "LLPIN",
    "roc_code": "ROC-Mumbai",
    "registered_address": "123 Business Park, Mumbai, Maharashtra",
    "email_id": "contact@acme.com",
    "date_of_incorporation": "01/04/2020",
    "created_at": "2026-06-01T10:05:00Z",
    "updated_at": "2026-06-01T10:05:00Z"
  },
  "domain": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "org_id": 1,
    "domain": "acme.com",
    "dns_verified": true,
    "dns_verified_at": "2026-06-01T10:30:00Z",
    "created_at": "2026-06-01T10:20:00Z",
    "updated_at": "2026-06-01T10:30:00Z"
  },
  "step_results": {
    "registration_number": { "status": "passed" },
    "business_name": { "status": "passed" },
    "entity_status": { "status": "passed" },
    "incorporation_date": { "status": "passed" },
    "domain": { "status": "passed" },
    "dns": { "status": "passed" }
  }
}
```

**Success Response — 200 OK (in progress)**
```json
{
  "is_verified": false,
  "is_trusted": true,
  "verified_at": null,
  "request": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "org_id": 1,
    "status": "in_progress",
    "current_step": "domain",
    "created_at": "2026-06-01T10:00:00Z",
    "updated_at": "2026-06-01T10:05:00Z"
  },
  "mca": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "org_id": 1,
    "registration_number": "ABC-1234",
    "legal_name": "Acme Corp LLP",
    "status": "active",
    "status_type": "LLPIN",
    "roc_code": "ROC-Mumbai",
    "registered_address": "123 Business Park, Mumbai, Maharashtra",
    "email_id": "contact@acme.com",
    "date_of_incorporation": "01/04/2020",
    "created_at": "2026-06-01T10:05:00Z",
    "updated_at": "2026-06-01T10:05:00Z"
  },
  "domain": null,
  "step_results": {
    "registration_number": { "status": "passed" },
    "business_name": { "status": "passed" },
    "entity_status": { "status": "passed" },
    "incorporation_date": { "status": "passed" },
    "domain": { "status": "pending" },
    "dns": { "status": "pending" }
  }
}
```

**Error Responses**

| Status | Code | Reason |
|--------|------|--------|
| 401 | — | Missing or invalid access token |

---

#### 7.13.6 Recheck Organization Verification

| Property | Value |
|----------|-------|
| Method | `POST` |
| Path | `/auth/org/verify/recheck` |
| Auth | **Required** (Bearer token, organization account) |
| Purpose | Re-evaluate all verification conditions against current MCA data and DNS records. For already-verified organizations to confirm their status remains valid. |

**Required Headers**
```
Authorization: Bearer <access_token>
```

> **No request body needed.** The server re-queries MCA API with the stored registration number and performs a fresh DNS TXT lookup.

**Success Response — 200 OK (all checks pass)**
```json
{
  "message": "Re-verification completed",
  "all_passed": true,
  "results": {
    "mca_recheck": { "status": "passed" },
    "business_name": { "status": "passed" },
    "company_status": { "status": "passed" },
    "incorporation_date": { "status": "passed" },
    "dns": { "status": "passed" }
  }
}
```

**Success Response — 200 OK (some checks fail)**
```json
{
  "message": "Re-verification completed",
  "all_passed": false,
  "results": {
    "mca_recheck": { "status": "passed" },
    "business_name": {
      "status": "failed",
      "message": "Business name 'Acme Corp' does not match MCA record 'Acme Solutions Pvt Ltd'"
    },
    "company_status": {
      "status": "failed",
      "message": "Company status is 'Under Process', expected 'Active'"
    },
    "incorporation_date": { "status": "passed" },
    "dns": {
      "status": "failed",
      "message": "DNS TXT record no longer matches"
    }
  }
}
```

> If `all_passed` is `false` in **enforce mode**, the organization's verification is automatically expired — they must restart the pipeline from the beginning.

**Error Responses**

| Status | Code | Reason |
|--------|------|--------|
| 400 | `ORG_NOT_VERIFIED` | Organization is not verified — recheck requires completed verification |
| 404 | `MCA_VERIFICATION_NOT_FOUND` | Verified org has no MCA record on file |
| 400 | `UNKNOWN_ENTITY_TYPE` | Stored registration number is not LLPIN or CIN format |
| 401 | — | Missing or invalid access token |
| 404 | `REGISTRATION_NUMBER_NOT_FOUND` | Registration number not found in MCA records |
| 503 | `MCA_SERVICE_UNAVAILABLE` | MCA API unavailable (network or non-200 HTTP) |
| 503 | `INVALID_MCA_RESPONSE` | MCA API returned an invalid JSON body |
| 403 | `ORG_VERIFICATION_EXPIRED` | Enforce mode: verification revoked after a hard recheck failure |

> Soft check failures (business name, status, DNS) still return **200** with `all_passed: false`. In **enforce** mode, hard failures (MCA unavailable, invalid response, registration not found) expire verification and return `ORG_VERIFICATION_EXPIRED` instead of the underlying MCA error code.

---

## 7.14 Teams (ADR-021)

Base path: `/auth/v1/teams`. JWT required (user or organization). See [Teams API contract](../teams/api-contract.md).

| Method | Path | Notes |
|--------|------|-------|
| `POST` | `/auth/v1/teams` | Create team; `client_request_id` for idempotency; org requires `initial_admin_user_id` |
| `GET` | `/auth/v1/teams` | List teams for current subject |
| `GET` | `/auth/v1/teams/:teamId` | Detail + `my_role` |
| `PATCH` | `/auth/v1/teams/:teamId` | Owner/Admin update (`name`, `description`, `invite_link_enabled`) |
| `DELETE` | `/auth/v1/teams/:teamId` | Owner only → `202` `{ status: "deleting" }` |
| `GET` | `/auth/v1/teams/:teamId/members` | Member list |
| `GET` | `/auth/v1/teams/:teamId/membership/history` | Owner/Admin; paginated (`cursor`, `limit`); `next_cursor` is opaque entry `id` |
| `POST` | `/auth/v1/teams/:teamId/members` | Direct add |
| `DELETE` | `/auth/v1/teams/:teamId/members/:userId` | Remove member |
| `PATCH` | `/auth/v1/teams/:teamId/members/:userId/role` | Role change |
| `POST` | `/auth/v1/teams/:teamId/invites` | Create invite |
| `GET` | `/auth/v1/teams/:teamId/invites/link` | Get/regenerate link — returns stable `token`; `403 INVITE_LINK_DISABLED` when toggle off |
| `POST` | `/auth/v1/teams/join` | User accepts token; `403` when team invite link disabled |
| `POST` | `/auth/v1/teams/:teamId/leave` | User leaves voluntarily; `409 LAST_OWNER` if sole owner |
| `GET` | `/auth/v1/teams/:teamId/audit` | Owner/Admin audit log; paginated (`cursor`, `limit`); opaque `next_cursor` |

**Vote integration:** `POST /vote/v1/polls` with `team_id` + `visibility: "team"`; list with `GET /vote/v1/polls?scope=team&team_id=`.

---

## 8. Vote Service Endpoints

> All endpoints under `/vote/v1/` require a valid Bearer token.

**Required Headers for all Vote Service requests:**
```
Authorization: Bearer <access_token>
Content-Type: application/json   ← (only for requests with a body)
```

---

### 8.1 Health Check

| Property  | Value      |
|-----------|------------|
| Method    | `GET`      |
| Path      | `/health`  |
| Auth      | Not required |

**Success Response — 200 OK**
```json
{ "status": "ok" }
```

---

### 8.2 Create Poll

| Property  | Value              |
|-----------|--------------------|
| Method    | `POST`             |
| Path      | `/vote/v1/polls`   |
| Auth      | **Required**       |
| Purpose   | Create a new poll. The calling user automatically becomes the poll **admin**. |

**Request Body**

| Field              | Type              | Required | Description                                                                                      |
|--------------------|-------------------|----------|--------------------------------------------------------------------------------------------------|
| `title`            | string            | Yes      | Title of the poll                                                                                |
| `client_request_id` | string           | No       | Stable client-generated idempotency key for retry-safe poll creation. Reusing the same value for the same creator returns the existing poll instead of creating a duplicate. Max 128 characters. |
| `description`      | string            | No       | Optional description                                                                             |
| `options`          | string[]          | Yes      | At least **2** options required                                                                  |
| `option_tags`      | object[]          | No       | **Option-level** tags: `{ "option_idx": 0, "user_ids": ["43"] }`. Tagged users must exist, be active, and cannot include the creator. When present, the stored option label for each tagged index is set to that user's display name (first tag wins if multiple IDs are sent). See [ADR-006](../../decisions/006-poll-option-user-tagging.md). |
| `poll_tags`        | object            | No       | **Poll-level** tags: `{ "subjects": [{ "id": "43", "account_type": "user" }] }` or legacy `{ "user_ids": ["43"] }`. Tagged subjects must be active users or organizations. See [ADR-008](../../decisions/008-poll-level-user-tagging.md), [ADR-011](../../decisions/011-cross-subject-tagging.md). |
| `allow_admin_vote`  | boolean           | No  | Whether the poll creator can also cast a vote (default: `false`)                                 |
| `allow_tagged_add_options` | boolean  | No  | When `true`, poll-tagged and option-tagged users may append options while `status=created`. Requires at least one tag or email invite. See [ADR-010](../../decisions/010-tagged-user-add-options.md). |
| `show_live_results` | boolean  | No  | When `true`, uses `legacy_plaintext` and exposes live per-option vote counts during active voting. When `false` or omitted, uses `e2e_encrypted` when `E2E_BALLOT_ENABLED` and `PLATFORM_BALLOT_MASTER_KEY` are configured; otherwise falls back to `legacy_plaintext`. Immutable after create. See [ADR-020](../../decisions/020-platform-e2e-ballot-encryption.md). |
| `email_invites`     | object[]          | No  | **Email invites** (max 50): `[{ "email": "alice@example.com", "name": "Alice" }]`. **Requires verified creator** (`is_verified` on user or organization). Sends a personalized Resend email with share link. On **private** polls, invitees gain view/vote access after sign-up/login with the matching email. On **public** polls, email is informational only. Verified user and verified organization creators supported. See [ADR-019](../../decisions/019-poll-email-invites.md). **UX note (web)**: mobile uses a unified search picker — existing accounts found by email go in `poll_tags` only; reserve `email_invites` for addresses with no account match. Mobile also supports client-side CSV import and a View all editor before create (no server upload). Backend dedupes overlaps (`skipped` in `email_invites_summary`). |
| `visibility`        | string            | No  | `public` (default) or `private`. Private polls are visible only to the creator, tagged users, email invitees (after reconcile), and users who already voted. See [ADR-009](../../decisions/009-poll-visibility.md). |
| `voting_start_at`   | string (ISO 8601) | No  | **PBAC** — explicit window open time. Must be used with `voting_end_at`. Mutually exclusive with `duration_minutes`. |
| `voting_end_at`     | string (ISO 8601) | No  | **PBAC** — explicit window close time. Votes outside this range get `403 Voting window is closed`. Mutually exclusive with `duration_minutes`. |
| `duration_minutes`  | integer           | No  | **Duration-based auto-expiry** — voting period length in minutes. When the admin calls `/start`, `voting_start_at` is set to `NOW()` and `voting_end_at` to `NOW() + N minutes`. The background expiry worker then auto-ends the poll when that time passes. Must be a positive integer. Mutually exclusive with `voting_end_at`. |
| `auto_start`        | boolean           | No  | **Duration + immediate start** — when `true`, requires `duration_minutes`. The poll is set to `active` immediately at creation; `voting_start_at` and `voting_end_at` are computed at insert time. No `POST /start` call is needed. Mutually exclusive with `voting_start_at`. Defaults to `false`. |

> **Four modes of voting-window control** (pick one):
> - **No window** — omit all time fields. Admin drives transitions manually via `/start` and `/end`.
> - **Explicit window (PBAC)** — set `voting_start_at` + `voting_end_at`. Casbin blocks votes outside the range regardless of poll status.
> - **Duration (manual start)** — set `duration_minutes`. On `/start` the window is computed automatically and the poll self-expires via the background worker.
> - **Duration + auto-start** — set `duration_minutes` + `auto_start: true`. The poll is activated immediately at creation; no `/start` call is needed and the poll self-expires via the background worker.

**Example 1 — No time window (manual control)**
```json
{
  "client_request_id": "mobile-create-20260605-abc123",
  "title": "Best Programming Language 2024",
  "description": "Vote for your favourite language.",
  "options": ["Go", "Python", "TypeScript", "Rust"],
  "option_tags": [
    { "option_idx": 0, "user_ids": ["43", "44"] }
  ],
  "poll_tags": { "user_ids": ["45", "46"] },
  "allow_admin_vote": false
}
```

> **▶ How to start:** Call `POST /vote/v1/polls/:pollId/start` — manually triggered by the poll admin.  
> **⏹ How to end:** Call `POST /vote/v1/polls/:pollId/end` — manually triggered by the poll admin.  
> Neither transition happens automatically; the poll stays in `created` until the admin explicitly starts it, and stays `active` until the admin explicitly ends it.

**Example 2 — Explicit time window (PBAC)**

> **🛠 Developer Testing Note**
>
> `voting_start_at` and `voting_end_at` must be **future UTC timestamps** at the time the request is submitted. The server validates both fields against the current UTC clock and rejects any value that is in the past.
>
> Before constructing the request body, retrieve the current UTC time from your terminal:
> ```bash
> date -u +"%Y-%m-%dT%H:%M:%SZ"
> ```
> Use the output as your baseline and set `voting_start_at` to a time **after** it, and `voting_end_at` to a time **after** `voting_start_at`.
>
> **Example output:** `2026-05-23T15:30:00Z` → you could then set `voting_start_at` to `2026-05-23T15:35:00Z` and `voting_end_at` to `2026-05-23T15:45:00Z`.

```json
{
  "title": "Best Programming Language 2024",
  "description": "Vote for your favourite language.",
  "options": ["Go", "Python", "TypeScript", "Rust"],
  "allow_admin_vote": false,
  "voting_start_at": "2024-07-10T09:00:00Z",
  "voting_end_at":   "2024-07-10T17:00:00Z"
}
```

> **▶ How to start:** Automatic — the background expiry worker transitions the poll from `created` → `active` when `voting_start_at ≤ NOW()` (checked every 30 s). No admin action required.  
> **⏹ How to end:** Automatic — the expiry worker transitions the poll from `active` → `ended` when `voting_end_at ≤ NOW()`. No admin action required.  
> The admin **may** still call `POST /start` or `POST /end` manually before the worker fires; the worker's next tick will then be a no-op for that poll.

**Example 3 — Duration-based auto-expiry**
```json
{
  "title": "Best Programming Language 2024",
  "description": "Voting closes 60 minutes after the poll is started.",
  "options": ["Go", "Python", "TypeScript", "Rust"],
  "allow_admin_vote": false,
  "duration_minutes": 60
}
```

> **▶ How to start:** Call `POST /vote/v1/polls/:pollId/start` — manually triggered by the poll admin. At that moment `voting_start_at` is set to `NOW()` and `voting_end_at` to `NOW() + duration_minutes`. The poll will not become active until this call is made.  
> **⏹ How to end:** Automatic — the background expiry worker transitions the poll from `active` → `ended` when `voting_end_at ≤ NOW()` (checked every 30 s). No further admin action is required; however the admin may call `POST /end` early to close voting before the window expires.

**Example 4 — Duration-based + auto-start**
```json
{
  "title": "Best Programming Language 2024",
  "description": "Voting opens immediately and closes in 60 minutes.",
  "options": ["Go", "Python", "TypeScript", "Rust"],
  "allow_admin_vote": false,
  "duration_minutes": 60,
  "auto_start": true
}
```

> **▶ How to start:** None — the poll is set to `active` immediately at creation. `voting_start_at` is set to `NOW()` and `voting_end_at` to `NOW() + duration_minutes` at insert time. No admin action required.  
> **⏹ How to end:** Automatic — the background expiry worker transitions the poll from `active` → `ended` when `voting_end_at ≤ NOW()` (checked every 30 s). No admin action required; however the admin may call `POST /end` early to close voting before the window expires.

**Example 5 — Private poll with email invites**
```json
{
  "title": "Team lunch vote",
  "options": ["Pizza", "Sushi"],
  "visibility": "private",
  "email_invites": [
    { "email": "alice@example.com", "name": "Alice" },
    { "email": "bob@company.com" }
  ],
  "client_request_id": "web-create-abc123"
}
```

**Success Response — 201 Created**

_Example A — duration-based, manual start (`auto_start: false`)_
```json
{
  "message": "Poll created successfully",
  "poll": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "title": "Best Programming Language 2024",
    "description": "Voting closes 60 minutes after the poll is started.",
    "options": ["Go", "Python", "TypeScript", "Rust"],
    "option_tags": [
      {
        "option_idx": 0,
        "tagged_user_id": "43",
        "tagged_by_user_id": "42"
      }
    ],
    "poll_tags": [
      {
        "tagged_user_id": "45",
        "tagged_by_user_id": "42"
      }
    ],
    "status": "created",
    "admin_id": "42",
    "admin_account_type": "user",
    "allow_admin_vote": false,
    "auto_start": false,
    "duration_minutes": 60,
    "created_at": "2024-07-10T08:00:00Z",
    "updated_at": "2024-07-10T08:00:00Z"
  }
}
```

_Example B — duration-based, auto-start (`auto_start: true`)_
```json
{
  "message": "Poll created successfully",
  "poll": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "title": "Best Programming Language 2024",
    "description": "Voting opens immediately and closes in 60 minutes.",
    "options": ["Go", "Python", "TypeScript", "Rust"],
    "status": "active",
    "admin_id": "42",
    "admin_account_type": "user",
    "allow_admin_vote": false,
    "auto_start": true,
    "duration_minutes": 60,
    "voting_start_at": "2024-07-10T08:00:00Z",
    "voting_end_at":   "2024-07-10T09:00:00Z",
    "created_at": "2024-07-10T08:00:00Z",
    "updated_at": "2024-07-10T08:00:00Z"
  }
}
```

> `voting_start_at`, `voting_end_at`, and `duration_minutes` are omitted from the response when they were not set.  
> `auto_start` is always present in the response (`false` by default).  
> All timestamp fields (`created_at`, `updated_at`, `voting_start_at`, `voting_end_at`) are always returned in UTC (`Z`).  
> `email_invites_summary` is **omitted** when `email_invites` was not sent (backward compatible).

_Example C — create with email invites_
```json
{
  "message": "Poll created successfully",
  "poll": { "...existing poll fields..." },
  "email_invites_summary": {
    "requested": 2,
    "sent": 2,
    "skipped": 0,
    "failed": 0,
    "items": [
      { "email": "alice@example.com", "status": "accepted", "delivery": "sent" },
      { "email": "bob@company.com", "status": "pending", "delivery": "sent" }
    ]
  }
}
```

**Invite deep-link contract:** Email links use `{APP_SHARE_BASE_URL}/polls/{pollId}?invite={token}`. Web and mobile signup/login flows must preserve the `invite` query param and redirect to `/polls/{pollId}` after authentication. Access still requires an authenticated session with the invited email (private polls).

**Error Responses**

| Status | Reason                                                                                      |
|--------|----------------------------------------------------------------------------------------------|
| 400    | Missing required fields, or fewer than 2 options                                            |
| 400    | `voting_start_at` is in the past                                                            |
| 400    | `voting_end_at` is in the past                                                              |
| 400    | `voting_start_at` ≥ `voting_end_at`                                                         |
| 400    | `duration_minutes` is zero or negative                                                      |
| 400    | `duration_minutes` combined with `voting_end_at` (mutually exclusive)                       |
| 400    | `auto_start: true` without `duration_minutes`                                               |
| 400    | `auto_start: true` combined with `voting_start_at` (mutually exclusive)                     |
| 400    | `option_tags` contains an invalid option index, duplicate user, self-tag, or inactive/missing user |
| 400    | `poll_tags` contains a duplicate user, self-tag, invalid user ID, or inactive/missing user |
| 400    | `email_invites exceeds maximum of 50` |
| 400    | `email_invites contains duplicate email` |
| 400    | `cannot invite your own email` |
| 400    | `email_invites contains invalid email` |
| 403    | `INVITER_NOT_VERIFIED` — creator must be verified (`is_verified`) to send email invites |
| 401    | Unauthorized                                                                                |
| 429    | `RATE_LIMITED` — email invite send quota exceeded (100/day per creator) |
| 500    | Tagged user validation is unavailable or failed                                             |
| 500    | Failed to create poll                                                                       |

---

### 8.2.1 List Polls

| Property | Value |
|----------|-------|
| Method | `GET` |
| Path | `/vote/v1/polls` |
| Auth | **Required** |
| Purpose | List polls for the mobile/web hub (See [ADR-004](../../decisions/004-poll-list-contract.md), [ADR-005](../../decisions/005-feed-scope.md)) |

**Query parameters**

| Param | Required | Description |
|-------|----------|-------------|
| `scope` | No | `admin` (default) — polls you created; `participated` — polls you voted in; `feed` — merged home feed with three-tier ranking (See [ADR-029](../../decisions/029-feed-ranking.md)); `profile` — public polls by a specific creator (requires `admin_id` + `admin_account_type`; See [ADR-025](../../decisions/025-profile-public-poll-lists.md)) |
| `admin_id` | When `scope=profile` | Creator user or organization id |
| `admin_account_type` | When `scope=profile` | `user` or `organization` |
| `status` | No | Comma-separated: `created`, `active`, `ended` |
| `limit` | No | 1–100, default `20` |
| `cursor` | No | Opaque cursor from `pagination.next_cursor` |

**Success Response — 200 OK**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Best Language",
      "status": "active",
      "voting_start_at": "2024-07-10T09:00:00Z",
      "voting_end_at": "2024-07-10T17:00:00Z",
      "admin_id": "42",
      "admin_account_type": "user",
      "admin_display_name": "Priya Sharma",
      "admin_is_trusted": true,
      "admin_is_verified": true,
      "has_voted": false,
      "is_admin": true,
      "is_tagged": false,
      "created_at": "2026-06-05T10:00:00Z"
    }
  ],
  "pagination": { "next_cursor": "...", "has_more": true }
}
```

**Feed ranking (`scope=feed`):** Polls are ordered by `feed_tier ASC`, then `created_at DESC`, then `id DESC`:

| Tier | Content |
|------|---------|
| 1 | Polls created by the viewer; polls from **mutual follows** |
| 2 | **Public** polls from creators not in tier 1 |
| 3 | Residual feed-eligible polls (tagged private, participated, email invites, etc.) |

Feed scope uses tier-aware cursors (`base64(tier|created_at_ns|id)`). Other scopes use the standard two-part cursor. vote-service fetches mutual follows from auth-service internal API; on failure it degrades to tier 1 = own polls only. See [ADR-029](../../decisions/029-feed-ranking.md).

---

| Property     | Value                      |
|--------------|----------------------------|
| Method       | `GET`                      |
| Path         | `/vote/v1/polls/:pollId`   |
| Auth         | **Required**               |
| Purpose      | Fetch details of a specific poll |
| Path Param   | `pollId` — UUID of the poll |

**Example Request**
```
GET /vote/v1/polls/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**Success Response — 200 OK**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "client_request_id": "mobile-create-20260605-abc123",
  "title": "Best Programming Language 2024",
  "description": "Vote for your favourite language.",
  "options": ["Go", "Python", "TypeScript", "Rust"],
  "status": "active",
  "admin_id": "42",
  "admin_account_type": "user",
  "allow_admin_vote": false,
  "has_voted": false,
  "duration_minutes": 60,
  "voting_start_at": "2024-07-10T09:00:00Z",
  "voting_end_at": "2024-07-10T17:00:00Z",
  "created_at": "2024-07-10T08:00:00Z",
  "updated_at": "2024-07-10T09:00:00Z"
}
```

> `has_voted` is scoped to the authenticated caller's composite identity `(user_id, account_type)` — a user and organization with the same numeric ID are independent voters. `duration_minutes`, `voting_start_at`, and `voting_end_at` are omitted from the response when they were not set.  
> **`email_invites`** (admin only): when the authenticated subject is the poll admin, the response includes invite status rows. Non-admin viewers never receive invitee emails. See [ADR-019](../../decisions/019-poll-email-invites.md).

```json
"email_invites": [
  {
    "email": "alice@example.com",
    "invitee_name": "Alice",
    "status": "accepted",
    "accepted_user_id": "99",
    "created_at": "2026-06-12T10:00:00Z",
    "accepted_at": "2026-06-12T10:00:01Z"
  }
]
```

**Access control (See [ADR-009](../../decisions/009-poll-visibility.md), [ADR-019](../../decisions/019-poll-email-invites.md)):** **Public** polls are readable by any authenticated user at any status. **Private** polls return `404` unless the caller is the poll admin, a tagged user, or an email invitee (accepted after login with matching email).

**Error Responses**

| Status | Reason           |
|--------|------------------|
| 401    | Unauthorized     |
| 404    | Poll not found, or caller lacks access (private poll and not admin/tagged) |

---

### 8.3.1 Add / Remove Poll Options (before start)

| Method | Path | Who | Rules |
|--------|------|-----|-------|
| `POST` | `/vote/v1/polls/:pollId/options` | Poll admin **or** (tagged subject when `allow_tagged_add_options`) | `status=created`; body `{ "label": "...", "client_request_id": "..." }` (label 1–120 chars; optional idempotency key max 128 chars); max 8 options |
| `DELETE` | `/vote/v1/polls/:pollId/options/:optionIdx` | Poll admin only | `status=created`; min 2 options remain |

Both return `{ "message": "...", "poll": { ... } }` with the updated poll object including `option_contributions` (post-create additions only).

**Add option idempotency:** Reusing the same `client_request_id` for the same `(poll_id, added_by_user_id, added_by_account_type)` returns the existing poll without appending a duplicate option (retry-safe after lost responses).

**Option contributions:** Each entry includes `option_idx`, `added_by_user_id`, `added_by_account_type` (`user` | `organization`), `added_by_display_name`, `added_by_is_trusted`, and `added_by_is_verified` (resolved via `POST /auth/internal/subjects/display-names`).

**Poll tags:** Each `poll_tags[]` row includes `tagged_display_name`, `tagged_is_trusted`, and `tagged_is_verified` when enriched from the same internal lookup.

**Subject search:** `GET /auth/subjects/search` and `GET /auth/subjects/nearby` rows include optional `avatar_url`, `is_trusted`, and `is_verified` for badge and avatar UI.

See [ADR-010](../../decisions/010-tagged-user-add-options.md).

---

### 8.4 Start Poll

| Property     | Value                             |
|--------------|-----------------------------------|
| Method       | `POST`                            |
| Path         | `/vote/v1/polls/:pollId/start`    |
| Auth         | **Required** — **poll owner only** |
| Purpose      | Transition poll status from `created` → `active` (opens voting) |
| Path Param   | `pollId` — UUID of the poll       |

> **ABAC enforcement:** The `Authorize("start")` middleware fetches the poll and checks `user_id == poll.admin_id` at request time. No stored role is consulted — ownership is evaluated directly from the resource attribute.

**No request body required.**

> **Duration auto-expiry:** When the poll was created with `duration_minutes`, this call also sets `voting_start_at = NOW()` and `voting_end_at = NOW() + N minutes` in a single Postgres UPDATE. The background worker then auto-transitions the poll to `ended` when `voting_end_at` is reached (no further admin action needed).

**Success Response — 200 OK**

Always includes the updated poll object so the caller can immediately read the computed `voting_start_at` / `voting_end_at`.

```json
{
  "message": "Poll started successfully",
  "poll": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "title": "Best Programming Language 2024",
    "description": "Voting closes 60 minutes after the poll is started.",
    "options": ["Go", "Python", "TypeScript", "Rust"],
    "status": "active",
    "admin_id": "42",
    "admin_account_type": "user",
    "allow_admin_vote": false,
    "duration_minutes": 60,
    "voting_start_at": "2024-07-10T10:00:00Z",
    "voting_end_at":   "2024-07-10T11:00:00Z",
    "created_at": "2024-07-10T08:00:00Z",
    "updated_at": "2024-07-10T10:00:00Z"
  }
}
```

**Error Responses**

| Status | Reason                                                          |
|--------|-----------------------------------------------------------------|
| 400    | Poll already started (poll status is `active`)                  |
| 400    | Poll cannot be started (poll status is `ended`)                 |
| 401    | Unauthorized                                                    |
| 403    | You are not the poll owner (ABAC check failed)                  |
| 404    | Poll not found                                                  |

---

### 8.5 End Poll

| Property     | Value                             |
|--------------|-----------------------------------|
| Method       | `POST`                            |
| Path         | `/vote/v1/polls/:pollId/end`      |
| Auth         | **Required** — **poll owner only** |
| Purpose      | Transition poll status from `active` → `ended` (closes voting) |
| Path Param   | `pollId` — UUID of the poll       |

> **ABAC enforcement:** Same ownership check as `/start` — `user_id == poll.admin_id` evaluated at runtime.

**No request body required.**

**Success Response — 200 OK**
```json
{
  "message": "Poll ended successfully"
}
```

**Error Responses**

| Status | Reason                                |
|--------|---------------------------------------|
| 400    | Poll is not active (can't end it)     |
| 401    | Unauthorized                          |
| 403    | You are not the admin of this poll    |
| 404    | Poll not found                        |

---

### 8.6 Vote on a Poll

| Property     | Value                            |
|--------------|----------------------------------|
| Method       | `POST`                           |
| Path         | `/vote/v1/polls/:pollId/vote`    |
| Auth         | **Required**                     |
| Purpose      | Cast a vote on an active poll    |
| Path Param   | `pollId` — UUID of the poll      |

> **ABAC + PBAC enforcement:** The `Authorize("vote")` middleware applies two checks before the handler is reached:
> 1. **ABAC** — derives whether the user is the poll owner or a voter from `poll.admin_id`. If the owner has `allow_admin_vote: false`, the request is denied before reaching the handler.
> 2. **PBAC** — if `voting_start_at` / `voting_end_at` are set on the poll, Casbin's `withinWindow` function verifies the current time falls inside the window. Requests outside the window receive `403 Voting window is closed`.

**Request Body**

| Field       | Type   | Required | Description                                              |
|-------------|--------|----------|----------------------------------------------------------|
| `poll_id`   | string | Yes      | Must match the `:pollId` path parameter                  |
| `option_idx`| number | Yes      | Zero-based index of the chosen option (e.g., `0` for the first option) |

**Example Request Body**
```json
{
  "poll_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "option_idx": 2
}
```

> If `options` is `["Go", "Python", "TypeScript", "Rust"]`, then `option_idx: 2` votes for `"TypeScript"`.

**Success Response — 200 OK**
```json
{
  "message": "Vote submitted successfully"
}
```

**Error Responses**

| Status | Reason                                                                     |
|--------|----------------------------------------------------------------------------|
| 400    | `poll_id` doesn't match the path, or invalid `option_idx`                 |
| 400    | Poll is not active                                                         |
| 401    | Unauthorized                                                               |
| 403    | Poll owner is not allowed to vote (`allow_admin_vote: false`) — ABAC deny |
| 403    | Voting window is closed — PBAC deny (`voting_start_at`/`voting_end_at` set) |
| 404    | Poll not found                                                             |
| 409    | You have already voted                                                     |

---

### 8.7 View Poll Results

| Property     | Value                               |
|--------------|-------------------------------------|
| Method       | `GET`                               |
| Path         | `/vote/v1/polls/:pollId/results`    |
| Auth         | **Required** — poll **admin** or a user who has **already voted** in this poll |
| Purpose      | Get the current vote tally for a poll |
| Path Param   | `pollId` — UUID of the poll         |

**Success Response — 200 OK**
```json
{
  "poll_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "title": "Best Programming Language 2024",
  "status": "ended",
  "options": ["Go", "Python", "TypeScript", "Rust"],
  "votes": {
    "Go": 45,
    "Python": 30,
    "TypeScript": 20,
    "Rust": 5
  },
  "total_votes": 100
}
```

> **Note:** `votes` is a `{ [optionName]: count }` map. Options with 0 votes may not appear in the map.

**Error Responses**

| Status | Reason         |
|--------|----------------|
| 401    | Unauthorized   |
| 403    | Not poll admin and have not voted |
| 404    | Poll not found |

---

### 8.7.5 Get Poll Tally

| Property     | Value                               |
|--------------|-------------------------------------|
| Method       | `GET`                               |
| Path         | `/vote/v1/polls/:pollId/tally`      |
| Auth         | **Required** — any authenticated user |
| Purpose      | Live vote counts for **active** or **ended** polls without requiring the caller to have voted |
| Path Param   | `pollId` — UUID of the poll         |

> **Difference from `/results`:** `/tally` has no `view_result` gate — any signed-in user can read counts while a poll is `active` or `ended`. Use `/results` when you need the restricted view (admin or prior voters only). The mobile app uses `/tally` on the poll detail screen for live counts and `/results` on the dedicated results screen.

**Success Response — 200 OK**

Same shape as [View Poll Results](#87-view-poll-results):

```json
{
  "poll_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "title": "Best Programming Language 2024",
  "status": "active",
  "options": ["Go", "Python", "TypeScript", "Rust"],
  "votes": {
    "Go": 12,
    "Python": 8,
    "TypeScript": 5,
    "Rust": 2
  },
  "total_votes": 27
}
```

**Error Responses**

| Status | Reason |
|--------|--------|
| 400    | Tally is only available for `active` or `ended` polls (`created` polls return this) |
| 401    | Unauthorized |
| 404    | Poll not found |

---

### 8.8 Delete Poll

| Property     | Value                              |
|--------------|------------------------------------|
| Method       | `DELETE`                           |
| Path         | `/vote/v1/polls/:pollId`           |
| Auth         | **Required** — **poll admin (owner) only** |
| Purpose      | Permanently delete a poll and all its votes. Works regardless of the poll's current status. |
| Path Param   | `pollId` — UUID of the poll        |

> **ABAC enforcement:** Only the poll creator (`user_id == poll.admin_id`) may delete a poll. This is evaluated at runtime from the resource attribute — no stored role is consulted. Any other authenticated user receives `403`.

> **Status-independent:** A poll can be deleted at any point in its lifecycle — `created`, `active`, or `ended`. The current status is **not** checked before deletion.

**No request body required.**

**Success Response — 200 OK**
```json
{
  "message": "Poll deleted successfully"
}
```

**Error Responses**

| Status | Reason                             |
|--------|---------------------------------|
| 401    | Unauthorized                       |
| 403    | You are not the admin of this poll |
| 404    | Poll not found                     |

---

### 8.10 Poll Dashboard APIs

> Admin (poll owner) only. Requires Casbin action `view_dashboard`. See [ADR-007](../../decisions/007-poll-dashboard-api.md).

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/vote/v1/polls/:pollId/dashboard/summary` | Hero KPIs: votes cast, eligible voters (`null` for open polls), participation, projections, time remaining |
| `GET` | `/vote/v1/polls/:pollId/dashboard/live` | Votes/min, active voters (5m), concurrent viewers (presence), peak votes/min |
| `GET` | `/vote/v1/polls/:pollId/dashboard/security` | Rejection counters; `encryption_status`: `"tls_active"` or `"e2e_active"` |

**`encryption_status` values** (honest labels per ADR-007 / ADR-020):

| Value | `ballot_mode` | Meaning |
|-------|---------------|---------|
| `tls_active` | `legacy_plaintext` | TLS in transit; server-visible vote choices (live tallies) |
| `e2e_active` | `e2e_encrypted` | Client-encrypted ballots; choices hidden until poll ends |

| `GET` | `/vote/v1/polls/:pollId/dashboard/activity?limit=20` | Audit timeline events |
| `GET` | `/vote/v1/polls/:pollId/dashboard/audit` | Compliance checklist |
| `GET` | `/vote/v1/polls/:pollId/dashboard/verification` | Voter verification breakdown (auth internal lookup) |

**Tally enrichment:** `GET /vote/v1/polls/:pollId/tally` now includes optional `standings[]` with `is_leader`, `margin_votes`, and `margin_percent`.

**Poll object:** includes `is_paused`, `paused_at`, `total_paused_seconds`.

---

### 8.11 Poll Manage Actions

| Method | Path | Casbin action | Purpose |
|--------|------|---------------|---------|
| `POST` | `/vote/v1/polls/:pollId/pause` | `pause` | Pause active poll; votes return 409 while paused |
| `POST` | `/vote/v1/polls/:pollId/resume` | `resume` | Resume and extend end time by paused duration |
| `POST` | `/vote/v1/polls/:pollId/extend` | `extend` | Body: `{ "additional_minutes": 30 }` or `{ "voting_end_at": "ISO" }` |
| `GET` | `/vote/v1/polls/:pollId/export?format=csv` | `export` | Downloadable CSV report |
| `GET` | `/vote/v1/polls/:pollId/share` | View access (ADR-009) | Canonical share URL `{APP_SHARE_BASE_URL}/polls/{id}` |
| `POST` | `/vote/v1/polls/:pollId/presence` | `view_dashboard` | Heartbeat for concurrent viewer count |

**Public poll preview (no auth, rate limited):**

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/vote/v1/public/polls/:pollId/preview` | OG/social preview data; private polls return generic title only |
| `GET` | `/vote/v1/public/users/:id/polls` | Paginated public polls by user (minimal fields; See [ADR-025](../../decisions/025-profile-public-poll-lists.md)) |
| `GET` | `/vote/v1/public/org/:id/polls` | Paginated public polls by organization (minimal fields) |

**Profile share links (auth required):**

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/auth/users/:id/share` | Canonical profile share URL (`/@username` when set, else `/users/:id`) |
| `GET` | `/auth/org/:id/share` | Canonical profile share URL (`/@username` when set, else `/org/:id`) |

**Username helpers:**

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/auth/public/usernames/:username/availability` | `{ available: boolean }` |
| `GET` | `/auth/usernames/suggestions` | JWT; `{ suggestions: string[] }` |
| `GET` | `/auth/public/profiles/:username/preview` | Guest-safe preview (user or org) |
| `GET` | `/auth/profiles/:username` | Authenticated profile by handle |
| `GET` | `/auth/public/users/:id/redirect` | Legacy numeric URL → `/@username` redirect hint |
| `GET` | `/auth/public/org/:id/redirect` | Same for organizations |

**Public profile previews (no auth, rate limited):**

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/auth/public/users/:id/preview` | ADR-014 safe user fields for OG |
| `GET` | `/auth/public/org/:id/preview` | ADR-014 safe org fields for OG |

---

### 8.12 Detailed Health

| Method | Path | Auth |
|--------|------|------|
| `GET` | `/vote/v1/health/detailed` | Required |

Returns subsystem status for Vote API, Auth Service, Database, Notifications, Email Queue (`warn` if unknown), and Audit Logger.

---

### 8.13 User Tag Recommendations

| Property | Value |
|----------|-------|
| Method | `GET` |
| Path | `/vote/v1/users/tag-recommendations?limit=20` |
| Auth | **Required** (Bearer token — user or organization) |
| Purpose | Recommend active users and organizations based on poll tag history for the mobile Search tab |

Unions `poll_tags` and `poll_option_tags` for the authenticated subject `(user_id, account_type)`. Returns both user and organization subjects, deduped by `(id, account_type)`. `limit` defaults to `20` and is capped at `20`. Enriched via `POST /auth/internal/subjects/public-summaries` (no email).

**Success Response — 200 OK**
```json
{
  "data": [
    {
      "id": "43",
      "account_type": "user",
      "first_name": "Alex",
      "last_name": "Lee",
      "is_trusted": false,
      "is_verified": true,
      "relationship": "tagged_you"
    },
    {
      "id": "5",
      "account_type": "organization",
      "org_name": "Acme Corp",
      "is_trusted": true,
      "is_verified": false,
      "relationship": "tagged_by_you"
    }
  ]
}
```

`relationship`: `tagged_by_you` | `tagged_you` | `both`. User rows include `first_name` / `last_name`; organization rows include `org_name`.

---

### 8.9 Notifications

Tagged users receive a persistent notification when they are tagged during poll creation, when a tagged poll opens, or when it ends:

- **`poll_option_tagged`** — user was tagged on a specific poll option (`option_tags`)
- **`poll_tagged`** — user was tagged on the poll itself (`poll_tags`)
- **`poll_started`** — a poll the user is tagged in has become active (manual start, scheduled auto-start, or expiry worker)
- **`poll_ended`** — a poll the user is tagged in has ended (manual end or expiry worker)

Polls created with `auto_start: true` are active immediately; tagged users receive tag notifications at create time only (no separate `poll_started` event).

When `PUSH_NOTIFICATIONS_ENABLED=true` on the vote service, matching Expo push tokens receive the same notification types as device alerts (best-effort, async).

#### 8.9.1 List Notifications

| Property | Value |
|----------|-------|
| Method | `GET` |
| Path | `/vote/v1/notifications` |
| Auth | **Required** |
| Purpose | List the authenticated user's latest vote-service notifications |

**Success Response — 200 OK**
```json
{
  "data": [
    {
      "id": "notification-uuid",
      "user_id": "43",
      "actor_id": "42",
      "type": "poll_option_tagged",
      "resource_type": "poll",
      "resource_id": "poll-uuid",
      "payload": {
        "poll_id": "poll-uuid",
        "poll_title": "Favorite candidate",
        "option_idx": 0,
        "option": "Alice"
      },
      "read_at": null,
      "created_at": "2026-06-05T10:00:00Z"
    },
    {
      "id": "notification-uuid-2",
      "user_id": "45",
      "actor_id": "42",
      "type": "poll_tagged",
      "resource_type": "poll",
      "resource_id": "poll-uuid",
      "payload": {
        "poll_id": "poll-uuid",
        "poll_title": "Favorite candidate"
      },
      "read_at": null,
      "created_at": "2026-06-05T10:00:00Z"
    }
  ]
}
```

#### 8.9.2 Mark Notification Read

| Property | Value |
|----------|-------|
| Method | `POST` |
| Path | `/vote/v1/notifications/:notificationId/read` |
| Auth | **Required** |
| Purpose | Mark one notification owned by the authenticated user as read |

**Success Response — 200 OK**
```json
{ "message": "Notification marked as read" }
```

| Status | Reason |
|--------|--------|
| 401 | Unauthorized |
| 404 | Notification not found for this user |

#### 8.9.3 Mark All Notifications Read

| Property | Value |
|----------|-------|
| Method | `POST` |
| Path | `/vote/v1/notifications/read-all` |
| Auth | **Required** |
| Purpose | Mark every unread notification for the authenticated user and `recipient_account_type` as read |

**Success Response — 200 OK**
```json
{ "message": "All notifications marked as read" }
```

| Status | Reason |
|--------|--------|
| 401 | Unauthorized |

#### 8.9.4 Register Push Token

| Property | Value |
|----------|-------|
| Method | `PUT` |
| Path | `/vote/v1/push-tokens` |
| Auth | **Required** |
| Purpose | Upsert an Expo push token for the authenticated subject `(user_id, account_type)` |

**Request Body**
```json
{
  "expo_push_token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "device_fingerprint": "sv_android_...",
  "platform": "android"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `expo_push_token` | string | Yes | Expo push token from the mobile client |
| `device_fingerprint` | string | No | Stable per-install fingerprint (dedupes token rows per device) |
| `platform` | string | No | `ios` or `android` |

**Success Response — 200 OK**
```json
{ "message": "Push token registered" }
```

#### 8.9.5 Delete Push Token

| Property | Value |
|----------|-------|
| Method | `DELETE` |
| Path | `/vote/v1/push-tokens` |
| Auth | **Required** |
| Purpose | Remove one token or all tokens for the authenticated subject |

**Request Body (optional)**
```json
{ "expo_push_token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]" }
```

When `expo_push_token` is omitted, all push tokens for the subject are deleted (typical on logout).

**Success Response — 200 OK**
```json
{ "message": "Push token deleted" }
```

---

## 9. Authorization Model

The Vote Service enforces two authorization strategies, both evaluated at request time by the `Authorize` middleware before any handler runs.

---

### 9.1 ABAC — Attribute-Based Access Control (Poll Ownership)

The user's effective role is **derived on every request** by comparing the caller's `user_id` against the `admin_id` attribute stored on the poll. No role is looked up from a database table for this decision.

```
user_id == poll.admin_id  →  effective role: "admin"
user_id != poll.admin_id  →  effective role: "voter"

Special case:
  user_id == poll.admin_id  AND  action == "vote"  AND  allow_admin_vote == true
    →  effective role: "voter"  (owner intentionally treated as voter)
```

| Effective Role | Who                              | Permitted Actions                     |
|----------------|----------------------------------|---------------------------------------|
| `admin`        | The user whose `user_id` matches `poll.admin_id` | `start`, `end`, `delete`, `view_result` |
| `voter`        | Authenticated users who are not the owner (or owner when `allow_admin_vote: true` for `vote` only) | `vote` |

**`view_result` access (enforced in middleware on `GET /results`, not on `GET /tally`):**

| Caller | Can view `/results`? | Can view `/tally`? |
|--------|----------------------|--------------------|
| Poll `admin_id` | Yes | Yes (when poll is `active` or `ended`) |
| User who has **already cast a vote** in this poll | Yes | Yes (when poll is `active` or `ended`) |
| Any other authenticated user | No — `403 Access denied` | Yes (when poll is `active` or `ended`) |

> `POST /vote/v1/polls` (create poll) does not use Casbin; any authenticated user may create a poll and becomes that poll's `admin_id`.

---

### 9.2 PBAC — Policy-Based Access Control (Time Window)

For the `vote` action, Casbin additionally evaluates a custom `withinWindow(start, end)` function registered at startup. The function is called with the poll's `voting_start_at` / `voting_end_at` attributes.

| Condition                                      | Effect                                       |
|------------------------------------------------|----------------------------------------------|
| Both `voting_start_at` and `voting_end_at` are `null` | No time restriction at policy layer — manual `/start` & `/end` and `poll.status` still apply |
| Both fields are set, current time is inside the window | Vote is allowed (subject to ABAC check passing too) |
| Both fields are set, current time is **outside** the window | `403 Voting window is closed`               |
| Only `voting_start_at` is set (end is `null`)  | Vote allowed only **after** start time       |
| Only `voting_end_at` is set (start is `null`)  | Vote allowed only **before** end time        |

---

### 9.3 Casbin Policy Reference (`policy.csv`)

```
p, admin, poll, delete
p, admin, poll, start
p, admin, poll, end
p, admin, poll, view_result

p, voter, poll, vote
p, voter, poll, view_result
```

> The `create` policy row was removed — poll creation is not Casbin-gated. `view_result` in policy applies only after the middleware grants access (admin or prior voter).

The Casbin model matcher:
```
r.sub.Role == p.sub  &&  r.obj.Type == p.obj  &&  r.act == p.act
  &&  (r.act != "vote"  ||  withinWindow(r.obj.VotingStart, r.obj.VotingEnd))
```

`r.sub` and `r.obj` are Go structs carrying the derived role and poll attributes respectively — Casbin evaluates field values, not stored strings.

---

## 10. Poll Status Flow

### Manual Flow (no time window)

When `voting_start_at` / `voting_end_at` are **not** set, the admin drives all transitions manually:

```
  [created]  ──── POST /start (owner) ────►  [active]  ──── POST /end (owner) ────►  [ended]
      │                                           │                                       │
   Can be                                    Voters can                              Results
   deleted                                    vote here                              available
```

### Time-Window Flow (PBAC — explicit `voting_start_at` / `voting_end_at`)

When both explicit time bounds are set at creation:
- The **expiry worker** handles **both** transitions automatically — no admin action is required.
- Casbin additionally gates every individual vote attempt inside the `[active]` window.

```
  [created]  ──── expiry worker (auto) ────►  [active]  ──── expiry worker (auto) ────►  [ended]
             when voting_start_at ≤ NOW()         │  when voting_end_at ≤ NOW()          │
                   (every 30 s)                   │        (every 30 s)                  │
                                  ┌──────────────┤                                    │
                                  │              │                                    │
                        before voting_start_at   inside window     after voting_end_at  │
                             → 403 window           → vote OK          → 403 window    │
                               closed                                    closed         │
                                                                               Results  │
                                                                               available┘
```

> The admin can still call `POST /start` and `POST /end` manually. If they do so before the worker fires, the worker’s next tick becomes a no-op for that poll.

### Duration Flow (auto-expiry via `duration_minutes`)

When `duration_minutes` is set at creation, the voting window does not exist yet — it is computed the moment the admin calls `/start`:

```
  [created]  ──── POST /start (owner) ────►  [active]  ──── expiry worker ────►  [ended]
                         │                       │              (auto)               │
                  computes NOW()            PBAC allows                         Results
                  voting_start_at            votes within                       available
                  voting_end_at              the window
                  = NOW() + N min
```

> The **expiry worker** runs every 30 seconds. It executes one `UPDATE polls SET status='ended' WHERE status='active' AND voting_end_at <= NOW()`. No admin action is needed to close the poll.

### Duration + Auto-Start Flow (`duration_minutes` + `auto_start: true`)

When both `duration_minutes` and `auto_start: true` are set, the poll skips the `created` phase entirely — it is inserted directly as `active` with the voting window already computed:

```
  POST /polls ──── auto_start: true ────► [active]  ──── expiry worker ────►  [ended]
  (creation)             │                   │              (auto)               │
                 voting_start_at         PBAC allows                        Results
                 = NOW()                  votes within                      available
                 voting_end_at            the window
                 = NOW() + N min
```

> No `POST /start` call is needed or accepted (the poll is already `active`). The expiry worker auto-ends it as usual. The admin may call `POST /end` early to close voting before the window expires.

| Status    | Can Vote                              | Can Start | Can End (manual) | Can Delete |
|-----------|---------------------------------------|-----------|------------------|------------|
| `created` | No (not active)                       | Yes       | No               | Yes        |
| `active`  | Yes — if inside time window (or no window set) | No | Yes         | Yes        |
| `ended`   | No                                    | No        | No               | Yes        |

> **Admin actions (start, end, delete) are ABAC-gated** — only the poll creator passes the ownership check. Any other user receives `403 Access denied: insufficient permissions`.

---

## 11. Sample Frontend Usage

### JavaScript / TypeScript (Fetch API)

#### Login and store access token in memory
```javascript
// /dev/null/authApi.js#L1-20
let accessToken = null; // store in memory, NOT localStorage

async function login(email, password) {
  const res = await fetch(`${process.env.VITE_AUTH_API_URL}/auth/login`, {
    method: "POST",
    credentials: "include", // required — browser stores refresh_token_user or refresh_token_org
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Login failed");
  }

  // Only access_token is in the body — refresh JWT is in HttpOnly cookie (you never see it)
  const { access_token } = await res.json();
  accessToken = access_token;
  return access_token;
}
```

#### Authenticated request helper
```javascript
// /dev/null/apiClient.js#L1-20
async function authFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    credentials: "include", // sends refresh cookie on refresh/logout when needed
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });
}
```

#### Create a poll (no time window — manual control)
```javascript
// /dev/null/pollsApi.js#L1-25
async function createPoll({ title, description, options, allowAdminVote }) {
  const res = await authFetch(
    `${process.env.VITE_VOTE_API_URL}/vote/v1/polls`,
    {
      method: "POST",
      body: JSON.stringify({
        title,
        description,
        options,
        allow_admin_vote: allowAdminVote ?? false,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create poll");
  }

  return res.json(); // { message, poll }
}
```

#### Create a poll with email invites
```javascript
async function createPollWithEmailInvites({ title, options, visibility, emailInvites }) {
  const res = await authFetch(`${process.env.VITE_VOTE_API_URL}/vote/v1/polls`, {
    method: "POST",
    body: JSON.stringify({
      title,
      options,
      visibility: visibility ?? "public",
      email_invites: emailInvites, // [{ email, name? }]
    }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json(); // { message, poll, email_invites_summary? }
}
```

TypeScript clients should prefer `@securevote/api-client`:

```typescript
import { createVoteApi } from "@securevote/api-client";

const voteApi = createVoteApi(apiClient);
const { poll, email_invites_summary } = await voteApi.createPoll({
  title: "Team lunch",
  options: ["Pizza", "Sushi"],
  visibility: "private",
  email_invites: [{ email: "alice@example.com", name: "Alice" }],
});
```

#### Create a poll with a PBAC time window (explicit bounds)
```javascript
// /dev/null/pollsApi.js#L28-55
async function createTimedPoll({ title, description, options, allowAdminVote, votingStartAt, votingEndAt }) {
  // votingStartAt / votingEndAt are JS Date objects or ISO 8601 strings.
  // Both must be provided together; if only one is given the server ignores the window.
  const res = await authFetch(
    `${process.env.VITE_VOTE_API_URL}/vote/v1/polls`,
    {
      method: "POST",
      body: JSON.stringify({
        title,
        description,
        options,
        allow_admin_vote: allowAdminVote ?? false,
        // Convert Date → ISO string if needed
        voting_start_at: votingStartAt instanceof Date ? votingStartAt.toISOString() : votingStartAt,
        voting_end_at:   votingEndAt   instanceof Date ? votingEndAt.toISOString()   : votingEndAt,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    // 400 if voting_start_at >= voting_end_at
    throw new Error(err.error || "Failed to create poll");
  }

  return res.json(); // { message, poll }  — poll includes voting_start_at / voting_end_at
}
```

#### Create a poll with duration-based auto-expiry
```javascript
// /dev/null/pollsApi.js#L58-80
async function createDurationPoll({ title, description, options, allowAdminVote, durationMinutes }) {
  // durationMinutes: positive integer — the voting window is calculated by the
  // server the moment the admin calls POST /start.
  // Cannot be combined with voting_end_at.
  const res = await authFetch(
    `${process.env.VITE_VOTE_API_URL}/vote/v1/polls`,
    {
      method: "POST",
      body: JSON.stringify({
        title,
        description,
        options,
        allow_admin_vote: allowAdminVote ?? false,
        duration_minutes: durationMinutes,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create poll");
  }

  // poll.voting_start_at and poll.voting_end_at are null until /start is called.
  return res.json(); // { message, poll }
}
```

#### List polls (hub / dashboard)
```javascript
// /dev/null/pollsApi.js#L83-105
async function listPolls({ scope = "admin", status, cursor, limit = 20 } = {}) {
  const q = new URLSearchParams({ scope, limit: String(limit) });
  if (status) q.set("status", status);
  if (cursor) q.set("cursor", cursor);

  const res = await authFetch(
    `${process.env.VITE_VOTE_API_URL}/vote/v1/polls?${q}`,
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to list polls");
  }

  return res.json(); // { data: PollListItem[], pagination: { next_cursor?, has_more } }
}
```

#### Get live tally (no vote required)
```javascript
// /dev/null/pollsApi.js#L108-120
async function getPollTally(pollId) {
  const res = await authFetch(
    `${process.env.VITE_VOTE_API_URL}/vote/v1/polls/${pollId}/tally`,
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to get tally");
  }

  return res.json(); // { poll_id, title, status, options, votes, total_votes }
}
```

#### Start a poll and read the computed voting window
```javascript
// /dev/null/pollsApi.js#L123-145
async function startPoll(pollId) {
  const res = await authFetch(
    `${process.env.VITE_VOTE_API_URL}/vote/v1/polls/${pollId}/start`,
    { method: "POST" }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to start poll");
  }

  const data = await res.json(); // { message, poll }

  // When duration_minutes was set at creation, the server has now computed:
  //   data.poll.voting_start_at  (the moment /start was called)
  //   data.poll.voting_end_at    (voting_start_at + duration_minutes)
  // You can display a countdown to the user using these values.
  if (data.poll?.voting_end_at) {
    const endsAt = new Date(data.poll.voting_end_at);
    console.log(`Voting closes at ${endsAt.toLocaleString()}`);
  }

  return data.poll;
}
```

#### Cast a vote
```javascript
// /dev/null/pollsApi.js#L58-85
async function castVote(pollId, optionIdx) {
  const res = await authFetch(
    `${process.env.VITE_VOTE_API_URL}/vote/v1/polls/${pollId}/vote`,
    {
      method: "POST",
      body: JSON.stringify({ poll_id: pollId, option_idx: optionIdx }),
    }
  );

  if (res.status === 409) throw new Error("You have already voted.");

  if (res.status === 403) {
    const err = await res.json();
    // Distinguish PBAC time-window denial from ABAC ownership denial
    if (err.error === "Voting window is closed") {
      throw new Error("Voting is not open right now. Please check the voting window.");
    }
    throw new Error(err.error || "You are not allowed to vote.");
  }

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Vote failed");
  }

  return res.json(); // { message: "Vote submitted successfully" }
}
```

#### Refresh the access token silently
```javascript
// /dev/null/authApi.js#L23-45
async function refreshAccessToken() {
  // No body needed — the browser automatically sends the HttpOnly cookie
  const res = await fetch(`${process.env.VITE_AUTH_API_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include", // required for the cookie to be sent
  });

  if (!res.ok) {
    // Refresh failed — cookie expired or revoked, force re-login
    accessToken = null;
    window.location.href = "/login";
    return;
  }

  const { access_token } = await res.json();
  accessToken = access_token; // update in-memory token
  return access_token;
}
```

#### Logout
```javascript
// /dev/null/authApi.js#L48-65
async function logout() {
  // No body needed — cookie is sent automatically and cleared by the server
  await fetch(`${process.env.VITE_AUTH_API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  accessToken = null; // discard in-memory token
  window.location.href = "/login";
}
```

---

## 12. CORS & Cookie Notes

### Cookie Behaviour
- User login sets `refresh_token_user`; organization login sets `refresh_token_org` (`HttpOnly; Secure; SameSite=Strict`).
- Refresh and logout accept either cookie (legacy `refresh_token` is cleared when a new session is issued).
- JavaScript **cannot read** this cookie — it is invisible to your code. The browser attaches it automatically on every request to the auth service domain.
- The `Secure` flag is active in production (Railway, HTTPS). In local development (HTTP), the cookie is still set but without `Secure` so it works on `localhost`.

### Required fetch / Axios setting
Every request to the auth service **must** include credentials, otherwise the browser will not send or store the cookie:

```javascript
// Fetch
fetch(url, { credentials: "include" })

// Axios (set once globally)
axios.defaults.withCredentials = true;
```

### CORS configuration (backend)
Auth-service enables CORS from `CORS_ALLOWED_ORIGINS` (comma-separated). Default dev origins: `http://localhost:3000`, `http://127.0.0.1:3000`.

```
CORS_ALLOWED_ORIGINS=https://your-frontend.com,http://localhost:5173
```

Responses use the request `Origin` when allowlisted, with `Access-Control-Allow-Credentials: true`.

### Token storage summary
| Token | Where stored | Accessible to JS? |
|---|---|---|
| `access_token` (`token_use: access`) | JS memory (a variable) | Yes — you manage it |
| Refresh JWT (`token_use: refresh`) | `HttpOnly` cookie: `refresh_token_user` or `refresh_token_org` | No — browser only |

---

## 13. Rate Limits

Auth-service and vote-service return `429 RATE_LIMITED` when limits are exceeded. Responses include a `Retry-After` header in seconds when the server can calculate the active window.

| Flow | Limit |
|------|--------|
| Login | 5 attempts / minute per email, IP, and device fingerprint |
| Register | 10 attempts / minute per email, IP, and device fingerprint |
| Refresh | 30 attempts / minute per IP and device fingerprint |
| Protected auth API | 120 requests / minute per user, IP, and device fingerprint |
| Vote API | 120 requests / minute per user and IP; 60 requests / minute per device fingerprint |
| Email OTP send | 3 codes / 2 minutes per user or org |
| Email OTP verify | 5 failed attempts / 2 minutes per user or org |

Default limits can be tuned per deployment with environment variables such as `RATE_LIMIT_ENABLED`, `RATE_LIMIT_LOGIN_MAX`, `RATE_LIMIT_LOGIN_WINDOW_SECONDS`, `RATE_LIMIT_API_MAX`, and `RATE_LIMIT_API_WINDOW_SECONDS`.

Best practices: refresh only when the access token is expiring; send `X-Device-Fingerprint` from browser/mobile clients; use exponential backoff on `429`; wait at least `Retry-After` seconds before retrying.
