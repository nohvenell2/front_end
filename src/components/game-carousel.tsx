"use client";

import { useRef, useEffect, useLayoutEffect, useCallback, useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { formatPlaytime, steamHeaderUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { SteamGame } from "@/types/steam";

const CARD_W   = 300;
const CARD_GAP = 20;
const CLONE_N  = 6; // clones on each side

// ── Card ──────────────────────────────────────────────────────────────────

interface GameScrollCardProps {
  game: SteamGame;
  headerImage?: string;
  description?: string;
  genres: string[];
  selected: boolean;
  isCenter: boolean;
  onToggle: (appid: number) => void;
  disabled: boolean;
}

function GameScrollCard({
  game,
  headerImage,
  description,
  genres,
  selected,
  isCenter,
  onToggle,
  disabled,
}: GameScrollCardProps) {
  return (
    <label
      className={cn(
        "relative flex flex-col w-[300px] h-[360px] cursor-pointer select-none rounded-sm overflow-hidden bg-card transition-shadow duration-300",
        selected ? "border-2 border-accent" : "border-2 border-border",
        isCenter && "shadow-[0_0_28px_rgba(103,193,245,0.22)]",
        disabled && !selected && "pointer-events-none",
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
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">
            {description}
          </p>
        )}
        {genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto pt-1 shrink-0">
            {genres.slice(0, 4).map((g) => (
              <Badge key={g} variant="secondary" className="text-[12px] px-1.5 py-0 rounded-sm h-4">
                {g}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </label>
  );
}

// ── Carousel ──────────────────────────────────────────────────────────────

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
  const scrollRef  = useRef<HTMLDivElement>(null);
  const cardRefs   = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef     = useRef(0);
  const wheelReady = useRef(true);
  const drag       = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false });
  const [activeDisplayIdx, setActiveDisplayIdx] = useState(0);

  // ── Build display list: [tail-clones … real … head-clones] ────────────
  const cc = Math.min(CLONE_N, games.length); // actual clone count

  const displayItems = useMemo(() => {
    if (games.length === 0) return [];
    const n = Math.min(CLONE_N, games.length);
    return [
      ...games.slice(-n).map((g, i) => ({ game: g, realIndex: games.length - n + i })),
      ...games.map((g, i) => ({ game: g, realIndex: i })),
      ...games.slice(0, n).map((g, i) => ({ game: g, realIndex: i })),
    ];
  }, [games]);

  // ── Per-card visual update ─────────────────────────────────────────────
  const updateStyles = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const centerX = el.scrollLeft + el.clientWidth / 2;

    let minDist  = Infinity;
    let newActive = 0;

    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      const cardCenter = card.offsetLeft + CARD_W / 2;
      const dist = Math.abs(centerX - cardCenter);
      const t    = Math.min(dist / (CARD_W + CARD_GAP), 2.5);

      card.style.transform = `scale(${(1 - t * 0.115).toFixed(4)})`;
      card.style.opacity   = Math.max(1 - t * 0.35, 0.18).toFixed(4);
      card.style.filter    = t > 0.09 ? `blur(${Math.min(t * 1.6, 4).toFixed(2)}px)` : "none";

      if (dist < minDist) { minDist = dist; newActive = i; }
    });

    setActiveDisplayIdx(newActive);
  }, []);

  // ── Scroll listener ────────────────────────────────────────────────────
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateStyles);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [updateStyles]);

  // ── Initialize (or re-initialize) scroll to first real card ───────────
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || displayItems.length === 0) return;
    const firstReal = cardRefs.current[cc];
    if (!firstReal) return;
    // Instant jump — no animation
    el.scrollLeft = firstReal.offsetLeft + CARD_W / 2 - el.clientWidth / 2;
    requestAnimationFrame(updateStyles);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [games]); // re-center whenever games list changes

  // ── Silent jump from clone zone → real zone ────────────────────────────
  const onSnapSettled = useCallback((snappedIdx: number) => {
    const el = scrollRef.current;
    if (!el || games.length === 0) return;
    const n = Math.min(CLONE_N, games.length);

    let jumpTo: number | null = null;
    if (snappedIdx < n)                        jumpTo = snappedIdx + games.length; // tail→real
    else if (snappedIdx >= n + games.length)   jumpTo = snappedIdx - games.length; // head→real

    if (jumpTo !== null) {
      const target = cardRefs.current[jumpTo];
      if (target) {
        el.scrollLeft = target.offsetLeft + CARD_W / 2 - el.clientWidth / 2;
        requestAnimationFrame(updateStyles);
      }
    }
  }, [games.length, updateStyles]);

  // ── Snap helpers ───────────────────────────────────────────────────────
  const snapToDisplayIdx = useCallback((idx: number) => {
    const el   = scrollRef.current;
    const card = cardRefs.current[idx];
    if (!el || !card) return;
    el.scrollTo({ left: card.offsetLeft + CARD_W / 2 - el.clientWidth / 2, behavior: "smooth" });
  }, []);

  const snapToNearest = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const centerX = el.scrollLeft + el.clientWidth / 2;
    let minDist = Infinity;
    let nearestIdx = 0;
    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      const dist = Math.abs(centerX - (card.offsetLeft + CARD_W / 2));
      if (dist < minDist) { minDist = dist; nearestIdx = i; }
    });
    snapToDisplayIdx(nearestIdx);
    setTimeout(() => onSnapSettled(nearestIdx), 420);
  }, [snapToDisplayIdx, onSnapSettled]);

  // ── Drag handlers ──────────────────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    drag.current = { active: true, startX: e.pageX, scrollLeft: el.scrollLeft, moved: false };
    el.style.cursor = "grabbing";
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    const d  = drag.current;
    if (!d.active || !el) return;
    e.preventDefault();
    const dx = e.pageX - d.startX;
    el.scrollLeft = d.scrollLeft - dx;
    if (Math.abs(dx) > 5) d.moved = true;
  }, []);

  const onMouseUp = useCallback(() => {
    const el = scrollRef.current;
    const d  = drag.current;
    if (!el) return;
    d.active = false;
    el.style.cursor = "grab";
    if (d.moved) snapToNearest();
  }, [snapToNearest]);

  const onMouseLeave = useCallback(() => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    if (scrollRef.current) scrollRef.current.style.cursor = "grab";
    snapToNearest();
  }, [snapToNearest]);

  // Prevent checkbox toggle when a drag occurred
  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  }, []);

  // ── Wheel: advance one card, with infinite wrap ────────────────────────
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!wheelReady.current) return;
      wheelReady.current = false;
      setTimeout(() => { wheelReady.current = true; }, 380);

      const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      const dir   = delta > 0 ? 1 : -1;

      const centerX = el.scrollLeft + el.clientWidth / 2;
      let minDist   = Infinity;
      let curIdx    = 0;
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const dist = Math.abs(centerX - (card.offsetLeft + CARD_W / 2));
        if (dist < minDist) { minDist = dist; curIdx = i; }
      });

      // Clamp to display list bounds (wrapping is handled by onSnapSettled)
      const nextIdx = Math.max(0, Math.min(displayItems.length - 1, curIdx + dir));
      snapToDisplayIdx(nextIdx);
      setTimeout(() => onSnapSettled(nextIdx), 420);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [displayItems.length, snapToDisplayIdx, onSnapSettled]);

  // ── Render ────────────────────────────────────────────────────────────
  const SIDE_PAD = `calc(50% - ${CARD_W / 2}px)`;

  return (
    <div
      ref={scrollRef}
      className="flex items-center overflow-x-auto h-full cursor-grab"
      style={{
        scrollbarWidth: "none",
        paddingLeft:  SIDE_PAD,
        paddingRight: SIDE_PAD,
        gap: CARD_GAP,
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onClickCapture={onClickCapture}
    >
      {displayItems.map(({ game, realIndex }, index) => {
        const enriched = enrichedMap.get(game.appid);
        const selected = selectedIds.has(game.appid);
        const disabled = !selected && selectedIds.size >= maxSelection;
        return (
          <div
            key={index}
            ref={(el) => { cardRefs.current[index] = el; }}
            className="shrink-0"
            style={{
              willChange:      "transform, opacity, filter",
              transition:      "transform 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.28s ease, filter 0.28s ease",
              transformOrigin: "center center",
            }}
          >
            <GameScrollCard
              game={game}
              headerImage={enriched?.headerImage}
              description={enriched?.description}
              genres={enriched?.genres ?? []}
              selected={selected}
              isCenter={index === activeDisplayIdx}
              onToggle={onToggle}
              disabled={disabled}
            />
          </div>
        );
      })}
    </div>
  );
}
