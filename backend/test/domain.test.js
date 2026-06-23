import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fallbackDiagnosis, fallbackEvaluation, detectFallbackSkill } from '../src/domain/fallbacks.js'
import { SKILL_IDS, normalizeSkillId } from '../src/domain/skills.js'
import { validateDiagnosis } from '../src/domain/validation.js'

test('all eight canonical skills have valid fallback lessons', () => {
  for (const skillId of SKILL_IDS) {
    const result = fallbackDiagnosis('Practice sentence.', skillId)
    assert.equal(result.focusSkill.id, skillId)
    assert.equal(result.guidedPractice.skillId, skillId)
    assert.equal(result.transferPractice.skillId, skillId)
    assert.equal(result.guidedPractice.hints.length, 2)
    assert.doesNotThrow(() => validateDiagnosis(result))
  }
})

test('reviewed demo sentences receive deterministic corrections', () => {
  const result = fallbackDiagnosis('Store I go yesterday.')
  assert.equal(result.corrected, 'I went to the store yesterday.')
  assert.deepEqual(result.conceptBridge.learnerOrder, ['place', 'person', 'action', 'time'])
  assert.deepEqual(result.conceptBridge.englishOrder, ['person', 'action', 'place', 'time'])
  assert.equal(result.conceptBridge.cards.find((card) => card.id === 'action').englishText, 'went')
  assert.equal(fallbackDiagnosis('I have three cat at home.').corrected, 'I have three cats at home.')
})

test('fallback detector covers scored benchmark diagnosis cases', () => {
  const benchmark = JSON.parse(readFileSync(new URL('../../evaluation/benchmark.json', import.meta.url), 'utf8'))
  const scored = benchmark.cases.filter((item) => item.expectedSkill)
  for (const item of scored) {
    assert.equal(detectFallbackSkill(item.sentence), item.expectedSkill, item.id)
  }
})

test('concept bridge validation rejects duplicate or unknown role cards', () => {
  const result = fallbackDiagnosis('Store I go yesterday.')
  result.conceptBridge.cards[1].id = result.conceptBridge.cards[0].id
  assert.throws(() => validateDiagnosis(result), /concept cards/)
})

test('legacy labels normalize to canonical IDs', () => {
  assert.equal(normalizeSkillId('Missing article'), 'articles')
  assert.equal(normalizeSkillId('Verb tense'), 'tense')
  assert.equal(normalizeSkillId('Topic-comment'), 'topic_comment')
})

test('fallback evaluation gives two hints then model support', () => {
  const practice = fallbackDiagnosis('Store I go tomorrow.', 'word_order').guidedPractice
  const first = fallbackEvaluation({ learnerAnswer: 'Wrong one', practice, attempt: 1 })
  const second = fallbackEvaluation({ learnerAnswer: 'Wrong two', practice, attempt: 2 })
  const third = fallbackEvaluation({ learnerAnswer: 'Wrong three', practice, attempt: 3 })
  assert.equal(first.status, 'retry')
  assert.equal(first.hint, practice.hints[0])
  assert.equal(second.hint, practice.hints[1])
  assert.equal(third.status, 'needs_support')
  assert.equal(third.modelAnswer, practice.referenceAnswer)
  assert.equal(third.shouldAdvance, true)
})
