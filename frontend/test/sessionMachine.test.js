import test from 'node:test'
import assert from 'node:assert/strict'
import { initialSession, sessionReducer } from '../src/features/grammar/sessionMachine.js'

const diagnosis = {
  corrected: 'I went to the store yesterday.',
  focusSkill: { id: 'tense' },
  decisionReason: 'The time word and verb form need to work together.',
  conceptBridge: {
    cards: [{ id: 'person', role: 'PERSON', learnerText: 'I', englishText: 'I' }, { id: 'action', role: 'ACTION', learnerText: 'go', englishText: 'went' }],
    learnerOrder: ['action', 'person'],
    englishOrder: ['person', 'action'],
    summary: 'Move the person before the action.',
  },
}

test('session follows diagnosis, concept, lesson, guided, transfer, summary', () => {
  let state = sessionReducer(initialSession, { type: 'DIAGNOSIS_READY', sentence: 'Go I', diagnosis, startedAt: 1 })
  assert.equal(state.stage, 'diagnosis')
  state = sessionReducer(state, { type: 'SHOW_CONCEPT' })
  assert.equal(state.stage, 'concept')
  state = sessionReducer(state, { type: 'MOVE_CONCEPT', id: 'person', direction: -1 })
  state = sessionReducer(state, { type: 'CHECK_CONCEPT' })
  assert.equal(state.concept.correct, true)
  assert.equal(state.decisions.length, 3)
  state = sessionReducer(state, { type: 'SHOW_LESSON' })
  state = sessionReducer(state, { type: 'START_GUIDED' })
  assert.equal(state.stage, 'guided')
  state = sessionReducer(state, { type: 'START_TRANSFER' })
  assert.equal(state.stage, 'transfer')
  state = sessionReducer(state, { type: 'SHOW_SUMMARY' })
  assert.equal(state.stage, 'summary')
})

test('retry increments attempt and clears answer', () => {
  let state = { ...initialSession, guided: { ...initialSession.guided, answer: 'try', result: { correct: false } } }
  state = sessionReducer(state, { type: 'RETRY', phase: 'guided' })
  assert.equal(state.guided.attempt, 2)
  assert.equal(state.guided.answer, '')
  assert.equal(state.guided.result, null)
})
