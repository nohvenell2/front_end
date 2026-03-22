"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { SteamGameEnriched } from "@/types/steam";
import { formatPlaytime, steamHeaderUrl, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface GameCardProps {
  game: SteamGameEnriched;
  view: "grid" | "list";
  priority?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}

function GameImage({
  appid,
  name,
  headerImage,
  fill,
  sizes,
  className,
  priority,
}: {
  appid: number;
  name: string;
  headerImage?: string;
  fill?: boolean;
  sizes?: string;
  className?: string;
  priority?: boolean;
}) {
  const [src, setSrc] = useState(headerImage ?? steamHeaderUrl(appid));

  useEffect(() => {
    if (headerImage) setSrc(headerImage);
  }, [headerImage]);

  return (
    <Image
      src={src}
      alt={name}
      fill={fill}
      className={className}
      sizes={sizes}
      unoptimized
      priority={priority}
      loading={priority ? "eager" : undefined}
      onError={() =>
        setSrc(
          `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/capsule_231x87.jpg`
        )
      }
    />
  );
}

export function GameCard({ game, view, priority, selectable, selected, onToggleSelect }: GameCardProps) {
  if (view === "list") {
    return (
      <div
        className={cn(
          "flex items-center gap-4 rounded-lg border p-3 hover:bg-muted/50 transition-colors",
          selectable && "cursor-pointer",
          selected && "ring-2 ring-primary"
        )}
        onClick={selectable ? onToggleSelect : undefined}
      >
        <div className="relative w-24 h-11.25 shrink-0 overflow-hidden rounded">
          <GameImage
            appid={game.appid}
            name={game.name}
            headerImage={game.header_image}
            fill
            className="object-cover"
            sizes="96px"
            priority={priority}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{game.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatPlaytime(game.playtime_forever)} played
          </p>
        </div>
        {game.genres.length > 0 && (
          <div className="hidden sm:flex gap-1 flex-wrap justify-end max-w-50">
            {game.genres.slice(0, 2).map((g) => (
              <Badge key={g} variant="secondary" className="text-xs">
                {g}
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border overflow-hidden hover:shadow-md transition-shadow",
        selectable && "cursor-pointer",
        selected && "ring-2 ring-primary"
      )}
      onClick={selectable ? onToggleSelect : undefined}
    >
      <div className="relative w-full aspect-460/215 overflow-hidden">
        <GameImage
          appid={game.appid}
          name={game.name}
          headerImage={game.header_image}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority={priority}
        />
      </div>
      <div className="p-3 space-y-2">
        <p className="font-medium text-sm truncate">{game.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatPlaytime(game.playtime_forever)} played
        </p>
        {game.genres.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {game.genres.slice(0, 3).map((g) => (
              <Badge key={g} variant="secondary" className="text-xs">
                {g}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
