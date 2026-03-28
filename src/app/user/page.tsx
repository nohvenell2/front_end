"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import Image from "next/image";
import { fetchSteamLibrary, fetchGamesInfo } from "@/lib/api-client";
import { enrichGames, formatPlaytime, steamIconUrl } from "@/lib/utils";
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
      className="rounded-sm p-4 flex flex-col gap-1"
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
      <p className="text-xs font-semibold mb-3" style={{ color: "var(--color-text-secondary)" }}>
        {title}
      </p>
      <ResponsiveContainer width="100%" height={280}>
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

// ── Game Row ──────────────────────────────────────────────────────────────────

function GameRow({
  game,
  selected,
  onToggle,
  disabled,
}: {
  game: SteamGame;
  selected: boolean;
  onToggle: (appid: number) => void;
  disabled: boolean;
}) {
  return (
    <label
      className="flex items-center gap-3 px-4 cursor-pointer transition-colors"
      style={{
        minHeight: 48,
        backgroundColor: selected ? "var(--color-bg-elevated)" : "transparent",
        borderLeft: selected
          ? "2px solid var(--color-border-active)"
          : "2px solid transparent",
      }}
      onMouseEnter={(e) => {
        if (!selected)
          (e.currentTarget as HTMLElement).style.borderLeftColor =
            "var(--color-border-active)";
      }}
      onMouseLeave={(e) => {
        if (!selected)
          (e.currentTarget as HTMLElement).style.borderLeftColor = "transparent";
      }}
    >
      <input
        type="checkbox"
        checked={selected}
        disabled={disabled && !selected}
        onChange={() => onToggle(game.appid)}
        className="accent-[var(--color-accent)] w-4 h-4 shrink-0"
        aria-label={`${game.name} 선택`}
      />
      {/* Thumbnail */}
      <div className="shrink-0 overflow-hidden rounded-sm" style={{ width: 46, height: 28 }}>
        {game.img_icon_url ? (
          <Image
            src={steamIconUrl(game.appid, game.img_icon_url)}
            alt=""
            width={46}
            height={28}
            className="object-cover w-full h-full"
            unoptimized
          />
        ) : (
          <div className="w-full h-full" style={{ backgroundColor: "var(--color-border)" }} />
        )}
      </div>
      {/* Name */}
      <span
        className="flex-1 min-w-0 text-sm truncate"
        style={{ color: "var(--color-text-primary)" }}
      >
        {game.name}
      </span>
      {/* Playtime */}
      <span className="text-xs shrink-0" style={{ color: "var(--color-text-secondary)" }}>
        {formatPlaytime(game.playtime_forever)}
      </span>
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
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));
  }, [enrichedGames]);

  const tagChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const g of enrichedGames)
      for (const tag of g.tags)
        counts[tag] = (counts[tag] ?? 0) + 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));
  }, [enrichedGames]);

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
          로딩 중...
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
            로그아웃
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col gap-6">
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
              <StatCard value={stats.totalGames.toLocaleString()} label="보유 게임" />
              <StatCard value={formatPlaytime(stats.totalPlaytime)} label="총 플레이타임" />
              <StatCard value={enrichLoading ? "..." : stats.topGenre} label="최다 장르" />
              <StatCard value={enrichLoading ? "..." : stats.topTag}   label="최다 태그" />
              <StatCard value={String(selectedIds.size)} label={`선택됨 / ${MAX_GAME_SELECTION}`} />
            </div>
            <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
              * 장르·태그 정보는 플레이타임 기준 상위 {ENRICH_LIMIT}개 게임 기준
            </p>
            {enrichLoading ? (
              <div className="flex gap-4">
                <SkeletonBlock className="flex-1 h-72" />
                <SkeletonBlock className="flex-1 h-72" />
              </div>
            ) : (
              <div className="flex gap-4">
                <DistributionChart title="장르 분포" data={genreChartData} barColor="var(--color-accent)" />
                <DistributionChart title="태그 분포" data={tagChartData}  barColor="#8f5fde" />
              </div>
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
              placeholder="게임 검색..."
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
              <option value="playtime">플레이타임순</option>
              <option value="name">이름순</option>
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
                ? `${selectedIds.size}개 게임으로 추천받기`
                : "전체 라이브러리로 추천받기"}
            </button>
          </div>

          {/* Game list */}
          {libraryLoading ? (
            <div className="flex flex-col divide-y" style={{ borderColor: "var(--color-border)" }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <GameRowSkeleton key={i} />
              ))}
            </div>
          ) : libraryError ? (
            <div
              className="flex flex-col items-center gap-3 py-12 px-6 text-center"
              style={{ backgroundColor: "var(--color-error-bg)" }}
            >
              <span className="text-3xl">⚠️</span>
              <p className="text-sm font-semibold" style={{ color: "var(--color-error)" }}>
                라이브러리를 불러올 수 없습니다
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                Steam 프로필이 공개 상태인지 확인하거나 잠시 후 다시 시도해주세요.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="text-xs px-4 py-2 rounded-sm mt-1"
                style={{
                  border: "1px solid var(--color-error)",
                  color: "var(--color-error)",
                }}
              >
                다시 시도
              </button>
            </div>
          ) : filteredGames.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <span className="text-3xl">🔍</span>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                검색 결과가 없습니다
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                다른 키워드로 검색해보세요.
              </p>
              <button
                onClick={() => setSearch("")}
                className="text-xs px-4 py-2 rounded-sm mt-1"
                style={{
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-secondary)",
                }}
              >
                검색 초기화
              </button>
            </div>
          ) : (
            <div
              className="flex flex-col divide-y overflow-y-auto"
              style={{ borderColor: "var(--color-border)", maxHeight: "60vh" }}
              role="list"
              aria-label="게임 라이브러리"
            >
              {filteredGames.map((game) => (
                <div key={game.appid} role="listitem">
                  <GameRow
                    game={game}
                    selected={selectedIds.has(game.appid)}
                    onToggle={toggleSelect}
                    disabled={selectedIds.size >= MAX_GAME_SELECTION}
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
              최대 {MAX_GAME_SELECTION}개까지 선택할 수 있습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
