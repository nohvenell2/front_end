import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { SteamGame, SteamGameEnriched } from "@/types/steam"
import type { GamesInfoResponse } from "@/types/recommend"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPlaytime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours.toLocaleString()}h`;
}

export function steamIconUrl(appid: number, imgIconUrl: string): string {
  return `https://media.steampowered.com/steamcommunity/public/images/apps/${appid}/${imgIconUrl}.jpg`;
}

export function steamHeaderUrl(appid: number): string {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`;
}

export function enrichGames(
  steamGames: SteamGame[],
  gamesInfo: GamesInfoResponse
): SteamGameEnriched[] {
  const infoMap = new Map(gamesInfo.data.map((g) => [g.game_id, g]));
  return steamGames.map((game) => {
    const info = infoMap.get(game.appid);
    return {
      ...game,
      genres: info?.genres ?? [],
      tags: info?.tags ?? [],
      header_image: info?.header_image,
    };
  });
}
