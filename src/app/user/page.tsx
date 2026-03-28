"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import Image from "next/image";
import { fetchSteamLibrary, fetchGamesInfo } from "@/lib/api-client";
import { enrichGames, formatPlaytime, steamIconUrl, steamHeaderUrl } from "@/lib/utils";
import { MAX_GAME_SELECTION } from "@/lib/constants";
import type { SteamGame, SteamGameEnriched } from "@/types/steam";

const ENRICH_LIMIT = 50;

// recharts — dynamic import, SSR disabled
const BarChart = dynamic(
  () => import("recharts").then((m) => m.BarChart),
  { ssr: false }
);
const Bar = dynamic(() => import("recharts").then((m) => m.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(
  () => import("recharts").then((m) => m.ResponsiveContainer),
  { ssr: false }
);

// ── Skeleton components ────────────────────────────────────────────────────────

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-sm ${className ?? ""}`}
      style={{ backgroundColor: "var(--color-bg-elevated)" }}
    />
  );
}

function StatCardSkeleton() {
  return (
    <div
      className="rounded-sm p-4 flex flex-col gap-2"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
      }}
    >
      <SkeletonBlock className="h-8 w-20" />
      <SkeletonBlock className="h-3 w-16" />
    </div>
  );
}

function GameRowSkeleton() {
  return (
    <div
      className="flex items-center gap-3 px-4 animate-pulse"
      style={{ minHeight: 48 }}
    >
      <SkeletonBlock className="w-4 h-4 shrink-0" />
      <SkeletonBlock className="w-[46px] h-[28px] shrink-0" />
      <SkeletonBlock className="flex-1 h-3" />
      <SkeletonBlock className="w-10 h-3" />
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div
      className="rounded-sm p-4 flex flex-col gap-1 items-center text-center"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
      }}
    >
      <span
        className="text-2xl font-bold leading-none"
        style={{ color: "var(--color-accent)", fontSize: 24 }}
      >
        {value}
      </span>
      <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
        {label}
      </span>
    </div>
  );
}

// ── Distribution Chart ────────────────────────────────────────────────────────

function DistributionChart({
  title,
  data,
  barColor,
}: {
  title: string;
  data: { name: string; count: number }[];
  barColor: string;
}) {
  if (data.length === 0) return null;

  return (
    <div
      className="flex-1 min-w-0 rounded-sm p-4"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
      }}
    >
      <p className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>
        {title}
      </p>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
          <XAxis type="number" tick={{ fontSize: 10, fill: "var(--color-text-secondary)" }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10, fill: "var(--color-text-secondary)" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--color-bg-header)",
              border: "1px solid var(--color-border)",
              borderRadius: 3,
              fontSize: 11,
              color: "var(--color-text-primary)",
            }}
            cursor={{ fill: "rgba(103,193,245,0.05)" }}
          />
          <Bar dataKey="count" fill={barColor} radius={2} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Game Card ─────────────────────────────────────────────────────────────────

function GameCard({
  game,
  genres,
  headerImage,
  selected,
  onToggle,
  disabled,
  priority,
}: {
  game: SteamGame;
  genres: string[];
  headerImage?: string;
  selected: boolean;
  onToggle: (appid: number) => void;
  disabled: boolean;
  priority?: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const imgSrc = headerImage ?? steamHeaderUrl(game.appid);

  // Reset error state when the image URL changes (e.g. enriched data arrives)
  const prevSrc = useRef(imgSrc);
  if (prevSrc.current !== imgSrc) {
    prevSrc.current = imgSrc;
    if (imgError) setImgError(false);
  }

  return (
    <label
      className="relative flex flex-col h-full cursor-pointer rounded-sm overflow-hidden transition-colors"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: selected
          ? "2px solid var(--color-border-active)"
          : "2px solid var(--color-border)",
        opacity: disabled && !selected ? 0.5 : 1,
      }}
    >
      <input
        type="checkbox"
        checked={selected}
        disabled={disabled && !selected}
        onChange={() => onToggle(game.appid)}
        className="sr-only"
        aria-label={`${game.name} 선택`}
      />

      {/* Header image */}
      <div className="relative w-full" style={{ paddingTop: "46.7%" /* 215:100 ratio */ }}>
        {imgError ? (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: "var(--color-border)" }}
          >
            <span style={{ fontSize: 20 }}>🎮</span>
          </div>
        ) : (
          <Image
            src={imgSrc}
            alt=""
            fill
            className="object-cover"
            unoptimized
            loading={priority ? "eager" : "lazy"}
            sizes="(max-width: 768px) 50vw, 25vw"
            onError={() => setImgError(true)}
          />
        )}
        {/* Selected overlay */}
        {selected && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: "rgba(65,122,155,0.35)" }}
          >
            <span className="text-xl">✓</span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-col gap-1.5 p-2.5">
        <span
          className="text-xs font-semibold leading-tight line-clamp-2"
          style={{ color: "var(--color-text-primary)" }}
        >
          {game.name}
        </span>
        <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
          {formatPlaytime(game.playtime_forever)}
        </span>
        {genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {genres.slice(0, 5).map((g) => (
              <span
                key={g}
                className="px-1 py-0.5 rounded-sm"
                style={{
                  fontSize: 9,
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
      </div>
    </label>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function UserPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"playtime" | "name">("playtime");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [chartsOpen, setChartsOpen] = useState(false);

  // Redirect if unauthenticated
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  // Fetch library
  const {
    data: library,
    isLoading: libraryLoading,
    error: libraryError,
  } = useQuery({
    queryKey: ["steamLibrary"],
    queryFn: fetchSteamLibrary,
    enabled: status === "authenticated",
  });

  // Top 50 by playtime for enrichment
  const topGameIds = useMemo(() => {
    if (!library) return [];
    return [...library]
      .sort((a, b) => b.playtime_forever - a.playtime_forever)
      .slice(0, ENRICH_LIMIT)
      .map((g) => g.appid);
  }, [library]);

  // Fetch game info for enrichment
  const { data: gamesInfo, isLoading: enrichLoading } = useQuery({
    queryKey: ["gamesInfo", topGameIds],
    queryFn: () => fetchGamesInfo(topGameIds),
    enabled: topGameIds.length > 0,
  });

  // Enriched games (top 50)
  const enrichedGames = useMemo<SteamGameEnriched[]>(() => {
    if (!library || !gamesInfo) return [];
    return enrichGames(
      library.filter((g) => topGameIds.includes(g.appid)),
      gamesInfo
    );
  }, [library, gamesInfo, topGameIds]);

  // Stats
  const stats = useMemo(() => {
    if (!library) return null;
    const totalPlaytime = library.reduce((s, g) => s + g.playtime_forever, 0);

    const topOf = (items: string[][]) => {
      const counts: Record<string, number> = {};
      for (const list of items)
        for (const item of list)
          counts[item] = (counts[item] ?? 0) + 1;
      return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";
    };

    const topGenre = enrichedGames.length > 0 ? topOf(enrichedGames.map((g) => g.genres)) : "-";
    const topTag   = enrichedGames.length > 0 ? topOf(enrichedGames.map((g) => g.tags))   : "-";

    return { totalGames: library.length, totalPlaytime, topGenre, topTag };
  }, [library, enrichedGames]);

  // Chart data
  const genreChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const g of enrichedGames)
      for (const genre of g.genres)
        counts[genre] = (counts[genre] ?? 0) + 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
  }, [enrichedGames]);

  const tagChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const g of enrichedGames)
      for (const tag of g.tags)
        counts[tag] = (counts[tag] ?? 0) + 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
  }, [enrichedGames]);

  // Enriched lookup map (appid → { genres, headerImage })
  const enrichedMap = useMemo(
    () => new Map(enrichedGames.map((g) => [g.appid, { genres: g.genres, headerImage: g.header_image }])),
    [enrichedGames]
  );

  // Filtered + sorted library
  const filteredGames = useMemo<SteamGame[]>(() => {
    if (!library) return [];
    let games = library;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      games = games.filter((g) => g.name.toLowerCase().includes(q));
    }
    if (sort === "playtime") {
      games = [...games].sort((a, b) => b.playtime_forever - a.playtime_forever);
    } else {
      games = [...games].sort((a, b) => a.name.localeCompare(b.name));
    }
    return games;
  }, [library, search, sort]);

  const toggleSelect = useCallback((appid: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(appid)) {
        next.delete(appid);
      } else if (next.size < MAX_GAME_SELECTION) {
        next.add(appid);
      }
      return next;
    });
  }, []);

  const handleRecommend = () => {
    if (selectedIds.size > 0) {
      router.push(`/recommend?selected=${[...selectedIds].join(",")}`);
    } else {
      router.push("/recommend");
    }
  };

  // Loading — waiting for session
  if (status === "loading") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--color-bg-primary)" }}
      >
        <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Loading...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg-primary)" }}>
      {/* ── Header ── */}
      <nav
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 gap-4"
        style={{
          backgroundColor: "var(--color-bg-header)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
          🎮 Steam Recommender
        </span>

        <div className="flex items-center gap-3">
          {session?.user?.image && (
            <Image
              src={session.user.image}
              alt={session.user.name ?? ""}
              width={28}
              height={28}
              className="rounded-full"
              unoptimized
            />
          )}
          <span className="text-xs hidden sm:block" style={{ color: "var(--color-text-secondary)" }}>
            {session?.user?.name}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-xs px-3 py-1.5 rounded-sm transition-opacity hover:opacity-80"
            style={{
              border: "1px solid var(--color-border)",
              color: "var(--color-text-secondary)",
            }}
          >
            Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-6">
        {/* ── Stats Dashboard ── */}
        {libraryLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        ) : libraryError ? null : stats ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <StatCard value={stats.totalGames.toLocaleString()} label="Games" />
              <StatCard value={formatPlaytime(stats.totalPlaytime)} label="Total Playtime" />
              <StatCard value={enrichLoading ? "..." : stats.topGenre} label="Top Genre" />
              <StatCard value={enrichLoading ? "..." : stats.topTag}   label="Top Tag" />
              <StatCard value={String(selectedIds.size)} label={`Selected / ${MAX_GAME_SELECTION}`} />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setChartsOpen((v) => !v)}
                className="text-xs px-3 py-1.5 rounded-sm transition-opacity hover:opacity-80 flex items-center gap-1.5"
                style={{
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-secondary)",
                  backgroundColor: "var(--color-bg-elevated)",
                }}
              >
                <span>{chartsOpen ? "▲" : "▼"}</span>
                Genre / Tag Chart
              </button>
              <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                * Top {ENRICH_LIMIT} games by playtime
              </span>
            </div>
            {chartsOpen && (
              enrichLoading ? (
                <div className="flex gap-4">
                  <SkeletonBlock className="flex-1 h-96" />
                  <SkeletonBlock className="flex-1 h-96" />
                </div>
              ) : (
                <div className="flex gap-4">
                  <DistributionChart title="Genre Distribution" data={genreChartData} barColor="var(--color-accent)" />
                  <DistributionChart title="Tag Distribution"   data={tagChartData}  barColor="#8f5fde" />
                </div>
              )
            )}
          </>
        ) : null}

        {/* ── Library ── */}
        <div
          className="rounded-sm overflow-hidden"
          style={{ border: "1px solid var(--color-border)" }}
        >
          {/* Toolbar */}
          <div
            className="flex flex-wrap items-center gap-3 px-4 py-3"
            style={{
              backgroundColor: "var(--color-bg-header)",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <input
              type="search"
              placeholder="Search games..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[160px] text-sm px-3 py-1.5 rounded-sm outline-none focus:border-[var(--color-border-active)]"
              style={{
                backgroundColor: "var(--color-bg-primary)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-primary)",
              }}
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as "playtime" | "name")}
              className="text-xs px-2 py-1.5 rounded-sm outline-none"
              style={{
                backgroundColor: "var(--color-bg-primary)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-secondary)",
              }}
            >
              <option value="playtime">By Playtime</option>
              <option value="name">By Name</option>
            </select>
            <button
              onClick={handleRecommend}
              className="ml-auto text-sm font-semibold px-4 py-1.5 rounded-sm transition-opacity hover:opacity-90"
              style={{
                backgroundColor: "var(--color-accent-cta)",
                color: "var(--color-cta-text)",
              }}
            >
              {selectedIds.size > 0
                ? `Recommend from ${selectedIds.size} selected`
                : "Recommend from full library"}
            </button>
          </div>

          {/* Game grid */}
          {libraryLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex flex-col rounded-sm overflow-hidden animate-pulse" style={{ border: "2px solid var(--color-border)" }}>
                  <div className="w-full" style={{ paddingTop: "46.7%", backgroundColor: "var(--color-border)" }} />
                  <div className="flex flex-col gap-2 p-2.5">
                    <div className="h-3 rounded-sm" style={{ backgroundColor: "var(--color-border)" }} />
                    <div className="h-2 w-12 rounded-sm" style={{ backgroundColor: "var(--color-border)" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : libraryError ? (
            <div
              className="flex flex-col items-center gap-3 py-12 px-6 text-center"
              style={{ backgroundColor: "var(--color-error-bg)" }}
            >
              <span className="text-3xl">⚠️</span>
              <p className="text-sm font-semibold" style={{ color: "var(--color-error)" }}>
                Failed to load library
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                Make sure your Steam profile is set to public, or try again later.
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
          ) : filteredGames.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <span className="text-3xl">🔍</span>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                No results found
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                Try a different search term.
              </p>
              <button
                onClick={() => setSearch("")}
                className="text-xs px-4 py-2 rounded-sm mt-1"
                style={{
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-secondary)",
                }}
              >
                Clear search
              </button>
            </div>
          ) : (
            <div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4 overflow-y-auto"
              style={{ maxHeight: "65vh" }}
              role="list"
              aria-label="게임 라이브러리"
            >
              {filteredGames.map((game, i) => (
                <div key={game.appid} role="listitem">
                  <GameCard
                    game={game}
                    genres={enrichedMap.get(game.appid)?.genres ?? []}
                    headerImage={enrichedMap.get(game.appid)?.headerImage}
                    selected={selectedIds.has(game.appid)}
                    onToggle={toggleSelect}
                    disabled={selectedIds.size >= MAX_GAME_SELECTION}
                    priority={i === 0}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Selection hint */}
          {selectedIds.size >= MAX_GAME_SELECTION && (
            <div
              className="px-4 py-2 text-xs text-center"
              style={{
                backgroundColor: "var(--color-bg-elevated)",
                borderTop: "1px solid var(--color-border)",
                color: "var(--color-text-secondary)",
              }}
            >
              You can select up to {MAX_GAME_SELECTION} games.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
