"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { fetchSteamLibrary, fetchGamesInfo } from "@/lib/api-client";
import type { SteamGame, SteamGameEnriched } from "@/types/steam";
import { GameLibrary, GameLibrarySkeleton } from "@/components/user/game-library";
import { StatsDashboard } from "@/components/user/stats-dashboard";
import { Button } from "@/components/ui/button";
import { SettingsDialog } from "@/components/settings/settings-dialog";
import { signOut } from "next-auth/react";

const TOP_GAMES_FOR_ENRICHMENT = 20;

export default function UserPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const handleSelectModeToggle = () => {
    setSelectMode((prev) => {
      if (prev) setSelectedIds(new Set());
      return !prev;
    });
  };

  const handleToggleSelect = (appid: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(appid)) next.delete(appid);
      else next.add(appid);
      return next;
    });
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  const {
    data: rawGames,
    isLoading: libraryLoading,
    error: libraryError,
  } = useQuery<SteamGame[]>({
    queryKey: ["steamLibrary"],
    queryFn: fetchSteamLibrary,
    enabled: status === "authenticated",
    staleTime: 5 * 60 * 1000,
  });

  // Enrich top 20 games with genres/tags/header_image from games/info API
  const { data: enrichedGames } = useQuery<SteamGameEnriched[]>({
    queryKey: ["enrichedGames", rawGames?.slice(0, TOP_GAMES_FOR_ENRICHMENT).map((g) => g.appid)],
    queryFn: async () => {
      if (!rawGames) return [];
      const sorted = [...rawGames].sort(
        (a, b) => b.playtime_forever - a.playtime_forever
      );
      const topGames = sorted.slice(0, TOP_GAMES_FOR_ENRICHMENT);
      const infoResponse = await fetchGamesInfo(topGames.map((g) => g.appid));
      const infoMap = new Map(infoResponse.data.map((g) => [g.game_id, g]));
      return rawGames.map((game) => {
        const info = infoMap.get(game.appid);
        return {
          ...game,
          genres: info?.genres ?? [],
          tags: info?.tags ?? [],
          header_image: info?.header_image,
        };
      });
    },
    enabled: !!rawGames && rawGames.length > 0,
    staleTime: Infinity,
  });

  const displayGames: SteamGameEnriched[] =
    enrichedGames ??
    (rawGames?.map((g) => ({ ...g, genres: [], tags: [] })) ?? []);

  if (status === "loading" || status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {session?.user?.image && (
              <Image
                src={session.user.image}
                alt={session.user.name ?? "User avatar"}
                width={36}
                height={36}
                className="rounded-full"
                unoptimized
              />
            )}
            <span className="font-semibold">{session?.user?.name}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
            Sign out
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 space-y-10">
        {/* Stats */}
        {displayGames.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Your Library Stats</h2>
            <StatsDashboard games={displayGames} />
          </section>
        )}

        {/* Library */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Game Library</h2>
          </div>

          {libraryLoading && <GameLibrarySkeleton />}

          {libraryError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center space-y-2">
              <p className="font-medium text-destructive">
                Could not load your game library.
              </p>
              <p className="text-sm text-muted-foreground">
                Make sure your Steam profile and game details are set to{" "}
                <strong>Public</strong> in{" "}
                <a
                  href="https://steamcommunity.com/my/edit/settings"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Steam Privacy Settings
                </a>
                .
              </p>
            </div>
          )}

          {!libraryLoading && !libraryError && displayGames.length > 0 && (
            <GameLibrary
              games={displayGames}
              selectable={selectMode}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
            />
          )}
        </section>
      </main>

      {/* Sticky action bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex gap-3 items-center">
          <div className="mr-auto flex items-center gap-2">
            <Button
              variant={selectMode ? "default" : "outline"}
              size="sm"
              onClick={handleSelectModeToggle}
            >
              {selectMode ? `Select (${selectedIds.size})` : "Select"}
            </Button>
            {selectMode && selectedIds.size > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
                Clear
              </Button>
            )}
          </div>
          <Button variant="outline" onClick={() => setSettingsOpen(true)}>
            Configure Recommendations
          </Button>
          <Button
            onClick={() => {
              const params = new URLSearchParams();
              if (selectMode && selectedIds.size > 0) {
                params.set("selected", Array.from(selectedIds).join(","));
              }
              const query = params.toString();
              router.push(`/recommend${query ? `?${query}` : ""}`);
            }}
            disabled={displayGames.length === 0}
          >
            Get Recommendations
          </Button>
        </div>
      </div>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
