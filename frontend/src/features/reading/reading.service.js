import { postJSON } from '../../shared/api/client.js'
import { SKILLS } from '../grammar/skills.js'
import { fallbackPassage } from './offlinePassages.js'

export const LEVELS = [
  { n: 1, name: 'Starter', hint: 'very short sentences, the 500 most common words' },
  { n: 2, name: 'Early', hint: 'short simple sentences, everyday words' },
  { n: 3, name: 'Growing', hint: 'a few longer sentences, some new vocabulary' },
  { n: 4, name: 'Confident', hint: 'varied sentences, richer vocabulary' },
  { n: 5, name: 'Advanced', hint: 'grade-level sentences and academic words' },
]

export const TOPICS = ['Animals', 'Space', 'Food', 'Sports', 'Weather', 'Friendship', 'The Ocean', 'Plants']

function offlineSkillFocus(profile) {
  const focus = [...profile].filter((item) => SKILLS[item.id]).sort((a, b) => a.mastery - b.mastery)[0]
  return focus ? { id: focus.id, label: SKILLS[focus.id].label } : null
}

function isRecoverable(error) {
  return /unavailable|too long|failed with status 5|failed with status 429/i.test(error.message)
}

// Client-side chunker mirrors the backend fallback so "bring your own content"
// still shows the teacher's text when the backend is unreachable.
function chunkSource(sourceText, level) {
  const clean = String(sourceText || '').replace(/\s+/g, ' ').trim()
  const sentences = clean.split(/(?<=[.!?])\s+/).filter(Boolean)
  const lines = (sentences.length ? sentences : [clean]).slice(0, level <= 2 ? 6 : 10)
  return { mode: 'fallback', source: 'byoc', level: Number(level) || 2, title: clean.split(' ').slice(0, 5).join(' ') || 'Your reading', passage: lines, keyVocab: [], questions: [], skillFocus: null }
}

export function createReadingService(request = postJSON) {
  return {
    async generatePassage(level, topic, profile = []) {
      try {
        return await request('/api/reading/passage', { level, topic, profile })
      } catch (error) {
        if (!isRecoverable(error)) throw error
        return fallbackPassage(topic, level, offlineSkillFocus(profile))
      }
    },
    async generateFromText(level, sourceText, profile = []) {
      try {
        return await request('/api/reading/from-text', { level, sourceText, profile })
      } catch (error) {
        if (!isRecoverable(error)) throw error
        return chunkSource(sourceText, level)
      }
    },
  }
}

export const { generatePassage, generateFromText } = createReadingService()

export function signRefUrl(word) {
  return `https://www.signingsavvy.com/search/${encodeURIComponent(word)}`
}

// A free, key-less AI illustration for a passage (visual-first learning for Deaf
// readers). Deterministic seed -> the same story always gets the same picture,
// so it caches and can be pre-warmed before a demo.
export function passageImageUrl(title) {
  const safeTitle = String(title || 'a story').slice(0, 80)
  const prompt = `soft colorful children's storybook illustration of ${safeTitle}, friendly cartoon, wholesome, for young readers, no text, no words`
  const seed = Math.abs([...safeTitle].reduce((hash, character) => (hash * 31 + character.charCodeAt(0)) | 0, 7))
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=768&height=420&nologo=true&seed=${seed}`
}
