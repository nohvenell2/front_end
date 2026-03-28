import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { SteamGame, SteamGameEnriched } from "@/types/steam";
import type { GameInfo, GamesInfoResponse } from "@/types/recommend";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPlaytime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  return `${Math.round(minutes / 60)}h`;
}

export function steamHeaderUrl(appid: number): string {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`;
}

export function steamIconUrl(appid: number, hash: string): string {
  return `https://media.steampowered.com/steamcommunity/public/images/apps/${appid}/${hash}.jpg`;
}

export function enrichGames(
  steamGames: SteamGame[],
  gamesInfo: GamesInfoResponse
): SteamGameEnriched[] {
  const infoMap = new Map<number, GameInfo>(
    gamesInfo.data.map((g: GameInfo) => [g.game_id, g])
  );
  return steamGames.map((game) => {
    const info = infoMap.get(game.appid);
    return {
      ...game,
      genres: info?.genres ?? [],
      tags: info?.tags ?? [],
      header_image: info?.header_image ?? steamHeaderUrl(game.appid),
      description: info?.description ?? "",
    };
  });
}
