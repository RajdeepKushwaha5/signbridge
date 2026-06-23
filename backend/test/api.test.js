import test from 'node:test'
import assert from 'node:assert/strict'
import { createApp } from '../src/app.js'
import { fallbackDiagnosis } from '../src/domain/fallbacks.js'

async function withServer(run) {
  const server = createApp().listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  try {
    await run(`http://127.0.0.1:${server.address().port}`)
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
}

test('health endpoint reports service status', () => withServer(async (base) => {
  const response = await fetch(`${base}/health`)
  const body = await response.json()
  assert.equal(response.status, 200)
  assert.equal(body.status, 'ok')
}))

test('grammar endpoint rejects empty and oversized input', () => withServer(async (base) => {
  for (const sentence of ['', 'x'.repeat(401)]) {
    const response = await fetch(`${base}/api/grammar/bridge`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sentence }) })
    assert.equal(response.status, 400)
  }
}))

test('practice endpoint accepts deterministic exact answers without Gemini', () => withServer(async (base) => {
  const practice = fallbackDiagnosis('Book is on table.', 'articles').guidedPractice
  const response = await fetch(`${base}/api/grammar/practice/check`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phase: 'guided', skillId: 'articles', learnerAnswer: practice.referenceAnswer, practice, attempt: 1 }),
  })
  const body = await response.json()
  assert.equal(response.status, 200)
  assert.equal(body.correct, true)
  assert.equal(body.shouldAdvance, true)
}))
