import type { RecommendedGame, RankedGame } from "@/types/recommend";
import type { RecommendationSettings } from "@/types/settings";

export function rankGames(
  candidates: RecommendedGame[],
  weights: RecommendationSettings["weights"],
  halfLifeDays: number
): RankedGame[] {
  if (candidates.length === 0) return [];

  // 1. Normalize weights to sum = 1.0
  const rawTotal =
    weights.similarity + weights.popularity + weights.rating + weights.recency;
  const w = {
    sim: rawTotal > 0 ? weights.similarity / rawTotal : 0.25,
    pop: rawTotal > 0 ? weights.popularity / rawTotal : 0.25,
    rate: rawTotal > 0 ? weights.rating / rawTotal : 0.25,
    time: rawTotal > 0 ? weights.recency / rawTotal : 0.25,
  };

  // 2. Compute candidate-set maxima
  const maxSimScore = Math.max(...candidates.map((g) => g.sim_score), 0);
  const maxReviews = Math.max(...candidates.map((g) => g.total_review_count), 0);
  const lambda = halfLifeDays > 0 ? Math.log(2) / halfLifeDays : 0;
  const now = Date.now();

  // 3. Score each candidate
  return candidates
    .map((game): RankedGame => {
      const sTfidf = maxSimScore > 0 ? game.sim_score / maxSimScore : 0;
      const sPop =
        maxReviews > 0
          ? Math.log(1 + game.total_review_count) /
            Math.log(1 + maxReviews)
          : 0;
      const sRate = Math.min(1, Math.max(0, game.total_review_positive_percent / 100));
      const releaseMs = new Date(game.release_date).getTime();
      const daysSinceRelease = isNaN(releaseMs)
        ? 0
        : (now - releaseMs) / (1000 * 60 * 60 * 24);
      const sTime = Math.exp(-lambda * Math.max(0, daysSinceRelease));

      const finalScore =
        w.sim * sTfidf + w.pop * sPop + w.rate * sRate + w.time * sTime;

      return {
        ...game,
        finalScore,
        scores: {
          tfidf: sTfidf,
          popularity: sPop,
          rating: sRate,
          recency: sTime,
        },
      };
    })
    .sort((a, b) => b.finalScore - a.finalScore);
}
