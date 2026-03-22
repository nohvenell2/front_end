import { Progress } from "@/components/ui/progress";
import type { RankedGame } from "@/types/recommend";

interface ScoreProgressBarsProps {
  scores: RankedGame["scores"];
}

const SCORE_LABELS = [
  { key: "tfidf" as const, label: "Similarity" },
  { key: "popularity" as const, label: "Popularity" },
  { key: "rating" as const, label: "Rating" },
  { key: "recency" as const, label: "Recency" },
];

export function ScoreProgressBars({ scores }: ScoreProgressBarsProps) {
  return (
    <div className="space-y-2">
      {SCORE_LABELS.map(({ key, label }) => {
        const pct = Math.round(scores[key] * 100);
        return (
          <div key={key} className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{label}</span>
              <span>{pct}%</span>
            </div>
            <Progress value={pct} className="h-1.5" />
          </div>
        );
      })}
    </div>
  );
}
