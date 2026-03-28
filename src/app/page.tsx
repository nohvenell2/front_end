import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();
  if (session?.user?.steamid) {
    redirect("/user");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: "var(--color-bg-primary)" }}>
      <div
        className="w-full max-w-lg rounded-sm p-12 flex flex-col items-center gap-8"
        style={{
          backgroundColor: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border)",
        }}
      >
        {/* Logo / Title */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="text-7xl">🎮</div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            Steam Game Recommender
          </h1>
          <p className="text-base" style={{ color: "var(--color-text-secondary)" }}>
            Personalized game recommendations from your Steam library
          </p>
        </div>

        {/* Divider */}
        <div className="w-full h-px" style={{ backgroundColor: "var(--color-border)" }} />

        {/* Steam Login Button */}
        <a
          href="/api/auth/steam/redirect"
          className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-sm text-base font-semibold transition-opacity hover:opacity-90 active:opacity-80"
          style={{
            backgroundColor: "var(--color-accent-cta)",
            color: "var(--color-cta-text)",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 233 233" fill="currentColor" aria-hidden="true">
            <path d="M116.5 0C52.1 0 0 52.1 0 116.5c0 55.7 39.2 102.3 91.7 113.5L133 116.5c0-46.1 37.4-83.5 83.5-83.5 3.8 0 7.5.3 11.2.7C215.5 14.4 168.9 0 116.5 0z"/>
            <path d="M166.5 98.3c-20.2 0-36.5 16.4-36.5 36.5 0 20.2 16.4 36.5 36.5 36.5S203 155 203 134.8c0-20.1-16.4-36.5-36.5-36.5zm0 60c-13 0-23.5-10.5-23.5-23.5s10.5-23.5 23.5-23.5 23.5 10.5 23.5 23.5-10.5 23.5-23.5 23.5z"/>
            <path d="M84.8 177.8l-17-7c-3 6.9-9.8 11.7-17.8 11.7-10.6 0-19.3-8.6-19.3-19.3s8.6-19.3 19.3-19.3c7.5 0 14 4.3 17.3 10.6l17.5 7.3c-4.8-18.8-21.9-32.7-42.3-32.7-24.1 0-43.7 19.6-43.7 43.7S18.4 216.5 42.5 216.5c20.7 0 38.2-14.5 42.3-38.7z"/>
          </svg>
          Sign in with Steam
        </a>

        <p className="text-sm text-center" style={{ color: "var(--color-text-dim)" }}>
          Sign in to get personalized game recommendations<br />
          based on your play history.
        </p>
      </div>
    </main>
  );
}
