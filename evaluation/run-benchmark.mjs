import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const directory = path.dirname(fileURLToPath(import.meta.url))
const benchmark = JSON.parse(await fs.readFile(path.join(directory, 'benchmark.json'), 'utf8'))
const baseUrl = (process.env.API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '')
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='))
const limit = limitArg ? Number(limitArg.split('=')[1]) : benchmark.cases.length
// Free-tier Gemini allows ~15 requests/min per key. Pace requests (default 4.5s
// ≈ 13/min) so the benchmark stays live the whole run instead of hitting 429 and
// silently dropping into fallback mode — which would skew the accuracy number.
const delayArg = process.argv.find((arg) => arg.startsWith('--delay='))
const delayMs = delayArg ? Number(delayArg.split('=')[1]) : 4500
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const cases = benchmark.cases.slice(0, limit)
const results = []

function validConceptBridge(bridge) {
  if (!bridge || !Array.isArray(bridge.cards) || bridge.cards.length < 1 || !Array.isArray(bridge.learnerOrder) || !Array.isArray(bridge.englishOrder)) return false
  const ids = new Set(bridge.cards.map((card) => card.id))
  const validOrder = (order) => order.length === ids.size && new Set(order).size === ids.size && order.every((id) => ids.has(id))
  return ids.size === bridge.cards.length && validOrder(bridge.learnerOrder) && validOrder(bridge.englishOrder)
}

for (const [index, item] of cases.entries()) {
  const started = Date.now()
  try {
    const response = await fetch(`${baseUrl}/api/grammar/bridge`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sentence: item.sentence, profile: [] }) })
    const body = await response.json()
    if (!response.ok) {
      results.push({ id: item.id, expectedSkill: item.expectedSkill, error: body.error || `HTTP ${response.status}`, status: response.status, durationMs: Date.now() - started })
      continue
    }
    results.push({ id: item.id, expectedSkill: item.expectedSkill, actualSkill: body.focusSkill?.id || null, matched: item.expectedSkill ? body.focusSkill?.id === item.expectedSkill : null, conceptBridgeValid: validConceptBridge(body.conceptBridge), conceptCardCount: body.conceptBridge?.cards?.length || 0, mode: body.mode, status: response.status, durationMs: Date.now() - started })
  } catch (error) {
    results.push({ id: item.id, error: error.message, durationMs: Date.now() - started })
  }
  process.stdout.write('.')
  if (index < cases.length - 1) await wait(delayMs)
}

const scored = results.filter((item) => typeof item.matched === 'boolean')
const liveScored = scored.filter((item) => item.mode === 'live')
const successfulResults = results.filter((item) => !item.error && item.status >= 200 && item.status < 300)
const validConcepts = successfulResults.filter((item) => item.conceptBridgeValid)
const liveResults = results.filter((item) => item.mode === 'live')
const requestFailures = results.filter((item) => item.error || item.status >= 400)
const summary = {
  generatedAt: new Date().toISOString(),
  benchmarkVersion: benchmark.version,
  reviewedStatus: benchmark.status,
  casesRun: results.length,
  successfulCases: successfulResults.length,
  requestFailureCount: requestFailures.length,
  canonicalSkillAccuracy: scored.length ? scored.filter((item) => item.matched).length / scored.length : null,
  liveCanonicalSkillAccuracy: liveScored.length ? liveScored.filter((item) => item.matched).length / liveScored.length : null,
  conceptBridgeValidity: successfulResults.length ? validConcepts.length / successfulResults.length : null,
  liveConceptBridgeValidity: liveResults.length ? liveResults.filter((item) => item.conceptBridgeValid).length / liveResults.length : null,
  fallbackCount: results.filter((item) => item.mode === 'fallback').length,
  results,
}
await fs.mkdir(path.join(directory, 'results'), { recursive: true })
const output = path.join(directory, 'results', `benchmark-${Date.now()}.json`)
await fs.writeFile(output, JSON.stringify(summary, null, 2))

const accuracy = summary.canonicalSkillAccuracy
const matchedCount = scored.filter((i) => i.matched).length
const accuracyText = accuracy === null ? 'n/a' : `${(accuracy * 100).toFixed(1)}% (${matchedCount}/${scored.length})`
const liveAccuracyText = summary.liveCanonicalSkillAccuracy === null ? 'n/a' : `${(summary.liveCanonicalSkillAccuracy * 100).toFixed(1)}% (${liveScored.filter((item) => item.matched).length}/${liveScored.length})`
const bridgeText = summary.conceptBridgeValidity === null ? 'n/a' : `${(summary.conceptBridgeValidity * 100).toFixed(1)}% (${validConcepts.length}/${successfulResults.length})`
console.log('\n\nBenchmark summary')
console.log(`  cases run:          ${summary.casesRun}`)
console.log(`  successful cases:   ${summary.successfulCases}`)
console.log(`  request failures:   ${summary.requestFailureCount}`)
console.log(`  overall accuracy:   ${accuracyText}`)
console.log(`  live-only accuracy: ${liveAccuracyText}`)
console.log(`  valid concept maps: ${bridgeText}`)
console.log(`  fallback responses: ${summary.fallbackCount}`)
if (summary.requestFailureCount > 0) {
  console.log('  Some requests failed before scoring. Start the backend or set API_BASE_URL,')
  console.log('  then rerun before using benchmark numbers in the demo.')
}
if (summary.fallbackCount > 0) {
  console.log('  Some responses fell back. Quote only the live-only metric as model performance,')
  console.log('  and report fallback reliability separately.')
}
console.log(`\nSaved ${output}`)
