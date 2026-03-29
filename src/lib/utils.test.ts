import { describe, it, expect } from 'vitest'
import { formatPlaytime, enrichGames, steamHeaderUrl, steamIconUrl } from './utils'
import type { SteamGame } from '@/types/steam'
import type { GamesInfoResponse } from '@/types/recommend'

describe('formatPlaytime', () => {
  it('shows minutes when under 60', () => {
    expect(formatPlaytime(0)).toBe('0 min')
    expect(formatPlaytime(45)).toBe('45 min')
    expect(formatPlaytime(59)).toBe('59 min')
  })

  it('converts to hours when 60+', () => {
    expect(formatPlaytime(60)).toBe('1 hour')
    expect(formatPlaytime(120)).toBe('2 hours')
    expect(formatPlaytime(90)).toBe('2 hours') // rounds to nearest hour
  })

  it('uses singular "hour" for exactly 1 hour', () => {
    expect(formatPlaytime(60)).toBe('1 hour')
    expect(formatPlaytime(89)).toBe('1 hour') // rounds to 1
  })

  it('uses plural "hours" for 2+', () => {
    expect(formatPlaytime(120)).toBe('2 hours')
    expect(formatPlaytime(600)).toBe('10 hours')
  })
})

describe('enrichGames', () => {
  const steamGames: SteamGame[] = [
    { appid: 1, name: 'Game A', playtime_forever: 120, img_icon_url: 'hash1', has_community_visible_stats: true },
    { appid: 2, name: 'Game B', playtime_forever: 60, img_icon_url: 'hash2', has_community_visible_stats: false },
  ]

  const gamesInfo: GamesInfoResponse = {
    status: 'ok',
    data: [
      {
        game_id: 1,
        url: 'https://store.steampowered.com/app/1',
        title: 'Game A',
        description: 'Desc A',
        header_image: 'https://example.com/1.jpg',
        developer: 'Dev A',
        publisher: 'Pub A',
        release_date: '2021-01-01',
        release_date_original: '1 Jan, 2021',
        total_review_count: 500,
        all_reviews: 'Positive',
        total_review_positive_percent: 80,
        recent_review_count: 50,
        recent_reviews: 'Positive',
        recent_review_positive_percent: 75,
        genres: ['Action', 'RPG'],
        tags: ['Open World'],
      },
    ],
    not_found_game_ids: [2],
  }

  it('merges steam game data with game info', () => {
    const enriched = enrichGames(steamGames, gamesInfo)
    expect(enriched).toHaveLength(2)
    expect(enriched[0].appid).toBe(1)
    expect(enriched[0].genres).toEqual(['Action', 'RPG'])
    expect(enriched[0].tags).toEqual(['Open World'])
    expect(enriched[0].header_image).toBe('https://example.com/1.jpg')
    expect(enriched[0].description).toBe('Desc A')
  })

  it('falls back to empty arrays and CDN URL when game not in info', () => {
    const enriched = enrichGames(steamGames, gamesInfo)
    expect(enriched[1].genres).toEqual([])
    expect(enriched[1].tags).toEqual([])
    expect(enriched[1].header_image).toContain('cdn.cloudflare.steamstatic.com')
    expect(enriched[1].description).toBe('')
  })

  it('returns empty array for empty steam games input', () => {
    const result = enrichGames([], gamesInfo)
    expect(result).toEqual([])
  })

  it('preserves original SteamGame fields', () => {
    const enriched = enrichGames(steamGames, gamesInfo)
    expect(enriched[0].name).toBe('Game A')
    expect(enriched[0].playtime_forever).toBe(120)
    expect(enriched[0].img_icon_url).toBe('hash1')
  })
})

describe('steamHeaderUrl', () => {
  it('returns correct CDN URL for appid', () => {
    expect(steamHeaderUrl(440)).toBe(
      'https://cdn.cloudflare.steamstatic.com/steam/apps/440/header.jpg'
    )
  })
})

describe('steamIconUrl', () => {
  it('returns correct Steam community URL for appid and hash', () => {
    expect(steamIconUrl(440, 'abc123')).toBe(
      'https://media.steampowered.com/steamcommunity/public/images/apps/440/abc123.jpg'
    )
  })
})
