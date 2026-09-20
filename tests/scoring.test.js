import test from 'node:test'
import assert from 'node:assert/strict'
import { distanceKm, scoreForDistance } from '../lib/locations.js'
import { leaderboardKey, thaiDateKey, thaiWeekKey } from '../lib/redis.js'
import { cleanName, validPlayerId, verifyRounds } from '../api/score.js'

test('perfect guess receives 5,000 points', () => {
  assert.equal(scoreForDistance(distanceKm(13.7563, 100.5018, 13.7563, 100.5018)), 5000)
})

test('score decreases with distance', () => {
  assert.ok(scoreForDistance(100) > scoreForDistance(500))
})

test('Thai leaderboard keys are stable', () => {
  const date = new Date('2026-09-20T05:00:00.000Z')
  assert.equal(thaiDateKey(date), '2026-09-20')
  assert.equal(thaiWeekKey(date), '2026-W38')
  assert.equal(leaderboardKey('today', date), 'thguess:leaderboard:day:2026-09-20')
  assert.equal(leaderboardKey('all', date), 'thguess:leaderboard:all')
})

test('player input is normalized and validated', () => {
  assert.equal(cleanName('  Map   Master <script>  '), 'Map Master script')
  assert.equal(validPlayerId('12345678-1234-1234-1234-123456789012'), true)
  assert.equal(validPlayerId('short'), false)
})

test('five unique rounds are recomputed by the server', () => {
  const names = [
    'เชียงใหม่',
    'เชียงราย',
    'ลำปาง',
    'พิษณุโลก',
    'นครสวรรค์'
  ]
  const result = verifyRounds(names.map(spotName => ({ spotName, guess: null })))
  assert.equal(result.length, 5)
  assert.equal(result.reduce((total, round) => total + round.score, 0), 0)
  assert.throws(() => verifyRounds(names.map(() => ({ spotName: 'เชียงใหม่', guess: null }))), /invalid_location/)
})
