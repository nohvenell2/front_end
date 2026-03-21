# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **front-end** for a Steam Game Recommendation System. The project is in early initialization — no framework has been scaffolded yet. The backend is a FastAPI server (`POST /recommend/game`, `POST /recommend/user`) running at the host defined in `.env`.

## Environment Variables

Defined in `.env` at the project root:
- `API_HOST` — IP of the recommendation API server
- `API_PORT` — Port of the recommendation API server (default: 8000)
- `STEAM_API_KEY` — Steam Web API key for fetching user library data

## Backend API

Base URL: `http://{API_HOST}:{API_PORT}`

### `POST /recommend/game` — Item-to-Item
Recommend games similar to a given `game_id`.

```json
{ "game_id": 1091500, "limit": 20, "release_date": "2020-01-01T00:00:00",
  "total_review_count": 100, "total_review_positive_percent": 50,
  "recent_review_count": 0, "recent_review_positive_percent": 0 }
```

### `POST /recommend/user` — User-to-Item
Recommend games based on a user's playtime-weighted game library. Games already owned are excluded from results.

```json
{ "games": [{ "appid": 1158310, "playtime_forever": 10, "name": "", "img_icon_url": "", "has_community_visible_stats": false }],
  "limit": 20, "release_date": "2000-01-01T00:00:00",
  "total_review_count": 100, "total_review_positive_percent": 50,
  "recent_review_count": 0, "recent_review_positive_percent": 0 }
```

### Response Shape (HTTP 200)
```json
{ "status": "success",
  "data": [{
    "sim_score": 0.67, "game_id": 1404210, "url": "...", "title": "...",
    "description": "...", "header_image": "...", "developer": "...", "publisher": "...",
    "release_date": "2020-12-01T00:00:00", "release_date_original": "Dec 1, 2020",
    "total_review_count": 30131, "all_reviews": "Mostly Positive",
    "total_review_positive_percent": 81,
    "recent_review_count": 412, "recent_reviews": "Mixed",
    "recent_review_positive_percent": 55,
    "genres": ["Action"], "tags": ["Open World"]
  }],
  "skipped_game_ids": [245] }
```

- `/recommend/game` returns 404 if the game has no embedding data.
- `/recommend/user` skips games without embedding data and lists them in `skipped_game_ids`.

## Client-Side Ranking Logic

After receiving API results (up to 50 candidates), the client re-ranks them using a weighted score:

```
Final Score = w₁·S_tfidf + w₂·S_pop + w₃·S_rate + w₄·S_time   (w₁+w₂+w₃+w₄ = 1.0)
```

| Score | Formula | Notes |
|---|---|---|
| `S_tfidf` | `sim_score / max(sim_score)` | Normalize API cosine similarity to [0,1] |
| `S_pop` | `ln(1 + reviews) / ln(1 + max_reviews)` | Log-normalize within candidate set |
| `S_rate` | `total_review_positive_percent / 100` | Direct mapping, already 0–1 |
| `S_time` | `e^(-λ · days_since_release)` | Exponential decay; λ = ln(2) / half_life_days |

Sort results descending by Final Score before rendering.

## Dev Docs

- [dev_docs/README-api.md](dev_docs/README-api.md) — Full backend API reference (Korean)
- [dev_docs/client_side_recommend_logic.md](dev_docs/client_side_recommend_logic.md) — Client ranking formulas
