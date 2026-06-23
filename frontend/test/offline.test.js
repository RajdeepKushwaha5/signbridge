import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createGrammarService } from '../src/features/grammar/grammar.service.js'
import { detectFallbackSkill } from '../src/features/grammar/offlineFallbacks.js'
import { createReadingService, TOPICS } from '../src/features/reading/reading.service.js'

const offlineRequest = async () => { throw new Error('The tutor service is unavailable.') }

test('grammar diagnosis falls back locally while offline', async () => {
  const service = createGrammarService(offlineRequest)
  const result = await service.bridgeSentence('Store I go yesterday.', [])
  assert.equal(result.mode, 'fallback')
  assert.equal(result.corrected, 'I went to the store yesterday.')
  assert.equal(result.guidedPractice.hints.length, 2)
  assert.equal(result.conceptBridge.cards.length, 4)
  assert.deepEqual(result.conceptBridge.englishOrder, ['person', 'action', 'place', 'time'])
})

test('local fallback detector covers scored benchmark diagnosis cases', () => {
  const benchmark = JSON.parse(readFileSync(new URL('../../evaluation/benchmark.json', import.meta.url), 'utf8'))
  const scored = benchmark.cases.filter((item) => item.expectedSkill)
  for (const item of scored) {
    assert.equal(detectFallbackSkill(item.sentence), item.expectedSkill, item.id)
  }
})

test('grammar checking provides hints and model support offline', async () => {
  const service = createGrammarService(offlineRequest)
  const diagnosis = await service.bridgeSentence('I have three cat at home.', [])
  const first = await service.checkPractice({ learnerAnswer: 'wrong', practice: diagnosis.guidedPractice, attempt: 1 })
  const third = await service.checkPractice({ learnerAnswer: 'wrong', practice: diagnosis.guidedPractice, attempt: 3 })
  assert.equal(first.status, 'retry')
  assert.ok(first.hint)
  assert.equal(third.status, 'needs_support')
  assert.ok(third.modelAnswer)
})

test('every reading topic has a complete local offline passage', async () => {
  const service = createReadingService(offlineRequest)
  for (const topic of TOPICS) {
    const result = await service.generatePassage(2, topic, [{ id: 'articles', mastery: 10 }])
    assert.equal(result.mode, 'fallback')
    assert.equal(result.questions.length, 3)
    assert.equal(result.keyVocab.length, 3)
    assert.equal(result.skillFocus.id, 'articles')
  }
})

test('client validation errors are not hidden by offline fallback', async () => {
  const service = createGrammarService(async () => { throw new Error('Request failed with status 400.') })
  await assert.rejects(() => service.bridgeSentence('', []), /status 400/)
})
