"use client";

import { useState } from "react";
import type { SteamGameEnriched } from "@/types/steam";
import { GameCard } from "./game-card";
import { ViewToggle } from "./view-toggle";
import { Skeleton } from "@/components/ui/skeleton";

interface GameLibraryProps {
  games: SteamGameEnriched[];
}

export function GameLibrary({ games }: GameLibraryProps) {
  const [view, setView] = useState<"grid" | "list">("grid");

  const sorted = [...games].sort(
    (a, b) => b.playtime_forever - a.playtime_forever
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {games.length} games
        </p>
        <ViewToggle view={view} onChange={setView} />
      </div>

      {view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sorted.map((game, i) => (
            <GameCard key={game.appid} game={game} view="grid" priority={i < 4} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((game, i) => (
            <GameCard key={game.appid} game={game} view="list" priority={i === 0} />
          ))}
        </div>
      )}
    </div>
  );
}

export function GameLibrarySkeleton({ view = "grid" }: { view?: "grid" | "list" }) {
  const items = Array.from({ length: 12 });

  if (view === "list") {
    return (
      <div className="space-y-2">
        {items.map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-lg border p-3">
            <Skeleton className="w-24 h-[45px] rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((_, i) => (
        <div key={i} className="rounded-lg border overflow-hidden">
          <Skeleton className="w-full aspect-[460/215]" />
          <div className="p-3 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}
