"use client";

import Image from "next/image";
import type { RankedGame } from "@/types/recommend";
import { Badge } from "@/components/ui/badge";
import { ScoreRadarChart } from "./score-radar-chart";
import { ScoreProgressBars } from "./score-progress-bars";

interface RecommendCardProps {
  game: RankedGame;
  rank: number;
  chartMode: "radar" | "bars";
  onChartModeChange: (mode: "radar" | "bars") => void;
}

function reviewColor(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("positive") || lower.includes("overwhelmingly"))
    return "text-green-600 dark:text-green-400";
  if (lower.includes("mixed")) return "text-yellow-600 dark:text-yellow-400";
  if (lower.includes("negative")) return "text-red-600 dark:text-red-400";
  return "text-muted-foreground";
}

export function RecommendCard({ game, rank, chartMode, onChartModeChange }: RecommendCardProps) {

  return (
    <div className="rounded-lg border overflow-hidden hover:shadow-md transition-shadow flex flex-col">
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

      <div className="p-4 flex flex-col flex-1 gap-3">
        {/* Title + review + score */}
        <div className="flex items-stretch gap-3">
          <div className="flex-1 space-y-1 min-w-0">
            <h3 className="font-semibold leading-tight">{game.title}</h3>
            <p className="text-xs text-muted-foreground">
              {game.developer} · {game.release_date_original}
            </p>
            <p className={`text-xs font-medium ${reviewColor(game.all_reviews)}`}>
              {game.all_reviews} ({game.total_review_positive_percent}%,{" "}
              {game.total_review_count.toLocaleString()} reviews)
            </p>
          </div>
          <div className="flex flex-col items-center justify-center shrink-0 w-14 rounded-lg bg-muted">
            <span className="text-2xl font-bold leading-none">
              {Math.round(game.finalScore * 100)}
            </span>
          </div>
        </div>

        {/* Genres & Tags */}
        {(game.genres.length > 0 || game.tags.length > 0) && (
          <div className="space-y-1">
            {game.genres.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {game.genres.slice(0, 5).map((g) => (
                  <Badge key={`genre-${g}`} className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                    {g}
                  </Badge>
                ))}
              </div>
            )}
            {game.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {game.tags.slice(0, 5).map((t) => (
                  <Badge key={`tag-${t}`} className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-muted-foreground">
          {game.description}
        </p>

        {/* Score visualization */}
        <div className="space-y-2 mt-auto pt-3 border-t">
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
                onClick={() => onChartModeChange("radar")}
              >
                Radar
              </button>
              <button
                className={`text-xs px-2 py-0.5 rounded transition-colors ${
                  chartMode === "bars"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
                onClick={() => onChartModeChange("bars")}
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
