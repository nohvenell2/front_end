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
            <svg width="56" height="56" viewBox="0 0 24 24" fill="var(--color-accent)" aria-hidden="true">
              <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.523 4.524-4.523 2.494 0 4.524 2.028 4.524 4.523s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.1-3.338-2.654L.022 16.71C1.478 20.831 5.49 24 11.979 24c6.627 0 11.999-5.373 11.999-12C23.978 5.372 18.607 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.297-.249-1.886-.038l1.522.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.02zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.662 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.252 0-2.265-1.014-2.265-2.265z"/>
            </svg>
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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.523 4.524-4.523 2.494 0 4.524 2.028 4.524 4.523s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.1-3.338-2.654L.022 16.71C1.478 20.831 5.49 24 11.979 24c6.627 0 11.999-5.373 11.999-12C23.978 5.372 18.607 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.297-.249-1.886-.038l1.522.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.02zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.662 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.252 0-2.265-1.014-2.265-2.265z"/>
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
