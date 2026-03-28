"use client";

/**
 * User Library Page (/user)
 *
 * This page should:
 * 1. Require authentication (redirect to / if unauthenticated)
 * 2. Fetch the user's Steam library via fetchSteamLibrary()
 * 3. Optionally enrich top games with genres/tags via fetchGamesInfo()
 * 4. Display the game library with sorting/filtering
 * 5. Allow game selection for targeted recommendations
 * 6. Provide a settings dialog (useSettings context) for recommendation weights/filters
 * 7. Navigate to /recommend (optionally with ?selected=appid1,appid2,...)
 * 8. Provide sign-out functionality via signOut({ callbackUrl: "/" })
 *
 * Key imports:
 *   import { useSession, signOut } from "next-auth/react";
 *   import { useQuery } from "@tanstack/react-query";
 *   import { fetchSteamLibrary, fetchGamesInfo } from "@/lib/api-client";
 *   import { useSettings } from "@/context/settings-context";
 *   import type { SteamGame, SteamGameEnriched } from "@/types/steam";
 *
 * Data flow:
 *   fetchSteamLibrary() → SteamGame[]
 *   fetchGamesInfo(topGameIds) → GamesInfoResponse → merge into SteamGameEnriched[]
 *
 * Session fields: session.user.steamid, .name, .image
 */
export default function UserPage() {
  return (
    <main>
      <h1>User Library</h1>
      <p>Implement your user library UI here.</p>
    </main>
  );
}
