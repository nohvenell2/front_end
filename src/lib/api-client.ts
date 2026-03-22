import type { SteamGame } from "@/types/steam";
import type {
  RecommendResponse,
  RecommendGameRequest,
  RecommendUserRequest,
  GamesInfoResponse,
} from "@/types/recommend";

export async function fetchSteamLibrary(): Promise<SteamGame[]> {
  const res = await fetch("/api/steam/library");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Failed to fetch Steam library");
  }
  return res.json();
}

export async function fetchGamesInfo(
  gameIds: number[]
): Promise<GamesInfoResponse> {
  const res = await fetch("/api/games/info", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ game_ids: gameIds }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? "Failed to fetch games info"
    );
  }
  return res.json();
}

export async function fetchGameRecommendation(
  body: RecommendGameRequest
): Promise<RecommendResponse> {
  const res = await fetch("/api/recommend/game", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? "Failed to fetch game recommendations"
    );
  }
  return res.json();
}

export async function fetchUserRecommendation(
  body: RecommendUserRequest
): Promise<RecommendResponse> {
  const res = await fetch("/api/recommend/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? "Failed to fetch user recommendations"
    );
  }
  return res.json();
}
