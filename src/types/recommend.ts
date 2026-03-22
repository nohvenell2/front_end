export interface RecommendedGame {
  sim_score: number;
  game_id: number;
  url: string;
  title: string;
  description: string;
  header_image: string;
  developer: string;
  publisher: string;
  release_date: string; // ISO-8601
  release_date_original: string;
  total_review_count: number;
  all_reviews: string;
  total_review_positive_percent: number;
  recent_review_count: number;
  recent_reviews: string;
  recent_review_positive_percent: number;
  genres: string[];
  tags: string[];
}

export interface RankedGame extends RecommendedGame {
  finalScore: number;
  scores: {
    tfidf: number;
    popularity: number;
    rating: number;
    recency: number;
  };
}

export interface RecommendResponse {
  status: string;
  data: RecommendedGame[];
  skipped_game_ids: number[];
}

export interface GameInfo {
  game_id: number;
  url: string;
  title: string;
  description: string;
  header_image: string;
  developer: string;
  publisher: string;
  release_date: string;
  release_date_original: string;
  total_review_count: number;
  all_reviews: string;
  total_review_positive_percent: number;
  recent_review_count: number;
  recent_reviews: string;
  recent_review_positive_percent: number;
  genres: string[];
  tags: string[];
}

export interface GamesInfoResponse {
  status: string;
  data: GameInfo[];
  not_found_game_ids: number[];
}

export interface RecommendGameRequest {
  game_id: number;
  limit?: number;
  release_date?: string;
  total_review_count?: number;
  total_review_positive_percent?: number;
  recent_review_count?: number;
  recent_review_positive_percent?: number;
}

export interface RecommendUserRequest {
  games: {
    appid: number;
    name: string;
    playtime_forever: number;
    img_icon_url: string;
    has_community_visible_stats: boolean;
  }[];
  limit?: number;
  release_date?: string;
  total_review_count?: number;
  total_review_positive_percent?: number;
  recent_review_count?: number;
  recent_review_positive_percent?: number;
}
