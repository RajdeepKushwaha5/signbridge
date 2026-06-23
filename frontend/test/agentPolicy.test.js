import test from 'node:test'
import assert from 'node:assert/strict'
import { chooseNextAction } from '../src/features/grammar/agentPolicy.js'

test('agent routes a retry to another scaffold', () => {
  assert.equal(chooseNextAction({ phase: 'guided', correct: false, shouldAdvance: false }).id, 'another_scaffold')
})

test('agent routes secure guided work to unseen transfer', () => {
  assert.equal(chooseNextAction({ phase: 'guided', correct: true, hintLevel: 0, masteryAfter: 50 }).id, 'unseen_transfer')
})

test('agent raises independently mastered work to a mastery challenge', () => {
  assert.equal(chooseNextAction({ phase: 'transfer', correct: true, hintLevel: 0, masteryAfter: 78 }).id, 'mastery_challenge')
})

test('agent routes unsuccessful transfer back to visual explanation', () => {
  assert.equal(chooseNextAction({ phase: 'transfer', correct: false, shouldAdvance: true }).id, 'visual_explanation')
})
