"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import Image from "next/image";
import { fetchSteamLibrary, fetchGamesInfo } from "@/lib/api-client";
import { enrichGames, formatPlaytime, steamHeaderUrl } from "@/lib/utils";
import { MAX_GAME_SELECTION } from "@/lib/constants";
import type { SteamGame, SteamGameEnriched } from "@/types/steam";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { NavBar } from "@/components/nav-bar";
import { StatCard, StatCardSkeleton } from "@/components/stat-card";
import { GameRow, GameRowSkeleton } from "@/components/game-row";
import { GameCarousel } from "@/components/game-carousel";

const ENRICH_LIMIT = 50;

// recharts — dynamic import, SSR disabled
const BarChart = dynamic(() => import("recharts").then((m) => m.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then((m) => m.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });

// ── Distribution Chart ──────────────────────────────────────────────────────

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
    <Card className="flex-1 min-w-0 rounded-sm shadow-none">
      <CardContent className="p-4">
        <p className="text-xs font-semibold mb-3 uppercase tracking-wide text-muted-foreground">
          {title}
        </p>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
            <XAxis type="number" tick={{ fontSize: 10, fill: "var(--color-text-secondary)" }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10, fill: "var(--color-text-secondary)" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-bg-header)",
                border: "1px solid var(--color-steam-border)",
                borderRadius: 3,
                fontSize: 11,
                color: "var(--color-text-primary)",
              }}
              cursor={{ fill: "rgba(103,193,245,0.05)" }}
            />
            <Bar dataKey="count" fill={barColor} radius={2} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ── Game Card (grid view) ───────────────────────────────────────────────────

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
  const prevSrc = useRef(imgSrc);
  if (prevSrc.current !== imgSrc) {
    prevSrc.current = imgSrc;
    if (imgError) setImgError(false);
  }

  return (
    <label
      className={[
        "relative flex flex-col h-full cursor-pointer rounded-sm overflow-hidden transition-colors select-none bg-card",
        selected ? "border-2 border-accent" : "border-2 border-border hover:border-accent/50",
        disabled && !selected ? "opacity-50 pointer-events-none" : "",
      ].join(" ")}
    >
      <input
        type="checkbox"
        checked={selected}
        disabled={disabled && !selected}
        onChange={() => onToggle(game.appid)}
        className="sr-only"
        aria-label={`Select ${game.name}`}
      />
      <div className="relative w-full" style={{ paddingTop: "46.7%" }}>
        {imgError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <span className="text-xl">🎮</span>
          </div>
        ) : (
          <Image
            src={imgSrc}
            alt=""
            fill
            className="object-cover select-none"
            draggable={false}
            unoptimized
            loading={priority ? "eager" : "lazy"}
            sizes="(max-width: 768px) 50vw, 25vw"
            onError={() => setImgError(true)}
          />
        )}
        {selected && (
          <div className="absolute inset-0 flex items-center justify-center bg-accent/35">
            <span className="text-5xl font-bold text-green-400">✓</span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5 p-2.5">
        <span className="text-sm font-semibold leading-tight line-clamp-2 text-foreground">
          {game.name}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatPlaytime(game.playtime_forever)}
        </span>
        {genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {genres.slice(0, 5).map((g) => (
              <Badge key={g} variant="secondary" className="text-[12px] px-1 py-0 rounded-sm h-4">
                {g}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </label>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function UserPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"playtime" | "name">("playtime");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [chartsOpen, setChartsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "scroll">(() => {
    if (typeof window === "undefined") return "grid";
    const saved = localStorage.getItem("userPageViewMode");
    return (saved === "grid" || saved === "list" || saved === "scroll") ? saved : "grid";
  });
  const [hideZeroPlaytime, setHideZeroPlaytime] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  const { data: library, isLoading: libraryLoading, error: libraryError } = useQuery({
    queryKey: ["steamLibrary"],
    queryFn: fetchSteamLibrary,
    enabled: status === "authenticated",
  });

  const topGameIds = useMemo(() => {
    if (!library) return [];
    return [...library]
      .sort((a, b) => b.playtime_forever - a.playtime_forever)
      .slice(0, ENRICH_LIMIT)
      .map((g) => g.appid);
  }, [library]);

  const { data: gamesInfo, isLoading: enrichLoading } = useQuery({
    queryKey: ["gamesInfo", topGameIds],
    queryFn: () => fetchGamesInfo(topGameIds),
    enabled: topGameIds.length > 0,
  });

  const enrichedGames = useMemo<SteamGameEnriched[]>(() => {
    if (!library || !gamesInfo) return [];
    return enrichGames(library.filter((g) => topGameIds.includes(g.appid)), gamesInfo);
  }, [library, gamesInfo, topGameIds]);

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

  const genreChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const g of enrichedGames)
      for (const genre of g.genres)
        counts[genre] = (counts[genre] ?? 0) + 1;
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, count }));
  }, [enrichedGames]);

  const tagChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const g of enrichedGames)
      for (const tag of g.tags)
        counts[tag] = (counts[tag] ?? 0) + 1;
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, count }));
  }, [enrichedGames]);

  const enrichedMap = useMemo(() => {
    const infoById = new Map(gamesInfo?.data.map((g) => [g.game_id, g]) ?? []);
    return new Map(
      enrichedGames.map((g) => [g.appid, {
        genres: g.genres,
        headerImage: g.header_image,
        description: infoById.get(g.appid)?.description,
      }])
    );
  }, [enrichedGames, gamesInfo]);

  const zeroPlaytimeCount = useMemo(
    () => library?.filter((g) => g.playtime_forever === 0).length ?? 0,
    [library],
  );

  const filteredGames = useMemo<SteamGame[]>(() => {
    if (!library) return [];
    let games = hideZeroPlaytime ? library.filter((g) => g.playtime_forever > 0) : library;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      games = games.filter((g) => g.name.toLowerCase().includes(q));
    }
    return sort === "playtime"
      ? [...games].sort((a, b) => b.playtime_forever - a.playtime_forever)
      : [...games].sort((a, b) => a.name.localeCompare(b.name));
  }, [library, search, sort, hideZeroPlaytime]);

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

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar session={session} title="🎮 Steam Recommender" />

      <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-6">

        {/* ── Stats Dashboard (secondary hierarchy) ── */}
        {libraryLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)}
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <StatCard value={stats.totalGames.toLocaleString()} label="Games" />
              <StatCard value={formatPlaytime(stats.totalPlaytime)} label="Total Playtime" />
              <StatCard value={enrichLoading ? "…" : stats.topGenre} label="Top Genre" />
              <StatCard value={enrichLoading ? "…" : stats.topTag}   label="Top Tag" />
              <StatCard value={String(selectedIds.size)} label={`Selected / ${MAX_GAME_SELECTION}`} />
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setChartsOpen((v) => !v)}>
                {chartsOpen ? "▲" : "▼"} Genre / Tag Chart
              </Button>
              <span className="text-xs text-muted-foreground">
                * Based on top {ENRICH_LIMIT} games by playtime
              </span>
            </div>
            {chartsOpen && (
              enrichLoading ? (
                <div className="flex gap-4">
                  <div className="flex-1 h-96 rounded-sm bg-card border border-border animate-pulse" />
                  <div className="flex-1 h-96 rounded-sm bg-card border border-border animate-pulse" />
                </div>
              ) : (
                <div className="flex gap-4 flex-wrap">
                  <DistributionChart title="Genre Distribution" data={genreChartData} barColor="var(--color-accent)" />
                  <DistributionChart title="Tag Distribution"   data={tagChartData}  barColor="#8f5fde" />
                </div>
              )
            )}
          </>
        ) : null}

        {/* ── Library (primary — main workspace) ── */}
        <Card className="rounded-sm shadow-none overflow-hidden p-0 gap-0">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-popover border-b border-border">
            <Input
              type="search"
              placeholder="Search games..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[160px] h-8 text-sm bg-background"
            />

            {/* View toggle */}
            <div className="flex rounded-sm overflow-hidden border border-border shrink-0">
              {(["grid", "list", "scroll"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => { setViewMode(mode); localStorage.setItem("userPageViewMode", mode); }}
                  className={[
                    "px-2.5 py-1.5 text-xs transition-colors",
                    viewMode === mode
                      ? "bg-accent text-white"
                      : "bg-background text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                  aria-label={mode === "grid" ? "Grid view" : mode === "list" ? "List view" : "Card scroll view"}
                >
                  {mode === "grid" ? "⊞" : mode === "list" ? "☰" : "⇔"}
                </button>
              ))}
            </div>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as "playtime" | "name")}
              className="text-xs px-2 py-1.5 rounded-sm bg-background border border-border text-muted-foreground outline-none"
            >
              <option value="playtime">By Playtime</option>
              <option value="name">By Name</option>
            </select>

            <Button variant="cta" size="sm" className="ml-auto" onClick={handleRecommend}>
              {selectedIds.size > 0
                ? `Recommend from ${selectedIds.size} games`
                : "Recommend from full library"}
            </Button>
          </div>

          {/* Zero-playtime info bar */}
          {!libraryLoading && zeroPlaytimeCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-card border-b border-border text-xs text-muted-foreground">
              <span className="text-amber-400 shrink-0">⚠</span>
              <span className="flex-1">
                {hideZeroPlaytime
                  ? <><strong className="text-foreground">{zeroPlaytimeCount} unplayed game{zeroPlaytimeCount !== 1 ? "s" : ""}</strong> hidden — unplayed games provide no signal and are excluded from recommendations.</>
                  : <><strong className="text-foreground">{zeroPlaytimeCount} unplayed game{zeroPlaytimeCount !== 1 ? "s" : ""}</strong> shown — these have no playtime data and will not affect recommendations.</>
                }
              </span>
              <button
                onClick={() => setHideZeroPlaytime((v) => !v)}
                className="shrink-0 px-2 py-0.5 rounded-sm border border-border hover:border-accent/60 hover:text-foreground transition-colors"
              >
                {hideZeroPlaytime ? "Show" : "Hide"}
              </button>
            </div>
          )}

          {/* Selected chips */}
          {selectedIds.size > 0 && library && (
            <div className="flex flex-wrap gap-2 px-4 py-2 bg-card border-b border-border">
              {[...selectedIds].map((id) => {
                const g = library.find((g) => g.appid === id);
                if (!g) return null;
                return (
                  <button
                    key={g.appid}
                    onClick={() => toggleSelect(g.appid)}
                    className="flex items-center gap-1 px-2 py-1 rounded-sm text-xs bg-popover border border-accent text-foreground hover:opacity-75 transition-opacity"
                  >
                    {g.name}
                    <span className="text-muted-foreground">✕</span>
                  </button>
                );
              })}
              <button
                onClick={() => setSelectedIds(new Set())}
                className="flex items-center gap-1 px-2 py-1 rounded-sm text-xs bg-destructive/10 border border-destructive text-destructive hover:opacity-75 transition-opacity"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Content area */}
          {libraryLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex flex-col rounded-sm overflow-hidden border-2 border-border animate-pulse bg-card">
                  <div className="w-full bg-muted" style={{ paddingTop: "46.7%" }} />
                  <div className="flex flex-col gap-2 p-2.5">
                    <div className="h-3 rounded-sm bg-muted" />
                    <div className="h-2 w-12 rounded-sm bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : libraryError ? (
            <div className="flex flex-col items-center gap-3 py-12 px-6 text-center bg-destructive/5 border-destructive/30">
              <span className="text-3xl">⚠️</span>
              <p className="text-sm font-semibold text-destructive">Failed to load library</p>
              <p className="text-xs text-muted-foreground">
                Make sure your Steam profile is set to public, then try again.
              </p>
              <Button variant="outline" size="sm" className="mt-1 border-destructive text-destructive" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          ) : filteredGames.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <span className="text-3xl">🔍</span>
              <p className="text-sm font-semibold text-foreground">No results</p>
              <p className="text-xs text-muted-foreground">Try a different search term.</p>
              <Button variant="outline" size="sm" className="mt-1" onClick={() => setSearch("")}>
                Clear search
              </Button>
            </div>
          ) : viewMode === "grid" ? (
            <div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4 overflow-y-auto"
              style={{ maxHeight: "65vh" }}
              role="list"
              aria-label="Game library"
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
          ) : viewMode === "list" ? (
            <div
              className="flex flex-col gap-2 p-3 overflow-y-auto"
              style={{ maxHeight: "65vh" }}
              role="list"
              aria-label="Game library"
            >
              {filteredGames.map((game) => (
                <GameRow
                  key={game.appid}
                  game={game}
                  headerImage={enrichedMap.get(game.appid)?.headerImage}
                  genres={enrichedMap.get(game.appid)?.genres ?? []}
                  selected={selectedIds.has(game.appid)}
                  onToggle={toggleSelect}
                  disabled={selectedIds.size >= MAX_GAME_SELECTION}
                />
              ))}
            </div>
          ) : (
            <div className="h-[480px] py-4" role="list" aria-label="Game library">
              <GameCarousel
                games={filteredGames}
                enrichedMap={enrichedMap}
                selectedIds={selectedIds}
                onToggle={toggleSelect}
                maxSelection={MAX_GAME_SELECTION}
              />
            </div>
          )}

          {/* Selection cap hint */}
          {selectedIds.size >= MAX_GAME_SELECTION && (
            <div className="px-4 py-2 text-xs text-center text-muted-foreground bg-card border-t border-border">
              You can select up to {MAX_GAME_SELECTION} games.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
