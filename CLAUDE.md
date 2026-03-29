# CLAUDE.md

## gstack

Use /browse from gstack for all web browsing. Never use mcp__claude-in-chrome__* tools.
Available skills: /office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review,
/design-consultation, /review, /ship, /land-and-deploy, /canary, /benchmark, /browse,
/qa, /qa-only, /design-review, /setup-browser-cookies, /setup-deploy, /retro,
/investigate, /document-release, /codex, /cso, /autoplan, /careful, /freeze, /guard,
/unfreeze, /gstack-upgrade.

## What is this?

Steam Game Recommender frontend — Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4.

All pages, components, API routes, auth, types, utilities, and state management are implemented. UI uses shadcn/ui with Steam dark theme.

For full API/type/function reference, see [dev_docs/FULL-REFERENCE.md](dev_docs/FULL-REFERENCE.md).

## Directory Structure

```
src/
├── app/
│   ├── page.tsx              # Login page — Server Component
│   ├── user/page.tsx         # User library — Client Component
│   ├── recommend/page.tsx    # Recommendations — Client Component
│   ├── layout.tsx            # Root layout (Providers wrapper)
│   ├── globals.css           # Global styles
│   └── api/                  # ✅ Fully implemented (do not modify)
│
├── lib/
│   ├── api-client.ts         # ✅ API fetch functions
│   ├── ranking.ts            # ✅ rankGames() — client-side scoring
│   ├── constants.ts          # ✅ CANDIDATE_LIMIT, DEFAULT_SETTINGS, MAX_GAME_SELECTION
│   └── utils.ts              # ✅ cn, formatPlaytime, steamHeaderUrl, enrichGames
├── types/                    # ✅ TypeScript interfaces
├── context/                  # ✅ Settings state (React Context + localStorage)
├── components/providers.tsx  # ✅ Provider stack (Session + Query + Settings)
└── auth.ts                   # ✅ NextAuth config (Steam OpenID)
```

## Environment Variables

See `.env.example`. Required: `API_HOST`, `API_PORT`, `STEAM_API_KEY`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_MAX_GAME_SELECTION` | `20` | Max games user can select for targeted recommendation |
| `NEXT_PUBLIC_CANDIDATE_LIMIT` | `100` | Candidates fetched from recommendation API |
| `NEXT_PUBLIC_DEFAULT_HALF_LIFE_DAYS` | `1825` | Recency score half-life (days) |

## Auth

- Login: `<a href="/api/auth/steam/redirect">` → Steam OpenID → callback → session
- Server-side: `const session = await auth()` → `session.user.steamid / .name / .image`
- Client-side: `useSession()` → `{ data: session, status }` (`"loading" | "authenticated" | "unauthenticated"`)
- Logout: `signOut({ callbackUrl: "/" })`

## API Client (`src/lib/api-client.ts`)

| Function | Returns | Description |
|----------|---------|-------------|
| `fetchSteamLibrary()` | `SteamGame[]` | User's game library |
| `fetchGamesInfo(ids)` | `GamesInfoResponse` | Game metadata (genres, tags, images) |
| `fetchUserRecommendation(body)` | `RecommendResponse` | User-based recommendations |

> `fetchGameRecommendation` exists but is not used in the main UI flow. All recommendation
> requests go through `fetchUserRecommendation`, including single-game targeted recommendations.

## Ranking (`src/lib/ranking.ts`)

```typescript
rankGames(candidates: RecommendedGame[], weights, halfLifeDays) → RankedGame[]
```

Weighted score: similarity + popularity + rating + recency → sorted descending.

`RankedGame.scores` fields: `tfidf` (similarity), `popularity`, `rating`, `recency` — display as "Similarity", "Popularity", "Rating", "Recency". Never expose the raw field name `tfidf` in UI.

## Settings (`src/context/settings-context.tsx`)

```typescript
const { settings, dispatch } = useSettings();
// settings.count, settings.weights.{similarity,popularity,rating,recency}
// settings.filters.{minReleaseDate, minReviewCount, minPositivePercent}
// settings.halfLifeDays

dispatch({ type: "SET_WEIGHT", payload: { key: "similarity", value: 7 } });
dispatch({ type: "SET_HALF_LIFE_DAYS", payload: 365 });
dispatch({ type: "HYDRATE", payload: settingsObject }); // replaces full state at once
dispatch({ type: "RESET_DEFAULTS" });
```

Settings dialog includes: count (5-20), weights x4, filters x3, halfLifeDays (180-3650), score viz toggle (radar / bars).

## Key Types

- `SteamGame` / `SteamGameEnriched` — User's library games (`src/types/steam.ts`)
- `RecommendedGame` / `RankedGame` — Recommendation results with scores (`src/types/recommend.ts`)
- `RecommendationSettings` — Weights, filters, count, halfLifeDays (`src/types/settings.ts`)

## Page Data Flow

```
/ (login)
  └─ auth() → authenticated → redirect /user
  └─ not auth → show Steam login button (<a href="/api/auth/steam/redirect">)

/user
  └─ useSession() → unauthenticated → redirect /
  └─ fetchSteamLibrary() → SteamGame[]
  └─ fetchGamesInfo(top 50 by playtime_forever) → GameInfo[]
  └─ enrichGames(steamGames, gameInfos) → SteamGameEnriched[]  [utils.ts]
  └─ Stats Dashboard (playtime, game count, genre/tag bar chart)
       NOTE: stats are based on top 50 most-played games — show this in UI
  └─ GameLibrary (list/grid toggle, search/filter, multi-select)
       max selection: NEXT_PUBLIC_MAX_GAME_SELECTION (default 20)
  └─ navigate → /recommend?selected=appid1,appid2,...

/recommend
  └─ useSession() → unauthenticated → redirect /
  └─ fetchSteamLibrary() [React Query cache — same key as /user, reused within staleTime]
  └─ parse ?selected → re-join appids against library → selectedGames: SteamGame[]
       if ?selected absent or empty → use full library
  └─ fetchUserRecommendation({ games: selectedGames, limit: CANDIDATE_LIMIT, ...filters })
  └─ rankGames(candidates, settings.weights, settings.halfLifeDays) → RankedGame[]
  └─ slice to settings.count → display RankedGameCard[]
```

## Utilities (`src/lib/utils.ts`)

- `cn(...classes)` — Tailwind class merge
- `formatPlaytime(minutes)` — `"45m"` or `"3h"`
- `steamHeaderUrl(appid)` / `steamIconUrl(appid, hash)` — Steam CDN image URLs
- `enrichGames(steamGames, gameInfos)` — joins `SteamGame[]` + `GameInfo[]` on appid → `SteamGameEnriched[]`

## Testing

Framework: **Vitest**

```bash
npx vitest        # run tests
npx vitest --ui   # UI mode
```

Test files:
- `src/lib/ranking.test.ts` — rankGames() all branches
- `src/lib/utils.test.ts` — formatPlaytime(), enrichGames()

## Implementation Rules

These decisions were locked in during plan review — do not deviate without discussion:

1. **recharts**: Install with `--legacy-peer-deps`. Wrap in `dynamic(() => import(...), { ssr: false })` — required to avoid SSR crash.
2. **Radar chart labels**: Use "Similarity / Popularity / Rating / Recency". Never show `tfidf`, `popularity`, `rating`, `recency` raw field names.
3. **?selected join step**: URL contains appids (strings). Parse → convert to numbers → filter `SteamGame[]` from `fetchSteamLibrary()` to reconstruct the full `SteamGame` objects before passing to `fetchUserRecommendation`.
4. **HYDRATE action**: `settings-context.tsx` hydration from localStorage must use a single `HYDRATE` dispatch (not individual field dispatches) to avoid N writes on mount.
5. **Stats Dashboard**: Show caption "플레이타임 기준 상위 N개 게임 기준" (where N = `fetchGamesInfo` call size, default 50).
6. **All pages**: Every data fetch must have explicit loading / error / empty / success states.

## Image Domains (next.config.ts)

`cdn.cloudflare.steamstatic.com`, `media.steampowered.com`, `avatars.steamstatic.com`
