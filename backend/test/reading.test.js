import test from 'node:test'
import assert from 'node:assert/strict'
import { fallbackPassage, chunkSourceToPassage } from '../src/domain/readingFallbacks.js'

const TOPICS = ['Animals', 'Space', 'Food', 'Sports', 'Weather', 'Friendship', 'The Ocean', 'Plants']

test('reading fallback returns a valid reviewed passage for every topic', () => {
  for (const topic of TOPICS) {
    const passage = fallbackPassage(topic, 2, null)
    assert.equal(passage.mode, 'fallback')
    assert.ok(Array.isArray(passage.passage) && passage.passage.length >= 3, `${topic} has passage lines`)
    assert.equal(passage.keyVocab.length, 3, `${topic} has three vocab words`)
    assert.equal(passage.questions.length, 3, `${topic} has three questions`)
    for (const question of passage.questions) {
      assert.equal(question.options.length, 4)
      assert.ok(Number.isInteger(question.answerIndex) && question.answerIndex >= 0 && question.answerIndex < 4)
    }
  }
})

test('reading fallback preserves skill focus and handles unknown topics', () => {
  const passage = fallbackPassage('Unknown Topic', 3, { id: 'tense', label: 'Verb tense' })
  assert.equal(passage.skillFocus.id, 'tense')
  assert.equal(passage.level, 3)
  assert.ok(passage.title)
})

test('bring-your-own-content chunker turns source text into readable lines', () => {
  const source = 'The water cycle moves water around Earth. The sun heats the ocean. Water rises as vapor. Clouds form and rain falls. The rain returns to rivers.'
  const passage = chunkSourceToPassage(source, 2, null)
  assert.equal(passage.mode, 'fallback')
  assert.equal(passage.source, 'byoc')
  assert.ok(passage.passage.length >= 3 && passage.passage.length <= 6)
  assert.deepEqual(passage.keyVocab, [])
  assert.deepEqual(passage.questions, [])
  assert.ok(passage.title.length > 0)
})
