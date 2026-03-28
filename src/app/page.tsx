import { auth } from "@/auth";
import { redirect } from "next/navigation";

/**
 * Home / Login Page
 *
 * This page should:
 * 1. Check if the user is already authenticated (redirect to /user if so)
 * 2. Display a Steam login button that navigates to /api/auth/steam/redirect
 *
 * Available session fields: session.user.steamid, .name, .image
 * Login endpoint: GET /api/auth/steam/redirect (initiates Steam OpenID flow)
 */
export default async function HomePage() {
  const session = await auth();
  if (session?.user?.steamid) {
    redirect("/user");
  }

  return (
    <main>
      <h1>Steam Game Recommender</h1>
      <p>Implement your login UI here.</p>
      <a href="/api/auth/steam/redirect">Sign in with Steam</a>
    </main>
  );
}
