"use client";

import { Slider } from "@/components/ui/slider";
import { useSettings } from "@/context/settings-context";
import type { RecommendationSettings } from "@/types/settings";

const WEIGHT_LABELS: Record<
  keyof RecommendationSettings["weights"],
  string
> = {
  similarity: "Similarity",
  popularity: "Popularity",
  rating: "Rating",
  recency: "Recency",
};

export function WeightSliders() {
  const { settings, dispatch } = useSettings();
  const { weights } = settings;

  const total = Object.values(weights).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Adjust the importance of each factor. Values are automatically
        normalized to sum to 100%.
      </p>
      {(
        Object.keys(WEIGHT_LABELS) as Array<
          keyof RecommendationSettings["weights"]
        >
      ).map((key) => {
        const pct = total > 0 ? Math.round((weights[key] / total) * 100) : 0;
        return (
          <div key={key} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{WEIGHT_LABELS[key]}</span>
              <span className="text-muted-foreground">
                {weights[key]} ({pct}%)
              </span>
            </div>
            <Slider
              min={1}
              max={10}
              step={1}
              value={weights[key]}
              onValueChange={(v) =>
                dispatch({ type: "SET_WEIGHT", payload: { key, value: v as number } })
              }
            />
          </div>
        );
      })}
    </div>
  );
}
