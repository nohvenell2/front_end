"use client";

import { useState } from "react";
import Image from "next/image";
import type { RankedGame } from "@/types/recommend";
import { Badge } from "@/components/ui/badge";
import { ScoreRadarChart } from "./score-radar-chart";
import { ScoreProgressBars } from "./score-progress-bars";

interface RecommendCardProps {
  game: RankedGame;
  rank: number;
}

function reviewColor(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("positive") || lower.includes("overwhelmingly"))
    return "text-green-600 dark:text-green-400";
  if (lower.includes("mixed")) return "text-yellow-600 dark:text-yellow-400";
  if (lower.includes("negative")) return "text-red-600 dark:text-red-400";
  return "text-muted-foreground";
}

export function RecommendCard({ game, rank }: RecommendCardProps) {
  const [showMore, setShowMore] = useState(false);
  const [chartMode, setChartMode] = useState<"radar" | "bars">("radar");

  return (
    <div className="rounded-lg border overflow-hidden hover:shadow-md transition-shadow">
      {/* Header image */}
      <div className="relative w-full aspect-460/215">
        <Image
          src={game.header_image}
          alt={game.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 50vw"
          unoptimized
        />
        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded">
          #{rank}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Title + review */}
        <div className="space-y-1">
          <h3 className="font-semibold leading-tight">{game.title}</h3>
          <p className="text-xs text-muted-foreground">
            {game.developer} · {game.release_date_original}
          </p>
          <p className={`text-xs font-medium ${reviewColor(game.all_reviews)}`}>
            {game.all_reviews} ({game.total_review_positive_percent}%,{" "}
            {game.total_review_count.toLocaleString()} reviews)
          </p>
        </div>

        {/* Genres */}
        {game.genres.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {game.genres.map((g) => (
              <Badge key={g} variant="secondary" className="text-xs">
                {g}
              </Badge>
            ))}
          </div>
        )}

        {/* Description */}
        <p
          className={`text-sm text-muted-foreground ${
            showMore ? "" : "line-clamp-2"
          }`}
        >
          {game.description}
        </p>
        {game.description.length > 120 && (
          <button
            className="text-xs text-primary hover:underline"
            onClick={() => setShowMore((p) => !p)}
          >
            {showMore ? "Show less" : "Show more"}
          </button>
        )}

        {/* Score visualization */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Score Breakdown
            </span>
            <div className="flex gap-1">
              <button
                className={`text-xs px-2 py-0.5 rounded transition-colors ${
                  chartMode === "radar"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
                onClick={() => setChartMode("radar")}
              >
                Radar
              </button>
              <button
                className={`text-xs px-2 py-0.5 rounded transition-colors ${
                  chartMode === "bars"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
                onClick={() => setChartMode("bars")}
              >
                Bars
              </button>
            </div>
          </div>
          {chartMode === "radar" ? (
            <ScoreRadarChart scores={game.scores} />
          ) : (
            <ScoreProgressBars scores={game.scores} />
          )}
        </div>

        {/* CTA */}
        <a
          href={game.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center w-full h-8 px-3 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          View on Steam
        </a>
      </div>
    </div>
  );
}
