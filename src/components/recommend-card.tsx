"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreRadar } from "@/components/score-radar";
import { ScoreProgressBars } from "@/components/score-progress-bars";
import { useSettings } from "@/context/settings-context";
import { cn } from "@/lib/utils";
import type { RankedGame } from "@/types/recommend";

interface RecommendCardProps {
  game: RankedGame;
  rank: number;
}

function formatReview(text: string): string {
  return text.replace(/overwhelmingly positive/i, "Overwhelmingly +");
}

function reviewColor(percent: number): string {
  if (percent >= 80) return "text-green-400";
  if (percent >= 70) return "text-blue-400";
  if (percent >= 50) return "text-yellow-400";
  return "text-red-400";
}

export function RecommendCard({ game, rank }: RecommendCardProps) {
  const isTop = rank === 1;
  const { settings } = useSettings();
  const [localMode, setLocalMode] = useState<"radar" | "bars" | null>(null);
  const chartMode = localMode ?? settings.scoreViz;
  const [descExpanded, setDescExpanded] = useState(false);
  const [descClamped, setDescClamped] = useState(false);
  const descRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = descRef.current;
    if (el) setDescClamped(el.scrollHeight > el.clientHeight);
  }, [game.description]);

  return (
    <Card
      className={cn(
        "rounded-sm shadow-none overflow-hidden flex flex-col",
        isTop ? "border-primary" : "border-border",
      )}
    >
      {/* Header image */}
      <div className="relative w-full" style={{ aspectRatio: "460/215" }}>
        <Image
          src={game.header_image}
          alt={game.title}
          fill
          className="object-cover"
          unoptimized
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <span className={cn(
          "absolute top-2 left-2 text-[18px] font-bold px-2 py-0.5 rounded-sm",
          isTop
            ? "bg-primary text-primary-foreground"
            : "bg-black/60 text-white"
        )}>
          #{rank}
        </span>
      </div>

      {/* Content */}
      <CardContent className="flex flex-col gap-2.5 p-3 flex-1">
        {/* Title / dev / review + score */}
        <div className="flex flex-row gap-3 items-center">
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <a
              href={game.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-base font-bold leading-snug hover:underline text-primary line-clamp-2"
            >
              {game.title}
            </a>
            <p className="text-sm text-muted-foreground">
              {[game.developer, game.release_date_original].filter(Boolean).join(" · ")}
            </p>
            {game.all_reviews && (
              <p className={cn("text-sm font-medium", reviewColor(game.total_review_positive_percent))}>
                {formatReview(game.all_reviews)} ({game.total_review_positive_percent}% / {game.total_review_count.toLocaleString()} reviews)
              </p>
            )}
          </div>
          <div className="flex flex-col items-center justify-center shrink-0 w-16 h-16 rounded-md bg-primary/20 border border-primary/30">
            <span className="text-4xl font-bold text-primary tabular-nums leading-none">
              {Math.round(game.finalScore * 100)}
            </span>
          </div>
        </div>

        {/* Tags */}
        {game.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {game.tags.slice(0, 6).map((t) => (
              <Badge key={t} className="text-xs px-1.5 py-0 rounded-sm h-5 bg-primary/15 text-primary border-transparent hover:bg-primary/15">
                {t}
              </Badge>
            ))}
          </div>
        )}

        {/* Genres */}
        {game.genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {game.genres.slice(0, 4).map((g) => (
              <Badge key={g} variant="outline" className="text-xs px-1.5 py-0 rounded-sm h-5 text-muted-foreground border-muted-foreground/30">
                {g}
              </Badge>
            ))}
          </div>
        )}

        {/* Description */}
        {game.description && (
          <div className="flex flex-col gap-0.5">
            <p
              ref={descRef}
              className={cn("text-sm text-muted-foreground leading-relaxed", !descExpanded && "line-clamp-4")}
            >
              {game.description}
            </p>
            {(descClamped || descExpanded) && (
              <button
                className="self-start text-sm text-primary/70 hover:text-primary transition-colors"
                onClick={() => setDescExpanded((v) => !v)}
              >
                {descExpanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        )}

        {/* Score visualization */}
        <div className="space-y-2 mt-auto pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Score Breakdown</span>
            <div className="flex gap-1">
              <button
                className={cn(
                  "text-sm px-2 py-0.5 rounded transition-colors",
                  chartMode === "radar"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground"
                )}
                onClick={() => setLocalMode("radar")}
              >
                Radar
              </button>
              <button
                className={cn(
                  "text-sm px-2 py-0.5 rounded transition-colors",
                  chartMode === "bars"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground"
                )}
                onClick={() => setLocalMode("bars")}
              >
                Bars
              </button>
            </div>
          </div>
          {chartMode === "radar" ? (
            <div className="flex justify-center">
              <ScoreRadar scores={game.scores} />
            </div>
          ) : (
            <ScoreProgressBars scores={game.scores} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function RecommendCardSkeleton() {
  return (
    <Card className="rounded-sm shadow-none overflow-hidden flex flex-col">
      <div className="bg-muted animate-pulse w-full" style={{ aspectRatio: "460/215" }} />
      <CardContent className="flex flex-col gap-2.5 p-3">
        <div className="flex flex-row gap-3">
          <div className="flex flex-col gap-2 flex-1">
            <div className="h-4 w-3/4 rounded-sm bg-muted animate-pulse" />
            <div className="h-3 w-1/2 rounded-sm bg-muted animate-pulse" />
            <div className="h-3 w-2/3 rounded-sm bg-muted animate-pulse" />
            <div className="flex gap-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-4 w-12 rounded-sm bg-muted animate-pulse" />
              ))}
            </div>
            <div className="h-3 w-full rounded-sm bg-muted animate-pulse" />
          </div>
          <div className="h-8 w-10 rounded-sm bg-muted animate-pulse shrink-0" />
        </div>
        <div className="pt-3 border-t border-border space-y-2">
          <div className="flex justify-between">
            <div className="h-3 w-16 rounded-sm bg-muted animate-pulse" />
            <div className="h-3 w-20 rounded-sm bg-muted animate-pulse" />
          </div>
          <div className="flex justify-center">
            <div className="w-[160px] h-[160px] rounded-full bg-muted animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
