import { LOCATION_BY_NAME, distanceKm, scoreForDistance } from '../lib/locations.js'
import { getRedis, leaderboardKey, sendJson } from '../lib/redis.js'

const MODES = new Set(['thailand', 'bangkok', 'speed', 'daily'])

export function cleanName(value) {
  return String(value || '')
    .replace(/[<>\u0000-\u001f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 24)
}

export function validPlayerId(value) {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]{16,64}$/.test(value)
}

function validCoordinate(value, min, max) {
  return Number.isFinite(value) && value >= min && value <= max
}

export function verifyRounds(rounds) {
  if (!Array.isArray(rounds) || rounds.length !== 5) throw new Error('invalid_rounds')
  const used = new Set()

  return rounds.map(round => {
    const location = LOCATION_BY_NAME.get(round?.spotName)
    if (!location || used.has(location.name)) throw new Error('invalid_location')
    used.add(location.name)

    if (!round.guess) return { spotName: location.name, distance: null, score: 0 }
    const lat = Number(round.guess.lat)
    const lng = Number(round.guess.lng)
    if (!validCoordinate(lat, -90, 90) || !validCoordinate(lng, -180, 180)) {
      throw new Error('invalid_guess')
    }

    const distance = distanceKm(lat, lng, location.lat, location.lng)
    return { spotName: location.name, distance, score: scoreForDistance(distance) }
  })
}

async function checkRateLimit(redis, request) {
  const forwarded = String(request.headers['x-forwarded-for'] || '').split(',')[0].trim()
  const ip = forwarded || request.socket?.remoteAddress || 'unknown'
  const key = `thguess:rate:${ip}`
  const count = await redis.incr(key)
  if (count === 1) await redis.expire(key, 60)
  return count <= 12
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return sendJson(response, 405, { error: 'method_not_allowed' })
  }

  try {
    const redis = getRedis()
    if (!(await checkRateLimit(redis, request))) {
      return sendJson(response, 429, { error: 'too_many_requests' })
    }

    const { playerId, username, mode, rounds } = request.body || {}
    const name = cleanName(username)
    if (!validPlayerId(playerId) || name.length < 2 || !MODES.has(mode)) {
      return sendJson(response, 400, { error: 'invalid_player' })
    }

    let verifiedRounds
    try {
      verifiedRounds = verifyRounds(rounds)
    } catch (error) {
      return sendJson(response, 400, { error: error.message })
    }

    const score = verifiedRounds.reduce((sum, round) => sum + round.score, 0)
    const xpEarned = Math.round(score / 10)
    const profileKey = `thguess:player:${playerId}`
    const keys = [leaderboardKey('today'), leaderboardKey('week'), leaderboardKey('all')]
    const [profile, ...existingScores] = await Promise.all([
      redis.hgetall(profileKey),
      ...keys.map(key => redis.zscore(key, playerId))
    ])

    const now = new Date().toISOString()
    const transaction = redis.multi()
    transaction.hset(profileKey, { name, updatedAt: now })
    transaction.hincrby(profileKey, 'games', 1)
    transaction.hincrby(profileKey, 'xp', xpEarned)
    if (score > (Number(profile?.best) || 0)) transaction.hset(profileKey, { best: score })
    keys.forEach((key, index) => {
      if (score > (Number(existingScores[index]) || 0)) {
        transaction.zadd(key, { score, member: playerId })
      }
    })
    transaction.expire(keys[0], 60 * 60 * 24 * 14)
    transaction.expire(keys[1], 60 * 60 * 24 * 90)
    transaction.lpush(`thguess:games:${playerId}`, JSON.stringify({ mode, score, playedAt: now }))
    transaction.ltrim(`thguess:games:${playerId}`, 0, 19)
    await transaction.exec()

    const rank = await redis.zrevrank(leaderboardKey('all'), playerId)
    return sendJson(response, 200, {
      online: true,
      score,
      xpEarned,
      rank: rank === null ? null : rank + 1,
      rounds: verifiedRounds.map(round => ({
        spotName: round.spotName,
        distance: round.distance === null ? null : Number(round.distance.toFixed(1)),
        score: round.score
      }))
    })
  } catch (error) {
    if (error.code === 'STORAGE_NOT_CONFIGURED') {
      return sendJson(response, 503, { online: false, error: 'leaderboard_not_configured' })
    }
    console.error('score error', error)
    return sendJson(response, 500, { online: false, error: 'score_save_failed' })
  }
}
