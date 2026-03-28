"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { fetchSteamLibrary, fetchUserRecommendation } from "@/lib/api-client";
import { rankGames } from "@/lib/ranking";
import { useSettings } from "@/context/settings-context";
import { CANDIDATE_LIMIT } from "@/lib/constants";
import type { RankedGame } from "@/types/recommend";

// ── Score Bar ─────────────────────────────────────────────────────────────────

const SCORE_LABELS: Record<string, { label: string; color: string }> = {
  tfidf:      { label: "유사도", color: "var(--color-accent)" },
  popularity: { label: "인기도", color: "#4c6b22" },
  rating:     { label: "평점",   color: "#a45f1d" },
  recency:    { label: "최신성", color: "#8f5fde" },
};

function ScoreBar({ scoreKey, value }: { scoreKey: string; value: number }) {
  const { label, color } = SCORE_LABELS[scoreKey] ?? { label: scoreKey, color: "#fff" };
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 text-right shrink-0" style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
        {label}
      </span>
      <div
        className="flex-1 rounded-sm overflow-hidden"
        style={{ height: 6, backgroundColor: "var(--color-border)" }}
      >
        <div
          className="h-full rounded-sm transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-8 shrink-0" style={{ fontSize: 12, color: "var(--color-text-dim)" }}>
        {pct}%
      </span>
    </div>
  );
}

// ── Recommendation Card ───────────────────────────────────────────────────────

function RecommendCard({ game }: { game: RankedGame }) {
  return (
    <article
      className="grid rounded-sm overflow-hidden"
      style={{
        gridTemplateColumns: "184px 1fr",
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
      }}
    >
      {/* Header image */}
      <div className="relative shrink-0 self-stretch" style={{ minHeight: 86 }}>
        <Image
          src={game.header_image}
          alt={game.title}
          fill
          className="object-cover"
          unoptimized
          sizes="184px"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-3 min-w-0">
        {/* Title + link */}
        <div className="flex items-start justify-between gap-2">
          <a
            href={game.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-base font-semibold leading-tight hover:underline truncate"
            style={{ color: "var(--color-text-link)" }}
          >
            {game.title}
          </a>
          <span
            className="shrink-0 text-sm font-bold"
            style={{ color: "var(--color-accent)" }}
          >
            {Math.round(game.finalScore * 100)}
          </span>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-x-3 gap-y-0.5" style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
          {game.developer && <span>{game.developer}</span>}
          {game.release_date_original && <span>{game.release_date_original}</span>}
          {game.all_reviews && <span>{game.all_reviews}</span>}
        </div>

        {/* Genres */}
        {game.genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {game.genres.slice(0, 4).map((g) => (
              <span
                key={g}
                className="px-1.5 py-0.5 rounded-sm"
                style={{
                  fontSize: 12,
                  backgroundColor: "var(--color-bg-header)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-secondary)",
                }}
              >
                {g}
              </span>
            ))}
          </div>
        )}

        {/* Score bars */}
        <div className="flex flex-col gap-1 mt-auto pt-1">
          {(["tfidf", "popularity", "rating", "recency"] as const).map((k) => (
            <ScoreBar key={k} scoreKey={k} value={game.scores[k]} />
          ))}
        </div>
      </div>
    </article>
  );
}

// ── Settings Panel ────────────────────────────────────────────────────────────

function SettingsPanel({ onApply }: { onApply?: () => void }) {
  const { settings, dispatch } = useSettings();

  const WEIGHT_LABELS: Record<string, string> = {
    similarity: "유사도",
    popularity: "인기도",
    rating: "평점",
    recency: "최신성",
  };

  return (
    <div className="flex flex-col gap-5 p-4 text-sm">
      {/* Count */}
      <div className="flex flex-col gap-2">
        <label className="font-semibold" style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
          Count <span style={{ color: "var(--color-accent)" }}>{settings.count}</span>
        </label>
        <input
          type="range"
          min={5}
          max={20}
          value={settings.count}
          onChange={(e) => dispatch({ type: "SET_COUNT", payload: Number(e.target.value) })}
          className="w-full accent-[var(--color-accent)]"
        />
        <div className="flex justify-between" style={{ fontSize: 10, color: "var(--color-text-dim)" }}>
          <span>5</span><span>20</span>
        </div>
      </div>

      {/* Weights */}
      <div className="flex flex-col gap-3">
        <p className="font-semibold" style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Weights</p>
        {(["similarity", "popularity", "rating", "recency"] as const).map((key) => (
          <div key={key} className="flex flex-col gap-1">
            <div className="flex justify-between" style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
              <span>{WEIGHT_LABELS[key]}</span>
              <span style={{ color: "var(--color-accent)" }}>{settings.weights[key]}</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={settings.weights[key]}
              onChange={(e) =>
                dispatch({ type: "SET_WEIGHT", payload: { key, value: Number(e.target.value) } })
              }
              className="w-full accent-[var(--color-accent)]"
            />
          </div>
        ))}
      </div>

      {/* HalfLife */}
      <div className="flex flex-col gap-2">
        <label className="font-semibold" style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
          Recency Half-life <span style={{ color: "var(--color-accent)" }}>{settings.halfLifeDays}d</span>
        </label>
        <input
          type="range"
          min={180}
          max={3650}
          step={90}
          value={settings.halfLifeDays}
          onChange={(e) => dispatch({ type: "SET_HALF_LIFE_DAYS", payload: Number(e.target.value) })}
          className="w-full accent-[var(--color-accent)]"
        />
        <div className="flex justify-between" style={{ fontSize: 10, color: "var(--color-text-dim)" }}>
          <span>180d</span><span>3650d</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <p className="font-semibold" style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Filters</p>

        <div className="flex flex-col gap-1">
          <label style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>Released after</label>
          <input
            type="date"
            value={settings.filters.minReleaseDate}
            onChange={(e) =>
              dispatch({ type: "SET_FILTER", payload: { key: "minReleaseDate", value: e.target.value } })
            }
            className="px-2 py-1.5 rounded-sm text-xs outline-none"
            style={{
              backgroundColor: "var(--color-bg-primary)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-primary)",
              colorScheme: "dark",
            }}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
            Min. reviews <span style={{ color: "var(--color-accent)" }}>{settings.filters.minReviewCount}</span>
          </label>
          <input
            type="number"
            min={0}
            value={settings.filters.minReviewCount}
            onChange={(e) =>
              dispatch({ type: "SET_FILTER", payload: { key: "minReviewCount", value: Number(e.target.value) } })
            }
            className="px-2 py-1.5 rounded-sm text-xs outline-none w-full"
            style={{
              backgroundColor: "var(--color-bg-primary)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-primary)",
            }}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
            Min. positive % <span style={{ color: "var(--color-accent)" }}>{settings.filters.minPositivePercent}%</span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={settings.filters.minPositivePercent}
            onChange={(e) =>
              dispatch({ type: "SET_FILTER", payload: { key: "minPositivePercent", value: Number(e.target.value) } })
            }
            className="w-full accent-[var(--color-accent)]"
          />
          <div className="flex justify-between" style={{ fontSize: 10, color: "var(--color-text-dim)" }}>
            <span>0%</span><span>100%</span>
          </div>
        </div>
      </div>

      {/* Reset + Apply */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => dispatch({ type: "RESET_DEFAULTS" })}
          className="flex-1 py-2 rounded-sm text-xs transition-opacity hover:opacity-80"
          style={{
            border: "1px solid var(--color-border)",
            color: "var(--color-text-secondary)",
          }}
        >
          Reset
        </button>
        {onApply && (
          <button
            onClick={onApply}
            className="flex-1 py-2 rounded-sm text-xs font-semibold transition-opacity hover:opacity-90"
            style={{
              backgroundColor: "var(--color-accent-cta)",
              color: "var(--color-cta-text)",
            }}
          >
            Apply
          </button>
        )}
      </div>
    </div>
  );
}

// ── Bottom Sheet (mobile settings) ────────────────────────────────────────────

function BottomSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden overflow-y-auto transition-transform duration-300 rounded-t-sm"
        style={{
          maxHeight: "70vh",
          backgroundColor: "var(--color-bg-header)",
          borderTop: "1px solid var(--color-border)",
          transform: open ? "translateY(0)" : "translateY(100%)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="추천 설정"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "var(--color-border-active)" }} />
        </div>
        <SettingsPanel onApply={onClose} />
      </div>
    </>
  );
}

// ── Skeleton Card ─────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div
      className="grid rounded-sm overflow-hidden animate-pulse"
      style={{
        gridTemplateColumns: "184px 1fr",
        minHeight: 120,
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div style={{ backgroundColor: "var(--color-border)" }} />
      <div className="flex flex-col gap-3 p-3">
        <div className="h-4 w-3/4 rounded-sm" style={{ backgroundColor: "var(--color-border)" }} />
        <div className="h-3 w-1/2 rounded-sm" style={{ backgroundColor: "var(--color-border)" }} />
        <div className="flex flex-col gap-1.5 mt-auto">
          {[1,2,3,4].map((i) => (
            <div key={i} className="h-2 rounded-sm" style={{ backgroundColor: "var(--color-border)" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Inner Page (uses useSearchParams — must be in Suspense) ───────────────────

function RecommendInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { settings } = useSettings();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Redirect if unauthenticated
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  // Parse ?selected= param
  const selectedAppids = useMemo<number[]>(() => {
    const raw = searchParams.get("selected");
    if (!raw) return [];
    return raw
      .split(",")
      .map(Number)
      .filter((n) => !isNaN(n) && n > 0);
  }, [searchParams]);

  // Fetch library (shared React Query cache with /user page)
  const { data: library } = useQuery({
    queryKey: ["steamLibrary"],
    queryFn: fetchSteamLibrary,
    enabled: status === "authenticated",
    staleTime: 5 * 60 * 1000,
  });

  // Re-join selected appids against library
  const selectedGames = useMemo(() => {
    if (!library) return [];
    if (selectedAppids.length === 0) return library;
    const idSet = new Set(selectedAppids);
    return library.filter((g) => idSet.has(g.appid));
  }, [library, selectedAppids]);

  // Fetch recommendations — re-fetches on filter change, not on weight change
  const {
    data: recommendData,
    isLoading: recLoading,
    error: recError,
    isFetching,
  } = useQuery({
    queryKey: [
      "recommendations",
      selectedGames.map((g) => g.appid),
      settings.filters,
      CANDIDATE_LIMIT,
    ],
    queryFn: () =>
      fetchUserRecommendation({
        games: selectedGames,
        limit: CANDIDATE_LIMIT,
        release_date: settings.filters.minReleaseDate || undefined,
        total_review_count: settings.filters.minReviewCount || undefined,
        total_review_positive_percent: settings.filters.minPositivePercent || undefined,
      }),
    enabled: selectedGames.length > 0,
    staleTime: 2 * 60 * 1000,
  });

  // Client-side ranking — instant on weight/halfLife change
  const rankedGames = useMemo<RankedGame[]>(() => {
    if (!recommendData?.data) return [];
    const ranked = rankGames(recommendData.data, settings.weights, settings.halfLifeDays);
    return ranked.slice(0, settings.count);
  }, [recommendData, settings.weights, settings.halfLifeDays, settings.count]);

  const isLoading = status === "loading" || recLoading || (selectedGames.length === 0 && !library);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg-primary)" }}>
      {/* ── Nav ── */}
      <nav
        className="sticky top-0 z-20 flex items-center justify-between px-6 py-3 gap-4"
        style={{
          backgroundColor: "var(--color-bg-header)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/user")}
            className="text-xs px-3 py-1.5 rounded-sm transition-opacity hover:opacity-80"
            style={{
              border: "1px solid var(--color-border)",
              color: "var(--color-text-secondary)",
            }}
          >
            ← Library
          </button>
          <span className="text-sm font-semibold hidden sm:block" style={{ color: "var(--color-text-primary)" }}>
            {selectedAppids.length > 0
              ? `Recommendations based on ${selectedAppids.length} selected games`
              : "Recommendations based on full library"}
          </span>
        </div>

        {/* Mobile settings trigger */}
        <button
          onClick={() => setSheetOpen(true)}
          className="lg:hidden text-xs px-3 py-1.5 rounded-sm transition-opacity hover:opacity-80"
          style={{
            border: "1px solid var(--color-border)",
            color: "var(--color-text-secondary)",
          }}
          aria-label="설정 열기"
        >
          ⚙ Settings
        </button>

        {/* Re-ranking indicator */}
        {isFetching && !recLoading && (
          <span className="text-xs hidden lg:block" style={{ color: "var(--color-text-secondary)" }}>
            Refreshing...
          </span>
        )}
      </nav>

      <div className="flex max-w-7xl mx-auto gap-0">
        {/* ── Settings Sidebar (lg) ── */}
        <aside
          className="hidden lg:flex flex-col shrink-0 overflow-y-auto sticky top-[53px] self-start"
          style={{
            width: 280,
            maxHeight: "calc(100vh - 53px)",
            borderRight: "1px solid var(--color-border)",
          }}
        >
          <div
            className="px-4 pt-4 pb-2 text-xs font-semibold"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Settings
          </div>
          <SettingsPanel />
        </aside>

        {/* ── Card Area ── */}
        <main className="flex-1 min-w-0 px-6 py-6">
          {/* Loading */}
          {isLoading ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 py-4">
                <div
                  className="w-5 h-5 rounded-full border-2 animate-spin shrink-0"
                  style={{
                    borderColor: "var(--color-border)",
                    borderTopColor: "var(--color-accent)",
                  }}
                />
                <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  Finding games you&apos;ll love...
                </span>
              </div>
              {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : recError ? (
            /* Error */
            <div
              className="flex flex-col items-center gap-3 py-16 text-center rounded-sm"
              style={{
                backgroundColor: "var(--color-error-bg)",
                border: "1px solid var(--color-error)",
              }}
            >
              <span className="text-3xl">⚠️</span>
              <p className="text-sm font-semibold" style={{ color: "var(--color-error)" }}>
                Failed to load recommendations
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                There was a server error or your library could not be read.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="text-xs px-4 py-2 rounded-sm mt-1"
                style={{
                  border: "1px solid var(--color-error)",
                  color: "var(--color-error)",
                }}
              >
                Try again
              </button>
            </div>
          ) : rankedGames.length === 0 ? (
            /* Empty */
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <span className="text-3xl">🎮</span>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                No recommendations found
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                Try relaxing the filters or selecting different games.
              </p>
              <button
                onClick={() => router.push("/user")}
                className="text-xs px-4 py-2 rounded-sm mt-1"
                style={{
                  backgroundColor: "var(--color-accent-cta)",
                  color: "var(--color-cta-text)",
                }}
              >
                Select games
              </button>
            </div>
          ) : (
            /* Success */
            <div className="flex flex-col gap-4">
              <p className="text-xs" style={{ color: "var(--color-text-dim)" }}>
                Top {rankedGames.length} recommendations · Weight changes re-rank instantly
              </p>
              {rankedGames.map((game) => (
                <RecommendCard key={game.game_id} game={game} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ── Mobile Bottom Sheet ── */}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
}

// ── Page Export (Suspense wrapper for useSearchParams) ────────────────────────

export default function RecommendPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: "var(--color-bg-primary)" }}
        >
          <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Loading...
          </span>
        </div>
      }
    >
      <RecommendInner />
    </Suspense>
  );
}
