import { auth } from "@/auth";
import { NextResponse } from "next/server";

const STEAM_API_BASE = "https://api.steampowered.com";

export async function GET() {
  const session = await auth();
  if (!session?.user?.steamid) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const steamid = session.user.steamid;
  const key = process.env.STEAM_API_KEY;

  const url = new URL(
    `${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v0001/`
  );
  url.searchParams.set("key", key!);
  url.searchParams.set("steamid", steamid);
  url.searchParams.set("format", "json");
  url.searchParams.set("include_appinfo", "true");
  url.searchParams.set("include_played_free_games", "true");

  const res = await fetch(url.toString());
  if (!res.ok) {
    return NextResponse.json(
      { message: "Failed to fetch Steam library" },
      { status: 502 }
    );
  }

  const data = await res.json();
  const games = data?.response?.games;

  if (!games || games.length === 0) {
    return NextResponse.json(
      {
        message:
          "No games found. Make sure your Steam profile and game details are set to Public.",
      },
      { status: 403 }
    );
  }

  return NextResponse.json(games);
}
