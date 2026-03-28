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
