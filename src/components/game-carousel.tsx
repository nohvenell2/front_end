"use client";

import { useRef, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { formatPlaytime, steamHeaderUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { SteamGame } from "@/types/steam";

interface GameScrollCardProps {
  game: SteamGame;
  headerImage?: string;
  description?: string;
  genres: string[];
  selected: boolean;
  onToggle: (appid: number) => void;
  disabled: boolean;
}

function GameScrollCard({
  game,
  headerImage,
  description,
  genres,
  selected,
  onToggle,
  disabled,
}: GameScrollCardProps) {
  return (
    <label
      className={cn(
        "relative flex flex-col w-[300px] h-[360px] shrink-0 cursor-pointer select-none rounded-sm overflow-hidden transition-colors",
        selected
          ? "border-2 border-accent"
          : "border-2 border-border hover:border-accent/50",
        disabled && !selected && "opacity-50 pointer-events-none",
        "bg-card",
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

      {/* Header image */}
      <div className="relative w-full shrink-0" style={{ paddingTop: "46.7%" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={headerImage ?? steamHeaderUrl(game.appid)}
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {selected && (
          <div className="absolute inset-0 flex items-center justify-center bg-accent/35 pointer-events-none">
            <span className="text-5xl font-bold text-green-400 leading-none">✓</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2 p-3 flex-1 min-h-0 overflow-hidden">
        <span className="text-sm font-semibold text-foreground leading-tight line-clamp-2">
          {game.name}
        </span>
        <span className="text-xs text-muted-foreground shrink-0">
          {formatPlaytime(game.playtime_forever)}
        </span>
        {description && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-5">
            {description}
          </p>
        )}
        {genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto pt-1 shrink-0">
            {genres.slice(0, 4).map((g) => (
              <Badge key={g} variant="secondary" className="text-[10px] px-1.5 py-0 rounded-sm h-4">
                {g}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </label>
  );
}

interface GameCarouselProps {
  games: SteamGame[];
  enrichedMap: Map<number, { genres: string[]; headerImage?: string; description?: string }>;
  selectedIds: Set<number>;
  onToggle: (appid: number) => void;
  maxSelection: number;
}

export function GameCarousel({
  games,
  enrichedMap,
  selectedIds,
  onToggle,
  maxSelection,
}: GameCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const drag = useRef({
    active: false,
    startX: 0,
    scrollLeft: 0,
    velX: 0,
    lastX: 0,
    lastT: 0,
    moved: false,
    raf: 0,
  });

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    const d = drag.current;
    cancelAnimationFrame(d.raf);
    d.active = true;
    d.moved = false;
    d.startX = e.pageX - el.offsetLeft;
    d.scrollLeft = el.scrollLeft;
    d.velX = 0;
    d.lastX = e.pageX;
    d.lastT = Date.now();
    el.style.cursor = "grabbing";
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    const d = drag.current;
    if (!d.active || !el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    el.scrollLeft = d.scrollLeft - (x - d.startX);
    const now = Date.now();
    const dt = now - d.lastT;
    if (dt > 0) {
      d.velX = (e.pageX - d.lastX) / dt;
      d.lastX = e.pageX;
      d.lastT = now;
    }
    if (Math.abs(x - d.startX) > 4) d.moved = true;
  }, []);

  const onMouseUp = useCallback(() => {
    const el = scrollRef.current;
    const d = drag.current;
    if (!el) return;
    d.active = false;
    el.style.cursor = "grab";
    let vel = d.velX * 14;
    const momentum = () => {
      if (!scrollRef.current || Math.abs(vel) < 0.4) return;
      scrollRef.current.scrollLeft -= vel;
      vel *= 0.93;
      d.raf = requestAnimationFrame(momentum);
    };
    d.raf = requestAnimationFrame(momentum);
  }, []);

  const onMouseLeave = useCallback(() => {
    const el = scrollRef.current;
    const d = drag.current;
    if (!d.active || !el) return;
    d.active = false;
    el.style.cursor = "grab";
  }, []);

  // Wheel → horizontal scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const d = drag.current;
      cancelAnimationFrame(d.raf);
      el.scrollLeft += (e.deltaY + e.deltaX) * 3;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div
      ref={scrollRef}
      className="flex gap-3 overflow-x-auto pb-2 cursor-grab"
      style={{ scrollbarWidth: "thin", scrollbarColor: "var(--color-steam-border) var(--color-bg-primary)" }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      {games.map((game) => {
        const enriched = enrichedMap.get(game.appid);
        const selected = selectedIds.has(game.appid);
        const disabled = !selected && selectedIds.size >= maxSelection;
        return (
          <GameScrollCard
            key={game.appid}
            game={game}
            headerImage={enriched?.headerImage}
            description={enriched?.description}
            genres={enriched?.genres ?? []}
            selected={selected}
            onToggle={onToggle}
            disabled={disabled}
          />
        );
      })}
    </div>
  );
}
