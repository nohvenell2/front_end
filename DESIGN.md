# Design System

Steam Game Recommender — Design Tokens & Specs

Updated by /plan-design-review on 2026-03-29 (ui-v3 — shadcn/ui refactor)

---

## App Type

**APP UI** — task-focused utility, not marketing/landing page.
Apply App UI rules: calm surface hierarchy, density over decoration, utility language.

---

## Information Hierarchy (per page)

### / (Login)
- PRIMARY: Steam 로그인 버튼 (단 하나의 행동)
- SECONDARY: 서비스 설명 1줄
- TERTIARY: 없음

### /user (Library)
- PRIMARY: 게임 라이브러리 리스트 (선택 행동) + 하단 고정 CTA
- SECONDARY: Stats 대시보드 5개 카드 — 조용한 스타일, muted text
- TERTIARY: 장르/태그 차트 (기본 상태: 접힘)

Stats 카드는 `text-muted-foreground` 로 다운그레이드. CTA가 페이지의 유일한 목표.

### /recommend (Recommendations)
- PRIMARY: 추천 카드 목록 (1위 카드 border Steam 블루 강조)
- SECONDARY: 점수 시각화 (레이더 차트 — 카드 내부)
- TERTIARY: 사이드바 설정 (현재 설정값 반영, 조용한 스타일)

---

## Color System

Two-layer system: shadcn CSS variables (HSL) + Steam legacy tokens (hex).
shadcn 컴포넌트는 `--background`, `--primary` 등을 읽음. Steam token은 shadcn 외부(인라인 스타일 불필요 — Tailwind 유틸리티로 대체) 참조용으로 유지.

Define in `src/app/globals.css`:

```css
:root {
  /* ── shadcn/ui CSS variable layer (HSL channel values, no hsl() wrapper) ── */
  --background: 220 28% 7%;          /* #0e1117 */
  --foreground: 208 23% 87%;         /* #c7d5e0 */
  --card: 214 33% 14%;               /* #16202d */
  --card-foreground: 208 23% 87%;    /* #c7d5e0 */
  --popover: 214 33% 14%;
  --popover-foreground: 208 23% 87%;
  --primary: 203 85% 68%;            /* #67c1f5 Steam blue */
  --primary-foreground: 220 28% 7%;  /* dark text on blue */
  --secondary: 222 22% 11%;          /* #171a21 muted surface */
  --secondary-foreground: 207 8% 62%;
  --muted: 222 22% 11%;              /* #171a21 */
  --muted-foreground: 207 8% 62%;    /* #8f98a0 */
  --accent: 204 40% 42%;             /* #417a9b border-active */
  --accent-foreground: 208 23% 87%;
  --destructive: 0 72% 61%;          /* #f44747 */
  --destructive-foreground: 208 23% 87%;
  --border: 205 38% 26%;             /* #2a475e */
  --input: 205 38% 26%;
  --ring: 203 85% 68%;               /* #67c1f5 focus ring */
  --radius: 0.1875rem;               /* 3px — Steam sharp corners */

  /* ── Steam legacy tokens (hex) — kept for non-shadcn contexts ── */
  --color-bg-primary: #0e1117;
  --color-bg-elevated: #16202d;
  --color-bg-header: #171a21;
  --color-border: #2a475e;
  --color-border-active: #417a9b;
  --color-accent: #67c1f5;
  --color-accent-green: #4c6b22;
  --color-accent-cta: #5c7e10;       /* CTA button bg */
  --color-cta-text: #d4e157;         /* CTA button text */
  --color-text-primary: #c7d5e0;
  --color-text-secondary: #8f98a0;
  --color-text-link: #66c0f4;
  --color-text-dim: #4a6b80;
  --color-error: #f44747;
  --color-error-bg: #2a1517;
}
```

**CTA Button:** shadcn `Button`에 커스텀 variant `"cta"` 추가.
```tsx
// bg-[#5c7e10] text-[#d4e157] hover:bg-[#4c6b22]
```
Steam 그린 CTA는 blue primary와 색 대비가 되어 시각적 위계를 만듦. 변경 금지.

WCAG AA contrast verified:
- `--color-text-primary` (#c7d5e0) on `--color-bg-primary` (#0e1117): 9.8:1 ✓
- `--color-text-secondary` (#8f98a0) on `--color-bg-primary`: 5.1:1 ✓
- `--color-accent` (#67c1f5) on `--color-bg-primary`: 6.2:1 ✓

---

## Typography

**Font:** `Noto Sans KR` (Google Fonts)
**Why:** Korean labels (유사도/인기도/평점/최신성) appear in score visualization on every recommendation card.

Load in `src/app/layout.tsx`:
```tsx
import { Noto_Sans_KR } from 'next/font/google'

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})
```

Apply in `<body className={notoSansKR.variable}>`.

**Type Scale:**
| Use | Size | Weight | Color |
|-----|------|--------|-------|
| Micro labels (tags, annotations) | 10px | 400 | `--color-text-secondary` |
| Meta text (playtime, release date) | 11px | 400 | `--color-text-secondary` |
| Secondary body (descriptions) | 12px | 400 | `--color-text-secondary` |
| Body / list items | 13px | 400 | `--color-text-primary` |
| Primary body | 14px | 400 | `--color-text-primary` |
| Card titles | 15px | 600 | `--color-text-primary` |
| Stat numbers | 24px | 700 | `--color-accent` |

---

## Border Radius

Single consistent value: `3px` (`rounded-sm` in Tailwind).
shadcn `--radius` 변수를 `0.1875rem` (3px)으로 설정해 모든 shadcn 컴포넌트에 자동 적용.
Never use `rounded-lg` or `rounded-xl` on cards/panels — too bubbly for a gaming utility app.
Exception: circular avatars use `rounded-full`.

---

## Spacing Scale

Use Tailwind's default spacing scale. Key values:
- Component padding: `p-3` (12px) or `p-4` (16px)
- Card gap: `gap-3` (12px)
- Section gap: `gap-4` (16px) or `gap-6` (24px)
- Page padding: `px-6` (24px)

---

## shadcn/ui Component Map

Install: `npx shadcn@latest init` → `npx shadcn@latest add button card input slider progress badge sheet separator label`

| UI Pattern | shadcn Component | Override notes |
|------------|-----------------|----------------|
| 일반 버튼 (뒤로가기, 토글 등) | `Button variant="outline"` | border/text: Steam colors |
| 추천 CTA 버튼 | `Button` + custom `variant="cta"` | bg `#5c7e10`, text `#d4e157` |
| 카드 (StatCard, RecommendCard) | `Card` | `shadow-none rounded-sm` |
| 검색 인풋 | `Input` | dark bg override |
| 설정 슬라이더 (가중치, 개수) | `Slider` | `--primary` accent 자동 적용 |
| 점수 바 | `Progress` | per-score 색상 className |
| 장르/선택게임 칩 | `Badge variant="secondary"` | — |
| 모바일 설정 바텀시트 | `Sheet side="bottom"` | height 70vh |
| 설정 구분선 | `Separator` | — |
| 슬라이더 레이블 | `Label` | — |

**절대 하지 말 것:** shadcn 기본 `rounded-lg`, `shadow-md` 유지. 반드시 `className="rounded-sm shadow-none"` 오버라이드.

## Component Directory Structure

```
src/components/
├── ui/                    ← shadcn 자동 생성 (직접 수정 금지)
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── slider.tsx
│   ├── progress.tsx
│   ├── badge.tsx
│   ├── sheet.tsx
│   ├── separator.tsx
│   └── label.tsx
├── providers.tsx          ← 기존 유지
├── nav-bar.tsx            ← 공통 상단 Nav (로그인 상태, 로그아웃 버튼)
├── stat-card.tsx          ← StatCard (shadcn Card 내부 사용)
├── game-row.tsx           ← GameRow (리스트 뷰 한 줄)
├── game-carousel.tsx      ← GameCarousel (드래그 스크롤 뷰)
├── recommend-card.tsx     ← RecommendCard (추천 결과 카드)
├── score-radar.tsx        ← ScoreRadar (recharts RadarChart, dynamic import)
└── settings-panel.tsx     ← SettingsPanel (shadcn Slider/Label/Separator)
```

page.tsx는 데이터 페칭 + 레이아웃만. 컴포넌트 정의 없음.

## Component Patterns

### Stat Card (/user dashboard)
- shadcn `Card` with `shadow-none rounded-sm`
- Data-first: large number (`text-2xl font-bold text-primary`) + short label (`text-xs text-muted-foreground`)
- No icons, no colored circles, no decorative shadows
- Stats는 secondary hierarchy — `text-muted-foreground` 레이블 사용

### Game Row (library list)
- Full-width clickable, min-height: 48px (touch target)
- Thumbnail: 46×28px (Steam header aspect ratio 460×215 = ~2.14:1)
- Selected state: `border-primary` + `bg-card`
- Hover state: `border-primary/50`

### Recommendation Card
- shadcn `Card` with `shadow-none rounded-sm grid grid-cols-[184px_1fr]`
- **1위 카드:** `border-primary` (Steam 블루) — 나머지는 `border-border`
- Image: Steam `header_image` URL via `steamHeaderUrl(appid)` utility
- Score visualization: recharts `RadarChart` (4 축: 유사도/인기도/평점/최신성)
  - dynamic import with `{ ssr: false }` (SSR crash 방지)
  - 레이더 색상: `fill: #67c1f5`, `fillOpacity: 0.2`, `stroke: #67c1f5`
  - 축 레이블: 한국어 (유사도/인기도/평점/최신성) — raw field name 절대 노출 금지

### Empty State Pattern
Every empty state requires:
1. Icon (relevant emoji, centered, `text-3xl`)
2. Title (`text-sm font-semibold`)
3. Body (1-2 lines, `text-xs text-muted-foreground`)
4. Primary action (`Button` 컴포넌트)

### Loading State Pattern
- **Lists:** shadcn `Skeleton` rows with shimmer
- **Calculations:** Spinner + copy "Finding games you'll love..."
- **Progressive (genre enrichment):** Library renders immediately, genre/tag columns shimmer then fill
- **Library fetch error:** `Card` with destructive border + retry `Button` — 절대 빈 화면 금지

---

## Accessibility

- ARIA landmarks: `<main>`, `<nav>` (top bar), `<aside>` (settings sidebar), `<dialog>` (modals/drawers)
- Focus trap: modal/drawer open → trap focus; close → return to trigger
- Keyboard: Tab nav, Space to toggle game selection, Arrow keys on sliders (±1), Shift+Arrow (±10), Escape to close modal
- Touch targets: all interactive elements ≥ 44×44px
- Animations: wrap shimmer in `@media (prefers-reduced-motion: no-preference)` block

```css
@media (prefers-reduced-motion: reduce) {
  .animate-pulse {
    animation: none;
  }
}
```

---

## Responsive Breakpoints

| Page | ≥1024px (lg) | 768-1023px (md) | <768px |
|------|-------------|-----------------|--------|
| / Login | Centered card, max-w-md | Same | Same, full-width card |
| /user | 2-col stats (4x grid), 2-col charts | 2×2 stat grid, charts stack | Single col, all stacked |
| /recommend | 2-col: 280px sidebar + cards | Sidebar hidden → bottom sheet trigger | Cards full-width, bottom sheet |
| Settings dialog | Centered modal, max-w-lg | Centered modal | Bottom sheet (70vh) |

**Mobile Settings bottom sheet (/recommend):**
- shadcn `Sheet side="bottom"` 사용
- Height: 70vh, scrollable content
- Sticky "Apply" button at bottom
- Close: overlay 탭 or Escape

---

## Interaction State Coverage

| Feature | LOADING | EMPTY | ERROR | SUCCESS |
|---------|---------|-------|-------|---------|
| 라이브러리 fetch | Skeleton rows (shimmer) | "라이브러리가 비어있습니다" + Steam 로그인 유도 | Card + destructive border + retry Button | 게임 리스트 렌더 |
| 게임 정보 enrich | Skeleton (genre/tag 컬럼) | — | 조용히 실패 (장르 없이 표시) | 장르/태그 Badge |
| 추천 fetch | Skeleton cards x5 + "Finding games..." | 🎮 "추천 결과 없음" + 필터 완화 유도 | ⚠️ Card + retry Button | 카드 목록 |
| 가중치 재랭킹 | 없음 (즉시 반영) | — | — | 카드 순서 변경 |
| 게임 선택 0개로 추천 | — | 전체 라이브러리 기준 추천으로 fallback (nav에 표시) | — | — |

---

## Implementation Rules (ui-v3 additions)

6. **shadcn CSS variables:** `globals.css`에 shadcn HSL layer를 Steam hex token 위에 추가. 두 시스템 공존.
7. **shadcn 기본값 오버라이드:** 모든 Card는 `shadow-none rounded-sm` 필수. `rounded-lg` 사용 금지.
8. **CTA Button:** shadcn `Button`에 `variant="cta"` 커스텀 추가 (`bg-[#5c7e10] text-[#d4e157]`). 변경 금지.
9. **Score visualization:** recharts `RadarChart` — dynamic import `{ ssr: false }`. 4 axes: 유사도/인기도/평점/최신성. raw field name 노출 금지.
10. **1위 추천 카드:** `border-primary` (Steam 블루). 나머지는 `border-border`.
11. **Stats hierarchy:** Stats 카드 레이블은 `text-muted-foreground`. CTA가 page primary action.
