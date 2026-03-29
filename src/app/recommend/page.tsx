"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSteamLibrary, fetchUserRecommendation } from "@/lib/api-client";
import { rankGames } from "@/lib/ranking";
import { useSettings } from "@/context/settings-context";
import { CANDIDATE_LIMIT } from "@/lib/constants";
import type { RankedGame } from "@/types/recommend";

import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { NavBar } from "@/components/nav-bar";
import { SettingsPanel } from "@/components/settings-panel";
import { RecommendCard, RecommendCardSkeleton } from "@/components/recommend-card";

// ── Inner Page (needs useSearchParams — must be in Suspense) ──────────────

function RecommendInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { settings } = useSettings();
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  const selectedAppids = useMemo<number[]>(() => {
    const raw = searchParams.get("selected");
    if (!raw) return [];
    return raw.split(",").map(Number).filter((n) => !isNaN(n) && n > 0);
  }, [searchParams]);

  const { data: library } = useQuery({
    queryKey: ["steamLibrary"],
    queryFn: fetchSteamLibrary,
    enabled: status === "authenticated",
    staleTime: 5 * 60 * 1000,
  });

  const selectedGames = useMemo(() => {
    if (!library) return [];
    if (selectedAppids.length === 0) return library;
    const idSet = new Set(selectedAppids);
    return library.filter((g) => idSet.has(g.appid));
  }, [library, selectedAppids]);

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

  const rankedGames = useMemo<RankedGame[]>(() => {
    if (!recommendData?.data) return [];
    return rankGames(recommendData.data, settings.weights, settings.halfLifeDays)
      .slice(0, settings.count);
  }, [recommendData, settings.weights, settings.halfLifeDays, settings.count]);

  const isLoading = status === "loading" || recLoading || (selectedGames.length === 0 && !library);

  const navLeft = (
    <Button variant="outline" size="sm" onClick={() => router.push("/user")}>
      ← Library
    </Button>
  );

  const navTitle = selectedAppids.length > 0
    ? `Recommendations based on ${selectedAppids.length} games`
    : "Recommendations based on full library";

  const navRight = isFetching && !recLoading
    ? <span className="text-xs text-muted-foreground">Refreshing...</span>
    : null;

  const navRightmost = (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger render={<Button variant="outline" size="sm" aria-label="Open settings"><Settings2 size={20} />Settings</Button>} />
      <SheetContent side="right" className="overflow-y-auto bg-popover border-border p-0 sm:max-w-xs">
        <SheetHeader className="px-4 pt-4 pb-2">
          <SheetTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Settings</SheetTitle>
        </SheetHeader>
        <SettingsPanel />
      </SheetContent>
    </Sheet>
  );

  return (
    <div className="min-h-screen bg-background">
      <NavBar session={session} title={navTitle} left={navLeft} right={navRight} rightmost={navRightmost} />

      <div className="flex max-w-7xl mx-auto">
        {/* ── Card Area ── */}
        <main className="flex-1 min-w-0 px-6 py-6">
          {isLoading ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 py-2">
                <div className="w-4 h-4 rounded-full border-2 border-border border-t-primary animate-spin shrink-0" />
                <span className="text-sm text-muted-foreground">
                  Finding games you&apos;ll love...
                </span>
              </div>
              <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 8 }).map((_, i) => <RecommendCardSkeleton key={i} />)}
              </div>
            </div>
          ) : recError ? (
            <Card className="rounded-sm shadow-none border-destructive">
              <CardContent className="flex flex-col items-center gap-3 py-16 text-center p-8">
                <span className="text-3xl">⚠️</span>
                <p className="text-sm font-semibold text-destructive">Failed to load recommendations</p>
                <p className="text-xs text-muted-foreground">
                  Server error or library could not be read.
                </p>
                <Button variant="outline" size="sm" className="mt-1 border-destructive text-destructive" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : rankedGames.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <span className="text-3xl">🎮</span>
              <p className="text-sm font-semibold text-foreground">No recommendations found</p>
              <p className="text-xs text-muted-foreground">
                Try relaxing your filters or selecting different games.
              </p>
              <Button variant="cta" size="sm" className="mt-1" onClick={() => router.push("/user")}>
                Select games
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-muted-foreground">
                Top {rankedGames.length} recommendations · re-ranked instantly on weight change
              </p>
              <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {rankedGames.map((game, i) => (
                  <RecommendCard key={game.game_id} game={game} rank={i + 1} />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ── Page Export (Suspense wrapper for useSearchParams) ────────────────────

export default function RecommendPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      }
    >
      <RecommendInner />
    </Suspense>
  );
}
