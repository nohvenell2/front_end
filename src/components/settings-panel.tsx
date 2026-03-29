"use client";

import { useSettings } from "@/context/settings-context";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

const WEIGHT_LABELS: Record<string, string> = {
  similarity: "Similarity",
  popularity: "Popularity",
  rating: "Rating",
  recency: "Recency",
};

const WEIGHT_DESCRIPTIONS: Record<string, string> = {
  similarity: "Score based on genre & tag similarity to your selected games.",
  popularity: "Score based on total player count across Steam.",
  rating: "Score based on positive review ratio.",
  recency: "Score that favors more recently released games.",
};

export function SettingsPanel() {
  const { settings, dispatch } = useSettings();

  return (
    <div className="flex flex-col gap-5 p-4 text-sm">
      {/* Count */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-bold text-foreground">Result Count</Label>
          <span className="text-xs font-semibold text-primary">{settings.count}</span>
        </div>
        <Slider
          min={5}
          max={20}
          step={1}
          value={[settings.count]}
          onValueChange={(v) => dispatch({ type: "SET_COUNT", payload: (v as number[])[0] })}
        />
        <div className="flex justify-between text-[12px] text-muted-foreground/60">
          <span>5</span><span>20</span>
        </div>
      </div>

      <Separator />

      {/* Weights */}
      <div className="flex flex-col gap-4">
        <Label className="text-sm font-bold text-foreground">Weights</Label>
        {(["similarity", "popularity", "rating", "recency"] as const).map((key) => {
          const total = Object.values(settings.weights).reduce((a, b) => a + b, 0);
          const pct = total > 0 ? Math.round((settings.weights[key] / total) * 100) : 0;
          return (
            <div key={key} className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <Label className="text-xs text-muted-foreground">{WEIGHT_LABELS[key]}</Label>
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger className="cursor-help text-muted-foreground">
                        <HelpCircle className="h-3 w-3" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-44 text-xs">
                        {WEIGHT_DESCRIPTIONS[key]}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <span className="text-xs text-primary">
                  {settings.weights[key]}
                  <span className="text-muted-foreground ml-1">({pct}%)</span>
                </span>
              </div>
              <Slider
                min={1}
                max={10}
                step={1}
                value={[settings.weights[key]]}
                onValueChange={(v) =>
                  dispatch({ type: "SET_WEIGHT", payload: { key, value: (v as number[])[0] } })
                }
              />
            </div>
          );
        })}
      </div>

      <Separator />

      {/* Half-life */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1">
            <Label className="text-sm font-bold text-foreground">Recency Half-life</Label>
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger className="cursor-help text-muted-foreground">
                  <HelpCircle className="h-3 w-3" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-44 text-xs">
                  Days until a game's recency score drops to 50%. Lower values favor newer releases more strongly.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span className="text-xs text-primary">{settings.halfLifeDays} days</span>
        </div>
        <Slider
          min={180}
          max={3650}
          step={90}
          value={[settings.halfLifeDays]}
          onValueChange={(v) => dispatch({ type: "SET_HALF_LIFE_DAYS", payload: (v as number[])[0] })}
        />
        <div className="flex justify-between text-[12px] text-muted-foreground/60">
          <span>180d</span><span>3650d</span>
        </div>
      </div>

      <Separator />

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <Label className="text-sm font-bold text-foreground">Filters</Label>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Released After</Label>
          <Input
            type="date"
            value={settings.filters.minReleaseDate}
            onChange={(e) =>
              dispatch({ type: "SET_FILTER", payload: { key: "minReleaseDate", value: e.target.value } })
            }
            className="h-8 text-xs bg-background border-border"
            style={{ colorScheme: "dark" }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <Label className="text-xs text-muted-foreground">Min Reviews</Label>
            <span className="text-xs text-primary">{settings.filters.minReviewCount.toLocaleString()}</span>
          </div>
          <Input
            type="number"
            min={0}
            value={settings.filters.minReviewCount}
            onChange={(e) =>
              dispatch({ type: "SET_FILTER", payload: { key: "minReviewCount", value: Number(e.target.value) } })
            }
            className="h-8 text-xs bg-background border-border"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <Label className="text-xs text-muted-foreground">Min Positive %</Label>
            <span className="text-xs text-primary">{settings.filters.minPositivePercent}%</span>
          </div>
          <Slider
            min={0}
            max={100}
            step={1}
            value={[settings.filters.minPositivePercent]}
            onValueChange={(v) =>
              dispatch({ type: "SET_FILTER", payload: { key: "minPositivePercent", value: (v as number[])[0] } })
            }
          />
          <div className="flex justify-between text-[12px] text-muted-foreground/60">
            <span>0%</span><span>100%</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Score Visualization */}
      <div className="flex flex-col gap-3">
        <Label className="text-sm font-bold text-foreground">Score Visualization</Label>
        <div className="flex gap-1">
          {(["radar", "bars"] as const).map((mode) => (
            <button
              key={mode}
              className={`flex-1 text-xs py-1.5 rounded transition-colors capitalize ${
                settings.scoreViz === mode
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              onClick={() => dispatch({ type: "SET_SCORE_VIZ", payload: mode })}
            >
              {mode === "radar" ? "Radar" : "Bars"}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => dispatch({ type: "RESET_DEFAULTS" })}
      >
        Reset to Default
      </Button>
    </div>
  );
}
