import type { RecommendationSettings } from "@/types/settings";

export const CANDIDATE_LIMIT = parseInt(
  process.env.NEXT_PUBLIC_CANDIDATE_LIMIT ?? "50"
);

export const DEFAULT_SETTINGS: RecommendationSettings = {
  count: parseInt(process.env.NEXT_PUBLIC_DEFAULT_RECOMMEND_COUNT ?? "10"),
  weights: {
    similarity: parseInt(
      process.env.NEXT_PUBLIC_DEFAULT_WEIGHT_SIMILARITY ?? "4"
    ),
    popularity: parseInt(
      process.env.NEXT_PUBLIC_DEFAULT_WEIGHT_POPULARITY ?? "3"
    ),
    rating: parseInt(process.env.NEXT_PUBLIC_DEFAULT_WEIGHT_RATING ?? "2"),
    recency: parseInt(process.env.NEXT_PUBLIC_DEFAULT_WEIGHT_RECENCY ?? "1"),
  },
  filters: {
    minReleaseDate:
      process.env.NEXT_PUBLIC_DEFAULT_MIN_RELEASE_DATE ?? "2000-01-01",
    minReviewCount: parseInt(
      process.env.NEXT_PUBLIC_DEFAULT_MIN_REVIEW_COUNT ?? "100"
    ),
    minPositivePercent: parseInt(
      process.env.NEXT_PUBLIC_DEFAULT_MIN_POSITIVE_PERCENT ?? "50"
    ),
  },
  halfLifeDays: parseInt(
    process.env.NEXT_PUBLIC_DEFAULT_HALF_LIFE_DAYS ?? "1825"
  ),
};
