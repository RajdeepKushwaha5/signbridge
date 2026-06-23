import test from 'node:test'
import assert from 'node:assert/strict'
import { addSession, applyAssessment, createProfile, MAX_SESSIONS, migrateLegacyProfile, observeMisconception, PROFILE_VERSION } from '../src/features/grammar/profile.js'

test('legacy counters migrate without losing attempts', () => {
  const profile = migrateLegacyProfile({ patterns: { 'Missing article': 3, 'Verb tense': 2 }, sessions: 4 }, 0)
  assert.equal(profile.skills.articles.attempts, 3)
  assert.equal(profile.skills.tense.attempts, 2)
  assert.equal(profile.sessions.length, 4)
})

test('independent transfer earns more mastery than hinted guided work', () => {
  const profile = createProfile(0)
  const guided = applyAssessment(profile, { skillId: 'articles', phase: 'guided', correct: true, hintLevel: 1 }, 100)
  const transfer = applyAssessment(profile, { skillId: 'articles', phase: 'transfer', correct: true, hintLevel: 0 }, 100)
  assert.equal(guided.delta, 6)
  assert.equal(transfer.delta, 15)
})

test('mastery requires threshold and transfer success', () => {
  let profile = createProfile(0)
  profile.skills.articles.mastery = 70
  profile = applyAssessment(profile, { skillId: 'articles', phase: 'guided', correct: true, hintLevel: 0 }, 100).profile
  assert.equal(profile.skills.articles.mastered, false)
  profile = applyAssessment(profile, { skillId: 'articles', phase: 'transfer', correct: true, hintLevel: 0 }, 200).profile
  assert.equal(profile.skills.articles.mastered, true)
})

test('session history remains capped', () => {
  let profile = createProfile(0)
  for (let index = 0; index < MAX_SESSIONS + 5; index += 1) profile = addSession(profile, { id: String(index) }, index)
  assert.equal(profile.sessions.length, MAX_SESSIONS)
})

test('version 2 profile migrates without losing mastery or sessions', () => {
  const old = createProfile(0)
  old.version = 2
  delete old.insights
  for (const skill of Object.values(old.skills)) delete skill.misconceptions
  old.skills.tense.mastery = 48
  old.sessions = [{ id: 'kept' }]
  const migrated = migrateLegacyProfile(old, 100)
  assert.equal(migrated.version, PROFILE_VERSION)
  assert.equal(migrated.skills.tense.mastery, 48)
  assert.equal(migrated.sessions[0].id, 'kept')
  assert.deepEqual(migrated.skills.tense.misconceptions, [])
})

test('qualitative memory records evidence and celebrates independent transfer', () => {
  let profile = createProfile(0)
  profile = observeMisconception(profile, { skillId: 'tense', learnerText: 'Yesterday I walk home.' }, 100)
  profile = observeMisconception(profile, { skillId: 'tense', learnerText: 'Last night we watch a movie.' }, 200)
  const result = applyAssessment(profile, { skillId: 'tense', phase: 'transfer', correct: true, hintLevel: 0, learnerAnswer: 'Last night we watched a movie.' }, 300)
  assert.equal(result.profile.skills.tense.misconceptions[0].occurrences, 2)
  assert.equal(result.profile.skills.tense.misconceptions[0].resolutions, 1)
  assert.match(result.insight, /previously omitted past-tense markers twice/i)
  assert.match(result.insight, /independently/i)
})
