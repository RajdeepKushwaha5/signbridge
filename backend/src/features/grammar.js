import { Router } from 'express'
import { generateStructuredJSON } from '../services/gemini.js'
import { fallbackDiagnosis, fallbackEvaluation, normalizeAnswer } from '../domain/fallbacks.js'
import { SKILLS, SKILL_IDS, normalizeSkillId } from '../domain/skills.js'
import { validateDiagnosis, validatePracticeRequest } from '../domain/validation.js'

const router = Router()

const diagnosisSystem = `You are SignBridge, an adaptive writing tutor for ASL-using learners ages 12–18 who are developing written English.

PEDAGOGY AND SAFETY:
- Preserve the learner's intended meaning. If meaning is ambiguous, state uncertainty instead of inventing details.
- A sentence may show language transfer from ASL, but never assume every learner or error comes from ASL.
- Diagnose only these skill IDs: ${SKILL_IDS.join(', ')}.
- Select exactly one focus skill that offers the highest-value next step.
- Explain the choice in learner-friendly language and teach one reusable rule without shame.
- Create one guided rewrite and one different, unseen transfer rewrite for the same skill.
- Build a visual concept bridge. Segment the learner's meaning into reusable semantic cards using only TIME, TOPIC, PERSON, ACTION, OBJECT, or PLACE. Each card needs the learner's wording and the written-English wording. Return the card IDs in the learner's original order and in clear written-English order. Keep the same IDs in both orders.
- The visual bridge is a contrastive language-learning aid, not a claim that there is one universal ASL word order.
- Each practice item needs two graduated hints: first a rule reminder, then a sentence scaffold.
- Keep examples age-appropriate, concrete, and unrelated to sound.`

const practiceProperties = {
  id: { type: 'string' },
  skillId: { type: 'string', enum: SKILL_IDS },
  phase: { type: 'string' },
  instruction: { type: 'string' },
  prompt: { type: 'string' },
  referenceAnswer: { type: 'string' },
  hints: { type: 'array', items: { type: 'string' } },
}

const diagnosisSchema = {
  type: 'object',
  properties: {
    corrected: { type: 'string' },
    meaningPreserved: { type: 'boolean' },
    confidence: { type: 'number' },
    hasErrors: { type: 'boolean' },
    errors: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          skillId: { type: 'string', enum: SKILL_IDS },
          label: { type: 'string' },
          explanation: { type: 'string' },
          tip: { type: 'string' },
        },
        required: ['skillId', 'label', 'explanation', 'tip'],
      },
    },
    focusSkill: {
      type: 'object',
      properties: { id: { type: 'string', enum: SKILL_IDS }, label: { type: 'string' } },
      required: ['id', 'label'],
    },
    decisionReason: { type: 'string' },
    conceptBridge: {
      type: 'object',
      properties: {
        cards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              role: { type: 'string', enum: ['TIME', 'TOPIC', 'PERSON', 'ACTION', 'OBJECT', 'PLACE'] },
              learnerText: { type: 'string' },
              englishText: { type: 'string' },
              changed: { type: 'boolean' },
              explanation: { type: 'string' },
            },
            required: ['id', 'role', 'learnerText', 'englishText', 'changed', 'explanation'],
          },
        },
        learnerOrder: { type: 'array', items: { type: 'string' } },
        englishOrder: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
      },
      required: ['cards', 'learnerOrder', 'englishOrder', 'summary'],
    },
    lesson: {
      type: 'object',
      properties: { title: { type: 'string' }, explanation: { type: 'string' }, rule: { type: 'string' } },
      required: ['title', 'explanation', 'rule'],
    },
    guidedPractice: { type: 'object', properties: practiceProperties, required: Object.keys(practiceProperties) },
    transferPractice: { type: 'object', properties: practiceProperties, required: Object.keys(practiceProperties) },
    encouragement: { type: 'string' },
  },
  required: ['corrected', 'meaningPreserved', 'confidence', 'hasErrors', 'errors', 'focusSkill', 'decisionReason', 'conceptBridge', 'lesson', 'guidedPractice', 'transferPractice', 'encouragement'],
}

const evaluationSystem = `You evaluate one written-English rewrite by an ASL-using learner ages 12–18.
- Judge whether the answer preserves the prompt's meaning and correctly uses the target skill.
- Accept natural alternatives; do not require an exact match to the reference answer.
- Ignore harmless punctuation or capitalization differences.
- Return concise, respectful feedback. Do not teach unrelated skills.`

const evaluationSchema = {
  type: 'object',
  properties: {
    correct: { type: 'boolean' },
    feedback: { type: 'string' },
  },
  required: ['correct', 'feedback'],
}

function preferredSkill(profile) {
  if (!Array.isArray(profile)) return null
  const valid = profile
    .filter((item) => item && SKILL_IDS.includes(item.id))
    .sort((a, b) => (Number(a.mastery) || 0) - (Number(b.mastery) || 0))
  return valid[0]?.id || null
}

function memoryContext(profile) {
  const memories = profile.flatMap((item) => Array.isArray(item.memories)
    ? item.memories.slice(0, 2).map((memory) => `${item.id}: ${memory.description} (${memory.occurrences} observed, ${memory.resolutions} independently resolved)`)
    : [])
  return memories.length ? `Qualitative learning memory: ${memories.join('; ')}.` : 'No qualitative misconception memory is available yet.'
}

router.post('/bridge', async (request, response) => {
  const sentence = typeof request.body.sentence === 'string' ? request.body.sentence.trim() : ''
  const profile = Array.isArray(request.body.profile) ? request.body.profile.slice(0, 8) : []
  if (!sentence || sentence.length > 400) return response.status(400).json({ error: 'Sentence must contain between 1 and 400 characters.' })

  const preferred = preferredSkill(profile)
  const profileContext = profile.length
    ? `Learner mastery profile: ${profile.map((item) => `${item.id}: ${Number(item.mastery) || 0}%`).join(', ')}. ${memoryContext(profile)}`
    : 'No prior mastery profile is available.'

  try {
    const raw = await generateStructuredJSON({
      system: diagnosisSystem,
      user: `Learner sentence: ${JSON.stringify(sentence)}\n${profileContext}${preferred ? `\nGive extra consideration to ${preferred}, but focus on it only if the sentence supports it.` : ''}`,
      schema: diagnosisSchema,
      temperature: 0.25,
    })
    const result = validateDiagnosis(raw)
    return response.json({ ...result, mode: 'live' })
  } catch (error) {
    console.error(`Grammar diagnosis fallback: ${error.message}`)
    return response.json(fallbackDiagnosis(sentence))
  }
})

router.post('/practice/check', async (request, response) => {
  const input = validatePracticeRequest(request.body)
  if (input.error) return response.status(400).json({ error: input.error })

  const { phase, attempt, learnerAnswer, practice, skillId } = input
  const exact = normalizeAnswer(learnerAnswer) === normalizeAnswer(practice.referenceAnswer)
  let judgment = exact ? { correct: true, feedback: 'You used the target pattern clearly and preserved the meaning.' } : null
  let mode = exact ? 'deterministic' : 'live'

  if (!judgment) {
    try {
      judgment = await generateStructuredJSON({
        system: evaluationSystem,
        user: `Target skill: ${skillId} (${SKILLS[skillId].label})\nPhase: ${phase}\nPrompt: ${practice.prompt}\nReference answer: ${practice.referenceAnswer}\nLearner answer: ${learnerAnswer}`,
        schema: evaluationSchema,
        temperature: 0.1,
      })
      if (typeof judgment.correct !== 'boolean' || typeof judgment.feedback !== 'string') throw new Error('Invalid evaluation response.')
    } catch (error) {
      console.error(`Practice evaluation fallback: ${error.message}`)
      judgment = fallbackEvaluation({ learnerAnswer, practice, attempt })
      mode = 'fallback'
    }
  }

  if (mode === 'fallback') return response.json(judgment)

  const exhausted = attempt >= 3
  return response.json({
    mode,
    correct: judgment.correct,
    status: judgment.correct ? 'correct' : exhausted ? 'needs_support' : 'retry',
    feedback: judgment.feedback,
    hint: !judgment.correct && attempt <= 2 ? practice.hints[attempt - 1] : null,
    modelAnswer: !judgment.correct && exhausted ? practice.referenceAnswer : null,
    shouldAdvance: judgment.correct || exhausted,
  })
})

export default router
