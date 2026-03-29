# Changelog

All notable changes to this project will be documented in this file.

## [0.1.1.0] - 2026-03-29

### Added
- shadcn/ui component library with Steam dark theme (card, button, badge, sheet, slider, tooltip, etc.)
- Horizontal drag-scroll carousel view for game library with infinite scroll and wheel support
- List view mode for game library with `GameRow` component
- Horizontal stat cards dashboard on `/user` (playtime, game count, genre/tag charts)
- Settings panel as slide-over Sheet on `/recommend`
- Score visualization toggle: radar chart ↔ progress bars, persisted per-card and globally
- `MAX_GAME_SELECTION` constant + enforcement on `?selected` URL param
- Auth guard on all three API proxy routes (`/api/games/info`, `/api/recommend/game`, `/api/recommend/user`)
- Vitest test framework with 21 tests covering `rankGames`, `formatPlaytime`, `enrichGames`, `steamHeaderUrl`, `steamIconUrl`
- DESIGN.md design system specification

### Changed
- Full UI rewrite of `/`, `/user`, and `/recommend` pages using shadcn/ui components
- Recommend card redesigned to vertical layout with full header image, grid/list support
- Corner radius system unified to `rounded-sm` (3px) per Steam UI conventions
- Breakpoints changed from `sm:` to `md:` (768px mobile boundary)
- Score labels in radar/progress bars localized to English: Similarity / Popularity / Rating / Recency
- `dark:` prefixes removed from all components (dark-only app)
- Settings hydration uses single `HYDRATE` dispatch instead of N individual dispatches
- `CANDIDATE_LIMIT` default updated from 50 → 100
- Login page hero: emoji replaced with Steam SVG mark
- Noto Sans KR font applied for Korean label support

### Fixed
- `rankGames`: NaN propagation from invalid `release_date` — now treated as today (0 days since release)
- `rankGames`: `total_review_positive_percent` clamped to [0, 1] range
- `recommend-card.tsx`: `game.url` href sanitized to reject `javascript:` URIs
- Proxy routes: check `res.ok` before `res.json()` to avoid SyntaxError on HTML error responses
- Sort `<select>` on `/user` page: added `focus-visible` ring (was `outline-none` with no replacement)
- Slider: replaced base-ui Slider with native range input (base-ui type error)
- Scroll card height unified, dark scrollbar color applied

### Removed
- Dead rate limiting code (incompatible with Vercel serverless)
- `src/proxy.ts` (dead proxy utility)
- Legacy component directories: `src/components/login/`, `src/components/recommend/`, `src/components/settings/`, `src/components/user/`
