"use client";

import dynamic from "next/dynamic";
import type { RankedGame } from "@/types/recommend";

// recharts — dynamic import, SSR disabled (required to avoid SSR crash)
const RadarChart = dynamic(() => import("recharts").then((m) => m.RadarChart), { ssr: false });
const Radar = dynamic(() => import("recharts").then((m) => m.Radar), { ssr: false });
const PolarGrid = dynamic(() => import("recharts").then((m) => m.PolarGrid), { ssr: false });
const PolarAngleAxis = dynamic(() => import("recharts").then((m) => m.PolarAngleAxis), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });

const SCORE_AXES = [
  { key: "tfidf" as const,      label: "Similarity" },
  { key: "popularity" as const, label: "Popularity" },
  { key: "rating" as const,     label: "Rating" },
  { key: "recency" as const,    label: "Recency" },
];

interface ScoreRadarProps {
  scores: RankedGame["scores"];
  size?: number;
}

export function ScoreRadar({ scores, size = 140 }: ScoreRadarProps) {
  const data = SCORE_AXES.map(({ key, label }) => ({
    subject: label,
    value: Math.round(scores[key] * 100),
    fullMark: 100,
  }));

  return (
    <ResponsiveContainer width={size} height={size}>
      <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
        <PolarGrid stroke="#2a475e" strokeDasharray="3 3" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: "#8f98a0", fontSize: 10 }}
        />
        <Radar
          dataKey="value"
          stroke="#67c1f5"
          fill="#67c1f5"
          fillOpacity={0.2}
          strokeWidth={1.5}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
