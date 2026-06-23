import test from 'node:test'
import assert from 'node:assert/strict'
import { computeMilestones, updateStreak } from '../src/features/progress/progress.js'
import { createProfile } from '../src/features/grammar/profile.js'

function localDate(year, month, day, hour = 12) {
  return new Date(year, month - 1, day, hour).getTime()
}

test('streak starts at one and does not double count the same day', () => {
  const first = updateStreak(null, localDate(2026, 6, 20))
  const sameDay = updateStreak(first, localDate(2026, 6, 20, 20))
  assert.deepEqual(first, sameDay)
  assert.equal(first.current, 1)
})

test('streak increments on consecutive calendar days and resets after a gap', () => {
  const first = updateStreak(null, localDate(2026, 6, 20))
  const second = updateStreak(first, localDate(2026, 6, 21))
  const gap = updateStreak(second, localDate(2026, 6, 23))
  assert.equal(second.current, 2)
  assert.equal(second.best, 2)
  assert.equal(gap.current, 1)
  assert.equal(gap.best, 2)
})

test('independent transfer milestone excludes hinted transfers', () => {
  const profile = createProfile(0)
  profile.sessions = [{ transferCorrect: true, transferHints: 1 }]
  let milestone = computeMilestones(profile, { current: 1, best: 1 }).find((item) => item.id === 'first-transfer')
  assert.equal(milestone.achieved, false)
  profile.sessions.push({ transferCorrect: true, transferHints: 0 })
  milestone = computeMilestones(profile, { current: 1, best: 1 }).find((item) => item.id === 'first-transfer')
  assert.equal(milestone.achieved, true)
})

test('session and streak milestones unlock at their thresholds', () => {
  const profile = createProfile(0)
  profile.sessions = Array.from({ length: 5 }, (_, index) => ({ id: String(index) }))
  const achieved = computeMilestones(profile, { current: 3, best: 3 }).filter((item) => item.achieved).map((item) => item.id)
  assert.ok(achieved.includes('first-bridge'))
  assert.ok(achieved.includes('sessions-5'))
  assert.ok(achieved.includes('streak-3'))
})
