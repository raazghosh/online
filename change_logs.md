# Change Logs  
(Types : Feature, Improvement, Deprecation, Bug Fix, Security Fix)

> Published API docs are versioned with [mike](https://github.com/jimporter/mike); see [DOCUMENTATION.md](../../meta/DOCUMENTATION.md).

### V 1.14.5

#### Google OAuth sign-in for web (Feature)
#### June 17th, 2026

- **`POST /auth/oauth/google`:** User Google sign-in / sign-up via Google ID token; issues web JWT pair (`token_channel: web`) with `access_token` in JSON and refresh token in `refresh_token_user` HttpOnly cookie.
- **`POST /auth/org/oauth/google`:** Organization Google sign-in / sign-up; requires `org_name` on first signup; sets `refresh_token_org` cookie.
- Same auto-link, avatar import, and error codes as mobile OAuth (ADR-032). Mobile endpoints unchanged.

### V 1.14.4

#### Google OAuth sign-in with profile picture import (Feature)
#### June 17th, 2026

- **Database:** Migration `000036` — `linked_identities` table; nullable `password_hash` on `users` / `organizations`.
- **`POST /auth/mobile/oauth/google`:** User Google sign-in / sign-up via Google ID token; issues mobile JWT pair (`token_channel: mobile`). Maps Google `email`, names, and verified-email trust flags; imports `picture` to Supabase `avatar_url` when none exists.
- **`POST /auth/org/mobile/oauth/google`:** Organization Google sign-in / sign-up; requires `org_name` on first signup.
- **Auto-link:** Verified Google email links to existing account with same email.
- **Password login:** OAuth-only accounts return `400 OAUTH_ACCOUNT`.
- See [ADR-032](../../decisions/032-google-oauth.md).

### V 1.14.3

#### Global email uniqueness across personal and organization accounts (Bug Fix)
#### June 17th, 2026

- **Policy:** One email may belong to either a personal user or an organization account, never both.
- **Database:** New `account_emails` table (`000035`) with backfill from `users` and `organizations`. Audit script: `scripts/audit-cross-type-emails.sql`.
- **`POST /auth/register`** and **`POST /auth/org/register`**: transactional registry insert; cross-type collisions return `409 EMAIL_ALREADY_EXISTS` (organization registration no longer returns `ORG_EMAIL_ALREADY_EXISTS` for email conflicts).
- **Error payload:** Optional `existing_account_type` (`user` | `organization`) on `EMAIL_ALREADY_EXISTS` for client UX. See [ADR-031](../../decisions/031-global-email-uniqueness.md).

### V 1.14.0

#### Team invite links, audit pagination, search avatars (Feature / Bug Fix)
#### June 16th, 2026

- **auth-service:** `teams.invite_token_enc` stores retrievable invite tokens; `GET .../invites/link` returns stable non-empty `token`; `invite_link_enabled` enforced on link fetch and team-level join (`403 INVITE_LINK_DISABLED`); `avatar_url` on `GET /auth/subjects/search` and `GET /auth/subjects/nearby`.
- **auth-service:** `listTeamAudit` and `listTeamMembershipHistory` `next_cursor` is the last row's opaque entry/event `id` (composite `(timestamp, id)` pagination); legacy RFC3339 timestamp cursors rejected.
- **share-web:** Guest `/teams/join` landing; AASA path `/teams/join*`.
- **Mobile parity:** Documented in [mobile changelog](./api-mobile.md) V 1.14.1–1.14.2.

---

### V 1.13.0

#### Feed tier ranking (Feature)
#### June 16th, 2026

- **auth-service:** `GET /auth/internal/subjects/:account_type/:id/mutual-follows` (internal token).
- **vote-service:** `scope=feed` orders polls in three tiers — own + mutual follows, then public, then residual — with tier-aware cursor pagination (`base64(tier|created_at_ns|id)`).
- **Mobile parity:** Documented in [mobile changelog](./api-mobile.md) V 1.13.0.
- **ADR:** [029-feed-ranking.md](../../decisions/029-feed-ranking.md)

---

### V 1.12.1

#### Structured social links (Feature)
#### June 16th, 2026

- **auth-service:** `subject_social_links` table; `PUT /auth/me/social-links`, `PUT /auth/org/me/social-links` (replace-all); public profiles include `social_links`.
- **auth-service:** Idempotent follow/unfollow (`ON CONFLICT DO NOTHING`).
- **Mobile parity:** Documented in [mobile changelog](./api-mobile.md) V 1.12.0.
- **ADR:** [028-structured-social-links.md](../../decisions/028-structured-social-links.md)

---

### V 1.12.0

#### Username URLs and suggestions (Feature)
#### June 16th, 2026

- **auth-service:** Username availability, suggestions, profile resolver by handle; share URL `/@username`; legacy redirect hints.
- **share-web:** `/@username` landing, 308 from `/users/:id` and `/org/:id` when handle exists.
- **Mobile parity:** Documented in [mobile changelog](./api-mobile.md) V 1.14.0.
- **ADR:** [028-username-profile-urls.md](../../decisions/028-username-profile-urls.md)

---

### V 1.11.1

#### Account self-delete (Feature)
#### June 16th, 2026

- **auth-service:** `DELETE /auth/me`, `DELETE /auth/org/me` with password confirmation; soft-delete + poll purge saga.
- **vote-service:** Internal subject poll purge endpoint for account deletion worker.
- **Mobile parity:** Documented in [mobile changelog](./api-mobile.md) V 1.13.1.

---

### V 1.11.0

#### Profile social features (Feature)
#### June 16th, 2026

- **auth-service:** Bio, global username, follow graph, follower privacy (see mobile changelog V 1.11.0).
- **vote-service:** Profile engagement stats endpoints.
- **ADR:** [026-subject-follow-graph.md](../../decisions/026-subject-follow-graph.md), [027-profile-bio-usernames.md](../../decisions/027-profile-bio-usernames.md)

---

### V 1.10.5

#### Public profile poll lists (Feature)
#### June 16th, 2026

- **vote-service:** `scope=profile` on `GET /vote/v1/polls` with `admin_id` + `admin_account_type` (public polls only).
- **Guest routes:** `GET /vote/v1/public/users/:id/polls`, `GET /vote/v1/public/org/:id/polls`.
- **Mobile API parity:** Same contracts documented in [mobile changelog](./api-mobile.md) V 1.10.6.
- **ADR:** [025-profile-public-poll-lists.md](../../decisions/025-profile-public-poll-lists.md)

---

### V 1.10.4

#### Subject ID normalization (Bug Fix)
#### June 15th, 2026

- **vote-service:** Normalizes numeric subject IDs when calling `POST /auth/internal/subjects/display-names` and when mapping responses to poll list `admin_display_name` (fixes key mismatch when auth returns canonical `id` values).

---

### V 1.10.3

#### Subject display names resilience (Bug Fix)
#### June 15th, 2026

- **Auth internal**: `POST /auth/internal/subjects/display-names` treats avatar URL batch lookup as best-effort; display names, trust, and verification are still returned when `avatar_url` columns are missing or avatar queries fail.

---

### V 1.10.2

#### Avatar upload limits (Improvement)
#### June 15th, 2026

- `POST .../avatar/upload` accepts JPEG, PNG, or WEBP (max 1 MB); see [mobile changelog](./api-mobile.md) V 1.10.2.

---

### V 1.10.1

#### Verified photo avatars (Feature)
#### June 15th, 2026

- `avatar_config.variant: "photo"` for verified **user** accounts only; auth-service enforces `is_verified` (see [mobile changelog](./api-mobile.md) V 1.10.1).

---

### V 1.10.0

#### Pixel avatars (Feature)
#### June 15th, 2026

- Same avatar endpoints (`POST .../avatar/upload` server-side PNG + signed-url fallback) and `admin_avatar_url` feed enrichment as [mobile changelog](./api-mobile.md) V 1.10.0.
- Public profiles: `avatar_url` on `GET /auth/users/:id`, `GET /auth/org/:id`.
- Web UI consumption deferred; API contracts ready.

---

### V 1.9.1

#### Notifications mark-all-read (Feature)
#### June 15th, 2026

- **`POST /vote/v1/notifications/read-all`**: bulk mark all unread notifications read for the authenticated user and `recipient_account_type`.
- Mobile Notifications tab: **Mark all as read** control; list bottom inset accounts for tab bar and FAB.

---

### V 1.9.0

#### Team leave (Feature)
#### June 14th, 2026

- **`POST /auth/v1/teams/:teamId/leave`**: user voluntary leave; distinct from admin `DELETE .../members/:userId` (`removed` vs `left` history).
- Errors: `409 LAST_OWNER`, `409 TEAM_DELETING`, `404` for non-members.

#### Teams feature (Feature)
#### June 14th, 2026

- **`/auth/v1/teams`**: CRUD, members, roles, invites, join, membership history, audit (ADR-021).
- **`POST /vote/v1/polls`**: `team_id` + `visibility=team`; roster captured in `poll_eligibility_snapshots`.
- **`GET /vote/v1/polls?scope=team&team_id=`**: team-scoped poll list.
- **Internal**: auth roster/authorize; vote idempotent team poll purge for delete saga.
- See [Teams engineering docs](../teams/index.md).

---

### V 1.8.11

#### Per-poll encryption choice + dashboard labels (Feature / Bug Fix)
#### June 13th, 2026

- **`POST /vote/v1/polls`**: optional `show_live_results` — creators choose live vote counts (`legacy_plaintext`) vs encrypted ballots (`e2e_encrypted`, default when E2E is configured).
- **`GET /vote/v1/polls/:pollId/dashboard/security`**: documents both `encryption_status` values — `tls_active` and `e2e_active`.
- See [poll encryption choice design](../../superpowers/specs/2026-06-13-poll-encryption-choice-design.md) and [E2E ballot encryption plan](../engineering/planning/e2e-ballot-encryption.md).

---

### V 1.8.10

#### E2E active results display (Improvement)
#### June 14th, 2026

- **`GET /vote/v1/polls/:pollId/tally`** and **`GET /vote/v1/polls/:pollId/results`**: add `ballot_mode`, `choices_hidden`, `tally_complete` to `PollResult` for E2E polls.
- Active E2E polls: `choices_hidden=true`, `total_votes` reflects participation count, per-option counts stay zero until tally.
- See [E2E active results UX](../../specs/2026-06-14-e2e-active-results-ux.md).

---

### V 1.8.9

#### Platform E2E ballot encryption (Security / Feature)
#### June 13th, 2026

- **`POST /vote/v1/polls`**: new polls use `ballot_mode=e2e_encrypted` when `E2E_BALLOT_ENABLED=true`; generates per-poll keys in `poll_crypto`.
- **`GET /vote/v1/polls/:pollId`**: returns `ballot_mode`, `election_public_key`, `crypto_algorithm`, `tally_complete`.
- **`POST /vote/v1/polls/:pollId/vote`**: E2E polls accept `encrypted_ballot`, `ballot_hash`, `client_crypto_version`; response includes `ballot_receipt`.
- **`GET /vote/v1/polls/:pollId/voters`**: E2E polls return `participants` only (`choices_hidden: true`).
- **Dashboard**: `encryption_status` is `e2e_active` for E2E polls; `cryptographic_seal` is `sealed` / `tallied`.
- **Env**: `E2E_BALLOT_ENABLED`, `PLATFORM_BALLOT_MASTER_KEY` (32-byte base64) on vote-service.
- See [ADR-020](../../decisions/020-platform-e2e-ballot-encryption.md).

---

### V 1.8.7

#### Email invite verification gate and org support (Feature)
#### June 14th, 2026

- **`POST /vote/v1/polls`**: `email_invites[]` now requires creator `is_verified` (user or organization) — returns `403 INVITER_NOT_VERIFIED` when unverified.
- **Organization creators**: verified organizations may send `email_invites`; self-invite check uses org account email.
- **Auth internal**: `GET /auth/internal/creators/:accountType/:id/verification` (`{ is_verified, is_trusted, email }`); `GET /auth/internal/organizations/:id/email`.
- See [ADR-019](../../decisions/019-poll-email-invites.md) amendment.

---

### V 1.8.6

#### Poll email invites (Feature)
#### June 12th, 2026

- **`POST /vote/v1/polls`**: optional `email_invites[]` (max 50); response `email_invites_summary` with `requested`, `sent`, `skipped`, `failed`, `items[]`.
- **`GET /vote/v1/polls/:pollId`**: admin-only `email_invites[]` with status and timestamps.
- **Access**: accepted email invites grant private-poll view/vote (reconciled into `poll_tags`); `is_tagged` includes reconciled invitees.
- **Auth internal**: `POST /auth/internal/users/lookup-by-emails`, `GET /auth/internal/users/:id/email`, `POST /auth/internal/users/emails-by-ids`, `GET /auth/internal/creators/:accountType/:id/verification`, `GET /auth/internal/organizations/:id/email`.
- **Vote internal**: `POST /vote/v1/internal/reconcile-email-invites` (called after login/email verify).
- **Env**: `RESEND_API_KEY`, `RESEND_FROM_EMAIL` on vote-service; `VOTE_SERVICE_URL` on auth-service.
- **api-client**: `EmailInvite`, `email_invites` on `CreatePollPayload`, Zod schemas for summary and admin detail.
- See [ADR-019](../../decisions/019-poll-email-invites.md) and Web API guide §8.2.
- **UX guidance (no API change)**: web poll-creation UI should follow the mobile unified-invite pattern — search by name or email, route resolved users to `poll_tags`, unknown emails to `email_invites` only.

---

### V 1.8.5

#### Shareable links and rich previews (Feature)
#### June 12th, 2026

- **share-web**: standalone Next.js repo (`securevote-share-web`) deployed at `APP_SHARE_BASE_URL` with SSR OG pages for polls, users, and organizations; legacy `/poll/:id` redirects to `/polls/:id`. No longer in the E-Voting monorepo.
- **Public previews** (no JWT, rate limited): `GET /vote/v1/public/polls/:pollId/preview`; `GET /auth/public/users/:id/preview`; `GET /auth/public/org/:id/preview`.
- **Share APIs**: `GET /vote/v1/polls/:pollId/share` now requires poll view access (not admin dashboard); URL format `{APP_SHARE_BASE_URL}/polls/{id}`; `GET /auth/users/:id/share`; `GET /auth/org/:id/share`.
- **Env**: `APP_SHARE_BASE_URL` on vote-service, auth-service, and share-web.
- See [ADR-016](../../decisions/016-shareable-links-and-previews.md) and [Shareable links design spec](../../specs/2026-06-12-shareable-links-design.md).

---

### V 1.8.4

#### Nearby subject discovery (Feature)
#### June 11th, 2026

- **PostGIS**: migration `000024` adds `subject_locations` with geography point and GIST index.
- **Location APIs**: sharing toggle/status and location update for users and organizations.
- **Nearby**: `GET /auth/subjects/nearby` with two-phase radius + KNN fallback; response `mode` field.
- **Rate limits**: location `PUT` 1/30s per subject; nearby `GET` 60/min per viewer.
- **api-client**: location and nearby schemas/methods.
- See [ADR-015](../../decisions/015-nearby-subject-discovery.md) and [Nearby design spec](../../specs/2026-06-11-nearby-users-design.md).

---

### V 1.8.3

#### Cross-type search and public profiles (Feature)
#### June 11th, 2026

- **Org public profile**: `GET /auth/org/:id` returns `org_name` and verification badges only — no email, registration ID, or domain.
- **Internal enrichment**: `POST /auth/internal/subjects/public-summaries` for vote-service cross-subject bulk resolution (users + organizations).
- **Tag recommendations**: `GET /vote/v1/users/tag-recommendations` now includes users and organizations; response adds `account_type` and optional `org_name`.
- **api-client**: `getOrgPublicProfile`, `orgPublicProfileSchema`; extended `tagRecommendationSchema`.
- See [ADR-014](../../decisions/014-cross-type-search-profiles.md) and [Cross-type search design spec](../../specs/2026-06-11-cross-type-search-design.md).

---

### V 1.8.2

#### Mobile Search tab (Feature)
#### June 11th, 2026

- **User search**: `GET /auth/users/search` moved to shared auth (user + organization tokens).
- **Public profile**: `GET /auth/users/:id` returns name and verification badges only — no email or gov-ID fields.
- **Internal enrichment**: `POST /auth/internal/users/public-summaries` for vote-service bulk public-safe user resolution.
- **Tag recommendations**: `GET /vote/v1/users/tag-recommendations` unions poll tag tables with composite identity.
- **api-client**: `getUserPublicProfile`, `getTagRecommendations`, `userPublicProfileSchema`, `tagRecommendationSchema`.
- See [ADR-013](../../decisions/013-user-search-and-recommendations.md) and [Search design spec](../../specs/2026-06-11-search-design.md).

---

### V 1.8.1

#### Forgot password stale OTP (Bug Fix)
#### June 10th, 2026

- **`POST /auth/forgot-password/send-otp`**: invalidates previous unused reset codes for the email before saving a new OTP (fixes verify failures when users resend or double-tap).
- **`POST /auth/forgot-password/verify-otp`**: trims whitespace from `otp`.
- See [Forgot Password](../web/api-guide.md#781-forgot-password) for the full three-step contract.

---

### V 1.8.0

#### Expo push notifications (Feature)
#### June 6th, 2026

- **`push_tokens` table** and migration `000017` for Expo device tokens keyed by `(user_id, account_type)`.
- **Notification types**: `poll_started` and `poll_ended` for tagged subjects when polls open or close (manual, scheduled, or expiry worker).
- **Push dispatch**: async Expo Push API delivery for all notification types when `PUSH_NOTIFICATIONS_ENABLED=true`; stale tokens are removed automatically.
- **Push token API**: `PUT /vote/v1/push-tokens`, `DELETE /vote/v1/push-tokens`.
- **Auto-start at create**: polls with `auto_start: true` skip a separate `poll_started` notification (already active).

---

### V 1.7.3

#### Verification badge data on poll and search responses (Improvement)
#### June 6th, 2026

- **Poll list**: rows include `admin_is_trusted` and `admin_is_verified` for creator verification badges.
- **Poll detail**: `poll_tags[]` includes `tagged_is_trusted` / `tagged_is_verified`; `option_contributions[]` includes `added_by_is_trusted` / `added_by_is_verified`.
- **Auth internal**: `POST /auth/internal/subjects/display-names` returns `is_trusted` and `is_verified` per subject.
- **Subject search**: `GET /auth/subjects/search` returns `is_trusted` and `is_verified` on each result row.

---

### V 1.7.2

#### Composite voter identity (Bug Fix)
#### June 6th, 2026

- **`votes.voter_account_type`**: new column; uniqueness is `(poll_id, user_id, voter_account_type)` instead of `(poll_id, user_id)` only.
- **Vote deduplication**: user `5` and organization `5` may each cast one ballot on the same poll; `has_voted` and `409 Already voted` are scoped to caller `(user_id, account_type)`.
- **List/feed/participated**: `has_voted` and participated scope match JWT account type.
- **Results auth**: `view_result` voter check uses composite voter identity.
- Migration `000016`. See [ADR-012](../../decisions/012-composite-voter-identity.md).

---

### V 1.7.1

#### Add option retry safety and org attribution (Bug Fix)
#### June 6th, 2026

- **`poll_option_contributions`**: new `added_by_account_type` column; `added_by_display_name` now resolves via subject-aware lookup (fixes org-added options showing user names on ID collision).
- **Add option idempotency**: `POST /vote/v1/polls/:pollId/options` accepts optional `client_request_id`; reusing the same key for the same contributor returns the existing poll instead of duplicating options after lost responses.
- Migration `000015`.

---

### V 1.7.0

#### Cross-subject tagging and composite poll identity (Feature)
#### June 6th, 2026

- **Composite ownership**: poll admin, `is_admin`, Casbin, and private-poll access use `(admin_id, admin_account_type)` — fixes user/org ID collisions.
- **Tag subjects**: `poll_tags.subjects` and `option_tags[].subjects` accept `{ id, account_type }` (`user` | `organization`). `user_ids` shorthand remains (`account_type=user`).
- **Tag responses**: `poll_tags` / `option_tags` include `tagged_account_type` and `tagged_by_account_type`.
- **Auth internal**: `POST /auth/internal/subjects/validate-tags` validates active users and organizations.
- **Auth search**: `GET /auth/subjects/search` (both account types) returns users and organizations.
- **Notifications**: `recipient_account_type` on `notifications` for org/user disambiguation.
- Migration `000014`. See [ADR-011](../../decisions/011-cross-subject-tagging.md).

---

### V 1.6.9

#### Organization poll creator identity (Bug Fix)
#### June 6th, 2026

- **`admin_account_type`**: new column on `polls` (`user` | `organization`, default `user`). Set from JWT `account_type` at poll creation.
- **List/detail responses**: poll objects and list rows include `admin_account_type`.
- **Creator display names**: `GET /vote/v1/polls` resolves `admin_display_name` via typed internal endpoint `POST /auth/internal/subjects/display-names` (users and organizations batched separately).
- **Existing polls**: no automatic backfill; pre-fix org polls remain `admin_account_type=user` unless updated manually.
- Migration `000013`.

---

### V 1.6.8

#### Tagged users can add poll options (Feature)
#### June 6th, 2026

- **`allow_tagged_add_options`**: new boolean on `polls` (default `false`). `POST /vote/v1/polls` accepts the field; requires at least one tag when `true`.
- **`poll_option_contributions`**: tracks post-create option additions (`option_idx`, `added_by_user_id`).
- **`POST /vote/v1/polls/:pollId/options`**: append option while `status=created`; creator or tagged user (when toggle on); max 8 options.
- **`DELETE /vote/v1/polls/:pollId/options/:optionIdx`**: creator removes option while `status=created`; min 2 options; reindexes `poll_option_tags` and contributions.
- **`GET /vote/v1/polls/:pollId`**: returns `allow_tagged_add_options` and `option_contributions` with `added_by_display_name`.
- Migration `000012`. See [ADR-010](../../decisions/010-tagged-user-add-options.md).

---

### V 1.6.7

#### Visibility-only poll access (Improvement)
#### June 6th, 2026

- **Public polls:** any authenticated user can view at all statuses (draft, scheduled, active, ended) via feed and `GET /vote/v1/polls/:pollId`.
- **Private polls:** view access limited to poll admin and tagged users only; prior voters no longer receive feed or direct-open access.
- **Feed rule 4:** all other users' public polls (any status). Feed rule 2 (voted) applies to public polls only.
- Supersedes V 1.6.6 status-based direct-open gating.

---

### V 1.6.6

#### Draft/scheduled poll direct access (Security Fix)
#### June 6th, 2026

- **Direct open gating**: `GET /vote/v1/polls/:pollId` and `/tally` return `404` for strangers on public polls with `status=created` (draft or scheduled). Poll admin and tagged users retain access before voting starts.
- **Feed unchanged**: scheduled public polls remain discoverable in `scope=feed`; opening the poll by ID is blocked until `active` or `ended` unless admin/tagged.

---

### V 1.6.5

#### Poll visibility (Feature)
#### June 6th, 2026

- **Visibility field**: `POST /vote/v1/polls` accepts optional `visibility`: `public` (default) or `private` (See [ADR-009](../../decisions/009-poll-visibility.md)).
- **Feed scope**: `scope=feed` public-discovery rule applies only to `visibility = public` polls from other users.
- **Access control**: `GET /vote/v1/polls/:pollId` and `/tally` return `404` for unauthorized users on private polls. `POST /vote` returns `403` for untagged users on private polls.
- **List items**: `GET /vote/v1/polls` rows include `visibility` for feed UI.

---

### V 1.6.4

#### Poll-level user tagging (Feature)
#### June 6th, 2026

- **Poll-level tags**: `POST /vote/v1/polls` accepts optional `poll_tags: { "user_ids": ["43"] }` to mention users on the poll itself (distinct from option-level `option_tags`; See [ADR-008](../../decisions/008-poll-level-user-tagging.md)).
- **Poll responses**: create and `GET /vote/v1/polls/:pollId` include `poll_tags` when present.
- **Notifications**: tagged users receive `poll_tagged` notifications with `{ poll_id, poll_title }` payload.
- **Feed and list**: `scope=feed` and `is_tagged` union `poll_tags` and `poll_option_tags`.
- **Dashboard**: eligible-voter count unions distinct users from both tag tables.

---

### V 1.6.3

#### Poll creator display names on list items (Feature)
#### June 6th, 2026

- **List item `admin_display_name`**: `GET /vote/v1/polls` rows now include the poll creator's display name, resolved in batch from auth-service.
- **Auth internal**: `POST /auth/internal/users/display-names` returns `users[]` with `id` and `display_name` for the requested user IDs (any account status).

---

### V 1.6.2

#### Voting trend graph removed (Deprecation)
#### June 6th, 2026

- **Removed** `GET /vote/v1/polls/:pollId/dashboard/vote-trend` and trend bucket rows from poll CSV export. The Election Control Center Live Command card now shows live stats only (votes/min, active now, viewing).

---

### V 1.6.1

#### Vote trend chart enrichment (Improvement)
#### June 6th, 2026

- **`GET /vote/v1/polls/:pollId/dashboard/vote-trend`**: response now includes `range_start`, `range_end`, and optional `vote_events[]` (per-vote timestamps with cumulative count when total votes ≤ 50). Bucket intervals remain duration-based (1m / 5m / 15m / 1h).

---

### V 1.6.0

#### Election Control Center dashboard APIs (Feature)
#### June 6th, 2026

- **Dashboard endpoints**: poll-scoped `GET /vote/v1/polls/:pollId/dashboard/{summary,live,security,activity,audit,verification}` for admin control center (See [ADR-007](../../decisions/007-poll-dashboard-api.md)).
- **Manage actions**: `POST /pause`, `/resume`, `/extend`; `GET /export` (CSV), `/share`; `POST /presence` heartbeat.
- **Pause columns**: `polls.is_paused`, `paused_at`, `total_paused_seconds`; votes rejected with 409 when paused.
- **Audit tables**: `vote_attempt_events`, `poll_audit_events`, `poll_admin_actions`, `poll_presence_events`.
- **Enriched tally**: `GET /tally` includes optional `standings[]` with leader margin.
- **Detailed health**: `GET /vote/v1/health/detailed` pings vote DB and auth `/health`.
- **Auth internal**: `POST /auth/internal/users/verification-summary` for bulk voter verification breakdown.

---

### V 1.5.4

#### Poll option tagging completion (Feature)
#### June 5th, 2026

- **Tagged option labels**: when `option_tags` is supplied, vote-service overwrites each tagged option's stored label with the tagged user's display name (See [ADR-006](../../decisions/006-poll-option-user-tagging.md)).
- **Internal validate-tags response**: `POST /auth/internal/users/validate-tags` now returns `users[]` with `id` and `display_name` for valid user IDs.
- **List item `is_tagged`**: poll list rows include `is_tagged: true` when the authenticated user appears in `poll_option_tags`.

---

### V 1.5.3

#### Feed scope for poll list (Feature)
#### June 5th, 2026

- **Feed list scope**: `GET /vote/v1/polls?scope=feed` returns my polls, tagged polls, voted polls, and public discoverable polls ordered by `created_at` descending (See [ADR-005](../../decisions/005-feed-scope.md)).
- **List item fields**: poll list rows now include `admin_id` and `created_at`.

---

### V 1.5.2

#### User Tagging for Poll Options (Feature)
#### June 5th, 2026

- **Create poll tagging**: `POST /vote/v1/polls` accepts optional `option_tags` entries that associate active users with specific poll options.
- **Create poll idempotency**: `POST /vote/v1/polls` accepts optional `client_request_id`; retrying the same key for the same creator returns the existing poll instead of creating duplicates after lost responses.
- **User search for tagging**: `GET /auth/users/search` lets authenticated user clients search active users by name/email for the tagging picker.
- **Poll responses**: `POST /vote/v1/polls` and `GET /vote/v1/polls/:pollId` include `option_tags` when present.
- **Poll detail vote state**: `GET /vote/v1/polls/:pollId` now includes caller-scoped `has_voted` so clients can disable duplicate vote controls immediately.
- **Tagged user notifications**: Added `GET /vote/v1/notifications` and `POST /vote/v1/notifications/:notificationId/read`.
- **Internal validation**: vote-service validates tagged users through auth-service using `AUTH_SERVICE_URL` and `INTERNAL_API_TOKEN`.

---

### V 1.5.1

#### Rate Limiting Coverage (Security Fix / Improvement)  
#### June 5th, 2026

- **Auth-service rate limiting** now covers login, registration, refresh, and protected auth APIs across email, IP, user, and device fingerprint dimensions where applicable.
- **Vote-service rate limiting** added for authenticated `/vote/v1` APIs with structured `429 RATE_LIMITED` responses and `Retry-After` headers.
- **Device fingerprint header**: clients may send `X-Device-Fingerprint` on auth and vote API requests for stronger abuse detection.
- **Configurable policies**: default windows and thresholds can be tuned with `RATE_LIMIT_*` environment variables.

---

### V 1.5.0

#### Mobile API and Poll Listing (Feature)  
#### June 4th, 2026

- **Mobile authentication** (`POST /auth/mobile/*`, `POST /auth/org/mobile/*`): Login, refresh, and logout return refresh tokens in JSON with `token_channel: "mobile"`; web cookie flow unchanged.
- **List polls** (`GET /vote/v1/polls`): `scope=admin|participated`, cursor pagination, `has_voted` / `is_admin` summary fields.
- **Poll tally** (`GET /vote/v1/polls/:pollId/tally`): Live vote counts for `active` or `ended` polls — no `view_result` gate (unlike `/results`).
- **Create poll validation**: Rejects past `voting_start_at` / `voting_end_at`; enforces `duration_minutes` + `auto_start` mutual-exclusion rules documented in Section 8.2.
- **ADRs** added under `docs/decisions/` for mobile auth, Expo layout, API client errors, and poll list contract.

---

### V 1.4.4

#### Organization Sessions and Recheck Errors (Bug Fix / Improvement)  
#### June 4th, 2026

- **`GET /auth/sessions` for organizations**: Route moved to shared auth middleware so organization tokens are accepted; handler lists sessions by `account_type` (`org_id` vs `user_id` query).
- **Recheck API error specificity** (`POST /auth/org/verify/recheck`): New codes `ORG_NOT_VERIFIED`, `MCA_VERIFICATION_NOT_FOUND`, `INVALID_MCA_RESPONSE`, `UNKNOWN_ENTITY_TYPE`; `NO_VERIFICATION_IN_PROGRESS` reserved for pipeline steps. Enforce mode hard failures return `ORG_VERIFICATION_EXPIRED` (403) after revoking verification.

---

### V 1.4.3

#### Organization Verification Step Errors (Improvement)  
#### June 2nd, 2026

- Re-submitting a completed verification step returns a dedicated **409** code instead of generic `INVALID_VERIFICATION_STEP`:
  - `REGISTRATION_NUMBER_STEP_COMPLETE` — registration already done; proceed to `submit-domain`
  - `DOMAIN_STEP_COMPLETE` — domain already done; proceed to `verify-dns`
- `assertVerificationStep` helper in `org_verification_service.go` centralizes step guards for submit-registration-number, submit-domain, and verify-dns

---

### V 1.1.1

#### Verification Pipeline and Poll Start Fixes

- **Poll start error message**: Starting an already-active poll now returns `400 { "error": "Poll already started" }` instead of the generic "Poll cannot be started".
- **Recheck verification for non-trusted users**: Fixed 500 error when `email_risk_status` is NULL — recheck now returns 200 with a proper verification breakdown.
- **Aadhaar status pipeline errors**: `GET /auth/aadhaar/status` returns `403 USER_NOT_TRUSTED` for unverified email users and `404 AADHAAR_NOT_FOUND` when no record exists, instead of 500.
- **`care_of` default**: Migration `000020` sets `user_aadhaar_verifications.care_of` to `NOT NULL DEFAULT ''`; nullable text columns use `COALESCE` on read.
- **Verified status pipeline**: `GET /auth/me/verified` returns tiered 403 errors — `USER_NOT_TRUSTED`, `AADHAAR_VERIFICATION_REQUIRED`, or `USER_NOT_VERIFIED` — based on the user's position in the verification pipeline.

---

### V 1.0.0

Initial release

---


### V 1.0.1

#### Modify Signup and Signin

- Change the API route path 'user' to 'auth' for logout , me.
- Updates Sign up and sign in credentials : Check Sign-up and Sign-in API endpoints
- Adding more API endpoints : Sessions, send-verification, verify-email API endpoints

- Need a domain for working Email OTP verification. Till now only working with my email (`priyadarsanf2@gmail.com`)

- Email verification after login
- **Login no longer blocks unverified users**: The `email_not_verified` check has been removed from `POST /auth/login`. Users can now sign in regardless of email verification status.
- **Verification endpoints now require authentication**: `POST /auth/send-verification` and `POST /auth/verify-email` are moved behind the Auth middleware. They require a valid Bearer token and use the authenticated user's identity (from JWT) instead of accepting an email in the request body.
- **Verify Email request body simplified**: Only `{ "otp": "..." }` is needed — email is derived from the authenticated session.
- **Register & Login request bodies updated**: Added `first_name` and `last_name` fields (required) plus optional `device_fingerprint` and `device_info` objects for device fingerprinting to both Register and Login endpoints.
- **Added `GET /auth/sessions` API documentation**: New section documenting the List Sessions endpoint.
- **Updated `/auth/me` response**: Documented all response fields (FirstName, LastName, EmailVerified, MfaEnabled, Status, CreatedAt, LastLoginAt).


---

### V 1.1.0

#### Implement Configurable Email Reputation Verification

- **New Backend Modules:**
  - `internal/models/email_reputation.go` — Typed structs matching the full Abstract API response schema plus a processed result struct
  - `internal/config/feature_flags.go` — `GetEmailReputationMode()` helper that reads `EMAIL_REPUTATION_MODE` from env with validation
  - `internal/validator/email_risk.go` — `ValidateEmailRisk()` reusable validator with mode-specific logic
  - `internal/service/email_reputation.go` — `CheckEmailReputation()` service with HTTP client (5s timeout), graceful fallback, and detailed logging

- **Three Runtime Modes:**
  - `disabled` — Skips all checks, no external API calls. Default for local development.
  - `monitor` — Calls Abstract API, logs suspicious/disposable/risky emails, rejects only technically undeliverable (SMTP/MX failures). Safe for demos and beta.
  - `enforce` — Strict validation: rejects disposable, undeliverable, high-risk, and low-score (< 0.5) emails. Production-grade.

- **Database Migration:**
  - `000008_add_email_reputation_fields` — Added `email_reputation_score` (DOUBLE PRECISION), `email_risk_status` (TEXT), `email_checked_at` (TIMESTAMPTZ) to `users` table

- **Backend Integration:**
  - Updated `Register` handler to call `CheckEmailReputation` after email format validation
  - Updated `RegisterUser` service to accept and store reputation results
  - Updated `CreateUser` repository INSERT to include 3 new reputation columns
  - Added 4 new error constants (`ErrDisposableEmailReputation`, `ErrEmailNotDeliverable`, `ErrHighRiskEmail`, `ErrLowReputationScore`)

- **Graceful Fallback:**
  - If Abstract API fails (network error, timeout, bad status), registration continues with reputation status marked as `"unchecked"`
  - No panic, no `log.Fatal` — production-safe error wrapping throughout

- **Environment Configuration:**
  - Added `EMAIL_REPUTATION_MODE` and example comments to `.env.sample`
  - Startup logs the active reputation mode

- **API Documentation:**
  - Added new error codes to Auth Service Errors table (`DISPOSABLE_EMAIL`, `EMAIL_NOT_DELIVERABLE`, `HIGH_RISK_EMAIL`, `LOW_REPUTATION_SCORE`)
  - Added Email Reputation Verification section (7.10) with mode descriptions, enforcement rules, example responses, and security notes

---

### V 1.2.0

#### Implement Aadhaar Verification (Feature)
#### May 29th, 2026  

- **New Backend Modules:**
  - `internal/models/aadhaar.go` — Typed structs matching Sandbox OKYC API request/response schemas plus `UserAadhaarVerification` model for DB persistence
  - `internal/repository/aadhaar_repository.go` — Full CRUD for `user_aadhaar_verifications` table (save, get by reference_id, get by user, update with e-KYC data)
  - `internal/service/sandbox_service.go` — Sandbox JWT authentication service with in-memory token cache (23h expiry), `callSandboxAPI()` helper, and `enforceAadhaarFallback()` mode-aware error handler
  - `internal/service/aadhaar_service.go` — `GenerateAadhaarOTP`, `VerifyAadhaarOTP`, and `GetAadhaarStatus` business logic with mode-aware fallback
  - `internal/handler/aadhaar_handler.go` — Three Gin handlers for the Aadhaar endpoints

- **Three Runtime Modes:**
  - `disabled` — All Aadhaar endpoints return `AADHAAR_FEATURE_DISABLED`. No external API calls. Default for local development.
  - `monitor` — Feature active; on API failure logs warning and falls back gracefully (operation may succeed with limited data)
  - `enforce` — Strict validation: API failure blocks the operation entirely

- **Database Migrations:**
  - `000009_add_aadhaar_fields_to_users` — Added `is_aadhaar_verified` (BOOLEAN, default false) and `aadhaar_verified_at` (TIMESTAMPTZ) to `users` table
  - `000010_create_aadhaar_verifications_table` — Created `user_aadhaar_verifications` table with reference_id, status, full e-KYC data (name, care_of, full_address, date_of_birth, gender, photo, structured address fields), plus index on user_id

- **New API Endpoints (all auth-protected):**
  - `POST /auth/aadhaar/generate-otp` — Generate OTP sent to Aadhaar-linked mobile number
  - `POST /auth/aadhaar/verify-otp` — Verify OTP and retrieve e-KYC data
  - `GET /auth/aadhaar/status` — Get latest Aadhaar verification status

- **Email Verification Prerequisite:**
  - All Aadhaar endpoints reject requests with `EMAIL_NOT_VERIFIED` (403) if the user has not verified their email — regardless of Aadhaar verification mode

- **Error Handling:**
  - Added 6 new error constants: `AADHAAR_FEATURE_DISABLED`, `AADHAAR_OTP_EXPIRED`, `AADHAAR_INVALID_OTP`, `AADHAAR_VERIFICATION_FAILED`, `AADHAAR_ALREADY_VERIFIED`
  - Graceful fallback in monitor mode: Sandbox API failures log warnings but don't block
  - Enforce mode: Sandbox API failures propagate as `AADHAAR_VERIFICATION_FAILED`

- **Session Resumption:**
  - `reference_id` stored in `user_aadhaar_verifications` table
  - Users can navigate away and return — `GET /auth/aadhaar/status` returns pending verification reference_id

- **Environment Configuration:**
  - Added `GetAadhaarVerificationMode()` to `config/feature_flags.go`, reads `AADHAAR_VERIFICATION_MODE` env var (disabled/monitor/enforce)
  - Uses existing `SANDBOX_API_KEY` and `SANDBOX_LIVE_API_SECRET_KEY` env vars

- **API Documentation:**
  - Added new Aadhaar error codes to Auth Service Errors table
  - Added Aadhaar Verification section (7.10) with mode descriptions, endpoint docs, request/response examples, error tables, session resumption guidance
  - Updated `/auth/me` response to include `IsAadhaarVerified` and `AadhaarVerifiedAt` fields
  - Updated Table of Contents with Aadhaar section links

- **Naming Conventions:**
  - Use the actual name when you Register for your account. Because when you verify your account , we'll match the name you provided with the Aadhaar data we have on file.

---

### V 1.2.1

#### Implement Verification Check (Feature)
#### May 30th, 2026

- **New API Endpoints:**
  - `GET /auth/me/verified` — Simple check of the user's `is_verified` field. Returns `200 { "is_verified": true }` if verified, or `403 USER_NOT_VERIFIED` if not.
  - `POST /auth/me/recheck-verification` — Re-runs all 5 verification conditions (email verified, reputation score ≥ 0.5, risk status = low, aadhaar verified, name match) and updates `is_verified` in the DB if all pass. Always returns 200 with a detailed breakdown including `is_verified`, individual `checks`, and `missing` reasons.

- **Verification Conditions (all must pass for `is_verified = true`):**
  1. Email verified (`email_verified = true`)
  2. Email reputation score ≥ 0.5
  3. Email risk status is "low"
  4. Aadhaar verified (`is_aadhaar_verified = true`)
  5. Aadhaar name matches registered name (case-insensitive, whitespace-normalized)

- **Database Migration:**
  - `000011_add_is_verified_field` — Added `is_verified` (BOOLEAN, default false) to `users` table

- **Backend Integration:**
  - Existing verification actions (email OTP, aadhaar OTP) now call `CheckAndSetVerified` in the repository to automatically set `is_verified` when all conditions are met
  - Added `VerificationCheckResult` model struct with `IsVerified`, `Checks`, and `Missing` fields
  - Added `ErrUserNotVerified` (403) and `ErrNameMismatch` (409) error constants

- **Backend Modules:**
  - `internal/models/user.go` — Added `IsVerified` field to `User` struct, added `VerificationCheckResult` struct
  - `internal/repository/user_repository.go` — Added `CheckAndSetVerified()` method
  - `internal/service/auth_service.go` — Added `GetVerifiedStatus()` and `RecheckVerification()` service methods
  - `internal/handler/auth_handler.go` — Added `GetVerifiedStatus` and `RecheckVerification` handlers
  - `internal/routes/routes.go` — Added `GET /auth/me/verified` and `POST /auth/me/recheck-verification` routes

- **API Documentation:**
  - Added `USER_NOT_VERIFIED` and `NAME_MISMATCH` error codes to Auth Service Errors table
  - Added `IsVerified` to `/auth/me` response
  - Added Verification Check section (7.11) with endpoint docs and example responses

---

### V 1.3.0

#### Separate Organizational Account (Feature)
#### May 30th, 2026

- **Separation of Concerns:**
  - User accounts and organizational accounts are now fully separated into two distinct tables (`users` and `organizations`)
  - Removed `is_organization` field from `users` table — an account is either a user or an organization by which table it lives in
  - Removed the CHECK constraint that prevented a record from being both `is_verified` and `is_organization` (no longer needed)
  - Organizational accounts use the same email verification and email reputation mechanisms as user accounts, with appropriate naming

- **New Database Tables:**
  - `organizations` — stores organizational accounts with fields: `id`, `email`, `password_hash`, `created_at`, `email_verified`, `mfa_enabled`, `status`, `updated_at`, `last_login_at`, `org_name`, `email_reputation_score`, `email_risk_status`, `email_checked_at`, `is_trusted`, `is_verified`
  - `org_email_verifications` — OTP verification records for organizational email verification (mirrors `email_verifications`)

- **New API Endpoints:**
  - `POST /auth/org/register` — Register a new organization (requires `email`, `password`, `org_name`)
  - `POST /auth/org/login` — Authenticate as an organization
  - `GET /auth/org/me` — Get current organization profile
  - `POST /auth/org/send-verification` — Send email verification OTP to organization email
  - `POST /auth/org/verify-email` — Verify organization email via OTP

- **JWT Updates:**
  - Added `account_type` claim to JWT tokens (`"user"` or `"organization"`)
  - Auth middleware passes `account_type` to downstream handlers

- **Error Constants:**
  - Added `ORG_EMAIL_ALREADY_EXISTS` (409), `ORGANIZATION_NOT_FOUND` (404), `ORG_NAME_REQUIRED` (400)

- **Backend Modules:**
  - `internal/models/organization.go` — Organization, OrgSignUpRequest, OrgLoginRequest, OrgEmailVerification structs
  - `internal/repository/organization_repository.go` — CRUD and verification logic for organizations
  - `internal/service/auth_service.go` — Added RegisterOrganization, LoginOrganization, OrgMe
  - `internal/service/email_service.go` — Added SendOrganizationVerificationEmail, VerifyOrganizationEmail
  - `internal/handler/auth_handler.go` — Added 5 org-specific handlers
  - `internal/routes/routes.go` — Added 5 new org routes under `/auth/org/`

- **API Documentation:**
  - Added Organization Endpoints section with register, login, profile, and email verification docs
  - Added org-specific error codes to Auth Service Errors table
  - Updated JWT token payload to include `account_type` claim
  - Removed `IsOrganization` from `/auth/me` user response
  - Updated Table of Contents

---

### V 1.2.2

#### Verification Structural Changes (Improvment)
#### May 30th, 2026

- **Aadhaar Number**
  - Store the Aadhaar number in the database, as of now in 'without encryption' but later in 'encrypted' format.
  - Add `is_trusted` field in the `users` table
  - Add `is_organization` field in the `users` table
  - Email Verification -> become a user into `trusted user`. Later we'll also add `Phone number verification`
  - `trusted user` can become either `Verified user` (as human) or `Organizational user`. But not both at a time.
  - No Need to change any API request body for storing the `Aadhaar number`
      - Client sends `POST /auth/aadhaar/generate-otp` with `{"aadhaar_number": "123412341234"}`
      - Handler parses `req.AadhaarNumber` and passes it to `service.GenerateAadhaarOTP(req.AadhaarNumber, userID)`
      - Service receives it and sends it to the Sandbox API to generate an OTP

---

### V 1.4.0

#### Implement Verified Organization Pipeline (Feature)
#### June 1st, 2026

- **New Backend Modules:**
  - `internal/models/org_verification.go` — Typed structs for MCA API request/response schemas (LLP & Company master data), org verification requests, MCA verification records, domain verification records, and step result tracking
  - `internal/repository/org_verification_repository.go` — Full CRUD for 3 new tables (verification requests, MCA verifications, domain verifications) with step advancement and completion
  - `internal/service/org_verification_service.go` — Orchestration logic for the 5-step verification pipeline with MCA API integration (Sandbox), DNS TXT lookup, registration number validation (LLPIN/CIN regex), business name matching, entity status verification, and incorporation date validation
  - `internal/handler/org_verification_handler.go` — Six Gin handlers for the verified organization endpoints with step-by-step instructions returned in responses

- **Three Runtime Modes:**
  - `disabled` — All org verification endpoints return `ORG_VERIFICATION_EXPIRED`. No external API calls. Default for local development.
  - `monitor` — Feature active; on API failure logs warning and falls back gracefully (step may report as failed but pipeline continues)
  - `enforce` — Strict validation: API failure blocks the current step entirely and may expire the verification

- **Database Migrations:**
  - `000014_create_org_verification_requests` — Table for tracking multi-step verification progress with `current_step` and `status` fields
  - `000015_create_org_mca_verifications` — Table for MCA API response data: registration number, entity type (LLP/CIN), LLP details (LLPIN, LLP name, LLP status), Company details (CIN, company name, company status), ROC code, registered address, email, incorporation date
  - `000016_create_org_domain_verifications` — Table for domain ownership verification with domain, verification token, DNS verified flag, and DNS verified timestamp
  - `000017_add_verified_at_to_organizations` — Added `verified_at` (TIMESTAMPTZ, nullable) to `organizations` table

- **5-Step Verification Pipeline:**
  - **Step 1: Registration Number** — Validates format (LLPIN: `ABC-1234`, CIN: `U12345MH2024PLC123456`) and looks up MCA records via Sandbox API
  - **Step 2: Business Name & Entity Checks** — Verifies org name matches MCA record (normalized, legal-suffix-aware), checks LLP/Company status is "Active", validates incorporation date format
  - **Step 3: Domain Submission** — Validates domain format, checks domain matches email domain, generates verification token
  - **Step 4: DNS TXT Verification** — Looks up `_e-voting-verify.<domain>` TXT record and matches verification token
  - **Step 5: Verified** — Organization marked as verified with `verified_at` timestamp

- **New API Endpoints (all auth-protected, organization-only):**
  - `POST /auth/org/verify/start` — Start the verification pipeline (requires trusted/email-verified org)
  - `POST /auth/org/verify/submit-registration-number` — Submit LLPIN or CIN for MCA lookup
  - `POST /auth/org/verify/submit-domain` — Submit official business domain
  - `POST /auth/org/verify/verify-dns` — Verify DNS TXT record presence and token match
  - `GET /auth/org/verify/status` — Get full verification status with step-by-step results
  - `POST /auth/org/verify/recheck` — Re-evaluate all verification conditions against current MCA data and DNS

- **Prerequisite:**
  - Organization must be Trusted (email verified via `POST /auth/org/verify-email`) before starting verification — returns `ORG_NOT_TRUSTED` if email not verified
  - Organization must not already be verified — returns `ORG_ALREADY_VERIFIED` if already verified
  - Only one active verification request allowed at a time — returns `VERIFICATION_IN_PROGRESS` if one exists

- **Error Handling:**
  - Added 17 new error constants: `ORG_NOT_TRUSTED` (403), `ORG_ALREADY_VERIFIED` (409), `VERIFICATION_IN_PROGRESS` (409), `NO_VERIFICATION_IN_PROGRESS` (400), `INVALID_VERIFICATION_STEP` (400), `MCA_SERVICE_UNAVAILABLE` (503), `INVALID_REGISTRATION_NUMBER` (400), `REGISTRATION_NUMBER_NOT_FOUND` (404), `BUSINESS_NAME_MISMATCH` (409), `ORG_STATUS_NOT_ACTIVE` (400), `INCORPORATION_DATE_INVALID` (400), `INVALID_DOMAIN` (400), `EMAIL_DOMAIN_MISMATCH` (409), `DNS_VERIFICATION_FAILED` (400), `DNS_TOKEN_NOT_FOUND` (404), `DNS_ALREADY_VERIFIED` (409), `ORG_VERIFICATION_EXPIRED` (403)

- **Feature Flag:**
  - Added `GetOrgVerificationMode()` to `config/feature_flags.go`, reads `ORG_VERIFICATION_MODE` env var (`disabled`/`monitor`/`enforce`)

- **API Documentation (index.md):**
  - Section 7 restructured into **User Endpoints** and **Organization Endpoints** sub-sections for better clarity
  - Added 17 new error codes to Auth Service Errors table
  - Added Verified Organization Pipeline section (7.13) with pipeline flow diagram, 6 endpoint docs, full MCA LLP & Company response examples, DNS setup instructions, and complete error tables
  - Updated `/auth/org/me` response to include `VerifiedAt` field
  - Updated Table of Contents with new sub-sections and endpoint links

- **Structural Changes:**
  - Organization model `VerifiedAt` field added for tracking verification timestamp
  - Removed automatic `is_verified` on org email verification — orgs must now complete the full pipeline to become verified

---

### V 1.4.2

#### Organization Login Fix (Bug Fix)
#### June 2nd, 2026

- **Root cause:** `refresh_tokens.user_id` foreign-keyed only `users(id)`; org login stored organization IDs in that column, causing PostgreSQL FK violations and `500 INTERNAL_SERVER_ERROR` after a valid password check.
- **Database migration `000021_refresh_tokens_support_orgs`**
  - Nullable `user_id` with FK to `users`; new `org_id` FK to `organizations`
  - `CHECK` constraint: exactly one of `user_id` or `org_id` is set (same pattern as `otp_verify_attempts`)
- **Backend**
  - `RefreshToken` model uses `account_type` + `subject_id`; repository saves/loads the correct column
  - `GetOrganizationByEmail` returns `INVALID_CREDENTIALS` on unknown email (aligned with user login)
  - `POST /auth/logout` moved to unauthenticated `/auth` group (cookie-only; works for user and org refresh cookies)

---

### V 1.4.1

#### Security & Performance Hardening (Security Fix / Improvement)
#### June 2nd, 2026

- **JWT & token lifecycle**
  - Added `token_use` claim on all minted tokens: `access` (15 min, Bearer header) and `refresh` (7 days, HttpOnly cookie only)
  - Protected routes use `ParseAccessToken` and reject refresh tokens
  - Enforced JWT issuer `auth-service` via `jwt.WithIssuer` in auth-service and vote-service
  - Vote-service accepts legacy tokens without `token_use` until clients re-login; new tokens always include the claim

- **Sessions & cookies**
  - User login sets `refresh_token_user`; organization login sets `refresh_token_org` (legacy `refresh_token` cleared on new login)
  - Refresh and logout read type-specific cookies (with legacy fallback)
  - `RefreshAccessToken` validates refresh JWT with `ParseRefreshToken` before rotation

- **Route authorization (auth-service)**
  - `RequireAccountType("user")` on `/auth/*` protected user routes (me, Aadhaar, email verification, sessions, etc.)
  - `RequireAccountType("organization")` on `/auth/org/*` protected org routes
  - New error constant `FORBIDDEN` (403) when account type does not match the route group

- **Login & registration hardening**
  - User and org login return `INVALID_CREDENTIALS` for both unknown email and wrong password (removed distinct `INVALID_PASSWORD` on login)
  - User login email normalized with `strings.ToLower` + trim (aligned with register and org login)
  - Login rate limit: 5 attempts / minute per email **and** per IP (`CheckRateLimit` now uses IP)
  - Register rate limit: 10 attempts / minute per IP
  - Refresh rate limit: 30 attempts / minute per IP

- **OTP verification**
  - Email and org OTP **verify** failures tracked in new `otp_verify_attempts` table (not send-count)
  - Maximum 5 failed verify attempts per 2-minute window per user/org
  - Constant-time OTP hash comparison (`crypto/subtle`)

- **Logging (PII & secrets)**
  - Removed Sandbox access token and API key from logs
  - Redacted raw Aadhaar API bodies, MCA response bodies, and email addresses from reputation logs

- **Database migration**
  - `000019_create_otp_verify_attempts` — tracks failed OTP verify attempts for users and organizations

- **Auth-service backend modules**
  - `internal/utils/jwt.go` — `TokenUse`, `ParseAccessToken`, `ParseRefreshToken`, issuer validation
  - `internal/utils/cookies.go` — cookie name helpers for user/org refresh tokens
  - `internal/middleware/account_middleware.go` — `RequireAccountType`
  - `internal/middleware/cors_middleware.go` — `CORS_ALLOWED_ORIGINS`
  - `internal/middleware/auth_middleware.go` — strict `Bearer` prefix, access tokens only
  - `internal/service/security_service.go` — register/refresh IP limits
  - `internal/service/email_service.go` — verify attempt limits, `RecordRegisterIP` / `RecordRefreshIP`
  - `internal/repository/otp_verify_repository.go` — OTP verify attempt persistence
  - `internal/repository/login_attempt_repository.go` — `GetRecentAttemptsByIP`

- **Vote-service changes**
  - `GET /vote/v1/polls/:pollId/results` — `Authorize("view_result")` plus explicit check: only poll admin or users who have already voted
  - `HasUserVoted` repository helper for results authorization
  - Duplicate vote: PostgreSQL unique violation (`23505`) mapped to `409` instead of `500`
  - Poll object stored on Gin context after Casbin to avoid redundant `GetByID` on vote path
  - `WithinVotingWindow` — partial windows (only start or only end) now enforced
  - Removed unused `p, admin, poll, create` from `policy.csv`
  - `GetResults` skips invalid `option_idx` values instead of panicking
  - JWT parsing aligned with auth-service (`token_use`, issuer)

- **Tests & tooling**
  - `auth-service/internal/utils/jwt_test.go` — access vs refresh token rejection
  - `vote_service/internal/utils/jwt_test.go` — refresh rejection and legacy token support
  - Extended `vote_service/tests/window_test.go` for partial voting windows
  - `make test` and `make security-scan` targets in both service Makefiles

- **Environment configuration**
  - `CORS_ALLOWED_ORIGINS` — comma-separated allowed browser origins (auth-service)
  - Documented in `auth-service/.env.sample`

- **API documentation (index.md)**
  - Version header `[V 1.4.1]`
  - Token payload: `token_use`, separate refresh cookies, issuer notes
  - Login/register/refresh/logout: rate limits, normalized email, unified login errors
  - `FORBIDDEN` in auth error table; account-type routing rules
  - Section 8.7 results: admin or prior voters only
  - Section 9: `view_result` rules, updated `policy.csv`, partial PBAC windows
  - Sections 12–13: CORS env, cookie names, documented rate limits


- **Deferred (documented, not implemented)**
  - Refresh token reuse / family revoke
  - Aadhaar number encryption at rest (still plaintext per v1.2.2 notes)
  - Frontend, ballot encryption, public audit trail (see audit-gap-matrix)
