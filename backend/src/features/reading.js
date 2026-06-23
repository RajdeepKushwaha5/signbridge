import { Router } from 'express'
import { generateStructuredJSON } from '../services/gemini.js'
import { SKILLS, SKILL_IDS } from '../domain/skills.js'
import { fallbackPassage, chunkSourceToPassage } from '../domain/readingFallbacks.js'

const router = Router()
const topics = new Set(['Animals', 'Space', 'Food', 'Sports', 'Weather', 'Friendship', 'The Ocean', 'Plants'])
const levels = {
  1: { name: 'Starter', hint: 'very short sentences and very common words' },
  2: { name: 'Early', hint: 'short simple sentences and everyday words' },
  3: { name: 'Growing', hint: 'some longer sentences and new vocabulary' },
  4: { name: 'Confident', hint: 'varied sentences and richer vocabulary' },
  5: { name: 'Advanced', hint: 'grade-level sentences and academic words' },
}

const system = `You are SignBridge's reading coach for Deaf and Hard-of-Hearing learners.
- Write visual, concrete, engaging passages at the requested level.
- Break the passage into short lines with one idea per line.
- Prefer concrete nouns and verbs. Avoid sound-dependent clues and unexplained idioms.
- Select exactly three key vocabulary words. Give a plain-language meaning and a visual or ASL-related concept cue. Do not claim a specific sign if uncertain.
- Write exactly three comprehension questions that test understanding. Give four options, one answer, and a short explanation.
- If a target grammar skill is provided, naturally write two or three sentences that clearly model that pattern, and make one comprehension question depend on understanding it. Never name grammar terms or mention the skill to the learner.
- Keep all language warm and clear.`

const schema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    level: { type: 'integer' },
    passage: { type: 'array', items: { type: 'string' } },
    keyVocab: {
      type: 'array',
      items: {
        type: 'object',
        properties: { word: { type: 'string' }, meaning: { type: 'string' }, aslTip: { type: 'string' } },
        required: ['word', 'meaning', 'aslTip'],
      },
    },
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          options: { type: 'array', items: { type: 'string' } },
          answerIndex: { type: 'integer' },
          explanation: { type: 'string' },
        },
        required: ['question', 'options', 'answerIndex', 'explanation'],
      },
    },
  },
  required: ['title', 'level', 'passage', 'keyVocab', 'questions'],
}

// Pick the learner's weakest practiced skill so reading reinforces what the
// writing studio is already working on — the same learner model drives both
// features, which is what makes SignBridge one adaptive agent rather than two tools.
function weakestSkill(profile) {
  if (!Array.isArray(profile)) return null
  const practiced = profile
    .filter((item) => item && SKILL_IDS.includes(item.id) && Number(item.attempts) > 0)
    .sort((a, b) => (Number(a.mastery) || 0) - (Number(b.mastery) || 0))
  return practiced[0]?.id || null
}

router.post('/passage', async (request, response, next) => {
  try {
    const level = Number(request.body.level)
    const topic = request.body.topic
    if (!Number.isInteger(level) || !levels[level] || !topics.has(topic)) {
      return response.status(400).json({ error: 'Choose a supported topic and a reading level from 1 to 5.' })
    }

    const profile = Array.isArray(request.body.profile) ? request.body.profile.slice(0, 8) : []
    const focusId = weakestSkill(profile)
    const skillFocus = focusId ? { id: focusId, label: SKILLS[focusId].label } : null

    const metadata = levels[level]
    const focusInstruction = skillFocus
      ? ` The learner is currently building the grammar skill "${SKILLS[focusId].label}" (${SKILLS[focusId].rule}). Weave this pattern naturally into the passage and target one comprehension question at it, without naming the skill.`
      : ''

    try {
      const result = await generateStructuredJSON({
        system,
        user: `Write a passage about ${JSON.stringify(topic)} at Level ${level} (${metadata.name}: ${metadata.hint}). Use 4-7 lines for Levels 1-2 and up to 9 lines for higher levels.${focusInstruction}`,
        schema,
        temperature: 0.7,
      })
      return response.json({ ...result, mode: 'live', skillFocus })
    } catch (modelError) {
      // Rate limit or outage: serve a reviewed passage so the learner never sees an error.
      console.error(`Reading passage fallback: ${modelError.message}`)
      return response.json(fallbackPassage(topic, level, skillFocus))
    }
  } catch (error) {
    return next(error)
  }
})

const adaptSystem = `You are SignBridge's reading coach for Deaf and Hard-of-Hearing learners. A teacher gives you SOURCE TEXT from a real classroom.
- Adapt the source into a SHORT passage at the requested reading level, preserving its core meaning. Do not invent facts that are not in the source.
- Break the passage into short lines, one idea per line.
- Prefer concrete, visual language. Avoid sound-dependent clues and unexplained idioms.
- Select exactly three key vocabulary words drawn from the source, each with a plain-language meaning and a visual or ASL-related concept cue. Do not claim a specific sign if uncertain.
- Write exactly three comprehension questions about the adapted passage, each with four options, one answer, and a short explanation.
- If a target grammar skill is provided, weave that pattern into the passage and target one question at it, without naming the skill.
- Keep all language warm and clear.`

router.post('/from-text', async (request, response, next) => {
  try {
    const level = Number(request.body.level)
    const sourceText = typeof request.body.sourceText === 'string' ? request.body.sourceText.trim() : ''
    if (!Number.isInteger(level) || !levels[level]) {
      return response.status(400).json({ error: 'Choose a reading level from 1 to 5.' })
    }
    if (sourceText.length < 20 || sourceText.length > 8000) {
      return response.status(400).json({ error: 'Paste between 20 and 8000 characters of text.' })
    }

    const profile = Array.isArray(request.body.profile) ? request.body.profile.slice(0, 8) : []
    const focusId = weakestSkill(profile)
    const skillFocus = focusId ? { id: focusId, label: SKILLS[focusId].label } : null
    const metadata = levels[level]
    const focusInstruction = skillFocus
      ? ` The learner is currently building the grammar skill "${SKILLS[focusId].label}" (${SKILLS[focusId].rule}). Weave this pattern into the passage and target one comprehension question at it, without naming the skill.`
      : ''

    try {
      const result = await generateStructuredJSON({
        system: adaptSystem,
        user: `Reading level ${level} (${metadata.name}: ${metadata.hint}). Adapt the following source text into a passage.${focusInstruction}\n\nSOURCE TEXT:\n${sourceText}`,
        schema,
        temperature: 0.4,
      })
      return response.json({ ...result, mode: 'live', source: 'byoc', skillFocus })
    } catch (modelError) {
      console.error(`From-text fallback: ${modelError.message}`)
      return response.json(chunkSourceToPassage(sourceText, level, skillFocus))
    }
  } catch (error) {
    return next(error)
  }
})

export default router
