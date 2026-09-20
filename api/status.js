import { getRedis, sendJson } from '../lib/redis.js'

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    return sendJson(response, 405, { error: 'method_not_allowed' })
  }

  try {
    const redis = getRedis()
    const pong = await redis.ping()
    return sendJson(response, 200, { online: pong === 'PONG' })
  } catch (error) {
    const status = error.code === 'STORAGE_NOT_CONFIGURED' ? 503 : 500
    return sendJson(response, status, { online: false })
  }
}
