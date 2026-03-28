import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function HomePage() {
  const session = await auth();
  if (session?.user?.steamid) {
    redirect("/user");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-background">
      <Card className="w-full max-w-lg rounded-sm shadow-none">
        <CardContent className="flex flex-col items-center gap-8 p-12">
          {/* Logo / Title */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="text-7xl">🎮</div>
            <h1 className="text-3xl font-bold text-foreground">
              Steam Game Recommender
            </h1>
            <p className="text-base text-muted-foreground">
              Personalized game recommendations from your Steam library
            </p>
          </div>

          <Separator />

          {/* Steam Login Button (anchor — not a form submit) */}
          <a
            href="/api/auth/steam/redirect"
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-sm text-base font-semibold transition-opacity hover:opacity-90 active:opacity-80 bg-[#5c7e10] text-[#d4e157]"
          >
            <svg width="24" height="24" viewBox="0 0 233 233" fill="currentColor" aria-hidden="true">
              <path d="M116.5 0C52.1 0 0 52.1 0 116.5c0 55.7 39.2 102.3 91.7 113.5L133 116.5c0-46.1 37.4-83.5 83.5-83.5 3.8 0 7.5.3 11.2.7C215.5 14.4 168.9 0 116.5 0z"/>
              <path d="M166.5 98.3c-20.2 0-36.5 16.4-36.5 36.5 0 20.2 16.4 36.5 36.5 36.5S203 155 203 134.8c0-20.1-16.4-36.5-36.5-36.5zm0 60c-13 0-23.5-10.5-23.5-23.5s10.5-23.5 23.5-23.5 23.5 10.5 23.5 23.5-10.5 23.5-23.5 23.5z"/>
              <path d="M84.8 177.8l-17-7c-3 6.9-9.8 11.7-17.8 11.7-10.6 0-19.3-8.6-19.3-19.3s8.6-19.3 19.3-19.3c7.5 0 14 4.3 17.3 10.6l17.5 7.3c-4.8-18.8-21.9-32.7-42.3-32.7-24.1 0-43.7 19.6-43.7 43.7S18.4 216.5 42.5 216.5c20.7 0 38.2-14.5 42.3-38.7z"/>
            </svg>
            Sign in with Steam
          </a>

          <p className="text-sm text-center text-muted-foreground/60">
            Sign in to get personalized game recommendations<br />
            based on your play history.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
