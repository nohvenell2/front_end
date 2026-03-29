import { describe, it, expect } from 'vitest'
import { rankGames } from './ranking'
import type { RecommendedGame } from '@/types/recommend'

const baseGame: RecommendedGame = {
  sim_score: 1.0,
  game_id: 1,
  url: 'https://example.com',
  title: 'Test Game',
  description: 'desc',
  header_image: 'https://example.com/img.jpg',
  developer: 'Dev',
  publisher: 'Pub',
  release_date: '2020-01-01',
  release_date_original: '1 Jan, 2020',
  total_review_count: 1000,
  all_reviews: 'Very Positive',
  total_review_positive_percent: 90,
  recent_review_count: 100,
  recent_reviews: 'Positive',
  recent_review_positive_percent: 85,
  genres: ['Action'],
  tags: ['RPG'],
}

const weights = { similarity: 5, popularity: 5, rating: 5, recency: 5 }

describe('rankGames', () => {
  it('returns empty array for empty candidates', () => {
    expect(rankGames([], weights, 365)).toEqual([])
  })

  it('returns RankedGame with finalScore and scores fields', () => {
    const result = rankGames([baseGame], weights, 365)
    expect(result).toHaveLength(1)
    expect(result[0].finalScore).toBeGreaterThan(0)
    expect(result[0].scores).toMatchObject({
      tfidf: expect.any(Number),
      popularity: expect.any(Number),
      rating: expect.any(Number),
      recency: expect.any(Number),
    })
  })

  it('sorts by finalScore descending', () => {
    const highSim: RecommendedGame = { ...baseGame, game_id: 1, sim_score: 2.0, total_review_positive_percent: 95 }
    const lowSim: RecommendedGame = { ...baseGame, game_id: 2, sim_score: 0.1, total_review_positive_percent: 50 }
    const result = rankGames([lowSim, highSim], weights, 365)
    expect(result[0].game_id).toBe(1)
    expect(result[1].game_id).toBe(2)
    expect(result[0].finalScore).toBeGreaterThanOrEqual(result[1].finalScore)
  })

  it('handles all-zero weights gracefully (falls back to equal 0.25 each)', () => {
    const zeroWeights = { similarity: 0, popularity: 0, rating: 0, recency: 0 }
    const result = rankGames([baseGame], zeroWeights, 365)
    expect(result).toHaveLength(1)
    expect(result[0].finalScore).toBeGreaterThan(0)
  })

  it('normalizes tfidf score against max in candidate set', () => {
    const game1: RecommendedGame = { ...baseGame, game_id: 1, sim_score: 2.0 }
    const game2: RecommendedGame = { ...baseGame, game_id: 2, sim_score: 1.0 }
    const result = rankGames([game1, game2], { similarity: 10, popularity: 0, rating: 0, recency: 0 }, 365)
    expect(result[0].scores.tfidf).toBeCloseTo(1.0)
    expect(result[1].scores.tfidf).toBeCloseTo(0.5)
  })

  it('popularity score is 0 when all review counts are 0', () => {
    const noReviews: RecommendedGame = { ...baseGame, total_review_count: 0 }
    const result = rankGames([noReviews], weights, 365)
    expect(result[0].scores.popularity).toBe(0)
  })

  it('recency score approaches 1.0 for very recent releases', () => {
    const today = new Date().toISOString().split('T')[0]
    const newGame: RecommendedGame = { ...baseGame, release_date: today }
    const result = rankGames([newGame], weights, 365)
    expect(result[0].scores.recency).toBeCloseTo(1.0, 2)
  })

  it('recency score is low for old games with short half-life', () => {
    const oldGame: RecommendedGame = { ...baseGame, release_date: '2010-01-01' }
    const result = rankGames([oldGame], { similarity: 0, popularity: 0, rating: 0, recency: 10 }, 30)
    expect(result[0].scores.recency).toBeLessThan(0.01)
  })

  it('rating score equals positive percent / 100', () => {
    const game: RecommendedGame = { ...baseGame, total_review_positive_percent: 80 }
    const result = rankGames([game], weights, 365)
    expect(result[0].scores.rating).toBeCloseTo(0.8)
  })
})
