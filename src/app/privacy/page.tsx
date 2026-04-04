import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "Privacy Policy — Steam Game Recommender",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12 bg-background">
      <Card className="w-full max-w-2xl rounded-sm shadow-none">
        <CardContent className="flex flex-col gap-8 p-10">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-foreground">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground">Last updated: April 2025</p>
          </div>

          <Separator />

          <Section title="Overview">
            <p>
              Steam Game Recommender uses your Steam account to generate personalized game
              recommendations. This page explains exactly what data is accessed, how it is
              used, and — most importantly — what we never do with it.
            </p>
          </Section>

          <Section title="What we access">
            <ul className="list-disc list-inside space-y-1">
              <li>Your Steam ID (used to identify your session)</li>
              <li>Your Steam display name and profile picture</li>
              <li>Your Steam game library (app IDs and playtime)</li>
            </ul>
            <p className="mt-3">
              These are fetched directly from the official Steam API on your behalf when
              you sign in.
            </p>
          </Section>

          <Section title="How your data is used">
            <p>
              Your library data is used solely to compute game recommendations in real time.
              The recommendation algorithm runs on our server during your session and the
              results are returned directly to your browser.
            </p>
          </Section>

          <Section title="What we never do">
            <ul className="list-disc list-inside space-y-2">
              <li>
                <span className="text-foreground font-medium">No data is stored.</span>{" "}
                We do not write your Steam ID, library, playtime, or any personal
                information to a database.
              </li>
              <li>
                <span className="text-foreground font-medium">No data is shared.</span>{" "}
                Your information is never sold, transferred, or transmitted to any third
                party other than the Steam API itself.
              </li>
              <li>
                <span className="text-foreground font-medium">No tracking or analytics.</span>{" "}
                We do not use cookies for advertising or behavioral tracking.
              </li>
            </ul>
          </Section>

          <Section title="Session handling">
            <p>
              Authentication is managed via a short-lived JWT session cookie (NextAuth.js).
              The cookie exists only in your browser and expires when you sign out or close
              the session. No session data is persisted on the server.
            </p>
          </Section>

          <Section title="Third-party services">
            <p>
              Sign-in is handled through{" "}
              <a
                href="https://steamcommunity.com/dev/apiterms"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                Steam OpenID
              </a>
              . Game metadata (cover images, genres, tags) is fetched from the Steam Store
              API. Both are subject to Valve&apos;s own privacy terms.
            </p>
          </Section>

          <Separator />

          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to login
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
        {children}
      </div>
    </section>
  );
}
