export const AGENT_ACTIONS = {
  another_scaffold: { id: 'another_scaffold', label: 'Another scaffold', description: 'Keep the same skill and reveal one more reusable cue.' },
  visual_explanation: { id: 'visual_explanation', label: 'Visual explanation', description: 'Return to the concept cards and make the language contrast visible.' },
  reading_reinforcement: { id: 'reading_reinforcement', label: 'Reading reinforcement', description: 'Meet the same pattern inside a short visual reading passage.' },
  unseen_transfer: { id: 'unseen_transfer', label: 'Unseen transfer', description: 'Test the skill with a different sentence and no copied answer.' },
  mastery_challenge: { id: 'mastery_challenge', label: 'Mastery challenge', description: 'Raise the challenge because independent performance is strong.' },
}

export function chooseNextAction(context) {
  if (context.phase === 'concept') {
    return AGENT_ACTIONS.visual_explanation
  }
  if (context.phase === 'guided') {
    if (!context.correct && !context.shouldAdvance) return AGENT_ACTIONS.another_scaffold
    if (!context.correct) return AGENT_ACTIONS.reading_reinforcement
    if (context.hintLevel === 0 && context.masteryAfter >= 75) return AGENT_ACTIONS.mastery_challenge
    return AGENT_ACTIONS.unseen_transfer
  }
  if (context.correct && context.hintLevel === 0 && context.masteryAfter >= 75) return AGENT_ACTIONS.mastery_challenge
  if (context.correct) return AGENT_ACTIONS.reading_reinforcement
  return AGENT_ACTIONS.visual_explanation
}

export function decisionEntry(action, detail, at = Date.now()) {
  return { id: `${action.id}-${at}`, actionId: action.id, label: action.label, detail, at }
}
