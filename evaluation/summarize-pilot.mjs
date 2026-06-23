import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const directory = path.dirname(fileURLToPath(import.meta.url))
const inputPath = process.argv[2] ? path.resolve(process.argv[2]) : path.join(directory, 'pilot-results.json')

function fail(message) {
  throw new Error(`Pilot summary refused: ${message}`)
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

const data = JSON.parse(await fs.readFile(inputPath, 'utf8'))
if (!Array.isArray(data.participants) || data.participants.length === 0) fail('no observed participant results were provided')
if (data.participants.some((item) => item.consentConfirmed !== true)) fail('every included participant must have confirmed consent')
if (data.participants.some((item) => ['name', 'email', 'phone', 'school'].some((key) => key in item))) fail('remove identifying fields before generating evidence')

const requiredNumbers = ['preScore20', 'postScore20', 'conceptRolesReviewed', 'conceptRolesAccurate', 'conceptRolesAcceptable', 'conceptRolesMisleading', 'visualBridgesReviewed', 'visualBridgesIndependent', 'adaptiveRoutesReviewed', 'adaptiveRoutesAppropriate', 'memoryStatementsReviewed', 'memoryStatementsGrounded']
for (const participant of data.participants) {
  if (typeof participant.participantId !== 'string' || !participant.participantId) fail('each participant needs an anonymous participantId')
  if (requiredNumbers.some((key) => !Number.isFinite(Number(participant[key])))) fail(`participant ${participant.participantId} is missing a numeric measure`)
}

const total = (key) => data.participants.reduce((sum, item) => sum + Number(item[key]), 0)
const ratio = (numerator, denominator) => denominator ? numerator / denominator : null
const misleading = total('conceptRolesMisleading')
const summary = {
  generatedAt: new Date().toISOString(),
  protocolVersion: data.protocolVersion || 'unknown',
  reviewStatus: data.reviewStatus || 'not supplied',
  sampleSize: data.participants.length,
  meanPreScore20: mean(data.participants.map((item) => Number(item.preScore20))),
  meanPostScore20: mean(data.participants.map((item) => Number(item.postScore20))),
  meanObservedChange20: mean(data.participants.map((item) => Number(item.postScore20) - Number(item.preScore20))),
  conceptRoleAcceptableOrBetterRate: ratio(total('conceptRolesAccurate') + total('conceptRolesAcceptable'), total('conceptRolesReviewed')),
  conceptRolesMisleading: misleading,
  independentVisualBridgeRate: ratio(total('visualBridgesIndependent'), total('visualBridgesReviewed')),
  appropriateAdaptiveRouteRate: ratio(total('adaptiveRoutesAppropriate'), total('adaptiveRoutesReviewed')),
  groundedMemoryStatementRate: ratio(total('memoryStatementsGrounded'), total('memoryStatementsReviewed')),
  outcomeClaimsBlocked: misleading > 0 || data.reviewStatus !== 'approved by Deaf educator',
  participantResults: data.participants,
}

await fs.mkdir(path.join(directory, 'results'), { recursive: true })
const output = path.join(directory, 'results', `pilot-summary-${Date.now()}.json`)
await fs.writeFile(output, JSON.stringify(summary, null, 2))
console.log(`Saved evidence summary to ${output}`)
if (summary.outcomeClaimsBlocked) console.log('Outcome claims remain blocked pending educator approval and resolution of any misleading concept roles.')
