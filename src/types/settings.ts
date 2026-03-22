export interface RecommendationSettings {
  count: number; // 5–20
  weights: {
    similarity: number; // 1–10 raw slider value
    popularity: number;
    rating: number;
    recency: number;
  };
  filters: {
    minReleaseDate: string; // YYYY-MM-DD
    minReviewCount: number;
    minPositivePercent: number; // 0–100
  };
  halfLifeDays: number;
}
