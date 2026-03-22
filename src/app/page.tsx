import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SteamLoginButton } from "@/components/login/steam-login-button";
import { PrivacyNotice } from "@/components/login/privacy-notice";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.steamid) {
    redirect("/user");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center min-h-screen px-4">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Steam Game Recommender
          </h1>
          <p className="text-muted-foreground max-w-xs">
            Get personalized game recommendations based on your Steam play
            history.
          </p>
        </div>

        <SteamLoginButton />
        <PrivacyNotice />
      </div>
    </main>
  );
}
