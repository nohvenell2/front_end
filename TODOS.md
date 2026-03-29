# TODOS

Deferred tasks from plan reviews (skeleton branch).

---

## E2E Testing

**What:** Playwright E2E test suite covering the core user journey.

**Why:** Unit tests (Vitest) cover pure functions (rankGames, formatPlaytime, enrichGames). E2E would cover the full flow: Steam OAuth, library load → game selection → recommend page → result render.

**Pros:**
- Catches regressions in the auth flow that unit tests can't reach
- Validates the `/recommend?selected=` URL parsing in a real browser context
- Protects against layout breaks on route transitions

**Cons:**
- Steam OAuth requires a real Steam account or mock server — mocking OAuth flows is complex
- Playwright setup adds dev dependency and CI time
- Low priority given pure function coverage is already good

**Context:** The eng review flagged E2E as "optional, lower priority" (2026-03-29). Core user flows are: login → /user → select games → /recommend. The most valuable E2E would be an authenticated library → recommend journey using a test Steam account or MSW mock.

**Depends on:** Working deployment environment (local dev with real Steam OAuth or MSW mock for auth)

**Suggested scope when ready:**
1. Auth redirect: `/` → Steam login → callback → `/user`
2. Library load: `/user` renders game list
3. Game selection: select 2 games → navigate to `/recommend?selected=id1,id2`
4. Recommend: cards render with scores
5. Settings: weight change → instant re-rank (no network request)
6. Empty state: mock 0 games → empty state shows privacy message

---

## Security: Rate Limiting

**What:** Re-add rate limiting on the three API proxy routes (`/api/games/info`, `/api/recommend/user`, `/api/recommend/game`) and `/api/steam/library`.

**Why:** The original rate limiting was removed because it was incompatible with Vercel serverless (in-memory state resets between cold starts). A proper solution requires a Redis/KV-backed rate limiter (e.g., Upstash + `@upstash/ratelimit`).

**Priority:** P2

**Context:** Flagged by adversarial review on 2026-03-29. An authenticated user can currently hammer the Steam API key and recommendation backend without any throttle.

---

## Security: OpenID Callback Hardening

**What:** Add `openid.return_to` verification and nonce validation to the Steam OpenID callback (`src/app/api/auth/steam/callback/route.ts`). Also add `res.ok` check before `.json()` on the Steam profile API response.

**Why:** Without nonce/return_to validation, an attacker can replay a valid `check_authentication` exchange from a different origin. The profile fetch also throws an unhandled error if Steam returns a non-JSON 500.

**Priority:** P2

**Context:** Flagged by adversarial review on 2026-03-29. Pre-existing issues not introduced by ui-v3 but worth tracking.

---

## UX: Search Debounce on /user

**What:** Debounce the `search` input on `/user/page.tsx` to avoid synchronous re-filter on every keystroke.

**Why:** `filteredGames` recalculates synchronously on every `onChange`. With 1000+ games, each keypress triggers a full filter + sort pass on the main thread — causes janky input on large libraries.

**Priority:** P3

**Context:** Flagged by adversarial review on 2026-03-29. Can be fixed with `useDeferredValue(search)` or a 150ms debounce.
