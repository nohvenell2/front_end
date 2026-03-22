"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSettings } from "@/context/settings-context";
import { fetchSteamLibrary, fetchUserRecommendation } from "@/lib/api-client";
import { rankGames } from "@/lib/ranking";
import { CANDIDATE_LIMIT } from "@/lib/constants";
import type { SteamGame } from "@/types/steam";
import type { RecommendResponse } from "@/types/recommend";
import { RecommendCard } from "@/components/recommend/recommend-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { SettingsDialog } from "@/components/settings/settings-dialog";
import { useState } from "react";
import Link from "next/link";

export default function RecommendPage() {
  return (
    <Suspense>
      <RecommendPageInner />
    </Suspense>
  );
}

function RecommendPageInner() {
  const { status } = useSession();
  const router = useRouter();
  const { settings } = useSettings();
  const searchParams = useSearchParams();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chartMode, setChartMode] = useState<"radar" | "bars">("radar");

  const selectedParam = searchParams.get("selected");
  const selectedIds = useMemo(() => {
    if (!selectedParam) return null;
    const ids = new Set(selectedParam.split(",").map(Number).filter((n) => !isNaN(n)));
    return ids.size > 0 ? ids : null;
  }, [selectedParam]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  const { data: games } = useQuery<SteamGame[]>({
    queryKey: ["steamLibrary"],
    queryFn: fetchSteamLibrary,
    enabled: status === "authenticated",
    staleTime: 5 * 60 * 1000,
  });

  const gamesToSend = useMemo(() => {
    if (!games) return [];
    if (selectedIds) {
      return games.filter((g) => selectedIds.has(g.appid));
    }
    return games;
  }, [games, selectedIds]);

  const {
    data: recommendResponse,
    isLoading,
    error,
    refetch,
  } = useQuery<RecommendResponse>({
    queryKey: ["recommendations", settings, selectedParam],
    queryFn: () =>
      fetchUserRecommendation({
        games: gamesToSend.map((g) => ({
          appid: g.appid,
          name: g.name,
          playtime_forever: g.playtime_forever,
          img_icon_url: g.img_icon_url,
          has_community_visible_stats: g.has_community_visible_stats,
        })),
        limit: CANDIDATE_LIMIT,
        release_date: `${settings.filters.minReleaseDate}T00:00:00`,
        total_review_count: settings.filters.minReviewCount,
        total_review_positive_percent: settings.filters.minPositivePercent,
      }),
    enabled: status === "authenticated" && gamesToSend.length > 0,
    staleTime: 0,
  });

  const rankedGames = useMemo(() => {
    if (!recommendResponse?.data) return [];
    return rankGames(
      recommendResponse.data,
      settings.weights,
      settings.halfLifeDays
    ).slice(0, settings.count);
  }, [recommendResponse, settings]);

  if (status === "loading" || status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/user"
              className="inline-flex items-center justify-center h-7 px-2.5 text-sm rounded-lg hover:bg-muted transition-colors"
            >
              ← Back
            </Link>
            <h1 className="text-lg font-semibold">Recommendations</h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
            Settings
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-lg border overflow-hidden">
                <Skeleton className="w-full aspect-460/215" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-40 w-full" />
                  <Skeleton className="h-9 w-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center space-y-4">
            <p className="font-medium text-destructive">
              Failed to load recommendations.
            </p>
            <p className="text-sm text-muted-foreground">
              The recommendation service may be temporarily unavailable.
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        )}

        {!isLoading && !error && rankedGames.length === 0 && (
          <div className="text-center py-16 space-y-4">
            <p className="text-lg font-medium">No games match your filters.</p>
            <p className="text-muted-foreground">
              Try adjusting your recommendation settings.
            </p>
            <Button variant="outline" onClick={() => setSettingsOpen(true)}>
              Adjust Settings
            </Button>
          </div>
        )}

        {!isLoading && rankedGames.length > 0 && (
          <>
            {selectedIds && (
              <p className="text-sm text-muted-foreground mb-4">
                Based on {selectedIds.size} selected game{selectedIds.size > 1 ? "s" : ""} from your library.
              </p>
            )}
            <p className="text-sm text-muted-foreground mb-6">
              Showing {rankedGames.length} recommendations
              {recommendResponse?.skipped_game_ids &&
                recommendResponse.skipped_game_ids.length > 0 && (
                  <span>
                    {" "}
                    ({recommendResponse.skipped_game_ids.length} games skipped
                    — no embedding data)
                  </span>
                )}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rankedGames.map((game, i) => (
                <RecommendCard key={game.game_id} game={game} rank={i + 1} chartMode={chartMode} onChartModeChange={setChartMode} />
              ))}
            </div>
          </>
        )}
      </main>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
