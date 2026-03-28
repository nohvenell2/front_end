# CLAUDE.md

## What is this?

Steam Game Recommender frontend — Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4.

**This is a skeleton branch.** API routes, auth, types, utilities, state management are all implemented. **UI pages and components need to be built.**

For full API/type/function reference, see [dev_docs/FULL-REFERENCE.md](dev_docs/FULL-REFERENCE.md).

## Directory Structure

```
src/
├── app/
│   ├── page.tsx              # Login page (placeholder) — Server Component
│   ├── user/page.tsx         # User library (placeholder) — Client Component
│   ├── recommend/page.tsx    # Recommendations (placeholder) — Client Component
│   ├── layout.tsx            # Root layout (Providers wrapper)
│   ├── globals.css           # Minimal — add your styles here
│   └── api/                  # ✅ Fully implemented (do not modify)
│
├── lib/                      # ✅ Utility functions & logic
├── types/                    # ✅ TypeScript interfaces
├── context/                  # ✅ Settings state (React Context + localStorage)
├── components/providers.tsx  # ✅ Provider stack (Session + Query + Settings)
├── auth.ts                   # ✅ NextAuth config (Steam OpenID)
└── proxy.ts                  # ✅ Rate limiting middleware
```

## Environment Variables

See `.env.example`. Required: `API_HOST`, `API_PORT`, `STEAM_API_KEY`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`

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
| `fetchGameRecommendation(body)` | `RecommendResponse` | Game-based recommendations |

## Ranking (`src/lib/ranking.ts`)

```typescript
rankGames(candidates: RecommendedGame[], weights, halfLifeDays) → RankedGame[]
```

Weighted score: similarity + popularity + rating + recency → sorted descending.

## Settings (`src/context/settings-context.tsx`)

```typescript
const { settings, dispatch } = useSettings();
// settings.count, settings.weights.{similarity,popularity,rating,recency}
// settings.filters.{minReleaseDate, minReviewCount, minPositivePercent}
// settings.halfLifeDays
dispatch({ type: "SET_WEIGHT", payload: { key: "similarity", value: 7 } });
```

## Key Types

- `SteamGame` / `SteamGameEnriched` — User's library games (`src/types/steam.ts`)
- `RecommendedGame` / `RankedGame` — Recommendation results with scores (`src/types/recommend.ts`)
- `RecommendationSettings` — Weights, filters, count (`src/types/settings.ts`)

## Page Data Flow

```
/ (login)     → auth check → redirect to /user or show login link
/user         → fetchSteamLibrary() → display library → navigate to /recommend
/recommend    → fetchSteamLibrary() → fetchUserRecommendation() → rankGames() → display cards
```

## Utilities (`src/lib/utils.ts`)

- `cn(...classes)` — Tailwind class merge
- `formatPlaytime(minutes)` — `"45m"` or `"3h"`
- `steamHeaderUrl(appid)` / `steamIconUrl(appid, hash)` — Steam CDN image URLs

## Image Domains (next.config.ts)

`cdn.cloudflare.steamstatic.com`, `media.steampowered.com`, `avatars.steamstatic.com`
