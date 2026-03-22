"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import type { RankedGame } from "@/types/recommend";

interface ScoreRadarChartProps {
  scores: RankedGame["scores"];
}

export function ScoreRadarChart({ scores }: ScoreRadarChartProps) {
  const data = [
    { factor: "Similarity", value: Math.round(scores.tfidf * 100) },
    { factor: "Popularity", value: Math.round(scores.popularity * 100) },
    { factor: "Rating", value: Math.round(scores.rating * 100) },
    { factor: "Recency", value: Math.round(scores.recency * 100) },
  ];

  return (
    <ResponsiveContainer width="100%" height={160}>
      <RadarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <PolarGrid />
        <PolarAngleAxis dataKey="factor" tick={{ fontSize: 11 }} />
        <Radar
          name="Score"
          dataKey="value"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.3}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
