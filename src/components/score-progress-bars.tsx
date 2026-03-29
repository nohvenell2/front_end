import type { RankedGame } from "@/types/recommend";

interface ScoreProgressBarsProps {
  scores: RankedGame["scores"];
}

const SCORE_LABELS = [
  { key: "tfidf" as const,      label: "Similarity" },
  { key: "popularity" as const, label: "Popularity" },
  { key: "rating" as const,     label: "Rating" },
  { key: "recency" as const,    label: "Recency" },
];

function barColor(pct: number): string {
  if (pct >= 80) return "bg-green-400";
  if (pct >= 60) return "bg-yellow-400";
  return "bg-red-400";
}

export function ScoreProgressBars({ scores }: ScoreProgressBarsProps) {
  return (
    <div className="space-y-2">
      {SCORE_LABELS.map(({ key, label }) => {
        const pct = Math.round(scores[key] * 100);
        return (
          <div key={key} className="space-y-1">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{label}</span>
              <span>{pct}</span>
            </div>
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full transition-all ${barColor(pct)}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
