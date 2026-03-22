import { type NextRequest, NextResponse } from "next/server";
import { signIn } from "@/auth";

const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";
const STEAM_API_BASE = "https://api.steampowered.com";
const STEAM_ID_PATTERN =
  /^https?:\/\/steamcommunity\.com\/openid\/id\/(\d+)$/;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const params = Object.fromEntries(searchParams.entries());

  // 1. Verify with Steam
  const verifyParams = new URLSearchParams({
    ...params,
    "openid.mode": "check_authentication",
  });

  const verifyRes = await fetch(STEAM_OPENID_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: verifyParams.toString(),
  });
  const verifyText = await verifyRes.text();

  if (!verifyText.includes("is_valid:true")) {
    return NextResponse.redirect(
      new URL("/?error=SteamVerificationFailed", request.url)
    );
  }

  // 2. Extract steamid from claimed_id
  const claimedId = params["openid.claimed_id"] ?? "";
  const match = claimedId.match(STEAM_ID_PATTERN);
  if (!match) {
    return NextResponse.redirect(
      new URL("/?error=SteamIdNotFound", request.url)
    );
  }
  const steamid = match[1];

  // 3. Fetch Steam profile
  const profileRes = await fetch(
    `${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${steamid}`
  );
  const profileData = await profileRes.json();
  const player = profileData?.response?.players?.[0];

  const name: string = player?.personaname ?? steamid;
  const image: string = player?.avatarfull ?? "";

  // 4. Sign in via NextAuth (server-side) — sets session cookie and redirects
  await signIn("steam", {
    steamid,
    name,
    image,
    redirectTo: "/user",
  });
}
