import { cn } from "@/lib/utils";
import { formatPlaytime, steamHeaderUrl } from "@/lib/utils";
import type { SteamGame } from "@/types/steam";

interface GameRowProps {
  game: SteamGame;
  headerImage?: string;
  selected: boolean;
  onToggle: (appid: number) => void;
  disabled: boolean;
}

export function GameRow({ game, headerImage, selected, onToggle, disabled }: GameRowProps) {
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
        aria-label={`${game.name} 선택`}
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

      {/* Name */}
      <span className="flex-1 min-w-0 text-sm text-foreground truncate">
        {game.name}
      </span>

      {/* Playtime */}
      <span className="shrink-0 text-xs text-muted-foreground">
        {formatPlaytime(game.playtime_forever)}
      </span>

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
      <div className="flex-1 h-3 rounded-sm bg-muted animate-pulse" />
      <div className="w-10 h-3 rounded-sm bg-muted animate-pulse shrink-0" />
    </div>
  );
}
