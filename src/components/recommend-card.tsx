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

export function RecommendCard({ game, rank }: RecommendCardProps) {
  const isTop = rank === 1;

  return (
    <Card
      className={cn(
        "rounded-sm shadow-none overflow-hidden grid",
        isTop ? "border-primary" : "border-border",
      )}
      style={{ gridTemplateColumns: "184px 1fr" }}
    >
      {/* Header image */}
      <div className="relative self-stretch" style={{ minHeight: 86 }}>
        <Image
          src={game.header_image}
          alt={game.title}
          fill
          className="object-cover"
          unoptimized
          sizes="184px"
        />
        {isTop && (
          <span className="absolute top-1.5 left-1.5 text-[12px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-sm">
            #1
          </span>
        )}
      </div>

      {/* Content */}
      <CardContent className="flex flex-row gap-3 p-3 min-w-0 px-3">
        {/* Text info */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          {/* Title + score */}
          <div className="flex items-start justify-between gap-2">
            <a
              href={game.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold leading-tight hover:underline truncate text-primary"
            >
              {game.title}
            </a>
            <span className="shrink-0 text-sm font-bold text-primary tabular-nums">
              {Math.round(game.finalScore * 100)}
            </span>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[13px] text-muted-foreground">
            {game.developer && <span>{game.developer}</span>}
            {game.release_date_original && <span>{game.release_date_original}</span>}
            {game.all_reviews && <span>{game.all_reviews}</span>}
          </div>

          {/* Genres */}
          {game.genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-0.5">
              {game.genres.slice(0, 4).map((g) => (
                <Badge key={g} variant="secondary" className="text-[12px] px-1.5 py-0 rounded-sm h-4">
                  {g}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Radar chart */}
        <div className="shrink-0 self-center">
          <ScoreRadar scores={game.scores} size={110} />
        </div>
      </CardContent>
    </Card>
  );
}

export function RecommendCardSkeleton() {
  return (
    <Card
      className="rounded-sm shadow-none overflow-hidden grid"
      style={{ gridTemplateColumns: "184px 1fr", minHeight: 110 }}
    >
      <div className="bg-muted animate-pulse" />
      <CardContent className="flex flex-col gap-3 p-3 px-3">
        <div className="h-4 w-3/4 rounded-sm bg-muted animate-pulse" />
        <div className="h-3 w-1/2 rounded-sm bg-muted animate-pulse" />
        <div className="flex gap-1 mt-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 w-12 rounded-sm bg-muted animate-pulse" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
