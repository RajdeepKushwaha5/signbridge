import { SKILL_IDS, normalizeSkillId } from './skills.js'

const CONCEPT_ROLES = new Set(['TIME', 'TOPIC', 'PERSON', 'ACTION', 'OBJECT', 'PLACE'])

function validateConceptBridge(bridge) {
  if (!bridge || !Array.isArray(bridge.cards) || bridge.cards.length < 1 || bridge.cards.length > 8) throw new Error('Diagnosis has an invalid concept bridge.')
  const ids = new Set()
  bridge.cards = bridge.cards.map((card, index) => {
    const id = typeof card?.id === 'string' && card.id.trim() ? card.id.trim() : `concept-${index + 1}`
    if (ids.has(id) || !CONCEPT_ROLES.has(card?.role)) throw new Error('Diagnosis has invalid concept cards.')
    ids.add(id)
    if (typeof card.learnerText !== 'string' || typeof card.englishText !== 'string' || typeof card.explanation !== 'string') throw new Error('Diagnosis has incomplete concept cards.')
    return { ...card, id, changed: Boolean(card.changed || card.learnerText.trim().toLowerCase() !== card.englishText.trim().toLowerCase()) }
  })
  for (const key of ['learnerOrder', 'englishOrder']) {
    if (!Array.isArray(bridge[key]) || bridge[key].length !== ids.size || new Set(bridge[key]).size !== ids.size || bridge[key].some((id) => !ids.has(id))) {
      throw new Error(`Diagnosis has invalid ${key}.`)
    }
  }
  if (typeof bridge.summary !== 'string') throw new Error('Diagnosis has no concept summary.')
  return bridge
}

export function validateDiagnosis(value) {
  if (!value || typeof value !== 'object') throw new Error('Diagnosis is not an object.')
  const requiredStrings = ['corrected', 'decisionReason', 'encouragement']
  if (requiredStrings.some((key) => typeof value[key] !== 'string')) throw new Error('Diagnosis is missing required text.')
  if (!Array.isArray(value.errors) || !value.focusSkill || !value.lesson) throw new Error('Diagnosis is missing learning data.')
  const focusId = normalizeSkillId(value.focusSkill.id)
  if (!SKILL_IDS.includes(focusId)) throw new Error('Diagnosis has an unsupported skill.')
  for (const key of ['guidedPractice', 'transferPractice']) {
    const item = value[key]
    if (!item || ['prompt', 'instruction', 'referenceAnswer'].some((field) => typeof item[field] !== 'string') || !Array.isArray(item.hints) || item.hints.length < 2) {
      throw new Error(`Diagnosis has invalid ${key}.`)
    }
    item.skillId = focusId
  }
  value.focusSkill.id = focusId
  value.conceptBridge = validateConceptBridge(value.conceptBridge)
  const parsedConfidence = Number(value.confidence)
  value.confidence = Math.max(0, Math.min(1, Number.isFinite(parsedConfidence) ? parsedConfidence : 0.5))
  value.errors = value.errors.map((error) => ({ ...error, skillId: normalizeSkillId(error.skillId, focusId) }))
  return value
}

export function validatePracticeRequest(body) {
  const phase = body.phase === 'transfer' ? 'transfer' : 'guided'
  const attempt = Number(body.attempt)
  const learnerAnswer = typeof body.learnerAnswer === 'string' ? body.learnerAnswer.trim() : ''
  const practice = body.practice
  if (!learnerAnswer || learnerAnswer.length > 500) return { error: 'Answer must contain between 1 and 500 characters.' }
  if (!Number.isInteger(attempt) || attempt < 1 || attempt > 3) return { error: 'Attempt must be 1, 2, or 3.' }
  if (!practice || typeof practice.prompt !== 'string' || typeof practice.referenceAnswer !== 'string' || !Array.isArray(practice.hints)) return { error: 'Practice context is invalid.' }
  const skillId = normalizeSkillId(body.skillId || practice.skillId)
  return { phase, attempt, learnerAnswer, practice: { ...practice, skillId }, skillId }
}
