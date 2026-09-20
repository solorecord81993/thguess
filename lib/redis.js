import { Redis } from '@upstash/redis'

let redis

export function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN

  if (!url || !token) {
    const error = new Error('Leaderboard storage is not connected')
    error.code = 'STORAGE_NOT_CONFIGURED'
    throw error
  }

  if (!redis) redis = new Redis({ url, token })
  return redis
}

export function thaiDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

export function thaiWeekKey(date = new Date()) {
  const [year, month, day] = thaiDateKey(date).split('-').map(Number)
  const current = new Date(Date.UTC(year, month - 1, day))
  const weekday = current.getUTCDay() || 7
  current.setUTCDate(current.getUTCDate() + 4 - weekday)
  const firstDay = new Date(Date.UTC(current.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((current - firstDay) / 86400000) + 1) / 7)
  return `${current.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

export function leaderboardKey(period, date = new Date()) {
  if (period === 'today') return `thguess:leaderboard:day:${thaiDateKey(date)}`
  if (period === 'week') return `thguess:leaderboard:week:${thaiWeekKey(date)}`
  return 'thguess:leaderboard:all'
}

export function sendJson(response, status, body) {
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Cache-Control', 'no-store')
  response.status(status).json(body)
}
