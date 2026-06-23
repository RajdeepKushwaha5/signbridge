import test from 'node:test'
import assert from 'node:assert/strict'
import { config } from '../src/config.js'
import { generateStructuredJSON } from '../src/services/gemini.js'

const schema = { type: 'object', properties: { ok: { type: 'boolean' } }, required: ['ok'] }

async function withMockedGemini(keys, handler, run) {
  const originalFetch = globalThis.fetch
  const originalKeys = config.geminiKeys
  config.geminiKeys = keys
  globalThis.fetch = handler
  try {
    await run()
  } finally {
    globalThis.fetch = originalFetch
    config.geminiKeys = originalKeys
  }
}

test('provider 5xx is retried once', { concurrency: false }, () => withMockedGemini(['key-one'], (() => {
  let calls = 0
  return async () => {
    calls += 1
    if (calls === 1) return new Response('busy', { status: 503 })
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"ok":true}' }] } }] }), { status: 200 })
  }
})(), async () => {
  assert.deepEqual(await generateStructuredJSON({ system: 'test', user: 'test', schema }), { ok: true })
}))

test('quota failure rotates to another key', { concurrency: false }, () => withMockedGemini(['key-one', 'key-two'], async (url) => {
  if (url.includes('key-one')) return new Response('quota', { status: 429 })
  return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"ok":true}' }] } }] }), { status: 200 })
}, async () => {
  assert.deepEqual(await generateStructuredJSON({ system: 'test', user: 'test', schema }), { ok: true })
}))

test('malformed provider JSON is rejected', { concurrency: false }, () => withMockedGemini(['key-one'], async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'not-json' }] } }] }), { status: 200 }), async () => {
  await assert.rejects(() => generateStructuredJSON({ system: 'test', user: 'test', schema }), SyntaxError)
}))

test('missing keys returns service unavailable', { concurrency: false }, () => withMockedGemini([], async () => new Response('', { status: 500 }), async () => {
  await assert.rejects(() => generateStructuredJSON({ system: 'test', user: 'test', schema }), (error) => error.status === 503)
}))
