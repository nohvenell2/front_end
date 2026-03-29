import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreRadar } from "@/components/score-radar";
import { cn } from "@/lib/utils";
import type { RankedGame } from "@/types/recommend";

interface RecommendCardProps {
  game: RankedGame;
  rank: number;
}

function reviewColor(percent: number): string {
  if (percent >= 80) return "text-green-400";
  if (percent >= 70) return "text-blue-400";
  if (percent >= 50) return "text-yellow-400";
  return "text-red-400";
}

export function RecommendCard({ game, rank }: RecommendCardProps) {
  const isTop = rank === 1;

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
              className="text-sm font-bold leading-snug hover:underline text-primary line-clamp-2"
            >
              {game.title}
            </a>
            <p className="text-xs text-muted-foreground">
              {[game.developer, game.release_date_original].filter(Boolean).join(" · ")}
            </p>
            {game.all_reviews && (
              <p className={cn("text-xs font-medium", reviewColor(game.total_review_positive_percent))}>
                {game.all_reviews} ({game.total_review_positive_percent}% / {game.total_review_count.toLocaleString()} reviews)
              </p>
            )}
          </div>
          <span className="text-3xl font-bold text-primary tabular-nums leading-none shrink-0">
            {Math.round(game.finalScore * 100)}
          </span>
        </div>

        {/* Genres */}
        {game.genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {game.genres.slice(0, 3).map((g) => (
              <Badge key={g} variant="secondary" className="text-[11px] px-1.5 py-0 rounded-sm h-4">
                {g}
              </Badge>
            ))}
          </div>
        )}

        {/* Tags */}
        {game.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {game.tags.slice(0, 5).map((t) => (
              <Badge key={t} variant="outline" className="text-[11px] px-1.5 py-0 rounded-sm h-4 text-muted-foreground border-muted-foreground/30">
                {t}
              </Badge>
            ))}
          </div>
        )}

        {/* Description */}
        {game.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {game.description}
          </p>
        )}

        {/* Radar chart */}
        <div className="flex justify-center pt-1">
          <ScoreRadar scores={game.scores} size={160} />
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
        <div className="flex justify-center pt-1">
          <div className="w-[160px] h-[160px] rounded-full bg-muted animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}
