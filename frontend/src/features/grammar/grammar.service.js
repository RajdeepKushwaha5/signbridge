import { postJSON } from '../../shared/api/client.js'
import { fallbackDiagnosis, fallbackEvaluation } from './offlineFallbacks.js'

function canUseOfflineFallback(error) {
  return /unavailable|too long|failed with status 5|failed with status 429/i.test(error.message)
}

export function createGrammarService(request = postJSON) {
  return {
    async bridgeSentence(sentence, profile = []) {
      try {
        return await request('/api/grammar/bridge', { sentence, profile })
      } catch (error) {
        if (!canUseOfflineFallback(error)) throw error
        return fallbackDiagnosis(sentence)
      }
    },
    async checkPractice(payload) {
      try {
        return await request('/api/grammar/practice/check', payload)
      } catch (error) {
        if (!canUseOfflineFallback(error)) throw error
        return fallbackEvaluation({ learnerAnswer: payload.learnerAnswer, practice: payload.practice, attempt: payload.attempt })
      }
    },
  }
}

export const { bridgeSentence, checkPractice } = createGrammarService()
