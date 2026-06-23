import { SKILLS } from './skills.js'

const EXERCISES = {
  articles: {
    guided: { prompt: 'Rewrite this in clear English: “Book is on table.”', referenceAnswer: 'The book is on the table.', hints: ['Look for the two specific nouns.', 'Add “the” before book and table.'] },
    transfer: { prompt: 'Rewrite this in clear English: “Dog waits by door.”', referenceAnswer: 'The dog waits by the door.', hints: ['Both nouns name specific things.', 'Add the same article before dog and door.'] },
  },
  tense: {
    guided: { prompt: 'Rewrite this in clear English: “Yesterday I walk home.”', referenceAnswer: 'Yesterday I walked home.', hints: ['The time word tells you this already happened.', 'Change walk to its past-tense form.'] },
    transfer: { prompt: 'Rewrite this in clear English: “Last night we watch a movie.”', referenceAnswer: 'Last night we watched a movie.', hints: ['Last night means the action is finished.', 'Change watch to its past-tense form.'] },
  },
  agreement: {
    guided: { prompt: 'Rewrite this in clear English: “My brother like coffee.”', referenceAnswer: 'My brother likes coffee.', hints: ['The subject is one person.', 'With he, she, or one person, the present-tense verb often ends in -s.'] },
    transfer: { prompt: 'Rewrite this in clear English: “She play basketball.”', referenceAnswer: 'She plays basketball.', hints: ['The subject is she.', 'Add -s to the present-tense verb.'] },
  },
  copula: {
    guided: { prompt: 'Rewrite this in clear English: “She happy today.”', referenceAnswer: 'She is happy today.', hints: ['English needs a connecting verb before the description.', 'Put “is” between she and happy.'] },
    transfer: { prompt: 'Rewrite this in clear English: “They ready now.”', referenceAnswer: 'They are ready now.', hints: ['English needs a connecting verb before ready.', 'Use “are” with they.'] },
  },
  plurals: {
    guided: { prompt: 'Rewrite this in clear English: “I have three cat.”', referenceAnswer: 'I have three cats.', hints: ['Three means there is more than one.', 'Mark cat as plural with -s.'] },
    transfer: { prompt: 'Rewrite this in clear English: “We saw two bird.”', referenceAnswer: 'We saw two birds.', hints: ['Two means the noun is plural.', 'Add -s to bird.'] },
  },
  prepositions: {
    guided: { prompt: 'Rewrite this in clear English: “I go school every day.”', referenceAnswer: 'I go to school every day.', hints: ['English needs a connecting word before the destination.', 'Put “to” before school.'] },
    transfer: { prompt: 'Rewrite this in clear English: “She arrived station early.”', referenceAnswer: 'She arrived at the station early.', hints: ['English uses a location connector after arrived.', 'Use “at the” before station.'] },
  },
  topic_comment: {
    guided: { prompt: 'Rewrite this in common English order: “That book, I finished yesterday.”', referenceAnswer: 'I finished that book yesterday.', hints: ['Begin with the person doing the action.', 'Use the order: I + finished + that book.'] },
    transfer: { prompt: 'Rewrite this in common English order: “The red bike, Maya wants.”', referenceAnswer: 'Maya wants the red bike.', hints: ['Begin with Maya.', 'Use subject + verb + object.'] },
  },
  word_order: {
    guided: { prompt: 'Rewrite this in clear English: “Store I go tomorrow.”', referenceAnswer: 'I will go to the store tomorrow.', hints: ['Begin with the person doing the action.', 'Use: I + will go + to the store + tomorrow.'] },
    transfer: { prompt: 'Rewrite this in clear English: “Homework she finish later.”', referenceAnswer: 'She will finish her homework later.', hints: ['Begin with she.', 'Use subject + future verb + object + time.'] },
  },
}

function practice(skillId, phase) {
  const item = EXERCISES[skillId]?.[phase] || EXERCISES.word_order[phase]
  return { id: `${skillId}-${phase}-fallback`, skillId, phase, instruction: 'Rewrite the sentence in clear written English.', ...item }
}

const REVIEWED_BRIDGES = {
  'store i go yesterday': {
    cards: [
      ['place', 'PLACE', 'Store', 'to the store', true, 'Written English marks the destination with “to the”.'],
      ['person', 'PERSON', 'I', 'I', false, 'The person doing the action becomes the subject.'],
      ['action', 'ACTION', 'go', 'went', true, 'Yesterday changes go to the past-tense form went.'],
      ['time', 'TIME', 'yesterday', 'yesterday', false, 'The time idea stays visible.'],
    ],
    learnerOrder: ['place', 'person', 'action', 'time'], englishOrder: ['person', 'action', 'place', 'time'],
    summary: 'The destination moves after the action, and the time idea changes the verb form.',
  },
  'she happy because test finish': {
    cards: [
      ['person', 'PERSON', 'She', 'She', false, 'The person remains first.'],
      ['state', 'ACTION', 'happy', 'is happy', true, 'Written English uses “is” before a description.'],
      ['reason', 'TOPIC', 'because', 'because', false, 'The reason connector stays in place.'],
      ['object', 'OBJECT', 'test', 'the test', true, 'Written English marks this specific test with “the”.'],
      ['action', 'ACTION', 'finish', 'is finished', true, 'The completed test needs a linking verb and finished form.'],
    ],
    learnerOrder: ['person', 'state', 'reason', 'object', 'action'], englishOrder: ['person', 'state', 'reason', 'object', 'action'],
    summary: 'The concept order is already clear; written English adds small grammar markers inside the cards.',
  },
  'my brother not like coffee': {
    cards: [
      ['person', 'PERSON', 'My brother', 'My brother', false, 'The person remains the subject.'],
      ['action', 'ACTION', 'not like', 'does not like', true, 'Written English uses “does not” with one person.'],
      ['object', 'OBJECT', 'coffee', 'coffee', false, 'The object remains after the action.'],
    ],
    learnerOrder: ['person', 'action', 'object'], englishOrder: ['person', 'action', 'object'],
    summary: 'The meaning order stays the same while the action card gains “does”.',
  },
  'tomorrow i will going to school': {
    cards: [
      ['time', 'TIME', 'Tomorrow', 'Tomorrow', false, 'The future time stays visible.'],
      ['person', 'PERSON', 'I', 'I', false, 'The person remains the subject.'],
      ['action', 'ACTION', 'will going', 'will go', true, 'After will, written English uses the base verb go.'],
      ['place', 'PLACE', 'to school', 'to school', false, 'The destination remains after the action.'],
    ],
    learnerOrder: ['time', 'person', 'action', 'place'], englishOrder: ['time', 'person', 'action', 'place'],
    summary: 'The structure is clear; the future action changes from “will going” to “will go”.',
  },
  'book on table is mine': {
    cards: [
      ['object', 'OBJECT', 'Book', 'The book', true, 'Written English marks the specific book with “the”.'],
      ['place', 'PLACE', 'on table', 'on the table', true, 'The specific table also takes “the”.'],
      ['action', 'ACTION', 'is', 'is', false, 'The linking action stays the same.'],
      ['topic', 'TOPIC', 'mine', 'mine', false, 'The ownership idea stays at the end.'],
    ],
    learnerOrder: ['object', 'place', 'action', 'topic'], englishOrder: ['object', 'place', 'action', 'topic'],
    summary: 'The concept order stays stable while written English adds articles to specific nouns.',
  },
  'i have three cat at home': {
    cards: [
      ['person', 'PERSON', 'I', 'I', false, 'The person remains the subject.'],
      ['action', 'ACTION', 'have', 'have', false, 'The action stays in place.'],
      ['object', 'OBJECT', 'three cat', 'three cats', true, 'Three means the noun needs the plural marker -s.'],
      ['place', 'PLACE', 'at home', 'at home', false, 'The place stays at the end.'],
    ],
    learnerOrder: ['person', 'action', 'object', 'place'], englishOrder: ['person', 'action', 'object', 'place'],
    summary: 'The order is clear; the object card changes to show more than one cat.',
  },
}

function conceptBridge(sentence, corrected) {
  const reviewed = REVIEWED_BRIDGES[normalizeAnswer(sentence)]
  if (reviewed) return { ...reviewed, cards: reviewed.cards.map(([id, role, learnerText, englishText, changed, explanation]) => ({ id, role, learnerText, englishText, changed, explanation })) }
  return {
    cards: [{ id: 'topic', role: 'TOPIC', learnerText: sentence, englishText: corrected, changed: normalizeAnswer(sentence) !== normalizeAnswer(corrected), explanation: 'The agent preserved the full idea while making the written-English pattern visible.' }],
    learnerOrder: ['topic'], englishOrder: ['topic'],
    summary: 'This idea stays together as one concept card because splitting it further could change the learner’s meaning.',
  }
}

export function detectFallbackSkill(sentence) {
  const raw = sentence.toLowerCase()
  const text = normalizeAnswer(sentence)

  if (/,/.test(raw) || /^(that|the|homework|my new)\b.*\b(i|maya|she|we)\b/.test(text)) return 'topic_comment'
  if (/^(store|every morning|after school|new phone|quickly)\b/.test(text)) return 'word_order'
  if (/\b(yesterday|last night|last week|tomorrow|next week|two days ago)\b/.test(text)) return 'tense'
  if (/\b(she|he|it|they|we|i|brother|sister|room|the room)\s+(happy|ready|tired|sad|excited|cold|very cold)\b/.test(text)) return 'copula'
  if (/\b(two|three|four|five|many)\s+(cat|dog|bird|book|notebook|student|car)\b/.test(text)) return 'plurals'
  if (/\b(go|went|arrive|arrived|are|met|walked)\s+(school|store|station|home|table|library)\b/.test(text)) return 'prepositions'
  if (/\b(she|he|brother|sister|student|maya)\s+(like|play|want|need|study)\b/.test(text)) return 'agreement'
  if (/\b(book|dog|cat|pencil|assignment|sun|cloud|teacher)\b.*\b(is|waits|sits|put|gave|behind|on|in|by)\b/.test(text)) return 'articles'
  return 'word_order'
}

export function fallbackDiagnosis(sentence, preferredSkillId) {
  const skillId = preferredSkillId || detectFallbackSkill(sentence)
  const skill = SKILLS[skillId]
  const knownCorrections = {
    'store i go yesterday': 'I went to the store yesterday.',
    'she happy because test finish': 'She is happy because the test is finished.',
    'my brother not like coffee': 'My brother does not like coffee.',
    'tomorrow i will going to school': 'Tomorrow I will go to school.',
    'book on table is mine': 'The book on the table is mine.',
    'i have three cat at home': 'I have three cats at home.',
  }
  const correctionKey = normalizeAnswer(sentence)
  const corrected = knownCorrections[correctionKey] || sentence
  return {
    mode: 'fallback',
    corrected,
    meaningPreserved: true,
    confidence: 0.62,
    hasErrors: true,
    errors: [{ skillId, label: skill.label, explanation: 'This sentence may use a different pattern from common written English.', tip: skill.rule }],
    focusSkill: { id: skillId, label: skill.label },
    decisionReason: `This pattern is the clearest next skill to practice from the sentence and learner profile.`,
    conceptBridge: conceptBridge(sentence, corrected),
    lesson: { title: skill.label, explanation: skill.rule, rule: skill.rule },
    guidedPractice: practice(skillId, 'guided'),
    transferPractice: practice(skillId, 'transfer'),
    encouragement: 'Your meaning matters. Let’s practice one small bridge at a time.',
  }
}

export function normalizeAnswer(value) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
}

export function fallbackEvaluation({ learnerAnswer, practice: item, attempt }) {
  const correct = normalizeAnswer(learnerAnswer) === normalizeAnswer(item.referenceAnswer)
  const exhausted = attempt >= 3
  return {
    mode: 'fallback',
    correct,
    status: correct ? 'correct' : exhausted ? 'needs_support' : 'retry',
    feedback: correct ? 'You used the target pattern clearly.' : exhausted ? 'This one needs more support. Compare your answer with the model.' : 'Your meaning is clear. Check the target pattern and try once more.',
    hint: !correct && attempt <= 2 ? item.hints[attempt - 1] : null,
    modelAnswer: !correct && exhausted ? item.referenceAnswer : null,
    shouldAdvance: correct || exhausted,
  }
}
