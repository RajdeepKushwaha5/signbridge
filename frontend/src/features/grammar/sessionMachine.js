import { AGENT_ACTIONS, decisionEntry } from './agentPolicy.js'

export const SESSION_KEY = 'signbridge.activeGrammarSession.v2'

export const initialSession = {
  stage: 'input',
  sentence: '',
  diagnosis: null,
  concept: { order: [], attempts: 0, checked: false, correct: false, revealed: false },
  guided: { attempt: 1, answer: '', result: null, hintLevel: 0, assessment: null },
  transfer: { attempt: 1, answer: '', result: null, hintLevel: 0, assessment: null },
  startedAt: null,
  decisions: [],
  nextAction: null,
}

export function sessionReducer(state, action) {
  switch (action.type) {
    case 'DIAGNOSIS_READY': {
      const conceptBridge = action.diagnosis.conceptBridge || {
        cards: [{ id: 'topic', role: 'TOPIC', learnerText: action.sentence, englishText: action.diagnosis.corrected || action.sentence, changed: false, explanation: 'The complete idea stays together.' }],
        learnerOrder: ['topic'], englishOrder: ['topic'], summary: 'The complete idea is preserved.',
      }
      const diagnosis = { ...action.diagnosis, conceptBridge }
      return {
        ...initialSession,
        stage: 'diagnosis',
        sentence: action.sentence,
        diagnosis,
        concept: { ...initialSession.concept, order: [...conceptBridge.learnerOrder] },
        startedAt: action.startedAt || Date.now(),
        decisions: [
          decisionEntry({ id: 'observed', label: 'Observed the learner' }, `Separated the idea into ${conceptBridge.cards.length} visual concept roles.`),
          decisionEntry({ id: 'selected', label: 'Selected a focus skill' }, action.diagnosis.decisionReason),
        ],
      }
    }
    case 'SHOW_CONCEPT':
      return { ...state, stage: 'concept' }
    case 'MOVE_CONCEPT': {
      const order = [...state.concept.order]
      const from = order.indexOf(action.id)
      const to = from + action.direction
      if (from < 0 || to < 0 || to >= order.length) return state
      ;[order[from], order[to]] = [order[to], order[from]]
      return { ...state, concept: { ...state.concept, order, checked: false } }
    }
    case 'CHECK_CONCEPT': {
      const correct = state.concept.order.join('|') === state.diagnosis.conceptBridge.englishOrder.join('|')
      const attempts = state.concept.attempts + 1
      const nextAction = AGENT_ACTIONS.visual_explanation
      return {
        ...state,
        concept: { ...state.concept, attempts, checked: true, correct },
        nextAction,
        decisions: [...state.decisions, decisionEntry(nextAction, correct
          ? 'The learner rebuilt the written-English concept order independently.'
          : 'The card order shows that a visual contrast will help before sentence practice.')],
      }
    }
    case 'REVEAL_CONCEPT':
      return { ...state, concept: { ...state.concept, order: [...state.diagnosis.conceptBridge.englishOrder], checked: true, revealed: true } }
    case 'SHOW_LESSON':
      return { ...state, stage: 'lesson' }
    case 'START_GUIDED':
      return { ...state, stage: 'guided' }
    case 'SET_ANSWER':
      return { ...state, [action.phase]: { ...state[action.phase], answer: action.answer } }
    case 'PRACTICE_RESULT': {
      const current = state[action.phase]
      const hintLevel = action.result.correct ? current.hintLevel : Math.min(2, current.hintLevel + (action.result.hint ? 1 : 0))
      return {
        ...state,
        [action.phase]: { ...current, result: action.result, hintLevel, assessment: action.assessment || current.assessment },
        nextAction: action.nextAction || state.nextAction,
        decisions: action.nextAction ? [...state.decisions, decisionEntry(action.nextAction, action.decisionDetail || action.nextAction.description)] : state.decisions,
      }
    }
    case 'RETRY':
      return { ...state, [action.phase]: { ...state[action.phase], attempt: state[action.phase].attempt + 1, answer: '', result: null } }
    case 'START_TRANSFER':
      return { ...state, stage: 'transfer' }
    case 'SHOW_SUMMARY':
      return { ...state, stage: 'summary' }
    case 'RESET':
      return initialSession
    default:
      return state
  }
}

export function restoreSession() {
  try {
    const stored = JSON.parse(sessionStorage.getItem(SESSION_KEY))
    return stored?.stage ? stored : initialSession
  } catch {
    return initialSession
  }
}
