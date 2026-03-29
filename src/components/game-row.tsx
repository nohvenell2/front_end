import { cn } from "@/lib/utils";
import { formatPlaytime, steamHeaderUrl } from "@/lib/utils";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SteamGame } from "@/types/steam";

interface GameRowProps {
  game: SteamGame;
  headerImage?: string;
  genres: string[];
  selected: boolean;
  onToggle: (appid: number) => void;
  disabled: boolean;
}

export function GameRow({ game, headerImage, genres, selected, onToggle, disabled }: GameRowProps) {
  return (
    <label
      className={cn(
        "relative flex items-center gap-3 px-4 min-h-[56px] w-full cursor-pointer select-none transition-colors rounded-sm",
        selected
          ? "bg-accent/10 border border-accent"
          : "bg-card border border-border hover:border-accent/50",
        disabled && !selected && "opacity-50 pointer-events-none",
      )}
    >
      <input
        type="checkbox"
        checked={selected}
        disabled={disabled && !selected}
        onChange={() => onToggle(game.appid)}
        className="sr-only"
        aria-label={`Select ${game.name}`}
      />

      {/* Thumbnail */}
      <div className="shrink-0 w-20 h-[47px] rounded-sm overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={headerImage ?? steamHeaderUrl(game.appid)}
          alt=""
          draggable={false}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Title + Playtime */}
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <span className="text-sm font-semibold text-foreground truncate">
          {game.name}
        </span>
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          {formatPlaytime(game.playtime_forever)}
        </span>
      </div>

      {/* Genres */}
      {genres.length > 0 && (
        <div className="hidden sm:flex flex-wrap justify-end gap-1 shrink-0 max-w-[360px]">
          {genres.slice(0, 5).map((g) => (
            <Badge key={g} variant="secondary" className="text-[13px] px-1.5 py-0 rounded-sm h-5">
              {g}
            </Badge>
          ))}
        </div>
      )}

      {/* Check overlay */}
      {selected && (
        <div className="absolute inset-0 flex items-center justify-center bg-accent/20 rounded-sm pointer-events-none">
          <span className="text-4xl font-bold text-green-400 leading-none">✓</span>
        </div>
      )}
    </label>
  );
}

export function GameRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 min-h-[56px] rounded-sm border border-border bg-card">
      <div className="w-20 h-[47px] rounded-sm bg-muted animate-pulse shrink-0" />
      <div className="flex flex-col gap-1 flex-1">
        <div className="h-3 rounded-sm bg-muted animate-pulse" />
        <div className="h-2 w-12 rounded-sm bg-muted animate-pulse" />
      </div>
      <div className="hidden sm:flex gap-1 shrink-0">
        <div className="w-12 h-4 rounded-sm bg-muted animate-pulse" />
        <div className="w-14 h-4 rounded-sm bg-muted animate-pulse" />
      </div>
    </div>
  );
}
