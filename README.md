# Steam Game Recommender — Frontend

A personalized Steam game recommendation web app. Log in with your Steam account, browse your library, and get ranked recommendations tuned to your taste.

Built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS v4**, and **shadcn/ui** with a Steam dark theme.

---

## Features

- **Steam OAuth login** — one click, no passwords
- **Library dashboard** — playtime stats, genre/tag breakdowns, list and carousel views
- **Personalized recommendations** — select up to 20 games as seeds, or use your full library
- **Client-side ranking** — four tunable scores: Similarity, Popularity, Rating, Recency
- **Score visualization** — radar chart or progress bars, per-card toggle
- **Settings panel** — weight sliders, recommendation count, filters, recency half-life

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Login page — Steam OAuth entry point |
| `/user` | Library view — stats dashboard + game selection |
| `/recommend` | Ranked recommendations with score breakdown |

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + shadcn/ui |
| Styling | Tailwind CSS v4 |
| Auth | NextAuth v5 (Steam OpenID) |
| Data fetching | TanStack Query v5 |
| Charts | Recharts (dynamic import, SSR disabled) |
| Testing | Vitest + Testing Library |

---

## Getting Started

### Prerequisites

- Node.js 20+
- A Steam API key ([get one here](https://steamcommunity.com/dev/apikey))
- The recommendation backend running (see `../` for the full monorepo)

### Install

```bash
npm install
```

### Environment

Copy `.env.example` and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `API_HOST` | Yes | Recommendation backend host |
| `API_PORT` | Yes | Recommendation backend port |
| `STEAM_API_KEY` | Yes | Steam Web API key |
| `NEXTAUTH_SECRET` | Yes | NextAuth secret (any random string) |
| `NEXTAUTH_URL` | Yes | App URL (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_MAX_GAME_SELECTION` | No | Max games to select as seeds (default: 20) |
| `NEXT_PUBLIC_CANDIDATE_LIMIT` | No | Candidates fetched from API (default: 100) |
| `NEXT_PUBLIC_DEFAULT_HALF_LIFE_DAYS` | No | Recency half-life in days (default: 1825) |

### Run

```bash
npm run dev      # development server at http://localhost:3000
npm run build    # production build
npm run start    # start production server
```

### Test

```bash
npm test         # run all tests
npm run test:ui  # Vitest UI mode
```

21 tests cover `rankGames`, `formatPlaytime`, `enrichGames`, `steamHeaderUrl`, `steamIconUrl`.

---

## How Ranking Works

Recommendations are ranked client-side using four normalized scores:

| Score | Label | Description |
|-------|-------|-------------|
| `tfidf` | **Similarity** | TF-IDF cosine similarity from the recommendation API |
| `popularity` | **Popularity** | Log-normalized review count within the candidate set |
| `rating` | **Rating** | Positive review ratio (0–1) |
| `recency` | **Recency** | Exponential decay from release date with a configurable half-life |

Final score = weighted sum of the four, where weights sum to 1.0. Users set raw 1–10 values; the app normalizes them before scoring.

Default weights: Similarity 4 / Popularity 3 / Rating 2 / Recency 1.

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Login page (Server Component)
│   ├── user/page.tsx         # Library page (Client Component)
│   ├── recommend/page.tsx    # Recommendations page (Client Component)
│   ├── layout.tsx            # Root layout + fonts
│   ├── globals.css           # Global styles + Steam theme tokens
│   └── api/                  # Proxy routes (Steam auth + backend)
│
├── components/
│   ├── ui/                   # shadcn/ui components (do not edit)
│   ├── nav-bar.tsx           # Top nav (login state, logout)
│   ├── stat-card.tsx         # Dashboard stat card
│   ├── game-row.tsx          # Library list item
│   ├── game-carousel.tsx     # Library carousel (drag-scroll)
│   ├── recommend-card.tsx    # Recommendation result card
│   ├── score-radar.tsx       # Recharts radar chart (SSR-safe)
│   ├── settings-panel.tsx    # Weight/filter sliders
│   └── providers.tsx         # Session + Query + Settings providers
│
├── lib/
│   ├── api-client.ts         # Fetch functions (library, game info, recommend)
│   ├── ranking.ts            # rankGames() — client-side scoring
│   ├── constants.ts          # CANDIDATE_LIMIT, DEFAULT_SETTINGS, MAX_GAME_SELECTION
│   └── utils.ts              # cn, formatPlaytime, steamHeaderUrl, enrichGames
│
├── types/                    # TypeScript interfaces
├── context/                  # Settings state (React Context + localStorage)
└── auth.ts                   # NextAuth config (Steam OpenID)
```

---

## Data Flow

```
/ (login)
  └─ Authenticated → redirect /user
  └─ Not authenticated → Steam login button

/user
  └─ fetchSteamLibrary() → SteamGame[]
  └─ fetchGamesInfo(top 50 by playtime) → GameInfo[]
  └─ enrichGames() → SteamGameEnriched[]
  └─ Stats dashboard (top 50 games basis)
  └─ GameLibrary (search/filter/sort, multi-select up to 20)
  └─ Navigate → /recommend?selected=appid1,appid2,...

/recommend
  └─ Parse ?selected → join against library → SteamGame[]
     (absent or empty = use full library)
  └─ fetchUserRecommendation({ games, limit, ...filters })
  └─ rankGames(candidates, weights, halfLifeDays) → RankedGame[]
  └─ Slice to count → render RankedGameCard[]
```

---

## Design System

Steam dark theme. Full spec in [`DESIGN.md`](./DESIGN.md).

Key tokens:

| Role | Color |
|------|-------|
| Background | `#0e1117` |
| Card surface | `#16202d` |
| Accent (Steam blue) | `#67c1f5` |
| CTA button | `#5c7e10` bg / `#d4e157` text |
| Text primary | `#c7d5e0` |
| Text secondary | `#8f98a0` |
| Border | `#2a475e` |

Border radius: 3px (`rounded-sm`) everywhere. No `rounded-lg` on cards.

---

## Docker

A `docker-compose.yml` is provided at the repo root for running the full stack locally. See the monorepo root for details.

---

## Known Limitations

- **Rate limiting** — removed (in-memory approach incompatible with serverless). A Redis/KV-backed solution is tracked in [`TODOS.md`](./TODOS.md).
- **Steam OpenID hardening** — `openid.return_to` and nonce validation are deferred. See [`TODOS.md`](./TODOS.md).
- **E2E tests** — Steam OAuth makes full E2E complex. Unit test coverage is solid; E2E is a future item.
- **Stats dashboard** — based on top 50 most-played games, not the full library.

---

## License

MIT
