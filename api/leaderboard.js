import { getRedis, leaderboardKey, sendJson } from '../lib/redis.js'

const ALLOWED_PERIODS = new Set(['today', 'week', 'all'])

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    return sendJson(response, 405, { error: 'method_not_allowed' })
  }

  const period = ALLOWED_PERIODS.has(request.query.period) ? request.query.period : 'today'
  const limit = Math.min(50, Math.max(1, Number(request.query.limit) || 20))

  try {
    const redis = getRedis()
    const key = leaderboardKey(period)
    const playerIds = await redis.zrange(key, 0, limit - 1, { rev: true })
    const [profiles, scores] = playerIds.length
      ? await Promise.all([
          Promise.all(playerIds.map(id => redis.hgetall(`thguess:player:${id}`))),
          Promise.all(playerIds.map(id => redis.zscore(key, id)))
        ])
      : [[], []]

    const leaderboard = playerIds.map((id, index) => ({
      rank: index + 1,
      playerId: id,
      name: profiles[index]?.name || 'Guest Explorer',
      score: Number(scores[index]) || 0,
      games: Number(profiles[index]?.games) || 0,
      xp: Number(profiles[index]?.xp) || 0,
      updatedAt: profiles[index]?.updatedAt || null
    }))

    return sendJson(response, 200, { online: true, period, leaderboard })
  } catch (error) {
    if (error.code === 'STORAGE_NOT_CONFIGURED') {
      return sendJson(response, 503, { online: false, error: 'leaderboard_not_configured' })
    }
    console.error('leaderboard error', error)
    return sendJson(response, 500, { online: false, error: 'leaderboard_unavailable' })
  }
}
