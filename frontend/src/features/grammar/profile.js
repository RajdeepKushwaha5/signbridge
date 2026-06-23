import { SKILLS, SKILL_IDS, normalizeLegacyLabel } from './skills.js'

export const PROFILE_VERSION = 3
export const MAX_SESSIONS = 50
export const MAX_MEMORY_EVIDENCE = 4
export const MAX_INSIGHTS = 20

const MISCONCEPTION_LIBRARY = {
  articles: { description: 'left out written-English articles', success: 'used articles clearly' },
  tense: { description: 'omitted past-tense markers', success: 'marked the time on the verb' },
  agreement: { description: 'used a verb form that did not match the person', success: 'matched the verb to the person' },
  copula: { description: 'left out a written-English linking verb', success: 'used the linking verb' },
  plurals: { description: 'left a plural noun unmarked', success: 'marked the noun as plural' },
  prepositions: { description: 'left out a written-English place connector', success: 'used the place connector' },
  topic_comment: { description: 'carried topic-first order into written English', success: 'rebuilt the idea in written-English order' },
  word_order: { description: 'used a different concept order from written English', success: 'built the written-English order' },
}

function nowIso(now = Date.now()) {
  return new Date(now).toISOString()
}

function newSkill(id) {
  return {
    id,
    label: SKILLS[id].label,
    attempts: 0,
    independentCorrect: 0,
    hintedCorrect: 0,
    transferCorrect: 0,
    streak: 0,
    mastery: 0,
    mastered: false,
    lastPracticed: null,
    nextReview: null,
    misconceptions: [],
  }
}

export function createProfile(now = Date.now()) {
  const createdAt = nowIso(now)
  return {
    version: PROFILE_VERSION,
    learnerId: globalThis.crypto?.randomUUID?.() || `local-${now}`,
    createdAt,
    updatedAt: createdAt,
    skills: Object.fromEntries(SKILL_IDS.map((id) => [id, newSkill(id)])),
    sessions: [],
    insights: [],
  }
}

export function migrateLegacyProfile(legacy, now = Date.now()) {
  const profile = createProfile(now)
  if (!legacy || typeof legacy !== 'object') return profile
  if (legacy.version === 2 && legacy.skills) {
    profile.learnerId = typeof legacy.learnerId === 'string' ? legacy.learnerId : profile.learnerId
    profile.createdAt = legacy.createdAt || profile.createdAt
    profile.updatedAt = legacy.updatedAt || profile.updatedAt
    profile.sessions = Array.isArray(legacy.sessions) ? legacy.sessions.slice(0, MAX_SESSIONS) : []
    for (const id of SKILL_IDS) profile.skills[id] = { ...newSkill(id), ...(legacy.skills[id] || {}), misconceptions: [] }
    return profile
  }
  for (const [label, countValue] of Object.entries(legacy.patterns || {})) {
    const id = normalizeLegacyLabel(label)
    const count = Math.max(0, Number(countValue) || 0)
    profile.skills[id].attempts += count
    profile.skills[id].mastery = Math.min(40, profile.skills[id].mastery + count * 4)
  }
  profile.sessions = Array.from({ length: Math.min(Number(legacy.sessions) || 0, 10) }, (_, index) => ({
    id: `legacy-${index + 1}`,
    completedAt: profile.createdAt,
    source: 'migrated',
  }))
  return profile
}

export function validateProfile(value) {
  if (!value || value.version !== PROFILE_VERSION || typeof value.learnerId !== 'string' || !value.skills || !Array.isArray(value.sessions)) return false
  return Array.isArray(value.insights) && SKILL_IDS.every((id) => value.skills[id] && typeof value.skills[id].mastery === 'number' && Array.isArray(value.skills[id].misconceptions))
}

function memoryFor(skillId) {
  return MISCONCEPTION_LIBRARY[skillId] || MISCONCEPTION_LIBRARY.word_order
}

function countPhrase(count) {
  if (count === 1) return 'once'
  if (count === 2) return 'twice'
  return `${count} times`
}

function addEvidence(memory, evidence, now) {
  memory.evidence.unshift({ ...evidence, at: nowIso(now) })
  memory.evidence = memory.evidence.slice(0, MAX_MEMORY_EVIDENCE)
}

export function observeMisconception(profile, observation, now = Date.now()) {
  const next = structuredClone(profile)
  const skill = next.skills[observation.skillId]
  if (!skill) throw new Error(`Unknown skill: ${observation.skillId}`)
  const definition = memoryFor(observation.skillId)
  let memory = skill.misconceptions.find((item) => item.id === `${observation.skillId}-core`)
  if (!memory) {
    memory = { id: `${observation.skillId}-core`, description: definition.description, occurrences: 0, resolutions: 0, lastObserved: null, lastResolved: null, evidence: [] }
    skill.misconceptions.push(memory)
  }
  memory.occurrences += 1
  memory.lastObserved = nowIso(now)
  addEvidence(memory, { phase: observation.phase || 'diagnosis', learnerText: String(observation.learnerText || '').slice(0, 180) }, now)
  next.updatedAt = nowIso(now)
  return next
}

function resolveMisconception(profile, assessment, now) {
  if (!assessment.correct || assessment.phase !== 'transfer' || Number(assessment.hintLevel) !== 0) return null
  const skill = profile.skills[assessment.skillId]
  const memory = skill.misconceptions.find((item) => item.id === `${assessment.skillId}-core` && item.occurrences > 0)
  if (!memory) return null
  memory.resolutions += 1
  memory.lastResolved = nowIso(now)
  const definition = memoryFor(assessment.skillId)
  const message = `You previously ${memory.description} ${countPhrase(memory.occurrences)}. Today you ${definition.success} independently.`
  profile.insights.unshift({ id: `insight-${now}-${assessment.skillId}-${memory.resolutions}`, skillId: assessment.skillId, message, createdAt: nowIso(now) })
  profile.insights = profile.insights.slice(0, MAX_INSIGHTS)
  return message
}

function masteryDelta({ correct, phase, hintLevel }) {
  if (!correct) return -3
  if (phase === 'transfer') return hintLevel === 0 ? 15 : hintLevel === 1 ? 8 : 4
  return hintLevel === 0 ? 10 : hintLevel === 1 ? 6 : 3
}

function reviewDelayDays(mastery) {
  if (mastery >= 75) return 7
  if (mastery >= 45) return 3
  return 1
}

export function applyAssessment(profile, assessment, now = Date.now()) {
  let next = structuredClone(profile)
  let skill = next.skills[assessment.skillId]
  if (!skill) throw new Error(`Unknown skill: ${assessment.skillId}`)

  const before = skill.mastery
  const hintLevel = Math.max(0, Math.min(2, Number(assessment.hintLevel) || 0))
  skill.attempts += 1
  if (assessment.correct) {
    skill.streak += 1
    if (hintLevel === 0) skill.independentCorrect += 1
    else skill.hintedCorrect += 1
    if (assessment.phase === 'transfer') skill.transferCorrect += 1
  } else {
    skill.streak = 0
    next = observeMisconception(next, { skillId: assessment.skillId, phase: assessment.phase, learnerText: assessment.learnerAnswer }, now)
    skill = next.skills[assessment.skillId]
  }

  skill.mastery = Math.max(0, Math.min(100, before + masteryDelta({ ...assessment, hintLevel })))
  skill.mastered = skill.mastery >= 75 && skill.transferCorrect > 0
  skill.lastPracticed = nowIso(now)
  const reviewAt = new Date(now)
  reviewAt.setUTCDate(reviewAt.getUTCDate() + reviewDelayDays(skill.mastery))
  skill.nextReview = reviewAt.toISOString()
  next.updatedAt = nowIso(now)
  const insight = resolveMisconception(next, { ...assessment, hintLevel }, now)

  return { profile: next, before, after: next.skills[assessment.skillId].mastery, delta: next.skills[assessment.skillId].mastery - before, insight }
}

export function addSession(profile, session, now = Date.now()) {
  const next = structuredClone(profile)
  next.sessions.unshift({ ...session, completedAt: nowIso(now) })
  next.sessions = next.sessions.slice(0, MAX_SESSIONS)
  next.updatedAt = nowIso(now)
  return next
}

export function profileSummary(profile) {
  return SKILL_IDS.map((id) => ({
    id,
    mastery: profile.skills[id].mastery,
    attempts: profile.skills[id].attempts,
    memories: profile.skills[id].misconceptions.map((memory) => ({ description: memory.description, occurrences: memory.occurrences, resolutions: memory.resolutions })).slice(0, 2),
  }))
}

export function latestInsight(profile, skillId) {
  return profile.insights.find((insight) => !skillId || insight.skillId === skillId) || null
}

export function skillsInFocus(profile, limit = 4) {
  return Object.values(profile.skills)
    .filter((skill) => skill.attempts > 0)
    .sort((a, b) => a.mastery - b.mastery || b.attempts - a.attempts)
    .slice(0, limit)
}
