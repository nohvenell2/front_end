"use client";

import type { SteamGameEnriched } from "@/types/steam";
import { formatPlaytime } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface StatsDashboardProps {
  games: SteamGameEnriched[];
}

function aggregateByPlaytime(
  games: SteamGameEnriched[],
  key: "genres" | "tags",
  limit = 8
): { name: string; playtime: number }[] {
  const map = new Map<string, number>();
  for (const game of games) {
    for (const item of game[key]) {
      map.set(item, (map.get(item) ?? 0) + game.playtime_forever);
    }
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, playtime]) => ({ name, playtime: Math.floor(playtime / 60) }));
}

export function StatsDashboard({ games }: StatsDashboardProps) {
  const totalMinutes = games.reduce((s, g) => s + g.playtime_forever, 0);
  const topGenres = aggregateByPlaytime(games, "genres");
  const topTags = aggregateByPlaytime(games, "tags");

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard label="Total Games" value={games.length.toLocaleString()} />
        <StatCard label="Total Playtime" value={formatPlaytime(totalMinutes)} />
        <StatCard
          label="Avg. Playtime"
          value={
            games.length > 0
              ? formatPlaytime(Math.floor(totalMinutes / games.length))
              : "—"
          }
        />
      </div>

      {(topGenres.length > 0 || topTags.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {topGenres.length > 0 && (
            <ChartSection title="Top Genres by Playtime" data={topGenres} />
          )}
          {topTags.length > 0 && (
            <ChartSection title="Top Tags by Playtime" data={topTags} />
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-4 text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function ChartSection({
  title,
  data,
}: {
  title: string;
  data: { name: string; playtime: number }[];
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <ResponsiveContainer width="100%" height={data.length * 32 + 24}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16 }}>
          <XAxis
            type="number"
            unit="h"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={100}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value) => [`${value}h`, "Playtime"]}
            contentStyle={{ fontSize: 12 }}
          />
          <Bar dataKey="playtime" radius={[0, 4, 4, 0]} fill="hsl(var(--primary))" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
