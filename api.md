overview
Who Are We
Company Name : securevote
Company Type : Election Infrastructure as a Service (EIaaS) and a social platform of your voice.
Company Mission : 'To make voting easier and more accessible for everyone'
Company Vision : 'To be the leading platform for voting, making it accessible to everyone'
Company Voice : 'Democracy deserves better infrastructure.', 'Your voice, counted.', 'Verified, Auditable, Transparent'
Company Philosophy : 'The secure, transparent, and accessible online voting platform built for the modern world.'
The Problem is : Voting is broken — and people know it.
55% of eligible voters didn't cast a ballot in the last major election
4+ hrs average wait time in under-resourced polling districts
$30B spent annually on paper-based election administration globally
We are giving :
End-to-end encryption : Every ballot cryptographically sealed and verifiable
Vote from anywhere : no polling station required
Public audit trail : Anyone can verify results without seeing individual votes
Accessibility first : Screen readers, 14 languages, low-bandwidth mode
Election Type : Poll
Customer/user : Public, Organizations, NGOs, Government Agencies
Working Overview :
Each user can conduct multiple elections and participate in multiple elections
I need dashboard for each election the user conduct.
Project based
Users virification : Not verified (just create an account), Trusted User (Email verified), Verified User (Government ID verified)
Users can customize : Public or Private elections
Users can also Add Voters for their elections
Users can create Election body for conduct any election
Person and Organization has separate registration and authentication APIs.
Feed :
Can Create an election
View Elections are live and upcoming elections in real-time card view
TopBar :
Search bar
Notifications
Profile Picture and Name
Profile
Settings
Logout
Sidebar (left) :
Feed
Elections
Notifications
Sidebar (right) :
Only in feed section
Profile Completion Card
Trending elections
verified Organizations
Creation of Election :
Candidate Management
Voter Management
Ballot Preview
In dashboard :
Election Overview : Election Name and Election Status (Draft, Scheduled, Live, Paused, Completed) in real-time as icon or a signal. Start time and End time and dates. KPIs: Total Eligible Voters, Votes Cast, Turnout %, Candidates, Positions/Seats, Remaining Time (real-time)
Live section :
Votes Cast
Voters Remaining
Voting Trend/Time Series
Turnout Rate
Voting Activity Timeline
Turnout Progress ``` Example:

Turnout ██████████░░░░░ 68%

680 / 1000 Voters ``` - Election Management or settings: Publish Election, Pause Election, Resume Election, Extend Voting Time, Close Election, Duplicate Election - Results Section : - Summary : - Total Votes - Turnout % - Winning Candidates - Visualizations - Bar Charts - Pie Charts - Seat Distribution - Audit & Compliance : - Election Timeline - Event History - Admin Actions - Vote Count Verification - Certificate Generation - Downloads : - Audit Report - Election Certificate - Participation Report
overview
[V-1.0][Commit - 3c71156]

E-Voting Platform — Frontend API Guide
Everything your frontend needs to integrate with the Auth Service and Vote Service.

Table of Contents
Base URLs
Authentication Overview
Token Lifecycle (Refresh & Logout)
Environment Variables
Global Headers
Error Response Format
Auth Service Endpoints
Health Check
Register
Login
Refresh Token
Logout
Get Current User (Me)
Vote Service Endpoints
Health Check
Create Poll
Get Poll
Start Poll
End Poll
Vote on a Poll
View Poll Results
Delete Poll
Authorization Model (ABAC + PBAC)
Poll Status Flow
Sample Frontend Usage
CORS & Cookie Notes
Rate Limits
1. Base URLs
Environment	Auth Service	Vote Service
Production	https://auth-service-production-25af.up.railway.app	https://vote-service-production.up.railway.app
Development	http://localhost:8080	http://localhost:8081
Tip: Always read the base URL from an environment variable (see Section 4) — never hardcode it.

2. Authentication Overview
All protected endpoints require a JWT Bearer Token in the Authorization header.

Authorization: Bearer <access_token>
Token Details
Property	Value
Algorithm	RS256 (RSA + SHA-256)
Access Token TTL	15 minutes
Refresh Token TTL	7 days
Token storage	access_token: JS memory (a variable); refresh_token: HttpOnly cookie (set and managed by the server — JS cannot read it)
The token payload contains:

{
  "user_id": "42",
  "iss": "auth-service",
  "iat": 1720000000,
  "exp": 1720000900
}
3. Token Lifecycle (Refresh & Logout)
┌─────────┐        POST /auth/login         ┌──────────────┐
│ Frontend│ ──────────────────────────────► │  Auth Service│
│         │ ◄────── access_token (15 min) ── │              │
│         │ ◄── Set-Cookie: refresh_token ── │              │  (HttpOnly, Secure, SameSite=Strict)
└─────────┘      (7 days, JS can't read)     └──────────────┘
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
┌─────────┐       POST /user/logout          ┌──────────────┐
│ Frontend│ ── no body, cookie auto-sent ───► │  Auth Service│
│         │ ◄──── { message: "Logout..." } ─  │              │  (server clears cookie via Set-Cookie: max-age=-1)
└─────────┘                                  └──────────────┘
Recommended Frontend Strategy
After login, store only the access_token in memory (a JS variable or React state). Do not store it in localStorage. The refresh_token is an HttpOnly cookie — you never see or touch it.
On every API call, check if the access token is about to expire (e.g., < 60 seconds remaining) and silently call POST /auth/refresh first — no body needed, the browser sends the cookie automatically.
If a 401 is returned from any protected route, attempt one silent refresh; if that also fails, redirect to login.
On logout, always call POST /user/logout to invalidate the refresh token server-side and clear the cookie, then discard the in-memory access token.
4. Environment Variables
Add these to your .env (or .env.local) file:

VITE_AUTH_API_URL=https://auth-service-production-25af.up.railway.app
VITE_VOTE_API_URL=https://vote-service-production.up.railway.app
If you use Create React App, replace the VITE_ prefix with REACT_APP_.

5. Global Headers
Every request to any endpoint should include:

Header	Value	Notes
Content-Type	application/json	Required for all requests with a body
Authorization	Bearer <token>	Required for all protected routes
Timestamps
All timestamps returned in any response are UTC (ISO 8601, Z suffix — e.g. "2024-07-10T09:00:00Z").
Request body timestamps may include any UTC offset (e.g. +05:30); the server normalises them to UTC before storage and always responds with Z.

6. Error Response Format
Auth Service Errors
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "email or password incorrect"
  }
}
Error Code	HTTP Status	Description
INVALID_CREDENTIALS	401	Wrong email or password
USER_NOT_FOUND	404	User does not exist
EMAIL_ALREADY_EXISTS	409	Email is already registered
INVALID_REQ_BODY	400	Malformed or missing request body
INVALID_PASSWORD	400	Password doesn't meet requirements
GENERATE_TOKEN	500	Server failed to generate JWT
INTERNAL_SERVER_ERROR	500	Unexpected server error
Vote Service Errors
{
  "error": "Poll is not active"
}
HTTP Status	Description
400	Bad request (e.g., poll cannot be started, wrong poll ID, invalid time window)
401	Missing or invalid Bearer token
403	Insufficient permissions — not the poll owner (ABAC), or voting window closed (PBAC)
404	Poll not found
409	Conflict — user has already voted
500	Internal server error
7. Auth Service Endpoints
7.1 Health Check
Property	Value
Method	GET
Path	/health
Auth	Not required
Success Response — 200 OK

{ "status": "ok" }
7.2 Register
Property	Value
Method	POST
Path	/auth/register
Auth	Not required
Purpose	Create a new user account
Required Headers

Content-Type: application/json
Request Body

Field	Type	Required	Description
email	string	Yes	Valid email address
password	string	Yes	Plain-text password (hashed server-side)
Example Request Body

{
  "email": "voter@example.com",
  "password": "SecurePass123"
}
Success Response — 201 Created

{
  "message": "User registered successfully"
}
Error Responses

Status	Code	Reason
400	INVALID_REQ_BODY	Missing or malformed fields
409	EMAIL_ALREADY_EXISTS	Email already in use
7.3 Login
Property	Value
Method	POST
Path	/auth/login
Auth	Not required
Purpose	Authenticate a user and receive JWT tokens
Required Headers

Content-Type: application/json
Request Body

Field	Type	Required	Description
email	string	Yes	Registered email
password	string	Yes	Account password
Example Request Body

{
  "email": "voter@example.com",
  "password": "SecurePass123"
}
Success Response — 200 OK

{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
The refresh_token is not returned in the body. It is set automatically as an HttpOnly cookie (Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Strict). Your JS code never sees it.

You must include credentials: 'include' (Fetch) or withCredentials: true (Axios) so the browser accepts and stores the cookie.

Error Responses

Status	Code	Reason
400	INVALID_REQ_BODY	Malformed body
400	INVALID_PASSWORD	Wrong password
401	INVALID_CREDENTIALS	Wrong email/password
7.4 Refresh Token
Property	Value
Method	POST
Path	/auth/refresh
Auth	Not required
Purpose	Get a new access token using the refresh token stored in the HttpOnly cookie
Required Headers

(none beyond credentials)
No request body needed. The browser automatically attaches the refresh_token cookie. You must send the request with credentials: 'include' (Fetch) or withCredentials: true (Axios).

Success Response — 200 OK

{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
Error Responses

Status	Code	Reason
401	—	Cookie missing (user never logged in)
401	INVALID_CREDENTIALS	Token expired or revoked — redirect to login
7.5 Logout
Property	Value
Method	POST
Path	/user/logout
Auth	Required (Bearer token)
Purpose	Invalidate the refresh token server-side and clear the cookie
Required Headers

Authorization: Bearer <access_token>
No request body needed. The browser automatically attaches the refresh_token cookie. You must send the request with credentials: 'include' (Fetch) or withCredentials: true (Axios). The server will also clear the cookie in the response (Set-Cookie: refresh_token=; max-age=-1).

Success Response — 200 OK

{
  "message": "Logout successful"
}
Error Responses

Status	Reason
401	Cookie missing or refresh token not found
401	Missing or invalid access token
7.6 Get Current User (Me)
Property	Value
Method	GET
Path	/user/me
Auth	Required (Bearer token)
Purpose	Return the profile of the authenticated user
Required Headers

Authorization: Bearer <access_token>
Success Response — 200 OK

{
  "ID": 42,
  "Email": "voter@example.com"
}
Error Responses

Status	Reason
401	Missing or invalid access token
404	USER_NOT_FOUND — user deleted
8. Vote Service Endpoints
All endpoints under /vote/v1/ require a valid Bearer token.

Required Headers for all Vote Service requests:

Authorization: Bearer <access_token>
Content-Type: application/json   ← (only for requests with a body)
8.1 Health Check
Property	Value
Method	GET
Path	/health
Auth	Not required
Success Response — 200 OK

{ "status": "ok" }
8.2 Create Poll
Property	Value
Method	POST
Path	/vote/v1/polls
Auth	Required
Purpose	Create a new poll. The calling user automatically becomes the poll admin.
Request Body

Field	Type	Required	Description
title	string	Yes	Title of the poll
description	string	No	Optional description
options	string[]	Yes	At least 2 options required
allow_admin_vote	boolean	No	Whether the poll creator can also cast a vote (default: false)
voting_start_at	string (ISO 8601)	No	PBAC — explicit window open time. Must be used with voting_end_at. Mutually exclusive with duration_minutes.
voting_end_at	string (ISO 8601)	No	PBAC — explicit window close time. Votes outside this range get 403 Voting window is closed. Mutually exclusive with duration_minutes.
duration_minutes	integer	No	Duration-based auto-expiry — voting period length in minutes. When the admin calls /start, voting_start_at is set to NOW() and voting_end_at to NOW() + N minutes. The background expiry worker then auto-ends the poll when that time passes. Must be a positive integer. Mutually exclusive with voting_end_at.
auto_start	boolean	No	Duration + immediate start — when true, requires duration_minutes. The poll is set to active immediately at creation; voting_start_at and voting_end_at are computed at insert time. No POST /start call is needed. Mutually exclusive with voting_start_at. Defaults to false.
Four modes of voting-window control (pick one): - No window — omit all time fields. Admin drives transitions manually via /start and /end. - Explicit window (PBAC) — set voting_start_at + voting_end_at. Casbin blocks votes outside the range regardless of poll status. - Duration (manual start) — set duration_minutes. On /start the window is computed automatically and the poll self-expires via the background worker. - Duration + auto-start — set duration_minutes + auto_start: true. The poll is activated immediately at creation; no /start call is needed and the poll self-expires via the background worker.

Example 1 — No time window (manual control)

{
  "title": "Best Programming Language 2024",
  "description": "Vote for your favourite language.",
  "options": ["Go", "Python", "TypeScript", "Rust"],
  "allow_admin_vote": false
}
▶ How to start: Call POST /vote/v1/polls/:pollId/start — manually triggered by the poll admin.
⏹ How to end: Call POST /vote/v1/polls/:pollId/end — manually triggered by the poll admin.
Neither transition happens automatically; the poll stays in created until the admin explicitly starts it, and stays active until the admin explicitly ends it.

Example 2 — Explicit time window (PBAC)

🛠 Developer Testing Note

voting_start_at and voting_end_at must be future UTC timestamps at the time the request is submitted. The server validates both fields against the current UTC clock and rejects any value that is in the past.

Before constructing the request body, retrieve the current UTC time from your terminal: bash date -u +"%Y-%m-%dT%H:%M:%SZ" Use the output as your baseline and set voting_start_at to a time after it, and voting_end_at to a time after voting_start_at.

Example output: 2026-05-23T15:30:00Z → you could then set voting_start_at to 2026-05-23T15:35:00Z and voting_end_at to 2026-05-23T15:45:00Z.

{
  "title": "Best Programming Language 2024",
  "description": "Vote for your favourite language.",
  "options": ["Go", "Python", "TypeScript", "Rust"],
  "allow_admin_vote": false,
  "voting_start_at": "2024-07-10T09:00:00Z",
  "voting_end_at":   "2024-07-10T17:00:00Z"
}
▶ How to start: Automatic — the background expiry worker transitions the poll from created → active when voting_start_at ≤ NOW() (checked every 30 s). No admin action required.
⏹ How to end: Automatic — the expiry worker transitions the poll from active → ended when voting_end_at ≤ NOW(). No admin action required.
The admin may still call POST /start or POST /end manually before the worker fires; the worker's next tick will then be a no-op for that poll.

Example 3 — Duration-based auto-expiry

{
  "title": "Best Programming Language 2024",
  "description": "Voting closes 60 minutes after the poll is started.",
  "options": ["Go", "Python", "TypeScript", "Rust"],
  "allow_admin_vote": false,
  "duration_minutes": 60
}
▶ How to start: Call POST /vote/v1/polls/:pollId/start — manually triggered by the poll admin. At that moment voting_start_at is set to NOW() and voting_end_at to NOW() + duration_minutes. The poll will not become active until this call is made.
⏹ How to end: Automatic — the background expiry worker transitions the poll from active → ended when voting_end_at ≤ NOW() (checked every 30 s). No further admin action is required; however the admin may call POST /end early to close voting before the window expires.

Example 4 — Duration-based + auto-start

{
  "title": "Best Programming Language 2024",
  "description": "Voting opens immediately and closes in 60 minutes.",
  "options": ["Go", "Python", "TypeScript", "Rust"],
  "allow_admin_vote": false,
  "duration_minutes": 60,
  "auto_start": true
}
▶ How to start: None — the poll is set to active immediately at creation. voting_start_at is set to NOW() and voting_end_at to NOW() + duration_minutes at insert time. No admin action required.
⏹ How to end: Automatic — the background expiry worker transitions the poll from active → ended when voting_end_at ≤ NOW() (checked every 30 s). No admin action required; however the admin may call POST /end early to close voting before the window expires.

Success Response — 201 Created

Example A — duration-based, manual start (auto_start: false)

{
  "message": "Poll created successfully",
  "poll": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "title": "Best Programming Language 2024",
    "description": "Voting closes 60 minutes after the poll is started.",
    "options": ["Go", "Python", "TypeScript", "Rust"],
    "status": "created",
    "admin_id": "42",
    "allow_admin_vote": false,
    "auto_start": false,
    "duration_minutes": 60,
    "created_at": "2024-07-10T08:00:00Z",
    "updated_at": "2024-07-10T08:00:00Z"
  }
}
Example B — duration-based, auto-start (auto_start: true)

{
  "message": "Poll created successfully",
  "poll": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "title": "Best Programming Language 2024",
    "description": "Voting opens immediately and closes in 60 minutes.",
    "options": ["Go", "Python", "TypeScript", "Rust"],
    "status": "active",
    "admin_id": "42",
    "allow_admin_vote": false,
    "auto_start": true,
    "duration_minutes": 60,
    "voting_start_at": "2024-07-10T08:00:00Z",
    "voting_end_at":   "2024-07-10T09:00:00Z",
    "created_at": "2024-07-10T08:00:00Z",
    "updated_at": "2024-07-10T08:00:00Z"
  }
}
voting_start_at, voting_end_at, and duration_minutes are omitted from the response when they were not set.
auto_start is always present in the response (false by default).
All timestamp fields (created_at, updated_at, voting_start_at, voting_end_at) are always returned in UTC (Z).

Error Responses

Status	Reason
400	Missing required fields, or fewer than 2 options
400	voting_start_at is in the past
400	voting_end_at is in the past
400	voting_start_at ≥ voting_end_at
400	duration_minutes is zero or negative
400	duration_minutes combined with voting_end_at (mutually exclusive)
400	auto_start: true without duration_minutes
400	auto_start: true combined with voting_start_at (mutually exclusive)
401	Unauthorized
500	Failed to create poll
8.3 Get Poll
Property	Value
Method	GET
Path	/vote/v1/polls/:pollId
Auth	Required
Purpose	Fetch details of a specific poll
Path Param	pollId — UUID of the poll
Example Request

GET /vote/v1/polls/a1b2c3d4-e5f6-7890-abcd-ef1234567890
Success Response — 200 OK

{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "title": "Best Programming Language 2024",
  "description": "Vote for your favourite language.",
  "options": ["Go", "Python", "TypeScript", "Rust"],
  "status": "active",
  "admin_id": "42",
  "allow_admin_vote": false,
  "duration_minutes": 60,
  "voting_start_at": "2024-07-10T09:00:00Z",
  "voting_end_at": "2024-07-10T17:00:00Z",
  "created_at": "2024-07-10T08:00:00Z",
  "updated_at": "2024-07-10T09:00:00Z"
}
duration_minutes, voting_start_at, and voting_end_at are omitted from the response when they were not set.

Error Responses

Status	Reason
401	Unauthorized
404	Poll not found
8.4 Start Poll
Property	Value
Method	POST
Path	/vote/v1/polls/:pollId/start
Auth	Required — poll owner only
Purpose	Transition poll status from created → active (opens voting)
Path Param	pollId — UUID of the poll
ABAC enforcement: The Authorize("start") middleware fetches the poll and checks user_id == poll.admin_id at request time. No stored role is consulted — ownership is evaluated directly from the resource attribute.

No request body required.

Duration auto-expiry: When the poll was created with duration_minutes, this call also sets voting_start_at = NOW() and voting_end_at = NOW() + N minutes in a single Postgres UPDATE. The background worker then auto-transitions the poll to ended when voting_end_at is reached (no further admin action needed).

Success Response — 200 OK

Always includes the updated poll object so the caller can immediately read the computed voting_start_at / voting_end_at.

{
  "message": "Poll started successfully",
  "poll": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "title": "Best Programming Language 2024",
    "description": "Voting closes 60 minutes after the poll is started.",
    "options": ["Go", "Python", "TypeScript", "Rust"],
    "status": "active",
    "admin_id": "42",
    "allow_admin_vote": false,
    "duration_minutes": 60,
    "voting_start_at": "2024-07-10T10:00:00Z",
    "voting_end_at":   "2024-07-10T11:00:00Z",
    "created_at": "2024-07-10T08:00:00Z",
    "updated_at": "2024-07-10T10:00:00Z"
  }
}
Error Responses

Status	Reason
400	Poll cannot be started (already active or ended)
401	Unauthorized
403	You are not the poll owner (ABAC check failed)
404	Poll not found
8.5 End Poll
Property	Value
Method	POST
Path	/vote/v1/polls/:pollId/end
Auth	Required — poll owner only
Purpose	Transition poll status from active → ended (closes voting)
Path Param	pollId — UUID of the poll
ABAC enforcement: Same ownership check as /start — user_id == poll.admin_id evaluated at runtime.

No request body required.

Success Response — 200 OK

{
  "message": "Poll ended successfully"
}
Error Responses

Status	Reason
400	Poll is not active (can't end it)
401	Unauthorized
403	You are not the admin of this poll
404	Poll not found
8.6 Vote on a Poll
Property	Value
Method	POST
Path	/vote/v1/polls/:pollId/vote
Auth	Required
Purpose	Cast a vote on an active poll
Path Param	pollId — UUID of the poll
ABAC + PBAC enforcement: The Authorize("vote") middleware applies two checks before the handler is reached: 1. ABAC — derives whether the user is the poll owner or a voter from poll.admin_id. If the owner has allow_admin_vote: false, the request is denied before reaching the handler. 2. PBAC — if voting_start_at / voting_end_at are set on the poll, Casbin's withinWindow function verifies the current time falls inside the window. Requests outside the window receive 403 Voting window is closed.

Request Body

Field	Type	Required	Description
poll_id	string	Yes	Must match the :pollId path parameter
option_idx	number	Yes	Zero-based index of the chosen option (e.g., 0 for the first option)
Example Request Body

{
  "poll_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "option_idx": 2
}
If options is ["Go", "Python", "TypeScript", "Rust"], then option_idx: 2 votes for "TypeScript".

Success Response — 200 OK

{
  "message": "Vote submitted successfully"
}
Error Responses

Status	Reason
400	poll_id doesn't match the path, or invalid option_idx
400	Poll is not active
401	Unauthorized
403	Poll owner is not allowed to vote (allow_admin_vote: false) — ABAC deny
403	Voting window is closed — PBAC deny (voting_start_at/voting_end_at set)
404	Poll not found
409	You have already voted
8.7 View Poll Results
Property	Value
Method	GET
Path	/vote/v1/polls/:pollId/results
Auth	Required
Purpose	Get the current vote tally for a poll
Path Param	pollId — UUID of the poll
Success Response — 200 OK

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
Note: votes is a { [optionName]: count } map. Options with 0 votes may not appear in the map.

Error Responses

Status	Reason
401	Unauthorized
404	Poll not found
8.8 Delete Poll
Property	Value
Method	DELETE
Path	/vote/v1/polls/:pollId
Auth	Required — poll admin (owner) only
Purpose	Permanently delete a poll and all its votes. Works regardless of the poll's current status.
Path Param	pollId — UUID of the poll
ABAC enforcement: Only the poll creator (user_id == poll.admin_id) may delete a poll. This is evaluated at runtime from the resource attribute — no stored role is consulted. Any other authenticated user receives 403.

Status-independent: A poll can be deleted at any point in its lifecycle — created, active, or ended. The current status is not checked before deletion.

No request body required.

Success Response — 200 OK

{
  "message": "Poll deleted successfully"
}
Error Responses

Status	Reason
401	Unauthorized
403	You are not the admin of this poll
404	Poll not found
9. Authorization Model
The Vote Service enforces two authorization strategies, both evaluated at request time by the Authorize middleware before any handler runs.

9.1 ABAC — Attribute-Based Access Control (Poll Ownership)
The user's effective role is derived on every request by comparing the caller's user_id against the admin_id attribute stored on the poll. No role is looked up from a database table for this decision.

user_id == poll.admin_id  →  effective role: "admin"
user_id != poll.admin_id  →  effective role: "voter"

Special case:
  user_id == poll.admin_id  AND  action == "vote"  AND  allow_admin_vote == true
    →  effective role: "voter"  (owner intentionally treated as voter)
Effective Role	Who	Permitted Actions
admin	The user whose user_id matches poll.admin_id	create, start, end, delete, view_result
voter	Every other authenticated user (or owner when allow_admin_vote: true)	vote, view_result
9.2 PBAC — Policy-Based Access Control (Time Window)
For the vote action, Casbin additionally evaluates a custom withinWindow(start, end) function registered at startup. The function is called with the poll's voting_start_at / voting_end_at attributes.

Condition	Effect
Both voting_start_at and voting_end_at are null	No time restriction — manual /start & /end flow applies
Both fields are set, current time is inside the window	Vote is allowed (subject to ABAC check passing too)
Both fields are set, current time is outside the window	403 Voting window is closed
Only one field is set	No time restriction (treated as null pair)
9.3 Casbin Policy Reference (policy.csv)
p, admin, poll, create
p, admin, poll, delete
p, admin, poll, start
p, admin, poll, end
p, admin, poll, view_result

p, voter, poll, vote
p, voter, poll, view_result
The Casbin model matcher:

r.sub.Role == p.sub  &&  r.obj.Type == p.obj  &&  r.act == p.act
  &&  (r.act != "vote"  ||  withinWindow(r.obj.VotingStart, r.obj.VotingEnd))
r.sub and r.obj are Go structs carrying the derived role and poll attributes respectively — Casbin evaluates field values, not stored strings.

10. Poll Status Flow
Manual Flow (no time window)
When voting_start_at / voting_end_at are not set, the admin drives all transitions manually:

  [created]  ──── POST /start (owner) ────►  [active]  ──── POST /end (owner) ────►  [ended]
      │                                           │                                       │
   Can be                                    Voters can                              Results
   deleted                                    vote here                              available
Time-Window Flow (PBAC — explicit voting_start_at / voting_end_at)
When both explicit time bounds are set at creation: - The expiry worker handles both transitions automatically — no admin action is required. - Casbin additionally gates every individual vote attempt inside the [active] window.

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
The admin can still call POST /start and POST /end manually. If they do so before the worker fires, the worker’s next tick becomes a no-op for that poll.

Duration Flow (auto-expiry via duration_minutes)
When duration_minutes is set at creation, the voting window does not exist yet — it is computed the moment the admin calls /start:

  [created]  ──── POST /start (owner) ────►  [active]  ──── expiry worker ────►  [ended]
                         │                       │              (auto)               │
                  computes NOW()            PBAC allows                         Results
                  voting_start_at            votes within                       available
                  voting_end_at              the window
                  = NOW() + N min
The expiry worker runs every 30 seconds. It executes one UPDATE polls SET status='ended' WHERE status='active' AND voting_end_at <= NOW(). No admin action is needed to close the poll.

Duration + Auto-Start Flow (duration_minutes + auto_start: true)
When both duration_minutes and auto_start: true are set, the poll skips the created phase entirely — it is inserted directly as active with the voting window already computed:

  POST /polls ──── auto_start: true ────► [active]  ──── expiry worker ────►  [ended]
  (creation)             │                   │              (auto)               │
                 voting_start_at         PBAC allows                        Results
                 = NOW()                  votes within                      available
                 voting_end_at            the window
                 = NOW() + N min
No POST /start call is needed or accepted (the poll is already active). The expiry worker auto-ends it as usual. The admin may call POST /end early to close voting before the window expires.

Status	Can Vote	Can Start	Can End (manual)	Can Delete
created	No (not active)	Yes	No	Yes
active	Yes — if inside time window (or no window set)	No	Yes	Yes
ended	No	No	No	Yes
Admin actions (start, end, delete) are ABAC-gated — only the poll creator passes the ownership check. Any other user receives 403 Access denied: insufficient permissions.

11. Sample Frontend Usage
JavaScript / TypeScript (Fetch API)
Login and store access token in memory
// /dev/null/authApi.js#L1-20
let accessToken = null; // store in memory, NOT localStorage

async function login(email, password) {
  const res = await fetch(`${process.env.VITE_AUTH_API_URL}/auth/login`, {
    method: "POST",
    credentials: "include", // required — browser stores the HttpOnly refresh_token cookie
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Login failed");
  }

  // Only access_token is in the body — refresh_token is in the cookie (you never see it)
  const { access_token } = await res.json();
  accessToken = access_token;
  return access_token;
}
Authenticated request helper
// /dev/null/apiClient.js#L1-20
async function authFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    credentials: "include", // sends the refresh_token cookie when needed
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });
}
Create a poll (no time window — manual control)
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
Create a poll with a PBAC time window (explicit bounds)
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
Create a poll with duration-based auto-expiry
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
Start a poll and read the computed voting window
// /dev/null/pollsApi.js#L83-105
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
Cast a vote
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
Refresh the access token silently
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
Logout
// /dev/null/authApi.js#L48-65
async function logout() {
  // No body needed — cookie is sent automatically and cleared by the server
  await fetch(`${process.env.VITE_AUTH_API_URL}/user/logout`, {
    method: "POST",
    credentials: "include",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  accessToken = null; // discard in-memory token
  window.location.href = "/login";
}
12. CORS & Cookie Notes
Cookie Behaviour
The refresh_token is stored in an HttpOnly; Secure; SameSite=Strict cookie set by the server.
JavaScript cannot read this cookie — it is invisible to your code. The browser attaches it automatically on every request to the auth service domain.
The Secure flag is active in production (Railway, HTTPS). In local development (HTTP), the cookie is still set but without Secure so it works on localhost.
Required fetch / Axios setting
Every request to the auth service must include credentials, otherwise the browser will not send or store the cookie:

// Fetch
fetch(url, { credentials: "include" })

// Axios (set once globally)
axios.defaults.withCredentials = true;
CORS configuration (backend)
For credentials: "include" to work, the server must respond with an exact origin (no wildcard *) and Access-Control-Allow-Credentials: true. Request the backend team to add your frontend origin to the allowlist:

Access-Control-Allow-Origin: https://your-frontend.com   ← exact, no wildcard
Access-Control-Allow-Credentials: true
For local development, the allowed origin will typically be http://localhost:5173 (Vite) or http://localhost:3000 (CRA).

Token storage summary
Token	Where stored	Accessible to JS?
access_token	JS memory (a variable)	Yes — you manage it
refresh_token	HttpOnly cookie	No — browser only
13. Rate Limits
There are currently no documented hard rate limits on either service. However, as a best practice:

Avoid hammering the /auth/refresh endpoint; only call it when the token is expiring.
Cache poll data locally for a few seconds before re-fetching.
If a 429 Too Many Requests response is ever returned, implement exponential backoff before retrying.
auth
voting
[V 1.0.0] [Commit - 3c71156]
[V 1.0.1] [Commit - b7d959c]
[V 1.2.0] [Feature - Aadhaar Verification]
[V 1.3.0] [Feature - Verification Check]
[V 1.4.0] [Feature - Organizational Account]
[V 1.4.1] [Security Fix - Security & Performance Hardening]
[V 1.4.2] [Bug Fix - Organization Login / Refresh Tokens]
[V 1.4.3] [Improvement - Organization Verification Step Errors]

E-Voting Platform — Frontend API Guide
Everything your frontend needs to integrate with the Auth Service and Vote Service.

Table of Contents
Base URLs
Authentication Overview
Token Lifecycle (Refresh & Logout)
Environment Variables
Global Headers
Error Response Format
Auth Service Endpoints
Health Check
User Endpoints
Register
Login
Refresh Token
Logout
Get Current User (Me)
Send Verification
Verify Email
List Sessions
Aadhaar Verification
Generate Aadhaar OTP
Verify Aadhaar OTP
Get Aadhaar Status
Verification Check
Get Verified Status
Recheck Verification
Organization Endpoints
Organization Overview
Register Organization
Login Organization
Get Current Organization (Org Me)
Send Organization Verification
Verify Organization Email
Verified Organization Pipeline
Start Organization Verification
Submit Registration Number
Submit Domain
Verify DNS
Get Verification Status
Recheck Organization Verification
Vote Service Endpoints
Health Check
Create Poll
Get Poll
Start Poll
End Poll
Vote on a Poll
View Poll Results
Delete Poll
Authorization Model (ABAC + PBAC)
Poll Status Flow
Sample Frontend Usage
CORS & Cookie Notes
Rate Limits
1. Base URLs
Environment	Auth Service	Vote Service
Production	https://auth-service-production-25af.up.railway.app	https://vote-service-production.up.railway.app
Development	http://localhost:8080	http://localhost:8081
Tip: Always read the base URL from an environment variable (see Section 4) — never hardcode it.

2. Authentication Overview
All protected endpoints require a JWT Bearer Token in the Authorization header.

Authorization: Bearer <access_token>
Token Details
Property	Value
Algorithm	RS256 (RSA + SHA-256)
Access Token TTL	15 minutes
Refresh Token TTL	7 days
Token storage	access_token: JS memory; refresh JWT in HttpOnly cookie (refresh_token_user or refresh_token_org)
token_use	access (Bearer) or refresh (cookie only) — refresh tokens are rejected on protected API routes
The access token payload contains:

{
  "user_id": "42",
  "account_type": "user",
  "token_use": "access",
  "iss": "auth-service",
  "iat": 1720000000,
  "exp": 1720000900
}
Organizational tokens use "account_type": "organization" instead.

How to use account_type
The account_type claim tells you whether the JWT belongs to a user or an organization. You must read this claim to decide which API endpoints to call and how to treat the session.

Frontend — reading account_type from the JWT:

JWT tokens are base64-encoded. Decode the payload (middle part) without a library:

function getAccountType(token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  return payload.account_type; // "user" or "organization"
}
How it affects your API calls:

account_type	Login endpoint	Me endpoint	Verify email endpoints	Other auth endpoints
"user"	POST /auth/login	GET /auth/me	/auth/send-verification, /auth/verify-email	All /auth/* routes (refresh, logout, sessions, aadhaar, etc.)
"organization"	POST /auth/org/login	GET /auth/org/me	/auth/org/send-verification, /auth/org/verify-email	Only shared /auth/* routes (refresh, logout, sessions)
Key rules: - Refresh (POST /auth/refresh) and logout (POST /auth/logout) are shared — they work for both account types; the correct refresh cookie is sent automatically. - Me endpoints are separate — call /auth/me for users, /auth/org/me for organizations. Using the wrong account type returns 403 FORBIDDEN. - Protected user routes (/auth/me, Aadhaar, verification, etc.) require account_type: "user". Protected org routes under /auth/org/* require account_type: "organization". - Verification is separate — call /auth/send-verification / /auth/verify-email for users, /auth/org/send-verification / /auth/org/verify-email for organizations. - Aadhaar endpoints are user-only — organizations do not have Aadhaar verification. - The account_type is automatically preserved during token refresh. You don't need to send it — the server reads it from the old JWT claims.

account_type in the refresh token flow:

When you call POST /auth/refresh, the server reads the account_type from the old JWT (before it expires) and writes it into the new JWT. The frontend always gets back a token with the same account_type.

Backend / middleware (for context):

The account_type is also set on the Gin context by the auth middleware. Any protected handler can read it via:

accountType := c.GetString("account_type")
This is used internally to ensure correct routing and can be used by backend services that consume auth-service tokens for custom authorization logic.

3. Token Lifecycle (Refresh & Logout)
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
Recommended Frontend Strategy
After login, store only the access_token in memory (a JS variable or React state). Do not store it in localStorage. The refresh JWT is an HttpOnly cookie (refresh_token_user for users, refresh_token_org for organizations) — you never see or touch it.
Use access tokens only in the Authorization header. Refresh tokens (token_use: "refresh") are rejected on protected routes.
On every API call, check if the access token is about to expire (e.g., < 60 seconds remaining) and silently call POST /auth/refresh first — no body needed, the browser sends the cookie automatically.
If a 401 is returned from any protected route, attempt one silent refresh; if that also fails, redirect to login.
On logout, always call POST /auth/logout to invalidate the refresh token server-side and clear the matching cookie, then discard the in-memory access token.
4. Environment Variables
Add these to your .env (or .env.local) file:

VITE_AUTH_API_URL=https://auth-service-production-25af.up.railway.app
VITE_VOTE_API_URL=https://vote-service-production.up.railway.app
If you use Create React App, replace the VITE_ prefix with REACT_APP_.

5. Global Headers
Every request to any endpoint should include:

Header	Value	Notes
Content-Type	application/json	Required for all requests with a body
Authorization	Bearer <token>	Required for all protected routes
Timestamps
All timestamps returned in any response are UTC (ISO 8601, Z suffix — e.g. "2024-07-10T09:00:00Z").
Request body timestamps may include any UTC offset (e.g. +05:30); the server normalises them to UTC before storage and always responds with Z.

6. Error Response Format
Auth Service Errors
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "email or password incorrect"
  }
}
Error Code	HTTP Status	Description
INVALID_CREDENTIALS	401	Wrong email or password
USER_NOT_FOUND	404	User does not exist
EMAIL_ALREADY_EXISTS	409	Email is already registered
INVALID_REQ_BODY	400	Malformed or missing request body
INVALID_PASSWORD	400	Wrong password (legacy; login uses INVALID_CREDENTIALS only)
FORBIDDEN	403	Wrong account type for route (e.g. org token on user endpoints)
INVALID_OTP	401	Invalid or expired OTP
EMAIL_NOT_VERIFIED	403	Email not verified
ACCOUNT_SUSPENDED	403	Account has been suspended
ACCOUNT_DELETED	403	Account has been deleted
ACCOUNT_LOCKED	429	Account temporarily locked due to too many failed attempts
RATE_LIMITED	429	Too many requests, please try again later
GENERATE_TOKEN	500	Server failed to generate JWT
INTERNAL_SERVER_ERROR	500	Unexpected server error
DISPOSABLE_EMAIL	400	Disposable email addresses are not allowed (reputation check)
EMAIL_NOT_DELIVERABLE	400	Email address is not deliverable (SMTP/MX validation failed)
HIGH_RISK_EMAIL	400	Email address is flagged as high risk
LOW_REPUTATION_SCORE	400	Email reputation score is too low
AADHAAR_FEATURE_DISABLED	403	Aadhaar verification feature is disabled
AADHAAR_INVALID_OTP	401	Invalid Aadhaar OTP
AADHAAR_OTP_EXPIRED	400	OTP expired, please generate a new one
AADHAAR_ALREADY_VERIFIED	409	Aadhaar already verified
AADHAAR_VERIFICATION_FAILED	503	Aadhaar verification service unavailable
USER_NOT_VERIFIED	403	Verification incomplete — call /auth/me/recheck-verification for details
USER_NOT_TRUSTED	403	Complete email verification to become a trusted user
AADHAAR_VERIFICATION_REQUIRED	403	Complete Aadhaar verification to become a verified user
AADHAAR_NOT_FOUND	404	No Aadhaar verification on file — complete Aadhaar verification to become a verified user
NAME_MISMATCH	409	Aadhaar name does not match registered name
ORG_EMAIL_ALREADY_EXISTS	409	Organization email already registered
ORGANIZATION_NOT_FOUND	404	Organization does not exist
ORG_NAME_REQUIRED	400	Organization name is required
ORG_NOT_TRUSTED	403	Organization email not verified, complete email verification first
ORG_ALREADY_VERIFIED	409	Organization is already verified
VERIFICATION_IN_PROGRESS	409	A verification request is already in progress
NO_VERIFICATION_IN_PROGRESS	400	No verification request in progress
ORG_NOT_VERIFIED	400	Organization must be verified before recheck
MCA_VERIFICATION_NOT_FOUND	404	No MCA verification record on file for recheck
INVALID_MCA_RESPONSE	503	MCA API returned an unparseable response (recheck)
UNKNOWN_ENTITY_TYPE	400	Stored registration number is not valid LLPIN or CIN (recheck)
INVALID_VERIFICATION_STEP	400	Current step does not match the requested operation
REGISTRATION_NUMBER_STEP_COMPLETE	409	Registration number already verified — proceed to domain verification
DOMAIN_STEP_COMPLETE	409	Domain already verified — proceed to DNS verification
MCA_SERVICE_UNAVAILABLE	503	MCA verification service unavailable, please try again later
INVALID_REGISTRATION_NUMBER	400	Invalid business registration number (must be LLPIN or CIN)
REGISTRATION_NUMBER_NOT_FOUND	404	Registration number not found in MCA records
BUSINESS_NAME_MISMATCH	409	Business name does not match MCA records
ORG_STATUS_NOT_ACTIVE	400	Business status is not Active in MCA records
INCORPORATION_DATE_INVALID	400	Invalid incorporation date format from MCA data
INVALID_DOMAIN	400	Invalid domain format
EMAIL_DOMAIN_MISMATCH	409	Organization email domain does not match the submitted domain
DNS_VERIFICATION_FAILED	400	DNS TXT verification failed
DNS_TOKEN_NOT_FOUND	404	DNS TXT record not found — add the verification record to your domain
DNS_ALREADY_VERIFIED	409	DNS already verified
ORG_VERIFICATION_EXPIRED	403	Organization verification has expired or feature is disabled
Vote Service Errors
{
  "error": "Poll is not active"
}
HTTP Status	Description
400	Bad request (e.g., poll cannot be started, wrong poll ID, invalid time window)
401	Missing or invalid Bearer token
403	Insufficient permissions — not the poll owner (ABAC), or voting window closed (PBAC)
404	Poll not found
409	Conflict — user has already voted
500	Internal server error
7. Auth Service Endpoints
7.1 Health Check
Property	Value
Method	GET
Path	/health
Auth	Not required
Success Response — 200 OK

{ "status": "ok" }
User Endpoints
7.2 Register
Property	Value
Method	POST
Path	/auth/register
Auth	Not required
Purpose	Create a new user account
Email normalization: email is trimmed and lowercased server-side (same as login).

Required Headers

Content-Type: application/json
Request Body

Field	Type	Required	Description
first_name	string	Yes	User's first name
last_name	string	Yes	User's last name
email	string	Yes	Valid email address
password	string	Yes	Plain-text password (hashed server-side)
device_fingerprint	string	No	Pre-computed device fingerprint hash
device_info	object	No	Device attributes for fingerprinting
Use the actual name when you Register for your account. Because when you verify your account , we'll match the name you provided with the Aadhaar data we have on file.
Example : first_name = "Raaz", last_name = "Ghosh" and In Aadhar Card Name = "Raaz Ghosh"

device_info object fields:

Field	Type	Description
timezone	string	User's IANA timezone
platform	string	Operating system
screen_size	string	Screen resolution
language	string	Browser language code
canvas_hash	string	Canvas fingerprint hash
Example Request Body

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
Success Response — 201 Created

{
  "message": "User registered successfully. Verification email sent."
}
7.2.1 Email Reputation Verification (This only for backend)
Property	Value
Trigger	POST /auth/register
Scope	Registration only
Service	Abstract Email Reputation API
Data stored	email_reputation_score, email_risk_status, email_checked_at on the users table
Overview
Email reputation verification checks the quality and risk level of an email address during registration. It is not performed during login.

The feature is controlled by the EMAIL_REPUTATION_MODE environment variable with three modes:

Mode	env value	Behavior
Disabled	disabled	Skip all reputation checks. No external API calls. Used for local development and testing.
Monitor	monitor	Call Abstract API, log results, reject only technically invalid emails (SMTP/MX failures). Never reject based on risk scoring. Used for demos and beta.
Enforce	enforce	Strictly validate. Reject disposable, undeliverable, high-risk, and low-score emails. Used for production.
Monitor Mode Behavior
In monitor mode, the following events are logged but do not block registration:

Disposable email detected
High risk address or domain
Low reputation score (< 0.5)
Only technically invalid emails are rejected: - is_smtp_valid == false — the mail server rejected the address - is_mx_valid == false — the domain has no mail exchange records

Enforce Mode Behavior
In enforce mode, registration is rejected if any of the following are true:

Condition	HTTP Status	Error Code
Email is disposable	400	DISPOSABLE_EMAIL
SMTP validation failed	400	EMAIL_NOT_DELIVERABLE
MX validation failed	400	EMAIL_NOT_DELIVERABLE
Address risk is "high"	400	HIGH_RISK_EMAIL
Domain risk is "high"	400	HIGH_RISK_EMAIL
Reputation score < 0.5	400	LOW_REPUTATION_SCORE
Graceful Fallback
If the Abstract API is unreachable, times out, or returns an error, the system never blocks registration. The reputation status is recorded as "unchecked" and registration proceeds normally. This ensures that an external API outage does not prevent legitimate users from signing up.

Example Responses
Registration blocked (enforce — disposable email)

{
  "success": false,
  "error": {
    "code": "DISPOSABLE_EMAIL",
    "message": "disposable email addresses are not allowed"
  }
}
Registration blocked (enforce — low reputation score)

{
  "success": false,
  "error": {
    "code": "LOW_REPUTATION_SCORE",
    "message": "email reputation score is too low"
  }
}
API failure (any mode — graceful fallback)

{
  "message": "User registered successfully.Login your account"
}
Environment Configuration
# .env file — choose one mode:
# EMAIL_REPUTATION_MODE=disabled    # Local development — skip all checks
# EMAIL_REPUTATION_MODE=monitor     # Demo/beta — log-only, reject only undeliverable
# EMAIL_REPUTATION_MODE=enforce     # Production — strict validation
ABSTRACT_EMAIL_REPUTATION_KEY=your_abstract_api_key
EMAIL_REPUTATION_MODE=disabled
Security Notes
Email reputation is one layer of a defense-in-depth strategy
OTP verification is still mandatory regardless of reputation mode
Single-device login (already implemented) operates independently
Reputation checks run during registration only — login is unaffected
In monitor mode, suspicious activity is logged for auditing without blocking onboarding
Error Responses

Status	Code	Reason
400	INVALID_REQ_BODY	Missing or malformed fields
400	DISPOSABLE_EMAIL	Disposable email addresses are not allowed
400	EMAIL_NOT_DELIVERABLE	Email is not deliverable (SMTP/MX failed)
400	HIGH_RISK_EMAIL	Email flagged as high risk
400	LOW_REPUTATION_SCORE	Email reputation score below threshold
409	EMAIL_ALREADY_EXISTS	Email already in use
429	RATE_LIMITED	Too many registration attempts from this IP (10 per minute)
500	INTERNAL_SERVER_ERROR	Failed to create user or send email
Email Reputation: Registration includes an optional email reputation check via Abstract API. The behavior depends on the EMAIL_REPUTATION_MODE environment variable. See section 7.10 for details. Login does NOT perform reputation checks.

7.3 Login
Property	Value
Method	POST
Path	/auth/login
Auth	Not required
Purpose	Authenticate a user and receive JWT tokens. Email verification is not required — users may log in before verifying their email.
Email normalization: email is trimmed and lowercased server-side before lookup (must match the address used at registration).

Required Headers

Content-Type: application/json
Request Body

Field	Type	Required	Description
email	string	Yes	Registered email
password	string	Yes	Account password
device_fingerprint	string	No	Pre-computed device fingerprint hash
device_info	object	No	Device attributes for fingerprinting
device_info object fields:

Field	Type	Description
timezone	string	User's IANA timezone
platform	string	Operating system
screen_size	string	Screen resolution
language	string	Browser language code
canvas_hash	string	Canvas fingerprint hash
Example Request Body

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
Success Response — 200 OK

{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
The refresh JWT is not returned in the body. It is set as Set-Cookie: refresh_token_user=...; HttpOnly; Secure; SameSite=Strict. Your JS code never sees it.

You must include credentials: 'include' (Fetch) or withCredentials: true (Axios) so the browser accepts and stores the cookie.

Error Responses

Status	Code	Reason
400	INVALID_REQ_BODY	Malformed body
401	INVALID_CREDENTIALS	Wrong email or password (same message for unknown email and wrong password)
403	ACCOUNT_SUSPENDED	Account has been suspended
403	ACCOUNT_DELETED	Account has been deleted
429	ACCOUNT_LOCKED	Too many failed attempts — account temporarily locked
429	RATE_LIMITED	Too many login attempts per email or IP (5 per minute)
500	INTERNAL_SERVER_ERROR	Unexpected server error
7.4 Refresh Token
Property	Value
Method	POST
Path	/auth/refresh
Auth	Not required
Purpose	Get a new access token using the refresh token stored in the HttpOnly cookie
Required Headers

(none beyond credentials)
No request body needed. The browser automatically attaches refresh_token_user or refresh_token_org (or legacy refresh_token). You must send the request with credentials: 'include' (Fetch) or withCredentials: true (Axios).

Rate limit: 30 refresh attempts per minute per IP.

Success Response — 200 OK

{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
Error Responses

Status	Code	Reason
401	—	Cookie missing (user never logged in)
401	INVALID_CREDENTIALS	Token expired or revoked — redirect to login
429	RATE_LIMITED	Too many refresh attempts from this IP
7.5 Logout
Property	Value
Method	POST
Path	/auth/logout
Auth	Not required (HttpOnly refresh cookie)
Purpose	Invalidate the refresh token server-side and clear the cookie
Required Headers

No request body needed. The browser automatically attaches the refresh cookie (refresh_token_user or refresh_token_org). Works for both user and organization sessions. Send with credentials: 'include' (Fetch) or withCredentials: true (Axios). Bearer token is optional and not validated on this route. You must send the request with credentials: 'include' (Fetch) or withCredentials: true (Axios). The server clears the matching cookie (refresh_token_user or refresh_token_org) via Set-Cookie with max-age=-1.

Success Response — 200 OK

{
  "message": "Logout successful"
}
Error Responses

Status	Reason
401	Cookie missing or refresh token not found
401	Missing or invalid access token
7.6 Get Current User (Me)
Property	Value
Method	GET
Path	/auth/me
Auth	Required (Bearer token with account_type: "user")
Purpose	Return the profile of the authenticated user
Required Headers

Authorization: Bearer <access_token>
Organization tokens receive 403 FORBIDDEN on this route — use /auth/org/me instead.

Success Response — 200 OK

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
  "LastLoginAt": "2024-07-10T09:15:00Z"
}
Error Responses

Status	Code / Reason
401	Missing or invalid access token
403	FORBIDDEN — organization token used on user route
404	USER_NOT_FOUND — user deleted
7.7 Send Verification
Notes : For now , Only 'priyadarsanf2@gmail.com' this Email is accepted for verification Testing. Same for send OTP and verify OTP.
Email : priyadarsanf2@gmail.com
Password : 123456

Property	Value
Method	POST
Path	/auth/send-verification
Auth	Required (Bearer token)
Purpose	Send a 6-digit OTP verification code to the authenticated user's email
Required Headers

Authorization: Bearer <access_token>
Content-Type: application/json
No request body needed. The server uses the authenticated user's email from the JWT token.

Success Response — 200 OK

{
  "message": "Verification email sent"
}
Error Responses

Status	Code	Reason
400	INVALID_REQ_BODY	Malformed body
401	—	Missing or invalid access token
429	RATE_LIMITED	Maximum 3 OTP requests per 2-minute window exceeded
500	—	Failed to send email (Resend API error)
Example Request

curl -X POST https://auth-service/auth/send-verification \
  -H "Authorization: Bearer <access_token>"
7.8 Verify Email
Property	Value
Method	POST
Path	/auth/verify-email
Auth	Required (Bearer token)
Purpose	Verify the authenticated user's email using the OTP sent to their inbox
Required Headers

Authorization: Bearer <access_token>
Content-Type: application/json
Request Body

Field	Type	Required	Description
otp	string	Yes	6-digit code received via email
Example Request Body

{
  "otp": "483291"
}
Success Response — 200 OK

{
  "message": "Email verified successfully"
}
Error Responses

Status	Code	Reason
400	INVALID_REQ_BODY	Missing or malformed otp field
401	—	Missing or invalid access token
401	INVALID_OTP	Invalid or expired OTP
429	RATE_LIMITED	Maximum 5 verification attempts per 2-minute window exceeded
Example Request

curl -X POST https://auth-service/auth/verify-email \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"otp": "483291"}'
7.9 List Sessions
Property	Value
Method	GET
Path	/auth/sessions
Auth	Required (Bearer token)
Purpose	List all active sessions (refresh tokens) for the authenticated account (user or organization), ordered by last activity
Required Headers

Authorization: Bearer <access_token>
Success Response — 200 OK

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
Error Responses

Status	Code	Reason
401	—	Missing or invalid access token
500	INTERNAL_SERVER_ERROR	Unexpected server error
Works for both account_type: "user" and "organization" access tokens. Organization sessions use the same path; each item includes account_type and user_id (JWT subject id for that account).

7.10 Aadhaar Verification
Aadhaar verification uses the Sandbox.co.in OKYC API to verify a user's identity via OTP sent to their Aadhaar-linked mobile number.

Property	Value
Trigger	Optional — controlled by AADHAAR_VERIFICATION_MODE environment variable
Dependency	User must have email_verified = true before proceeding
Service	Sandbox.co.in Aadhaar OKYC API
Data stored	user_aadhaar_verifications table + is_aadhaar_verified / aadhaar_verified_at on users table
Prerequisite: Email Verification
Aadhaar verification requires the user to have verified their email first. If email_verified is false, the API returns:

{
  "success": false,
  "error": {
    "code": "EMAIL_NOT_VERIFIED",
    "message": "email not verified"
  }
}
Feature Modes
Controlled by the AADHAAR_VERIFICATION_MODE environment variable:

Mode	Value	Behavior
Disabled	disabled	All Aadhaar endpoints return AADHAAR_FEATURE_DISABLED. No external API calls.
Monitor	monitor	Feature active. On API failure, logs the error and falls back gracefully (operation may succeed with limited data).
Enforce	enforce	Feature active. Strict mode — API failure blocks the operation entirely.
Session Resumption
The reference_id from OTP generation is stored in the database. Users can navigate away and return — the GET /auth/aadhaar/status endpoint returns any pending verification, allowing the frontend to resume the flow.

7.10.1 Generate Aadhaar OTP
Property	Value
Method	POST
Path	/auth/aadhaar/generate-otp
Auth	Required (Bearer token)
Purpose	Send an OTP to the mobile number registered with the provided Aadhaar number
Required Headers

Authorization: Bearer <access_token>
Content-Type: application/json
Request Body

Field	Type	Required	Description
aadhaar_number	string	Yes	12-digit Aadhaar number
Example Request Body

{
  "aadhaar_number": "123412341234"
}
Success Response — 200 OK

{
  "reference_id": "1234567",
  "message": "OTP sent to Aadhaar-linked mobile number"
}
Error Responses

Status	Code	Reason
400	INVALID_REQ_BODY	Missing or malformed aadhaar_number
401	—	Missing or invalid access token
403	EMAIL_NOT_VERIFIED	User must verify their email first
403	AADHAAR_FEATURE_DISABLED	Feature is disabled in current mode
409	AADHAAR_ALREADY_VERIFIED	User already verified
503	AADHAAR_VERIFICATION_FAILED	Sandbox API unavailable (enforce mode)
7.10.2 Verify Aadhaar OTP
Property	Value
Method	POST
Path	/auth/aadhaar/verify-otp
Auth	Required (Bearer token)
Purpose	Verify the OTP and retrieve e-KYC data from Aadhaar
Required Headers

Authorization: Bearer <access_token>
Content-Type: application/json
Request Body

Field	Type	Required	Description
reference_id	string	Yes	Reference ID received from the Generate OTP response
otp	string	Yes	6-digit OTP received on Aadhaar-linked mobile
Example Request Body

{
  "reference_id": "1234567",
  "otp": "123456"
}
Success Response — 200 OK

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
Photo: The Photo is a base64-encoded string representing the user's photo.
How to use it : Decode the base64 string and use it as an image source in your application.

Error Responses

Status	Code	Reason
400	INVALID_REQ_BODY	Missing or malformed fields
400	AADHAAR_OTP_EXPIRED	OTP expired — generate a new one via /generate-otp
401	—	Missing or invalid access token
401	AADHAAR_INVALID_OTP	Invalid OTP — user can retry
403	EMAIL_NOT_VERIFIED	User must verify their email first
403	AADHAAR_FEATURE_DISABLED	Feature is disabled in current mode
503	AADHAAR_VERIFICATION_FAILED	Sandbox API unavailable (enforce mode)
OTP Retry: If the OTP is invalid, the user may re-enter it. There is no strict retry limit enforced by this service (UIDAI governs retry limits on their side).

OTP Expired: Return AADHAAR_OTP_EXPIRED — user must call /generate-otp again to start a fresh session.

Invalid Reference ID: The reference_id returned from POST /auth/aadhaar/generate-otp is stored server-side. If the user provides an unknown reference_id, the request will fail with AADHAAR_VERIFICATION_FAILED. Use GET /auth/aadhaar/status to retrieve the correct reference_id.

7.10.3 Get Aadhaar Status
Property	Value
Method	GET
Path	/auth/aadhaar/status
Auth	Required (Bearer token)
Purpose	Retrieve the latest Aadhaar verification record for the authenticated user
Required Headers

Authorization: Bearer <access_token>
Success Response — 200 OK (verified)

{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "reference_id": "1234567",
  "status": "VALID",
  "name": "John Doe",
  "is_verified": true,
  "created_at": "2024-07-10T10:00:00Z",
  "updated_at": "2024-07-10T10:05:00Z"
}
Success Response — 200 OK (pending)

{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "reference_id": "1234567",
  "status": "PENDING",
  "name": "",
  "is_verified": false,
  "created_at": "2024-07-10T10:00:00Z",
  "updated_at": "2024-07-10T10:00:00Z"
}
Error Responses

Status	Code	Reason
401	—	Missing or invalid access token
403	USER_NOT_TRUSTED	Email not verified — complete email verification to become a trusted user
403	AADHAAR_FEATURE_DISABLED	Feature is disabled in current mode
404	AADHAAR_NOT_FOUND	No Aadhaar verification record found — complete Aadhaar verification to become a verified user
7.11 Verification Check
The verification check evaluates whether a user meets all conditions required for full platform access. A user is considered "fully verified" only when all 5 conditions are satisfied.

Property	Value
Trigger	Manual — the frontend can call the recheck endpoint at any time
Dependency	Both /auth/me/verified and /auth/me/recheck-verification require authentication
Data read	is_verified on the users table (simple check) or all verification fields (recheck)
Verification Conditions
#	Condition	Source	Detail
1	Email verified	users.email_verified	User must have verified their email via OTP
2	Reputation score ≥ 0.5	users.email_reputation_score	Email must have a good reputation score
3	Risk status = "low"	users.email_risk_status	Email must not be flagged as high risk
4	Aadhaar verified	users.is_aadhaar_verified	User must have completed Aadhaar e-KYC
5	Name match	user_aadhaar_verifications.name vs users.first_name + last_name	Aadhaar name must match the registered name (case-insensitive, whitespace-normalized)
If a user passes all 5 checks, is_verified is set to true in the database and the user is granted full platform access.

7.11.1 Get Verified Status
Property	Value
Method	GET
Path	/auth/me/verified
Auth	Required (Bearer token)
Purpose	Simple check of the is_verified field. Returns immediately without re-evaluating conditions.
Required Headers

Authorization: Bearer <access_token>
Success Response — 200 OK

{
  "is_verified": true,
  "is_trusted": true
}
Error Responses

Status	Code	Reason
401	—	Missing or invalid access token
403	USER_NOT_TRUSTED	Email not verified — complete email verification to become a trusted user
403	AADHAAR_VERIFICATION_REQUIRED	Aadhaar not verified — complete Aadhaar verification to become a verified user
403	USER_NOT_VERIFIED	Trusted and Aadhaar verified but other checks failed — call /auth/me/recheck-verification for details
7.11.2 Recheck Verification
Property	Value
Method	POST
Path	/auth/me/recheck-verification
Auth	Required (Bearer token)
Purpose	Re-evaluate all 5 verification conditions, update is_verified in the DB if all pass, and return a detailed breakdown. Always returns 200.
Required Headers

Authorization: Bearer <access_token>
No request body needed. The server evaluates conditions from the authenticated user's existing data.

Success Response — 200 OK (all checks pass)

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
Success Response — 200 OK (some checks fail)

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
Error Responses

Status	Code	Reason
401	—	Missing or invalid access token
Organization Endpoints
7.12 Organization Endpoints
Organizational accounts are fully separated from user accounts with their own table, registration, login, and email verification flow. The email verification and email reputation mechanisms are the same as user accounts — only the naming and endpoints differ.

Property	Value
Auth	Separate endpoints under /auth/org/*
Email verification	Same OTP-based flow as user accounts
Email reputation	Same Abstract API check as user accounts
JWT account_type	"organization"
7.12.1 Register Organization
Property	Value
Method	POST
Path	/auth/org/register
Auth	Not required
Purpose	Create a new organizational account
Required Headers

Content-Type: application/json
Request Body

Field	Type	Required	Description
org_name	string	Yes	Organization name
email	string	Yes	Valid email address
password	string	Yes	Plain-text password (hashed server-side)
device_fingerprint	string	No	Pre-computed device fingerprint hash
device_info	object	No	Device attributes for fingerprinting
device_info object fields:

Field	Type	Description
timezone	string	User's IANA timezone
platform	string	Operating system
screen_size	string	Screen resolution
language	string	Browser language code
canvas_hash	string	Canvas fingerprint hash
Example Request Body

{
  "org_name": "Acme Corp",
  "email": "admin@acme.com",
  "password": "SecurePass123"
}
Success Response — 201 Created

{
  "message": "Organization registered successfully. Login your account"
}
Error Responses

Status	Code	Reason
400	INVALID_REQ_BODY	Missing or malformed fields
400	ORG_NAME_REQUIRED	Organization name is required
400	DISPOSABLE_EMAIL	Disposable email addresses are not allowed
400	EMAIL_NOT_DELIVERABLE	Email is not deliverable (SMTP/MX failed)
400	HIGH_RISK_EMAIL	Email flagged as high risk
400	LOW_REPUTATION_SCORE	Email reputation score below threshold
409	ORG_EMAIL_ALREADY_EXISTS	Organization email already in use
429	RATE_LIMITED	Too many registration attempts from this IP (10 per minute)
500	INTERNAL_SERVER_ERROR	Failed to create organization or send email
Email normalization: email is trimmed and lowercased server-side.

Email reputation verification works identically to user registration — see Section 7.2.1 for details.

7.12.2 Login Organization
Property	Value
Method	POST
Path	/auth/org/login
Auth	Not required
Purpose	Authenticate as an organization and receive JWT tokens
Required Headers

Content-Type: application/json
Request Body

Field	Type	Required	Description
email	string	Yes	Registered organization email
password	string	Yes	Organization account password
device_fingerprint	string	No	Pre-computed device fingerprint hash
device_info	object	No	Device attributes for fingerprinting
Example Request Body

{
  "email": "admin@acme.com",
  "password": "SecurePass123"
}
Success Response — 200 OK

{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
The refresh JWT is set as Set-Cookie: refresh_token_org=... (HttpOnly). See Section 7.3 for the same flow as user login.

Email normalization: email is trimmed and lowercased server-side.

Error Responses

Status	Code	Reason
400	INVALID_REQ_BODY	Malformed body
401	INVALID_CREDENTIALS	Wrong email or password (same message for unknown email and wrong password)
403	ACCOUNT_SUSPENDED	Organization account has been suspended
403	ACCOUNT_DELETED	Organization account has been deleted
429	ACCOUNT_LOCKED	Too many failed attempts — account temporarily locked
429	RATE_LIMITED	Too many login attempts per email or IP (5 per minute)
500	INTERNAL_SERVER_ERROR	Unexpected server error
7.12.3 Get Current Organization (Org Me)
Property	Value
Method	GET
Path	/auth/org/me
Auth	Required (Bearer token with account_type: "organization")
Purpose	Return the profile of the authenticated organization
Required Headers

Authorization: Bearer <access_token>
User tokens receive 403 FORBIDDEN on this route — use /auth/me instead.

Success Response — 200 OK

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
Error Responses

Status	Code / Reason
401	Missing or invalid access token
403	FORBIDDEN — user token used on organization route
404	ORGANIZATION_NOT_FOUND — organization deleted
7.12.4 Send Organization Verification
Property	Value
Method	POST
Path	/auth/org/send-verification
Auth	Required (Bearer token)
Purpose	Send a 6-digit OTP verification code to the authenticated organization's email
Required Headers

Authorization: Bearer <access_token>
Content-Type: application/json
No request body needed. The server uses the authenticated organization's email from the JWT token.

Success Response — 200 OK

{
  "message": "Organization verification email sent"
}
Error Responses

Status	Code	Reason
401	—	Missing or invalid access token
429	RATE_LIMITED	Maximum 3 OTP requests per 2-minute window exceeded
500	—	Failed to send email (Resend API error)
7.12.5 Verify Organization Email
Property	Value
Method	POST
Path	/auth/org/verify-email
Auth	Required (Bearer token)
Purpose	Verify the authenticated organization's email using the OTP sent to their inbox
Required Headers

Authorization: Bearer <access_token>
Content-Type: application/json
Request Body

Field	Type	Required	Description
otp	string	Yes	6-digit code received via email
Example Request Body

{
  "otp": "483291"
}
Success Response — 200 OK

{
  "message": "Organization email verified successfully"
}
Error Responses

Status	Code	Reason
400	INVALID_REQ_BODY	Missing or malformed otp field
401	—	Missing or invalid access token
401	INVALID_OTP	Invalid or expired OTP
429	RATE_LIMITED	Maximum 5 verification attempts per 2-minute window exceeded
7.13 Verified Organization Pipeline
The Verified Organization Pipeline transforms a Trusted Organization (email-verified) into a Verified Organization through a multi-step process that validates business registration, legal status, and domain ownership.

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
Feature Modes
Mode	ORG_VERIFICATION_MODE	Behavior
Disabled	disabled	All endpoints return ORG_VERIFICATION_EXPIRED. No MCA API calls. Default.
Monitor	monitor	Steps proceed on API failure with failed step results logged. Pipeline continues.
Enforce	enforce	Strict validation: API failure blocks the step and may expire the verification.
Prerequisites
Organization must be Trusted (email verified via POST /auth/org/verify-email) — returns ORG_NOT_TRUSTED otherwise
Organization must not already be verified — returns ORG_ALREADY_VERIFIED otherwise
Only one active verification request allowed at a time — returns VERIFICATION_IN_PROGRESS otherwise
Environment Configuration
ORG_VERIFICATION_MODE=disabled   # Local development
ORG_VERIFICATION_MODE=monitor    # Demo/beta — graceful fallback
ORG_VERIFICATION_MODE=enforce    # Production — strict validation
SANDBOX_BASE_URL=https://test-api.sandbox.co.in
7.13.1 Start Organization Verification
Property	Value
Method	POST
Path	/auth/org/verify/start
Auth	Required (Bearer token, organization account)
Purpose	Initialize the verification pipeline. Returns the current step and instructions.
Required Headers

Authorization: Bearer <access_token>
No request body needed.

Success Response — 200 OK

{
  "message": "Organization verification started",
  "request": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "current_step": "registration_number",
    "status": "in_progress"
  },
  "instructions": "Submit your business registration number (LLPIN for LLP or CIN for company)."
}
Error Responses

Status	Code	Reason
401	—	Missing or invalid access token
403	ORG_NOT_TRUSTED	Organization email not verified — complete email verification first
403	ORG_VERIFICATION_EXPIRED	Feature is disabled in current mode
409	ORG_ALREADY_VERIFIED	Organization is already verified
409	VERIFICATION_IN_PROGRESS	A verification request is already active
7.13.2 Submit Registration Number
Property	Value
Method	POST
Path	/auth/org/verify/submit-registration-number
Auth	Required (Bearer token, organization account)
Purpose	Submit an LLPIN (for LLPs) or CIN (for companies) for MCA lookup. Returns MCA data and step-by-step verification results.
Required Headers

Authorization: Bearer <access_token>
Content-Type: application/json
Request Body

Field	Type	Required	Description
registration_number	string	Yes	LLPIN (ABC-1234) or CIN (U12345MH2024PLC123456) format
LLPIN Format: ABC-1234 (3 letters, hyphen, 4 digits)

CIN Format: U12345MH2024PLC123456 (1 letter, 5 digits, 1 letter, 4 digits, 3 letters, 6 digits, 1 letter, 4 digits)

Example Request Body

{
  "registration_number": "ABC-1234"
}
Success Response — 200 OK (LLP Entity)

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
Success Response — 200 OK (Company Entity)

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
Success Response — 200 OK (Some checks fail, monitor mode)

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
MCA Data Reference (stored server-side):

Field	Source	Description
legal_name	MCA	Registered LLP or Company name
status	MCA	Derived status — active or inactive
status_type	MCA	Entity type — CIN (company) or LLPIN (LLP)
roc_code	MCA	Registrar of Companies code
registered_address	MCA	Registered office address
email_id	MCA	Registered email address
date_of_incorporation	MCA	Incorporation date
The organizations table is also auto-populated with official_domain (extracted from MCA email_id), registration_id (CIN or LLPIN), and org_type (llp or company).

Error Responses

Status	Code	Reason
400	INVALID_REQ_BODY	Missing or malformed registration_number field
400	NO_VERIFICATION_IN_PROGRESS	No active verification request — call /start first
400	INVALID_VERIFICATION_STEP	Current step is not registration_number (e.g. domain not submitted yet)
409	REGISTRATION_NUMBER_STEP_COMPLETE	Registration number already verified — proceed to domain verification (submit-domain)
400	INVALID_REGISTRATION_NUMBER	Format does not match LLPIN or CIN pattern
400	ORG_STATUS_NOT_ACTIVE	LLP/Company status is not "Active" (enforce mode)
400	INCORPORATION_DATE_INVALID	Incorporation date format is invalid (enforce mode)
401	—	Missing or invalid access token
404	REGISTRATION_NUMBER_NOT_FOUND	Registration number not found in MCA records (enforce mode)
409	BUSINESS_NAME_MISMATCH	Business name does not match MCA records (enforce mode)
503	MCA_SERVICE_UNAVAILABLE	MCA API unavailable, please try again later (enforce mode)
7.13.3 Submit Domain
Property	Value
Method	POST
Path	/auth/org/verify/submit-domain
Auth	Required (Bearer token, organization account)
Purpose	Submit the official business domain. The domain must match the organization email's domain. Returns a DNS verification token.
Required Headers

Authorization: Bearer <access_token>
Content-Type: application/json
Request Body

Field	Type	Required	Description
domain	string	Yes	Official business domain (e.g., acme.com)
The domain is automatically sanitized: www. prefix, http:///https:// protocol, and path suffixes are stripped. Only the root domain is stored.

Example Request Body

{
  "domain": "acme.com"
}
Success Response — 200 OK

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
DNS Setup Instructions

To complete domain verification, add a TXT record to your domain's DNS configuration:

Field	Value
Record type	TXT
Record name	_e-voting-verify (or _e-voting-verify.yourdomain.com depending on your DNS provider)
Record value	The token from the domain_verification response (e.g., e-voting-verify=a1b2c3d4e5f6a7b8-1717200000)
TTL	300 (5 minutes) or your provider's default
DNS Propagation: Changes may take a few minutes to propagate. Most providers update within 1-5 minutes. No need to wait longer — the verify-dns endpoint performs a live lookup.

Error Responses

Status	Code	Reason
400	INVALID_REQ_BODY	Missing or malformed domain field
400	NO_VERIFICATION_IN_PROGRESS	No active verification request — call /start first
400	INVALID_VERIFICATION_STEP	Current step is not domain (e.g. registration number not submitted yet)
409	DOMAIN_STEP_COMPLETE	Domain already verified — proceed to DNS verification (verify-dns)
400	INVALID_DOMAIN	Domain format is invalid (enforce mode)
401	—	Missing or invalid access token
409	EMAIL_DOMAIN_MISMATCH	Email domain does not match submitted domain (enforce mode)
7.13.4 Verify DNS
Property	Value
Method	POST
Path	/auth/org/verify/verify-dns
Auth	Required (Bearer token, organization account)
Purpose	Perform a live DNS TXT record lookup to confirm domain ownership. Must be called after adding the TXT record from the domain submission step.
Required Headers

Authorization: Bearer <access_token>
No request body needed. The server looks up _e-voting-verify.<submitted-domain> TXT record and matches it against the stored token.

Success Response — 200 OK (verified)

{
  "message": "DNS verification successful. Organization is now verified.",
  "verified": true
}
Success Response — 200 OK (TXT record not found or token mismatch)

{
  "message": "DNS TXT record not found at _e-voting-verify.acme.com. Please add the record and try again.",
  "verified": false,
  "retry": true
}
Note: If the TXT record exists but the token doesn't match, the response will indicate the mismatch. Double-check that you copied the token exactly. DNS verification is case-sensitive.

Error Responses

Status	Code	Reason
400	NO_VERIFICATION_IN_PROGRESS	No active verification request — call /start first
400	INVALID_VERIFICATION_STEP	Current step is not dns — submit domain first
401	—	Missing or invalid access token
409	DNS_ALREADY_VERIFIED	DNS already verified for this domain
7.13.5 Get Verification Status
Property	Value
Method	GET
Path	/auth/org/verify/status
Auth	Required (Bearer token, organization account)
Purpose	Retrieve the full verification status including step-by-step results, MCA data, and domain verification records.
Required Headers

Authorization: Bearer <access_token>
Success Response — 200 OK (fully verified)

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
Success Response — 200 OK (in progress)

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
Error Responses

Status	Code	Reason
401	—	Missing or invalid access token
7.13.6 Recheck Organization Verification
Property	Value
Method	POST
Path	/auth/org/verify/recheck
Auth	Required (Bearer token, organization account)
Purpose	Re-evaluate all verification conditions against current MCA data and DNS records. For already-verified organizations to confirm their status remains valid.
Required Headers

Authorization: Bearer <access_token>
No request body needed. The server re-queries MCA API with the stored registration number and performs a fresh DNS TXT lookup.

Success Response — 200 OK (all checks pass)

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
Success Response — 200 OK (some checks fail)

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
If all_passed is false in enforce mode, the organization's verification is automatically expired — they must restart the pipeline from the beginning.

Error Responses

Status	Code	Reason
400	ORG_NOT_VERIFIED	Organization is not verified — recheck requires completed verification
404	MCA_VERIFICATION_NOT_FOUND	Verified org has no MCA record on file
400	UNKNOWN_ENTITY_TYPE	Stored registration number is not LLPIN or CIN format
401	—	Missing or invalid access token
404	REGISTRATION_NUMBER_NOT_FOUND	Registration number not found in MCA records
503	MCA_SERVICE_UNAVAILABLE	MCA API unavailable (network or non-200 HTTP)
503	INVALID_MCA_RESPONSE	MCA API returned an invalid JSON body
403	ORG_VERIFICATION_EXPIRED	Enforce mode: verification revoked after a hard recheck failure
Soft check failures (business name, status, DNS) still return 200 with all_passed: false. In enforce mode, hard failures (MCA unavailable, invalid response, registration not found) expire verification and return ORG_VERIFICATION_EXPIRED instead of the underlying MCA error code.

8. Vote Service Endpoints
All endpoints under /vote/v1/ require a valid Bearer token.

Required Headers for all Vote Service requests:

Authorization: Bearer <access_token>
Content-Type: application/json   ← (only for requests with a body)
8.1 Health Check
Property	Value
Method	GET
Path	/health
Auth	Not required
Success Response — 200 OK

{ "status": "ok" }
8.2 Create Poll
Property	Value
Method	POST
Path	/vote/v1/polls
Auth	Required
Purpose	Create a new poll. The calling user automatically becomes the poll admin.
Request Body

Field	Type	Required	Description
title	string	Yes	Title of the poll
description	string	No	Optional description
options	string[]	Yes	At least 2 options required
allow_admin_vote	boolean	No	Whether the poll creator can also cast a vote (default: false)
voting_start_at	string (ISO 8601)	No	PBAC — explicit window open time. Must be used with voting_end_at. Mutually exclusive with duration_minutes.
voting_end_at	string (ISO 8601)	No	PBAC — explicit window close time. Votes outside this range get 403 Voting window is closed. Mutually exclusive with duration_minutes.
duration_minutes	integer	No	Duration-based auto-expiry — voting period length in minutes. When the admin calls /start, voting_start_at is set to NOW() and voting_end_at to NOW() + N minutes. The background expiry worker then auto-ends the poll when that time passes. Must be a positive integer. Mutually exclusive with voting_end_at.
auto_start	boolean	No	Duration + immediate start — when true, requires duration_minutes. The poll is set to active immediately at creation; voting_start_at and voting_end_at are computed at insert time. No POST /start call is needed. Mutually exclusive with voting_start_at. Defaults to false.
Four modes of voting-window control (pick one): - No window — omit all time fields. Admin drives transitions manually via /start and /end. - Explicit window (PBAC) — set voting_start_at + voting_end_at. Casbin blocks votes outside the range regardless of poll status. - Duration (manual start) — set duration_minutes. On /start the window is computed automatically and the poll self-expires via the background worker. - Duration + auto-start — set duration_minutes + auto_start: true. The poll is activated immediately at creation; no /start call is needed and the poll self-expires via the background worker.

Example 1 — No time window (manual control)

{
  "title": "Best Programming Language 2024",
  "description": "Vote for your favourite language.",
  "options": ["Go", "Python", "TypeScript", "Rust"],
  "allow_admin_vote": false
}
▶ How to start: Call POST /vote/v1/polls/:pollId/start — manually triggered by the poll admin.
⏹ How to end: Call POST /vote/v1/polls/:pollId/end — manually triggered by the poll admin.
Neither transition happens automatically; the poll stays in created until the admin explicitly starts it, and stays active until the admin explicitly ends it.

Example 2 — Explicit time window (PBAC)

🛠 Developer Testing Note

voting_start_at and voting_end_at must be future UTC timestamps at the time the request is submitted. The server validates both fields against the current UTC clock and rejects any value that is in the past.

Before constructing the request body, retrieve the current UTC time from your terminal: bash date -u +"%Y-%m-%dT%H:%M:%SZ" Use the output as your baseline and set voting_start_at to a time after it, and voting_end_at to a time after voting_start_at.

Example output: 2026-05-23T15:30:00Z → you could then set voting_start_at to 2026-05-23T15:35:00Z and voting_end_at to 2026-05-23T15:45:00Z.

{
  "title": "Best Programming Language 2024",
  "description": "Vote for your favourite language.",
  "options": ["Go", "Python", "TypeScript", "Rust"],
  "allow_admin_vote": false,
  "voting_start_at": "2024-07-10T09:00:00Z",
  "voting_end_at":   "2024-07-10T17:00:00Z"
}
▶ How to start: Automatic — the background expiry worker transitions the poll from created → active when voting_start_at ≤ NOW() (checked every 30 s). No admin action required.
⏹ How to end: Automatic — the expiry worker transitions the poll from active → ended when voting_end_at ≤ NOW(). No admin action required.
The admin may still call POST /start or POST /end manually before the worker fires; the worker's next tick will then be a no-op for that poll.

Example 3 — Duration-based auto-expiry

{
  "title": "Best Programming Language 2024",
  "description": "Voting closes 60 minutes after the poll is started.",
  "options": ["Go", "Python", "TypeScript", "Rust"],
  "allow_admin_vote": false,
  "duration_minutes": 60
}
▶ How to start: Call POST /vote/v1/polls/:pollId/start — manually triggered by the poll admin. At that moment voting_start_at is set to NOW() and voting_end_at to NOW() + duration_minutes. The poll will not become active until this call is made.
⏹ How to end: Automatic — the background expiry worker transitions the poll from active → ended when voting_end_at ≤ NOW() (checked every 30 s). No further admin action is required; however the admin may call POST /end early to close voting before the window expires.

Example 4 — Duration-based + auto-start

{
  "title": "Best Programming Language 2024",
  "description": "Voting opens immediately and closes in 60 minutes.",
  "options": ["Go", "Python", "TypeScript", "Rust"],
  "allow_admin_vote": false,
  "duration_minutes": 60,
  "auto_start": true
}
▶ How to start: None — the poll is set to active immediately at creation. voting_start_at is set to NOW() and voting_end_at to NOW() + duration_minutes at insert time. No admin action required.
⏹ How to end: Automatic — the background expiry worker transitions the poll from active → ended when voting_end_at ≤ NOW() (checked every 30 s). No admin action required; however the admin may call POST /end early to close voting before the window expires.

Success Response — 201 Created

Example A — duration-based, manual start (auto_start: false)

{
  "message": "Poll created successfully",
  "poll": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "title": "Best Programming Language 2024",
    "description": "Voting closes 60 minutes after the poll is started.",
    "options": ["Go", "Python", "TypeScript", "Rust"],
    "status": "created",
    "admin_id": "42",
    "allow_admin_vote": false,
    "auto_start": false,
    "duration_minutes": 60,
    "created_at": "2024-07-10T08:00:00Z",
    "updated_at": "2024-07-10T08:00:00Z"
  }
}
Example B — duration-based, auto-start (auto_start: true)

{
  "message": "Poll created successfully",
  "poll": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "title": "Best Programming Language 2024",
    "description": "Voting opens immediately and closes in 60 minutes.",
    "options": ["Go", "Python", "TypeScript", "Rust"],
    "status": "active",
    "admin_id": "42",
    "allow_admin_vote": false,
    "auto_start": true,
    "duration_minutes": 60,
    "voting_start_at": "2024-07-10T08:00:00Z",
    "voting_end_at":   "2024-07-10T09:00:00Z",
    "created_at": "2024-07-10T08:00:00Z",
    "updated_at": "2024-07-10T08:00:00Z"
  }
}
voting_start_at, voting_end_at, and duration_minutes are omitted from the response when they were not set.
auto_start is always present in the response (false by default).
All timestamp fields (created_at, updated_at, voting_start_at, voting_end_at) are always returned in UTC (Z).

Error Responses

Status	Reason
400	Missing required fields, or fewer than 2 options
400	voting_start_at is in the past
400	voting_end_at is in the past
400	voting_start_at ≥ voting_end_at
400	duration_minutes is zero or negative
400	duration_minutes combined with voting_end_at (mutually exclusive)
400	auto_start: true without duration_minutes
400	auto_start: true combined with voting_start_at (mutually exclusive)
401	Unauthorized
500	Failed to create poll
8.3 Get Poll
Property	Value
Method	GET
Path	/vote/v1/polls/:pollId
Auth	Required
Purpose	Fetch details of a specific poll
Path Param	pollId — UUID of the poll
Example Request

GET /vote/v1/polls/a1b2c3d4-e5f6-7890-abcd-ef1234567890
Success Response — 200 OK

{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "title": "Best Programming Language 2024",
  "description": "Vote for your favourite language.",
  "options": ["Go", "Python", "TypeScript", "Rust"],
  "status": "active",
  "admin_id": "42",
  "allow_admin_vote": false,
  "duration_minutes": 60,
  "voting_start_at": "2024-07-10T09:00:00Z",
  "voting_end_at": "2024-07-10T17:00:00Z",
  "created_at": "2024-07-10T08:00:00Z",
  "updated_at": "2024-07-10T09:00:00Z"
}
duration_minutes, voting_start_at, and voting_end_at are omitted from the response when they were not set.

Error Responses

Status	Reason
401	Unauthorized
404	Poll not found
8.4 Start Poll
Property	Value
Method	POST
Path	/vote/v1/polls/:pollId/start
Auth	Required — poll owner only
Purpose	Transition poll status from created → active (opens voting)
Path Param	pollId — UUID of the poll
ABAC enforcement: The Authorize("start") middleware fetches the poll and checks user_id == poll.admin_id at request time. No stored role is consulted — ownership is evaluated directly from the resource attribute.

No request body required.

Duration auto-expiry: When the poll was created with duration_minutes, this call also sets voting_start_at = NOW() and voting_end_at = NOW() + N minutes in a single Postgres UPDATE. The background worker then auto-transitions the poll to ended when voting_end_at is reached (no further admin action needed).

Success Response — 200 OK

Always includes the updated poll object so the caller can immediately read the computed voting_start_at / voting_end_at.

{
  "message": "Poll started successfully",
  "poll": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "title": "Best Programming Language 2024",
    "description": "Voting closes 60 minutes after the poll is started.",
    "options": ["Go", "Python", "TypeScript", "Rust"],
    "status": "active",
    "admin_id": "42",
    "allow_admin_vote": false,
    "duration_minutes": 60,
    "voting_start_at": "2024-07-10T10:00:00Z",
    "voting_end_at":   "2024-07-10T11:00:00Z",
    "created_at": "2024-07-10T08:00:00Z",
    "updated_at": "2024-07-10T10:00:00Z"
  }
}
Error Responses

Status	Reason
400	Poll already started (poll status is active)
400	Poll cannot be started (poll status is ended)
401	Unauthorized
403	You are not the poll owner (ABAC check failed)
404	Poll not found
8.5 End Poll
Property	Value
Method	POST
Path	/vote/v1/polls/:pollId/end
Auth	Required — poll owner only
Purpose	Transition poll status from active → ended (closes voting)
Path Param	pollId — UUID of the poll
ABAC enforcement: Same ownership check as /start — user_id == poll.admin_id evaluated at runtime.

No request body required.

Success Response — 200 OK

{
  "message": "Poll ended successfully"
}
Error Responses

Status	Reason
400	Poll is not active (can't end it)
401	Unauthorized
403	You are not the admin of this poll
404	Poll not found
8.6 Vote on a Poll
Property	Value
Method	POST
Path	/vote/v1/polls/:pollId/vote
Auth	Required
Purpose	Cast a vote on an active poll
Path Param	pollId — UUID of the poll
ABAC + PBAC enforcement: The Authorize("vote") middleware applies two checks before the handler is reached: 1. ABAC — derives whether the user is the poll owner or a voter from poll.admin_id. If the owner has allow_admin_vote: false, the request is denied before reaching the handler. 2. PBAC — if voting_start_at / voting_end_at are set on the poll, Casbin's withinWindow function verifies the current time falls inside the window. Requests outside the window receive 403 Voting window is closed.

Request Body

Field	Type	Required	Description
poll_id	string	Yes	Must match the :pollId path parameter
option_idx	number	Yes	Zero-based index of the chosen option (e.g., 0 for the first option)
Example Request Body

{
  "poll_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "option_idx": 2
}
If options is ["Go", "Python", "TypeScript", "Rust"], then option_idx: 2 votes for "TypeScript".

Success Response — 200 OK

{
  "message": "Vote submitted successfully"
}
Error Responses

Status	Reason
400	poll_id doesn't match the path, or invalid option_idx
400	Poll is not active
401	Unauthorized
403	Poll owner is not allowed to vote (allow_admin_vote: false) — ABAC deny
403	Voting window is closed — PBAC deny (voting_start_at/voting_end_at set)
404	Poll not found
409	You have already voted
8.7 View Poll Results
Property	Value
Method	GET
Path	/vote/v1/polls/:pollId/results
Auth	Required — poll admin or a user who has already voted in this poll
Purpose	Get the current vote tally for a poll
Path Param	pollId — UUID of the poll
Success Response — 200 OK

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
Note: votes is a { [optionName]: count } map. Options with 0 votes may not appear in the map.

Error Responses

Status	Reason
401	Unauthorized
403	Not poll admin and have not voted
404	Poll not found
8.8 Delete Poll
Property	Value
Method	DELETE
Path	/vote/v1/polls/:pollId
Auth	Required — poll admin (owner) only
Purpose	Permanently delete a poll and all its votes. Works regardless of the poll's current status.
Path Param	pollId — UUID of the poll
ABAC enforcement: Only the poll creator (user_id == poll.admin_id) may delete a poll. This is evaluated at runtime from the resource attribute — no stored role is consulted. Any other authenticated user receives 403.

Status-independent: A poll can be deleted at any point in its lifecycle — created, active, or ended. The current status is not checked before deletion.

No request body required.

Success Response — 200 OK

{
  "message": "Poll deleted successfully"
}
Error Responses

Status	Reason
401	Unauthorized
403	You are not the admin of this poll
404	Poll not found
9. Authorization Model
The Vote Service enforces two authorization strategies, both evaluated at request time by the Authorize middleware before any handler runs.

9.1 ABAC — Attribute-Based Access Control (Poll Ownership)
The user's effective role is derived on every request by comparing the caller's user_id against the admin_id attribute stored on the poll. No role is looked up from a database table for this decision.

user_id == poll.admin_id  →  effective role: "admin"
user_id != poll.admin_id  →  effective role: "voter"

Special case:
  user_id == poll.admin_id  AND  action == "vote"  AND  allow_admin_vote == true
    →  effective role: "voter"  (owner intentionally treated as voter)
Effective Role	Who	Permitted Actions
admin	The user whose user_id matches poll.admin_id	start, end, delete, view_result
voter	Authenticated users who are not the owner (or owner when allow_admin_vote: true for vote only)	vote
view_result access (enforced in middleware, not open to all voters):

Caller	Can view results?
Poll admin_id	Yes
User who has already cast a vote in this poll	Yes
Any other authenticated user	No — 403 Access denied
POST /vote/v1/polls (create poll) does not use Casbin; any authenticated user may create a poll and becomes that poll's admin_id.

9.2 PBAC — Policy-Based Access Control (Time Window)
For the vote action, Casbin additionally evaluates a custom withinWindow(start, end) function registered at startup. The function is called with the poll's voting_start_at / voting_end_at attributes.

Condition	Effect
Both voting_start_at and voting_end_at are null	No time restriction at policy layer — manual /start & /end and poll.status still apply
Both fields are set, current time is inside the window	Vote is allowed (subject to ABAC check passing too)
Both fields are set, current time is outside the window	403 Voting window is closed
Only voting_start_at is set (end is null)	Vote allowed only after start time
Only voting_end_at is set (start is null)	Vote allowed only before end time
9.3 Casbin Policy Reference (policy.csv)
p, admin, poll, delete
p, admin, poll, start
p, admin, poll, end
p, admin, poll, view_result

p, voter, poll, vote
p, voter, poll, view_result
The create policy row was removed — poll creation is not Casbin-gated. view_result in policy applies only after the middleware grants access (admin or prior voter).

The Casbin model matcher:

r.sub.Role == p.sub  &&  r.obj.Type == p.obj  &&  r.act == p.act
  &&  (r.act != "vote"  ||  withinWindow(r.obj.VotingStart, r.obj.VotingEnd))
r.sub and r.obj are Go structs carrying the derived role and poll attributes respectively — Casbin evaluates field values, not stored strings.

10. Poll Status Flow
Manual Flow (no time window)
When voting_start_at / voting_end_at are not set, the admin drives all transitions manually:

  [created]  ──── POST /start (owner) ────►  [active]  ──── POST /end (owner) ────►  [ended]
      │                                           │                                       │
   Can be                                    Voters can                              Results
   deleted                                    vote here                              available
Time-Window Flow (PBAC — explicit voting_start_at / voting_end_at)
When both explicit time bounds are set at creation: - The expiry worker handles both transitions automatically — no admin action is required. - Casbin additionally gates every individual vote attempt inside the [active] window.

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
The admin can still call POST /start and POST /end manually. If they do so before the worker fires, the worker’s next tick becomes a no-op for that poll.

Duration Flow (auto-expiry via duration_minutes)
When duration_minutes is set at creation, the voting window does not exist yet — it is computed the moment the admin calls /start:

  [created]  ──── POST /start (owner) ────►  [active]  ──── expiry worker ────►  [ended]
                         │                       │              (auto)               │
                  computes NOW()            PBAC allows                         Results
                  voting_start_at            votes within                       available
                  voting_end_at              the window
                  = NOW() + N min
The expiry worker runs every 30 seconds. It executes one UPDATE polls SET status='ended' WHERE status='active' AND voting_end_at <= NOW(). No admin action is needed to close the poll.

Duration + Auto-Start Flow (duration_minutes + auto_start: true)
When both duration_minutes and auto_start: true are set, the poll skips the created phase entirely — it is inserted directly as active with the voting window already computed:

  POST /polls ──── auto_start: true ────► [active]  ──── expiry worker ────►  [ended]
  (creation)             │                   │              (auto)               │
                 voting_start_at         PBAC allows                        Results
                 = NOW()                  votes within                      available
                 voting_end_at            the window
                 = NOW() + N min
No POST /start call is needed or accepted (the poll is already active). The expiry worker auto-ends it as usual. The admin may call POST /end early to close voting before the window expires.

Status	Can Vote	Can Start	Can End (manual)	Can Delete
created	No (not active)	Yes	No	Yes
active	Yes — if inside time window (or no window set)	No	Yes	Yes
ended	No	No	No	Yes
Admin actions (start, end, delete) are ABAC-gated — only the poll creator passes the ownership check. Any other user receives 403 Access denied: insufficient permissions.

11. Sample Frontend Usage
JavaScript / TypeScript (Fetch API)
Login and store access token in memory
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
Authenticated request helper
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
Create a poll (no time window — manual control)
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
Create a poll with a PBAC time window (explicit bounds)
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
Create a poll with duration-based auto-expiry
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
Start a poll and read the computed voting window
// /dev/null/pollsApi.js#L83-105
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
Cast a vote
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
Refresh the access token silently
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
Logout
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
12. CORS & Cookie Notes
Cookie Behaviour
User login sets refresh_token_user; organization login sets refresh_token_org (HttpOnly; Secure; SameSite=Strict).
Refresh and logout accept either cookie (legacy refresh_token is cleared when a new session is issued).
JavaScript cannot read this cookie — it is invisible to your code. The browser attaches it automatically on every request to the auth service domain.
The Secure flag is active in production (Railway, HTTPS). In local development (HTTP), the cookie is still set but without Secure so it works on localhost.
Required fetch / Axios setting
Every request to the auth service must include credentials, otherwise the browser will not send or store the cookie:

// Fetch
fetch(url, { credentials: "include" })

// Axios (set once globally)
axios.defaults.withCredentials = true;
CORS configuration (backend)
Auth-service enables CORS from CORS_ALLOWED_ORIGINS (comma-separated). Default dev origins: http://localhost:3000, http://127.0.0.1:3000.

CORS_ALLOWED_ORIGINS=https://your-frontend.com,http://localhost:5173
Responses use the request Origin when allowlisted, with Access-Control-Allow-Credentials: true.

Token storage summary
Token	Where stored	Accessible to JS?
access_token (token_use: access)	JS memory (a variable)	Yes — you manage it
Refresh JWT (token_use: refresh)	HttpOnly cookie: refresh_token_user or refresh_token_org	No — browser only
13. Rate Limits
Auth-service returns 429 RATE_LIMITED when limits are exceeded:

Flow	Limit
Login	5 attempts / minute per email and per IP
Register	10 attempts / minute per IP
Refresh	30 attempts / minute per IP
Email OTP send	3 codes / 2 minutes per user or org
Email OTP verify	5 failed attempts / 2 minutes per user or org
Best practices: refresh only when the access token is expiring; use exponential backoff on 429.
Tags
Browse documentation by topic:

auth
Home (New)
changelog
Changelog
overview
Documentation Guide
Old Docs
Who Are We
voting
Home (New)
changelog
Change Logs
(Types : Feature, Improvement, Deprecation, Bug Fix, Security Fix)

Published API docs are versioned with mike; see DOCUMENTATION.md.

V 1.4.4
Organization Sessions and Recheck Errors (Bug Fix / Improvement)
June 4th, 2026
GET /auth/sessions for organizations: Route moved to shared auth middleware so organization tokens are accepted; handler lists sessions by account_type (org_id vs user_id query).
Recheck API error specificity (POST /auth/org/verify/recheck): New codes ORG_NOT_VERIFIED, MCA_VERIFICATION_NOT_FOUND, INVALID_MCA_RESPONSE, UNKNOWN_ENTITY_TYPE; NO_VERIFICATION_IN_PROGRESS reserved for pipeline steps. Enforce mode hard failures return ORG_VERIFICATION_EXPIRED (403) after revoking verification.
V 1.4.3
Organization Verification Step Errors (Improvement)
June 2nd, 2026
Re-submitting a completed verification step returns a dedicated 409 code instead of generic INVALID_VERIFICATION_STEP:
REGISTRATION_NUMBER_STEP_COMPLETE — registration already done; proceed to submit-domain
DOMAIN_STEP_COMPLETE — domain already done; proceed to verify-dns
assertVerificationStep helper in org_verification_service.go centralizes step guards for submit-registration-number, submit-domain, and verify-dns
V 1.1.1
Verification Pipeline and Poll Start Fixes
Poll start error message: Starting an already-active poll now returns 400 { "error": "Poll already started" } instead of the generic "Poll cannot be started".
Recheck verification for non-trusted users: Fixed 500 error when email_risk_status is NULL — recheck now returns 200 with a proper verification breakdown.
Aadhaar status pipeline errors: GET /auth/aadhaar/status returns 403 USER_NOT_TRUSTED for unverified email users and 404 AADHAAR_NOT_FOUND when no record exists, instead of 500.
care_of default: Migration 000020 sets user_aadhaar_verifications.care_of to NOT NULL DEFAULT ''; nullable text columns use COALESCE on read.
Verified status pipeline: GET /auth/me/verified returns tiered 403 errors — USER_NOT_TRUSTED, AADHAAR_VERIFICATION_REQUIRED, or USER_NOT_VERIFIED — based on the user's position in the verification pipeline.
V 1.0.0
Initial release

V 1.0.1
Modify Signup and Signin
Change the API route path 'user' to 'auth' for logout , me.
Updates Sign up and sign in credentials : Check Sign-up and Sign-in API endpoints
Adding more API endpoints : Sessions, send-verification, verify-email API endpoints

Need a domain for working Email OTP verification. Till now only working with my email (priyadarsanf2@gmail.com)

Email verification after login

Login no longer blocks unverified users: The email_not_verified check has been removed from POST /auth/login. Users can now sign in regardless of email verification status.
Verification endpoints now require authentication: POST /auth/send-verification and POST /auth/verify-email are moved behind the Auth middleware. They require a valid Bearer token and use the authenticated user's identity (from JWT) instead of accepting an email in the request body.
Verify Email request body simplified: Only { "otp": "..." } is needed — email is derived from the authenticated session.
Register & Login request bodies updated: Added first_name and last_name fields (required) plus optional device_fingerprint and device_info objects for device fingerprinting to both Register and Login endpoints.
Added GET /auth/sessions API documentation: New section documenting the List Sessions endpoint.
Updated /auth/me response: Documented all response fields (FirstName, LastName, EmailVerified, MfaEnabled, Status, CreatedAt, LastLoginAt).
V 1.1.0
Implement Configurable Email Reputation Verification
New Backend Modules:
internal/models/email_reputation.go — Typed structs matching the full Abstract API response schema plus a processed result struct
internal/config/feature_flags.go — GetEmailReputationMode() helper that reads EMAIL_REPUTATION_MODE from env with validation
internal/validator/email_risk.go — ValidateEmailRisk() reusable validator with mode-specific logic
internal/service/email_reputation.go — CheckEmailReputation() service with HTTP client (5s timeout), graceful fallback, and detailed logging

Three Runtime Modes:

disabled — Skips all checks, no external API calls. Default for local development.
monitor — Calls Abstract API, logs suspicious/disposable/risky emails, rejects only technically undeliverable (SMTP/MX failures). Safe for demos and beta.
enforce — Strict validation: rejects disposable, undeliverable, high-risk, and low-score (< 0.5) emails. Production-grade.

Database Migration:

000008_add_email_reputation_fields — Added email_reputation_score (DOUBLE PRECISION), email_risk_status (TEXT), email_checked_at (TIMESTAMPTZ) to users table

Backend Integration:

Updated Register handler to call CheckEmailReputation after email format validation
Updated RegisterUser service to accept and store reputation results
Updated CreateUser repository INSERT to include 3 new reputation columns
Added 4 new error constants (ErrDisposableEmailReputation, ErrEmailNotDeliverable, ErrHighRiskEmail, ErrLowReputationScore)

Graceful Fallback:

If Abstract API fails (network error, timeout, bad status), registration continues with reputation status marked as "unchecked"
No panic, no log.Fatal — production-safe error wrapping throughout

Environment Configuration:

Added EMAIL_REPUTATION_MODE and example comments to .env.sample
Startup logs the active reputation mode

API Documentation:

Added new error codes to Auth Service Errors table (DISPOSABLE_EMAIL, EMAIL_NOT_DELIVERABLE, HIGH_RISK_EMAIL, LOW_REPUTATION_SCORE)
Added Email Reputation Verification section (7.10) with mode descriptions, enforcement rules, example responses, and security notes
V 1.2.0
Implement Aadhaar Verification (Feature)
May 29th, 2026
New Backend Modules:
internal/models/aadhaar.go — Typed structs matching Sandbox OKYC API request/response schemas plus UserAadhaarVerification model for DB persistence
internal/repository/aadhaar_repository.go — Full CRUD for user_aadhaar_verifications table (save, get by reference_id, get by user, update with e-KYC data)
internal/service/sandbox_service.go — Sandbox JWT authentication service with in-memory token cache (23h expiry), callSandboxAPI() helper, and enforceAadhaarFallback() mode-aware error handler
internal/service/aadhaar_service.go — GenerateAadhaarOTP, VerifyAadhaarOTP, and GetAadhaarStatus business logic with mode-aware fallback
internal/handler/aadhaar_handler.go — Three Gin handlers for the Aadhaar endpoints

Three Runtime Modes:

disabled — All Aadhaar endpoints return AADHAAR_FEATURE_DISABLED. No external API calls. Default for local development.
monitor — Feature active; on API failure logs warning and falls back gracefully (operation may succeed with limited data)
enforce — Strict validation: API failure blocks the operation entirely

Database Migrations:

000009_add_aadhaar_fields_to_users — Added is_aadhaar_verified (BOOLEAN, default false) and aadhaar_verified_at (TIMESTAMPTZ) to users table
000010_create_aadhaar_verifications_table — Created user_aadhaar_verifications table with reference_id, status, full e-KYC data (name, care_of, full_address, date_of_birth, gender, photo, structured address fields), plus index on user_id

New API Endpoints (all auth-protected):

POST /auth/aadhaar/generate-otp — Generate OTP sent to Aadhaar-linked mobile number
POST /auth/aadhaar/verify-otp — Verify OTP and retrieve e-KYC data
GET /auth/aadhaar/status — Get latest Aadhaar verification status

Email Verification Prerequisite:

All Aadhaar endpoints reject requests with EMAIL_NOT_VERIFIED (403) if the user has not verified their email — regardless of Aadhaar verification mode

Error Handling:

Added 6 new error constants: AADHAAR_FEATURE_DISABLED, AADHAAR_OTP_EXPIRED, AADHAAR_INVALID_OTP, AADHAAR_VERIFICATION_FAILED, AADHAAR_ALREADY_VERIFIED
Graceful fallback in monitor mode: Sandbox API failures log warnings but don't block
Enforce mode: Sandbox API failures propagate as AADHAAR_VERIFICATION_FAILED

Session Resumption:

reference_id stored in user_aadhaar_verifications table
Users can navigate away and return — GET /auth/aadhaar/status returns pending verification reference_id

Environment Configuration:

Added GetAadhaarVerificationMode() to config/feature_flags.go, reads AADHAAR_VERIFICATION_MODE env var (disabled/monitor/enforce)
Uses existing SANDBOX_API_KEY and SANDBOX_LIVE_API_SECRET_KEY env vars

API Documentation:

Added new Aadhaar error codes to Auth Service Errors table
Added Aadhaar Verification section (7.10) with mode descriptions, endpoint docs, request/response examples, error tables, session resumption guidance
Updated /auth/me response to include IsAadhaarVerified and AadhaarVerifiedAt fields
Updated Table of Contents with Aadhaar section links

Naming Conventions:

Use the actual name when you Register for your account. Because when you verify your account , we'll match the name you provided with the Aadhaar data we have on file.
V 1.2.1
Implement Verification Check (Feature)
May 30th, 2026
New API Endpoints:
GET /auth/me/verified — Simple check of the user's is_verified field. Returns 200 { "is_verified": true } if verified, or 403 USER_NOT_VERIFIED if not.
POST /auth/me/recheck-verification — Re-runs all 5 verification conditions (email verified, reputation score ≥ 0.5, risk status = low, aadhaar verified, name match) and updates is_verified in the DB if all pass. Always returns 200 with a detailed breakdown including is_verified, individual checks, and missing reasons.

Verification Conditions (all must pass for is_verified = true):

Email verified (email_verified = true)
Email reputation score ≥ 0.5
Email risk status is "low"
Aadhaar verified (is_aadhaar_verified = true)
Aadhaar name matches registered name (case-insensitive, whitespace-normalized)

Database Migration:

000011_add_is_verified_field — Added is_verified (BOOLEAN, default false) to users table

Backend Integration:

Existing verification actions (email OTP, aadhaar OTP) now call CheckAndSetVerified in the repository to automatically set is_verified when all conditions are met
Added VerificationCheckResult model struct with IsVerified, Checks, and Missing fields
Added ErrUserNotVerified (403) and ErrNameMismatch (409) error constants

Backend Modules:

internal/models/user.go — Added IsVerified field to User struct, added VerificationCheckResult struct
internal/repository/user_repository.go — Added CheckAndSetVerified() method
internal/service/auth_service.go — Added GetVerifiedStatus() and RecheckVerification() service methods
internal/handler/auth_handler.go — Added GetVerifiedStatus and RecheckVerification handlers
internal/routes/routes.go — Added GET /auth/me/verified and POST /auth/me/recheck-verification routes

API Documentation:

Added USER_NOT_VERIFIED and NAME_MISMATCH error codes to Auth Service Errors table
Added IsVerified to /auth/me response
Added Verification Check section (7.11) with endpoint docs and example responses
V 1.3.0
Separate Organizational Account (Feature)
May 30th, 2026
Separation of Concerns:
User accounts and organizational accounts are now fully separated into two distinct tables (users and organizations)
Removed is_organization field from users table — an account is either a user or an organization by which table it lives in
Removed the CHECK constraint that prevented a record from being both is_verified and is_organization (no longer needed)
Organizational accounts use the same email verification and email reputation mechanisms as user accounts, with appropriate naming

New Database Tables:

organizations — stores organizational accounts with fields: id, email, password_hash, created_at, email_verified, mfa_enabled, status, updated_at, last_login_at, org_name, email_reputation_score, email_risk_status, email_checked_at, is_trusted, is_verified
org_email_verifications — OTP verification records for organizational email verification (mirrors email_verifications)

New API Endpoints:

POST /auth/org/register — Register a new organization (requires email, password, org_name)
POST /auth/org/login — Authenticate as an organization
GET /auth/org/me — Get current organization profile
POST /auth/org/send-verification — Send email verification OTP to organization email
POST /auth/org/verify-email — Verify organization email via OTP

JWT Updates:

Added account_type claim to JWT tokens ("user" or "organization")
Auth middleware passes account_type to downstream handlers

Error Constants:

Added ORG_EMAIL_ALREADY_EXISTS (409), ORGANIZATION_NOT_FOUND (404), ORG_NAME_REQUIRED (400)

Backend Modules:

internal/models/organization.go — Organization, OrgSignUpRequest, OrgLoginRequest, OrgEmailVerification structs
internal/repository/organization_repository.go — CRUD and verification logic for organizations
internal/service/auth_service.go — Added RegisterOrganization, LoginOrganization, OrgMe
internal/service/email_service.go — Added SendOrganizationVerificationEmail, VerifyOrganizationEmail
internal/handler/auth_handler.go — Added 5 org-specific handlers
internal/routes/routes.go — Added 5 new org routes under /auth/org/

API Documentation:

Added Organization Endpoints section with register, login, profile, and email verification docs
Added org-specific error codes to Auth Service Errors table
Updated JWT token payload to include account_type claim
Removed IsOrganization from /auth/me user response
Updated Table of Contents
V 1.2.2
Verification Structural Changes (Improvment)
May 30th, 2026
Aadhaar Number
Store the Aadhaar number in the database, as of now in 'without encryption' but later in 'encrypted' format.
Add is_trusted field in the users table
Add is_organization field in the users table
Email Verification -> become a user into trusted user. Later we'll also add Phone number verification
trusted user can become either Verified user (as human) or Organizational user. But not both at a time.
No Need to change any API request body for storing the Aadhaar number
Client sends POST /auth/aadhaar/generate-otp with {"aadhaar_number": "123412341234"}
Handler parses req.AadhaarNumber and passes it to service.GenerateAadhaarOTP(req.AadhaarNumber, userID)
Service receives it and sends it to the Sandbox API to generate an OTP
V 1.4.0
Implement Verified Organization Pipeline (Feature)
June 1st, 2026
New Backend Modules:
internal/models/org_verification.go — Typed structs for MCA API request/response schemas (LLP & Company master data), org verification requests, MCA verification records, domain verification records, and step result tracking
internal/repository/org_verification_repository.go — Full CRUD for 3 new tables (verification requests, MCA verifications, domain verifications) with step advancement and completion
internal/service/org_verification_service.go — Orchestration logic for the 5-step verification pipeline with MCA API integration (Sandbox), DNS TXT lookup, registration number validation (LLPIN/CIN regex), business name matching, entity status verification, and incorporation date validation
internal/handler/org_verification_handler.go — Six Gin handlers for the verified organization endpoints with step-by-step instructions returned in responses

Three Runtime Modes:

disabled — All org verification endpoints return ORG_VERIFICATION_EXPIRED. No external API calls. Default for local development.
monitor — Feature active; on API failure logs warning and falls back gracefully (step may report as failed but pipeline continues)
enforce — Strict validation: API failure blocks the current step entirely and may expire the verification

Database Migrations:

000014_create_org_verification_requests — Table for tracking multi-step verification progress with current_step and status fields
000015_create_org_mca_verifications — Table for MCA API response data: registration number, entity type (LLP/CIN), LLP details (LLPIN, LLP name, LLP status), Company details (CIN, company name, company status), ROC code, registered address, email, incorporation date
000016_create_org_domain_verifications — Table for domain ownership verification with domain, verification token, DNS verified flag, and DNS verified timestamp
000017_add_verified_at_to_organizations — Added verified_at (TIMESTAMPTZ, nullable) to organizations table

5-Step Verification Pipeline:

Step 1: Registration Number — Validates format (LLPIN: ABC-1234, CIN: U12345MH2024PLC123456) and looks up MCA records via Sandbox API
Step 2: Business Name & Entity Checks — Verifies org name matches MCA record (normalized, legal-suffix-aware), checks LLP/Company status is "Active", validates incorporation date format
Step 3: Domain Submission — Validates domain format, checks domain matches email domain, generates verification token
Step 4: DNS TXT Verification — Looks up _e-voting-verify.<domain> TXT record and matches verification token
Step 5: Verified — Organization marked as verified with verified_at timestamp

New API Endpoints (all auth-protected, organization-only):

POST /auth/org/verify/start — Start the verification pipeline (requires trusted/email-verified org)
POST /auth/org/verify/submit-registration-number — Submit LLPIN or CIN for MCA lookup
POST /auth/org/verify/submit-domain — Submit official business domain
POST /auth/org/verify/verify-dns — Verify DNS TXT record presence and token match
GET /auth/org/verify/status — Get full verification status with step-by-step results
POST /auth/org/verify/recheck — Re-evaluate all verification conditions against current MCA data and DNS

Prerequisite:

Organization must be Trusted (email verified via POST /auth/org/verify-email) before starting verification — returns ORG_NOT_TRUSTED if email not verified
Organization must not already be verified — returns ORG_ALREADY_VERIFIED if already verified
Only one active verification request allowed at a time — returns VERIFICATION_IN_PROGRESS if one exists

Error Handling:

Added 17 new error constants: ORG_NOT_TRUSTED (403), ORG_ALREADY_VERIFIED (409), VERIFICATION_IN_PROGRESS (409), NO_VERIFICATION_IN_PROGRESS (400), INVALID_VERIFICATION_STEP (400), MCA_SERVICE_UNAVAILABLE (503), INVALID_REGISTRATION_NUMBER (400), REGISTRATION_NUMBER_NOT_FOUND (404), BUSINESS_NAME_MISMATCH (409), ORG_STATUS_NOT_ACTIVE (400), INCORPORATION_DATE_INVALID (400), INVALID_DOMAIN (400), EMAIL_DOMAIN_MISMATCH (409), DNS_VERIFICATION_FAILED (400), DNS_TOKEN_NOT_FOUND (404), DNS_ALREADY_VERIFIED (409), ORG_VERIFICATION_EXPIRED (403)

Feature Flag:

Added GetOrgVerificationMode() to config/feature_flags.go, reads ORG_VERIFICATION_MODE env var (disabled/monitor/enforce)

API Documentation (index.md):

Section 7 restructured into User Endpoints and Organization Endpoints sub-sections for better clarity
Added 17 new error codes to Auth Service Errors table
Added Verified Organization Pipeline section (7.13) with pipeline flow diagram, 6 endpoint docs, full MCA LLP & Company response examples, DNS setup instructions, and complete error tables
Updated /auth/org/me response to include VerifiedAt field
Updated Table of Contents with new sub-sections and endpoint links

Structural Changes:

Organization model VerifiedAt field added for tracking verification timestamp
Removed automatic is_verified on org email verification — orgs must now complete the full pipeline to become verified
V 1.4.2
Organization Login Fix (Bug Fix)
June 2nd, 2026
Root cause: refresh_tokens.user_id foreign-keyed only users(id); org login stored organization IDs in that column, causing PostgreSQL FK violations and 500 INTERNAL_SERVER_ERROR after a valid password check.
Database migration 000021_refresh_tokens_support_orgs
Nullable user_id with FK to users; new org_id FK to organizations
CHECK constraint: exactly one of user_id or org_id is set (same pattern as otp_verify_attempts)
Backend
RefreshToken model uses account_type + subject_id; repository saves/loads the correct column
GetOrganizationByEmail returns INVALID_CREDENTIALS on unknown email (aligned with user login)
POST /auth/logout moved to unauthenticated /auth group (cookie-only; works for user and org refresh cookies)
V 1.4.1
Security & Performance Hardening (Security Fix / Improvement)
June 2nd, 2026
JWT & token lifecycle
Added token_use claim on all minted tokens: access (15 min, Bearer header) and refresh (7 days, HttpOnly cookie only)
Protected routes use ParseAccessToken and reject refresh tokens
Enforced JWT issuer auth-service via jwt.WithIssuer in auth-service and vote-service
Vote-service accepts legacy tokens without token_use until clients re-login; new tokens always include the claim

Sessions & cookies

User login sets refresh_token_user; organization login sets refresh_token_org (legacy refresh_token cleared on new login)
Refresh and logout read type-specific cookies (with legacy fallback)
RefreshAccessToken validates refresh JWT with ParseRefreshToken before rotation

Route authorization (auth-service)

RequireAccountType("user") on /auth/* protected user routes (me, Aadhaar, email verification, sessions, etc.)
RequireAccountType("organization") on /auth/org/* protected org routes
New error constant FORBIDDEN (403) when account type does not match the route group

Login & registration hardening

User and org login return INVALID_CREDENTIALS for both unknown email and wrong password (removed distinct INVALID_PASSWORD on login)
User login email normalized with strings.ToLower + trim (aligned with register and org login)
Login rate limit: 5 attempts / minute per email and per IP (CheckRateLimit now uses IP)
Register rate limit: 10 attempts / minute per IP
Refresh rate limit: 30 attempts / minute per IP

OTP verification

Email and org OTP verify failures tracked in new otp_verify_attempts table (not send-count)
Maximum 5 failed verify attempts per 2-minute window per user/org
Constant-time OTP hash comparison (crypto/subtle)

Logging (PII & secrets)

Removed Sandbox access token and API key from logs
Redacted raw Aadhaar API bodies, MCA response bodies, and email addresses from reputation logs

Database migration

000019_create_otp_verify_attempts — tracks failed OTP verify attempts for users and organizations

Auth-service backend modules

internal/utils/jwt.go — TokenUse, ParseAccessToken, ParseRefreshToken, issuer validation
internal/utils/cookies.go — cookie name helpers for user/org refresh tokens
internal/middleware/account_middleware.go — RequireAccountType
internal/middleware/cors_middleware.go — CORS_ALLOWED_ORIGINS
internal/middleware/auth_middleware.go — strict Bearer prefix, access tokens only
internal/service/security_service.go — register/refresh IP limits
internal/service/email_service.go — verify attempt limits, RecordRegisterIP / RecordRefreshIP
internal/repository/otp_verify_repository.go — OTP verify attempt persistence
internal/repository/login_attempt_repository.go — GetRecentAttemptsByIP

Vote-service changes

GET /vote/v1/polls/:pollId/results — Authorize("view_result") plus explicit check: only poll admin or users who have already voted
HasUserVoted repository helper for results authorization
Duplicate vote: PostgreSQL unique violation (23505) mapped to 409 instead of 500
Poll object stored on Gin context after Casbin to avoid redundant GetByID on vote path
WithinVotingWindow — partial windows (only start or only end) now enforced
Removed unused p, admin, poll, create from policy.csv
GetResults skips invalid option_idx values instead of panicking
JWT parsing aligned with auth-service (token_use, issuer)

Tests & tooling

auth-service/internal/utils/jwt_test.go — access vs refresh token rejection
vote_service/internal/utils/jwt_test.go — refresh rejection and legacy token support
Extended vote_service/tests/window_test.go for partial voting windows
make test and make security-scan targets in both service Makefiles

Environment configuration

CORS_ALLOWED_ORIGINS — comma-separated allowed browser origins (auth-service)
Documented in auth-service/.env.sample

API documentation (index.md)

Version header [V 1.4.1]
Token payload: token_use, separate refresh cookies, issuer notes
Login/register/refresh/logout: rate limits, normalized email, unified login errors
FORBIDDEN in auth error table; account-type routing rules
Section 8.7 results: admin or prior voters only
Section 9: view_result rules, updated policy.csv, partial PBAC windows
Sections 12–13: CORS env, cookie names, documented rate limits

Deferred (documented, not implemented)

Refresh token reuse / family revoke
Aadhaar number encryption at rest (still plaintext per v1.2.2 notes)
Frontend, ballot encryption, public audit trail (see audit-gap-matrix)
overview
Documentation site guide
This project publishes the backend API guide with MkDocs Material and mike for versioned releases.

Live site: https://cloudflare-workers-autoconfig-evoting-backend-docs.priyadarsanf2.workers.dev/

Quick start
make -f Makefile.docs docs-venv    # recommended: creates .venv-docs
make -f Makefile.docs docs-serve
Or install globally: pip install -r requirements.txt (if your Python environment allows it).

Open http://127.0.0.1:8000 for a fast edit/preview loop (single doc tree, no version switcher).

Tags
Pages are categorized with YAML front matter:

---
tags:
  - auth
  - voting
---
Taxonomy
Tag	Meaning
auth	Auth service, JWT, sessions, user/org accounts
voting	Polls, votes, Casbin
organization	Org accounts and verification pipeline
verification	Email, Aadhaar, MCA/DNS
changelog	Release history
overview	Product mission and meta docs
internal	Engineering audit notes under docs/Cursor/
The Tags nav page (tags.md) renders the full index via ###### DOCUMENTATION.md:1300-1322/name { #DOCUMENTATION.md:1300-1322/slug }. Files in docs/Cursor/ inherit internal from docs/Cursor/.meta.yml.

Versioning
Doc versions match Change-log API release labels (e.g. 1.4.4), not every git commit.

Cloudflare CI reads the deploy label from the first ### V x.y.z heading in Change-log.md (currently the newest release at the top). Override with the DOCS_VERSION environment variable if needed. Add a new ### V … section at the top of the changelog before you expect a new entry in the site version selector.

Initial deploy (current docs as 1.4.3)
pip install -r requirements.txt
make -f Makefile.docs docs-deploy
make -f Makefile.docs docs-set-default
make -f Makefile.docs docs-serve-versioned
Preview version selector at http://127.0.0.1:8000 (mike serves the deployment branch).

Publish a new release (example 1.4.4)
Update API docs and add a new top section ### V 1.4.4 in Change-log.md (must be the first ### V in the file).
Deploy locally (optional) or push to trigger Cloudflare:
bash make -f Makefile.docs docs-deploy DOCS_VERSION=1.4.4 # optional; defaults match Change-log make -f Makefile.docs docs-set-default

Cloudflare runs scripts/cloudflare-docs-build.sh, which deploys that version and checks site/versions.json.
Older versions stay available at /1.4.3/, /1.4.4/, etc.

Useful commands
Command	Purpose
pip install -r requirements.txt	Install mkdocs + material + mike
mkdocs serve	Fast edit loop (single tree, no version switcher)
mike deploy 1.4.3 latest --update-aliases	Build versioned site into deployment branch
mike set-default latest	Root redirect to latest alias
mike serve	Preview all versions locally (reads deployment branch)
mike list	Show deployed versions
Cloudflare Workers publish
wrangler.jsonc at the repo root points Wrangler at the MkDocs output directory (./site). The Worker name must match your Cloudflare dashboard (cloudflare-workers-autoconfig-evoting-backend-docs).

Workers Builds (CI)
Configure the Worker project in Cloudflare with:

Setting	Value
Build command	pip install -r requirements.txt && bash scripts/cloudflare-docs-build.sh
Deploy command	npx wrangler versions upload
Static assets	./site (mike gh-pages tree via wrangler.jsonc assets.directory)
Set MIKE_PUSH=1 in Cloudflare environment variables (with git push access) to persist older doc versions on gh-pages between builds. Without it, each build still updates latest and the version from Change-log, but older folders (e.g. 1.4.3) only remain if git fetch origin gh-pages succeeds in CI.

Optional override: DOCS_VERSION=1.4.4 in Cloudflare env vars (otherwise derived from Change-log).

After deploy, confirm https://<your-worker>/versions.json lists the new version and the header selector shows it.

Cloudflare injects CLOUDFLARE_API_TOKEN in CI; local uploads need the same token or wrangler login.

Verify locally (after mike build):

pip install -r requirements.txt
bash scripts/cloudflare-docs-build.sh
npx wrangler versions upload
If config is correct, Wrangler fails only on missing credentials—not on “Missing entry-point to Worker script or to assets directory”.

Mike versioned publish (optional)
Mike outputs a versioned static site:

/latest/ — current alias
/1.4.3/ — frozen snapshot
/versions.json — version selector data
Workflow when using mike:

Run make -f Makefile.docs docs-deploy (or docs-deploy-push if using a git deployment branch).
Upload the entire site root from the mike deployment branch (including versions.json and version directories), or change the CI build to run mike deploy and point assets.directory at that output.
Confirm site_url in mkdocs.yml matches your Workers URL (trailing slash required).
CI uses scripts/cloudflare-docs-build.sh (mike + alias_type: copy in mkdocs.yml) so the live site gets the version selector, versions.json, and /latest/ paths.

If you previously deployed with mkdocs gh-deploy to the site root, run make -f Makefile.docs docs-clean-versions once before the first mike deploy to avoid mixing layouts.

Configuration files
File	Role
mkdocs.yml	Site name, nav, theme, tags, mike provider
requirements.txt	mkdocs, mkdocs-material, mike
wrangler.jsonc	Worker name, assets.directory → ./site for CI deploy
Makefile.docs	Serve, deploy, and version commands
name: MkDocs Tags Versioning overview: "Complete your partially configured MkDocs Material setup: fix the tags index and tag all doc pages, then enable mike-based versioning aligned with your Change-log releases and Cloudflare Workers URL." todos: - id: deps-mkdocs-yml content: Add mike to requirements.txt; complete mkdocs.yml (site_url, theme features, meta plugin) status: completed - id: tags-index-pages content: Fix docs/tags.md marker; add tags front matter to all doc pages + Cursor .meta.yml status: completed - id: mike-initial-deploy content: Add Makefile.docs with mike deploy/serve commands; document 1.4.3 latest initial deploy status: completed - id: docs-maintainer-guide content: Add docs/DOCUMENTATION.md + README section for tags, versioning, Cloudflare publish status: completed isProject: false

MkDocs tags and versioning
Skills search (/find-skills)
No dedicated MkDocs/Mike skill showed up in a registry search. This plan follows official Material for MkDocs — tags and versioning (mike). Optional later: npx skills find documentation or author a project skill under .cursor/skills/ for your release workflow.

Current state
[mkdocs.yml](mkdocs.yml) already declares tags and mike, but implementation is incomplete:

Piece	Status
plugins: tags + tags_file: tags.md	Config present
[docs/tags.md](docs/tags.md)	Uses legacy [TAGS] marker only
Page front matter	Only [docs/index.md](docs/index.md) has tags (markdown, tutorial, guide — placeholders)
extra.version.provider: mike	Config present
[requirements.txt](requirements.txt)	Missing mike
site_url	Not set (required for version selector paths on Cloudflare)
Deploy automation	No Makefile/docs script; no .github/workflows
Your live URL: https://cloudflare-workers-autoconfig-evoting-backend-docs.priyadarsanf2.workers.dev/

Part 1: Tags
1.1 Fix tags index page
Update [docs/tags.md](docs/tags.md):

# Tags

Browse documentation by topic:

###### DOCUMENTATION.md:9379-9401/name { #DOCUMENTATION.md:9379-9401/slug }
Keep tags_file: tags.md in [mkdocs.yml](mkdocs.yml) (still supported; renders clickable tags in the nav page). Optionally migrate later to marker-only (Material 9.6+ deprecates tags_file).

1.2 Define a small tag taxonomy
Use consistent, lowercase tags (Material merges and deduplicates):

Tag	Use on
auth	Auth API, JWT, sessions, org/user accounts
voting	Polls, votes, Casbin
organization	Org registration, org verification pipeline
verification	Email, Aadhaar, MCA/DNS
changelog	Release history
overview	Product / mission content
internal	Cursor audit/review notes (optional)
1.3 Add front matter to every nav page
File	Suggested tags
[docs/index.md](docs/index.md)	auth, voting, overview — remove placeholder markdown / tutorial / guide
[docs/whoarewe.md](docs/whoarewe.md)	overview
[docs/Change-log.md](docs/Change-log.md)	changelog
[docs/Cursor/security-performance-review-2026-06-02.md](docs/Cursor/security-performance-review-2026-06-02.md)	internal, auth, voting
[docs/Cursor/audit-gap-matrix.md](docs/Cursor/audit-gap-matrix.md)	internal, overview
1.4 Optional: folder-level tags via meta plugin
Add to [mkdocs.yml](mkdocs.yml):

plugins:
  - meta
  - search
  - tags:
      tags_file: tags.md
Create [docs/Cursor/.meta.yml](docs/Cursor/.meta.yml):

tags:
  - internal
So Cursor docs inherit internal without repeating it on every file.

1.5 Theme tweak (tags in header/search)
In [mkdocs.yml](mkdocs.yml) under theme:

features:
  - search.suggest
  - search.highlight
  - content.tags
Part 2: Versioning (mike)
flowchart LR
    sources[docs_on_main]
    mikeDeploy[mike_deploy_1.4.3_latest]
    ghPages[gh_pages_branch_or_site_dir]
    cf[Cloudflare_Workers_URL]

    sources --> mikeDeploy --> ghPages --> cf
2.1 Dependencies and site metadata
Update [requirements.txt](requirements.txt):

mkdocs
mkdocs-material
mike
Extend [mkdocs.yml](mkdocs.yml):

site_url: https://cloudflare-workers-autoconfig-evoting-backend-docs.priyadarsanf2.workers.dev/
repo_url: https://github.com/<your-org>/E-Voting  # fill real repo if public
edit_uri: edit/main/docs/

extra:
  version:
    provider: mike
    default: latest
(default: latest matches Material’s default alias; version dropdown appears only after at least one mike deploy.)

2.2 Version identifiers
Align doc versions with [docs/Change-log.md](docs/Change-log.md) release labels:

Initial deploy: **1.4.3** with alias **latest** (current API doc state)
Future releases: mike deploy 1.4.4 latest --update-aliases when you ship the next changelog section
Keep one version per released API doc snapshot, not per git commit.

2.3 Local commands (new [Makefile.docs](Makefile.docs) or root Makefile target) (Important)
Command	Purpose
pip install -r requirements.txt	Install mkdocs + material + mike
mkdocs serve	Fast edit loop (single tree, no version switcher)
mike deploy 1.4.3 latest --update-aliases	Build versioned site into deployment branch
mike set-default latest	Root redirect to latest alias
mike serve	Preview all versions locally (reads deployment branch)
mike list	Show deployed versions
First-time note: if you previously used mkdocs gh-deploy to Cloudflare root, run mike delete --all on the deployment branch once to avoid mixing unversioned and versioned layouts (per Material/mike guidance).

2.4 Cloudflare publish path
Mike stores built HTML under version directories (e.g. /1.4.3/, /latest/) plus versions.json for the header selector.

CI today: bash scripts/cloudflare-docs-build.sh → npx wrangler versions upload using wrangler.jsonc (assets.directory: ./site).

Mike versioned flow:

mike deploy 1.4.3 latest --update-aliases (optionally --push if deployment branch is gh-pages on GitHub)
Check out the deployment branch (or copy its tree)
Point wrangler.jsonc assets.directory at that tree (or upload manually) so /versions.json and version folders are included
2.5 Changelog ↔ version workflow (docs for maintainers)
When adding V 1.4.4 to Change-log:

Finish doc edits on main
mike deploy 1.4.4 latest --update-aliases
mike set-default latest (if not using --update-aliases alone)
Publish to Cloudflare
Old versions (e.g. 1.4.3) remain at /1.4.3/ for readers on older integrations
Part 3: Documentation updates
[README.md](README.md): link to DOCUMENTATION.md, mkdocs serve, mike serve, Cloudflare publish steps
[docs/Change-log.md](docs/Change-log.md): short note under V 1.4.x that doc site versioning uses mike (optional one-liner)
New [docs/DOCUMENTATION.md](docs/DOCUMENTATION.md): tags taxonomy, versioning commands, Cloudflare sync
Verification checklist
mkdocs build succeeds; Tags nav page lists all tagged pages
Tags appear on pages (header chips + search)
mike deploy 1.4.3 latest --update-aliases then mike serve shows version selector with 1.4.3 / latest
After Cloudflare upload, .../latest/ and .../1.4.3/ load; root redirects to default alias
Files to touch (summary)
File	Change
[mkdocs.yml](mkdocs.yml)	site_url, repo_url, theme features, optional meta plugin
[requirements.txt](requirements.txt)	add mike
[docs/tags.md](docs/tags.md)	###### DOCUMENTATION.md:16956-16978/name { #DOCUMENTATION.md:16956-16978/slug }
All [docs/*.md](docs/) nav pages	tags front matter
[docs/Cursor/.meta.yml](docs/Cursor/.meta.yml)	optional folder tags
[docs/DOCUMENTATION.md](docs/DOCUMENTATION.md)	new maintainer guide
[Makefile.docs](Makefile.docs) or [README.md](README.md)	serve / deploy commands
