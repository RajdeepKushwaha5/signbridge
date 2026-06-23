import test from 'node:test'
import assert from 'node:assert/strict'
import { createApiClient } from '../src/shared/api/client.js'

test('API client returns structured JSON', async () => {
  const request = createApiClient({ fetchImpl: async () => new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } }) })
  assert.deepEqual(await request('/test', {}), { ok: true })
})

test('API client converts network failure into learner-friendly error', async () => {
  const request = createApiClient({ fetchImpl: async () => { throw new TypeError('network down') } })
  await assert.rejects(() => request('/test', {}), /tutor service is unavailable/i)
})

test('API client aborts requests after timeout', async () => {
  const request = createApiClient({
    timeoutMs: 5,
    fetchImpl: (_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
    }),
  })
  await assert.rejects(() => request('/test', {}), /took too long/i)
})
