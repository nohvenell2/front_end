# CLAUDE.md

This file provides comprehensive documentation for AI tools working on this project.

## Project Overview

**Steam Game Recommender** — A Next.js 16 (App Router) frontend that provides personalized Steam game recommendations. Users log in via Steam, view their game library, and receive AI-powered recommendations ranked by a client-side weighted scoring algorithm.

**Tech Stack:** Next.js 16.2.1, React 19, TypeScript, Tailwind CSS v4, NextAuth v5, TanStack React Query v5

**Status:** This is a "skeleton" branch — all UI components have been removed. API routes, authentication, utilities, types, and state management are fully implemented. **You need to build the UI (pages + components).**

## Directory Structure

```
src/
├── app/                         # Next.js App Router
│   ├── layout.tsx               # Root layout (wraps Providers)
│   ├── globals.css              # Global styles (minimal — add your own)
│   ├── page.tsx                 # Home/Login page (placeholder)
│   ├── user/page.tsx            # User library page (placeholder)
│   ├── recommend/page.tsx       # Recommendations page (placeholder)
│   └── api/                     # Server-side API routes (FULLY IMPLEMENTED)
│       ├── auth/
│       │   ├── [...nextauth]/route.ts   # NextAuth handler
│       │   └── steam/
│       │       ├── redirect/route.ts    # Initiates Steam login
│       │       └── callback/route.ts    # Handles Steam login callback
│       ├── steam/
│       │   └── library/route.ts         # Fetches user's Steam game library
│       ├── recommend/
│       │   ├── user/route.ts            # User-based recommendations
│       │   └── game/route.ts            # Game-based recommendations
│       └── games/
│           └── info/route.ts            # Fetches game metadata
│
├── components/
│   └── providers.tsx            # Provider wrapper (Session + Query + Settings)
│
├── context/
│   └── settings-context.tsx     # Recommendation settings state (React Context + localStorage)
│
├── lib/
│   ├── api-client.ts            # Client-side API fetch functions
│   ├── ranking.ts               # Client-side game ranking algorithm
│   ├── constants.ts             # Environment-based default settings
│   └── utils.ts                 # Utility functions (cn, formatPlaytime, Steam URLs)
│
├── types/
│   ├── steam.ts                 # Steam game types
│   ├── recommend.ts             # Recommendation types & API request/response
│   └── settings.ts              # Recommendation settings type
│
├── auth.ts                      # NextAuth configuration (Steam OpenID)
└── proxy.ts                     # Rate limiting middleware
```

## Environment Variables

Defined in `.env` (see `.env.example`):

| Variable | Server/Client | Required | Description |
|----------|--------------|----------|-------------|
| `API_HOST` | Server | Yes | Backend recommendation API host IP |
| `API_PORT` | Server | Yes | Backend API port (default: 8000) |
| `STEAM_API_KEY` | Server | Yes | Steam Web API key |
| `NEXTAUTH_SECRET` | Server | Yes | NextAuth session encryption secret |
| `NEXTAUTH_URL` | Server | Yes | App base URL (e.g., `http://localhost:3000`) |
| `NEXT_PUBLIC_DEFAULT_WEIGHT_SIMILARITY` | Client | No | Default weight for similarity (default: 4) |
| `NEXT_PUBLIC_DEFAULT_WEIGHT_POPULARITY` | Client | No | Default weight for popularity (default: 3) |
| `NEXT_PUBLIC_DEFAULT_WEIGHT_RATING` | Client | No | Default weight for rating (default: 2) |
| `NEXT_PUBLIC_DEFAULT_WEIGHT_RECENCY` | Client | No | Default weight for recency (default: 1) |
| `NEXT_PUBLIC_DEFAULT_HALF_LIFE_DAYS` | Client | No | Recency decay half-life in days (default: 1825) |
| `NEXT_PUBLIC_DEFAULT_MIN_RELEASE_DATE` | Client | No | Min release date filter (default: 2000-01-01) |
| `NEXT_PUBLIC_DEFAULT_MIN_REVIEW_COUNT` | Client | No | Min review count filter (default: 100) |
| `NEXT_PUBLIC_DEFAULT_MIN_POSITIVE_PERCENT` | Client | No | Min positive review % (default: 50) |
| `NEXT_PUBLIC_DEFAULT_RECOMMEND_COUNT` | Client | No | Number of results to display (default: 10) |
| `NEXT_PUBLIC_CANDIDATE_LIMIT` | Client | No | Max candidates to fetch from API (default: 50) |
| `RATE_LIMIT_MAX_REQUESTS` | Server | No | Rate limit max requests (default: 10000) |
| `RATE_LIMIT_WINDOW_MS` | Server | No | Rate limit window in ms (default: 60000) |

---

## Authentication Flow

Steam OpenID login flow (fully implemented):

```
User clicks "Sign in with Steam"
  → GET /api/auth/steam/redirect
  → Redirects to Steam OpenID login page
  → User authenticates on Steam
  → GET /api/auth/steam/callback
    → Verifies OpenID response with Steam
    → Extracts steamid from claimed_id
    → Fetches Steam profile (name, avatar)
    → Calls NextAuth signIn("steam", { steamid, name, image })
    → Redirects to /user
```

### Session Object

After login, `session.user` contains:

```typescript
{
  steamid: string;   // Steam 64-bit ID (e.g., "76561198012345678")
  name: string;      // Steam display name
  image: string;     // Avatar URL (full size)
  email: string;     // Always empty string ""
}
```

### Key Auth Functions

| Import | Usage |
|--------|-------|
| `import { auth } from "@/auth"` | Server-side: `const session = await auth()` |
| `import { useSession } from "next-auth/react"` | Client-side: `const { data: session, status } = useSession()` |
| `import { signOut } from "next-auth/react"` | Client-side: `signOut({ callbackUrl: "/" })` |

`status` values: `"loading"`, `"authenticated"`, `"unauthenticated"`

---

## Client-Side API Functions

File: `src/lib/api-client.ts`

### `fetchSteamLibrary(): Promise<SteamGame[]>`
Fetches the authenticated user's Steam game library.
- Endpoint: `GET /api/steam/library`
- Returns: Array of `SteamGame` objects sorted by Steam's default order
- Errors: Throws if unauthorized (401) or Steam profile is private (403)

### `fetchGamesInfo(gameIds: number[]): Promise<GamesInfoResponse>`
Fetches detailed metadata (genres, tags, images) for specific games.
- Endpoint: `POST /api/games/info`
- Request body: `{ game_ids: number[] }`
- Returns: `{ status, data: GameInfo[], not_found_game_ids: number[] }`

### `fetchGameRecommendation(body: RecommendGameRequest): Promise<RecommendResponse>`
Gets recommendations similar to a specific game (item-to-item).
- Endpoint: `POST /api/recommend/game`
- Request body: See `RecommendGameRequest` type below
- Returns: `RecommendResponse`

### `fetchUserRecommendation(body: RecommendUserRequest): Promise<RecommendResponse>`
Gets personalized recommendations based on user's game library (user-to-item).
- Endpoint: `POST /api/recommend/user`
- Request body: See `RecommendUserRequest` type below
- Returns: `RecommendResponse`

---

## Backend API (Proxied)

The frontend proxies requests to the backend recommendation API at `http://{API_HOST}:{API_PORT}`.

### `POST /recommend/game` — Item-to-Item

```json
// Request
{ "game_id": 1091500, "limit": 20, "release_date": "2020-01-01T00:00:00",
  "total_review_count": 100, "total_review_positive_percent": 50,
  "recent_review_count": 0, "recent_review_positive_percent": 0 }
```

Returns 404 if the game has no embedding data.

### `POST /recommend/user` — User-to-Item

```json
// Request
{ "games": [{ "appid": 1158310, "playtime_forever": 10, "name": "", "img_icon_url": "", "has_community_visible_stats": false }],
  "limit": 20, "release_date": "2000-01-01T00:00:00",
  "total_review_count": 100, "total_review_positive_percent": 50,
  "recent_review_count": 0, "recent_review_positive_percent": 0 }
```

Games without embedding data are skipped and listed in `skipped_game_ids`.

### `POST /games/info` — Game Metadata

```json
// Request
{ "game_ids": [1091500, 570, 730] }

// Response
{ "status": "success",
  "data": [{ "game_id": 1091500, "title": "...", "genres": [...], "tags": [...], ... }],
  "not_found_game_ids": [] }
```

### Common Response Shape (HTTP 200)

```json
{ "status": "success",
  "data": [{
    "sim_score": 0.67, "game_id": 1404210, "url": "https://store.steampowered.com/app/...",
    "title": "Game Title", "description": "...", "header_image": "https://cdn...",
    "developer": "Dev Studio", "publisher": "Publisher",
    "release_date": "2020-12-01T00:00:00", "release_date_original": "Dec 1, 2020",
    "total_review_count": 30131, "all_reviews": "Mostly Positive",
    "total_review_positive_percent": 81,
    "recent_review_count": 412, "recent_reviews": "Mixed",
    "recent_review_positive_percent": 55,
    "genres": ["Action", "Adventure"], "tags": ["Open World", "RPG"]
  }],
  "skipped_game_ids": [245] }
```

---

## Client-Side Ranking Algorithm

File: `src/lib/ranking.ts` — `rankGames(candidates, weights, halfLifeDays) → RankedGame[]`

After receiving API results (up to `CANDIDATE_LIMIT` candidates), the client re-ranks using:

```
Final Score = w₁·S_tfidf + w₂·S_pop + w₃·S_rate + w₄·S_time   (weights normalized to sum=1.0)
```

| Score | Formula | Notes |
|---|---|---|
| `S_tfidf` | `sim_score / max(sim_score)` | Normalize cosine similarity to [0,1] |
| `S_pop` | `ln(1 + reviews) / ln(1 + max_reviews)` | Log-normalize within candidate set |
| `S_rate` | `total_review_positive_percent / 100` | Direct mapping, already 0–1 |
| `S_time` | `e^(-λ · days_since_release)` | Exponential decay; λ = ln(2) / halfLifeDays |

Results are sorted descending by Final Score, then sliced to `settings.count`.

---

## State Management

### Settings Context (`src/context/settings-context.tsx`)

Manages recommendation settings with auto-persistence to localStorage.

```typescript
import { useSettings } from "@/context/settings-context";

const { settings, dispatch } = useSettings();

// Read settings
settings.count              // number (5–20), how many results to show
settings.weights.similarity // number (1–10), raw slider value
settings.weights.popularity // number (1–10)
settings.weights.rating     // number (1–10)
settings.weights.recency    // number (1–10)
settings.filters.minReleaseDate    // string "YYYY-MM-DD"
settings.filters.minReviewCount    // number
settings.filters.minPositivePercent // number (0–100)
settings.halfLifeDays       // number, recency decay half-life

// Dispatch actions
dispatch({ type: "SET_COUNT", payload: 15 });
dispatch({ type: "SET_WEIGHT", payload: { key: "similarity", value: 7 } });
dispatch({ type: "SET_FILTER", payload: { key: "minReviewCount", value: 200 } });
dispatch({ type: "RESET_DEFAULTS" });
```

**localStorage key:** `"recommendSettings"`

### Provider Stack (`src/components/providers.tsx`)

All pages are wrapped with these providers (configured in `layout.tsx`):

```
SessionProvider (NextAuth — session management)
  └── QueryClientProvider (TanStack React Query — data caching, staleTime: 60s)
      └── SettingsProvider (Recommendation settings — localStorage persistence)
```

---

## Type Definitions

### `SteamGame` (`src/types/steam.ts`)

```typescript
interface SteamGame {
  appid: number;                       // Steam app ID
  name: string;                        // Game name
  playtime_forever: number;            // Total playtime in minutes
  img_icon_url: string;                // Icon hash (use steamIconUrl() to build full URL)
  has_community_visible_stats: boolean;
}

interface SteamGameEnriched extends SteamGame {
  genres: string[];       // e.g., ["Action", "Adventure"]
  tags: string[];         // e.g., ["Open World", "RPG"]
  header_image?: string;  // Full header image URL
}
```

### `RecommendedGame` / `RankedGame` (`src/types/recommend.ts`)

```typescript
interface RecommendedGame {
  sim_score: number;           // Cosine similarity (0–1)
  game_id: number;             // Steam app ID
  url: string;                 // Steam store URL
  title: string;
  description: string;
  header_image: string;        // Header image URL
  developer: string;
  publisher: string;
  release_date: string;        // ISO-8601 (e.g., "2020-12-01T00:00:00")
  release_date_original: string; // Human-readable (e.g., "Dec 1, 2020")
  total_review_count: number;
  all_reviews: string;         // e.g., "Mostly Positive"
  total_review_positive_percent: number; // 0–100
  recent_review_count: number;
  recent_reviews: string;
  recent_review_positive_percent: number;
  genres: string[];
  tags: string[];
}

// After client-side ranking
interface RankedGame extends RecommendedGame {
  finalScore: number;          // Combined weighted score (0–1)
  scores: {
    tfidf: number;             // Normalized similarity score (0–1)
    popularity: number;        // Log-normalized review count (0–1)
    rating: number;            // Positive review percentage (0–1)
    recency: number;           // Exponential decay score (0–1)
  };
}
```

### API Request Types (`src/types/recommend.ts`)

```typescript
interface RecommendGameRequest {
  game_id: number;
  limit?: number;
  release_date?: string;                  // ISO-8601
  total_review_count?: number;
  total_review_positive_percent?: number;
  recent_review_count?: number;
  recent_review_positive_percent?: number;
}

interface RecommendUserRequest {
  games: {
    appid: number;
    name: string;
    playtime_forever: number;
    img_icon_url: string;
    has_community_visible_stats: boolean;
  }[];
  limit?: number;
  release_date?: string;
  total_review_count?: number;
  total_review_positive_percent?: number;
  recent_review_count?: number;
  recent_review_positive_percent?: number;
}

interface RecommendResponse {
  status: string;
  data: RecommendedGame[];
  skipped_game_ids: number[];
}
```

### `RecommendationSettings` (`src/types/settings.ts`)

```typescript
interface RecommendationSettings {
  count: number;           // 5–20, number of results to display
  weights: {
    similarity: number;    // 1–10, raw slider value (normalized at ranking time)
    popularity: number;
    rating: number;
    recency: number;
  };
  filters: {
    minReleaseDate: string;     // "YYYY-MM-DD"
    minReviewCount: number;
    minPositivePercent: number;  // 0–100
  };
  halfLifeDays: number;    // Recency decay half-life (default: 1825 = ~5 years)
}
```

---

## Utility Functions

File: `src/lib/utils.ts`

| Function | Signature | Description |
|----------|-----------|-------------|
| `cn` | `(...inputs: ClassValue[]) → string` | Merges CSS classes (clsx + tailwind-merge) |
| `formatPlaytime` | `(minutes: number) → string` | Formats playtime: `45` → `"45m"`, `180` → `"3h"` |
| `steamIconUrl` | `(appid: number, imgIconUrl: string) → string` | Builds Steam game icon URL |
| `steamHeaderUrl` | `(appid: number) → string` | Builds Steam game header image URL |

File: `src/lib/constants.ts`

| Export | Type | Description |
|--------|------|-------------|
| `CANDIDATE_LIMIT` | `number` | Max candidates to request from backend (env-configurable, default: 50) |
| `DEFAULT_SETTINGS` | `RecommendationSettings` | Default values for all recommendation settings |

---

## Page Requirements

### 1. Home/Login Page (`/`)
- **Server component** (can use `await auth()`)
- If authenticated → redirect to `/user`
- Show Steam login button → link to `/api/auth/steam/redirect`
- No data fetching needed

### 2. User Library Page (`/user`)
- **Client component** (`"use client"`)
- Requires authentication (redirect to `/` if unauthenticated)
- Fetch library: `useQuery({ queryKey: ["steamLibrary"], queryFn: fetchSteamLibrary })`
- Optionally enrich top games: `fetchGamesInfo(topGameIds)` → merge genres/tags/header_image
- Display user profile (session.user.name, .image)
- Show game library with sorting (by playtime, name, etc.)
- Game selection mode: let users pick specific games for targeted recommendations
- Settings dialog: adjust recommendation weights/filters via `useSettings()`
- Navigate to `/recommend` (or `/recommend?selected=id1,id2,...` for selected games)
- Sign out button: `signOut({ callbackUrl: "/" })`

### 3. Recommendations Page (`/recommend`)
- **Client component** (`"use client"`)
- Requires authentication
- Read `?selected=id1,id2` query param to filter games (optional)
- Fetch library → filter if selected → call `fetchUserRecommendation()`
- Apply ranking: `rankGames(response.data, settings.weights, settings.halfLifeDays)`
- Slice to `settings.count` results
- Display game cards with: title, header_image, description, scores, reviews, genres, tags
- Each card should link to `game.url` (Steam store page)
- Show skipped games count if any
- Settings dialog for adjusting weights/filters
- Back navigation to `/user`

---

## Data Flow Diagram

```
[Steam OpenID] ──login──→ /api/auth/steam/callback ──session──→ NextAuth JWT

[/user page]
  ├── useSession() → session.user (steamid, name, image)
  ├── fetchSteamLibrary() → GET /api/steam/library → Steam API → SteamGame[]
  ├── fetchGamesInfo(ids) → POST /api/games/info → Backend API → GameInfo[]
  └── Navigate to /recommend(?selected=ids)

[/recommend page]
  ├── useSession() → verify auth
  ├── fetchSteamLibrary() → SteamGame[] (cached by React Query)
  ├── Filter by ?selected param (optional)
  ├── fetchUserRecommendation({games, limit, filters})
  │     → POST /api/recommend/user → Backend API → RecommendResponse
  ├── rankGames(candidates, weights, halfLifeDays) → RankedGame[]
  └── Display top N results (settings.count)
```

---

## Next.js Image Domains

Configured in `next.config.ts` for `<Image>` component:
- `cdn.cloudflare.steamstatic.com` — Game header images
- `media.steampowered.com` — Game icons
- `avatars.steamstatic.com` — User avatars

---

## Dev Docs

- [dev_docs/README-api.md](dev_docs/README-api.md) — Full backend API reference (Korean)
- [dev_docs/client_side_recommend_logic.md](dev_docs/client_side_recommend_logic.md) — Client ranking formulas
