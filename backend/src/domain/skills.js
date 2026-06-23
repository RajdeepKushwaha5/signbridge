export const SKILLS = {
  articles: { label: 'Articles', rule: 'English often puts a, an, or the before a noun.' },
  tense: { label: 'Verb tense', rule: 'English changes the verb to show when something happened.' },
  agreement: { label: 'Subject-verb agreement', rule: 'The subject and verb must match in English.' },
  copula: { label: 'The verb “to be”', rule: 'English uses am, is, or are to connect a person or thing with a description.' },
  plurals: { label: 'Plural marking', rule: 'English usually adds -s or -es when there is more than one.' },
  prepositions: { label: 'Prepositions', rule: 'English uses words such as to, at, in, and on to connect ideas.' },
  topic_comment: { label: 'Topic-comment transfer', rule: 'English usually places the subject before the verb and object.' },
  word_order: { label: 'English word order', rule: 'A common English pattern is subject, verb, then object.' },
}

export const SKILL_IDS = Object.keys(SKILLS)

const aliases = {
  article: 'articles',
  'missing article': 'articles',
  tense: 'tense',
  'verb tense': 'tense',
  agreement: 'agreement',
  'subject-verb agreement': 'agreement',
  copula: 'copula',
  'missing copula': 'copula',
  'to be': 'copula',
  plural: 'plurals',
  plurals: 'plurals',
  preposition: 'prepositions',
  prepositions: 'prepositions',
  'topic-comment': 'topic_comment',
  'topic comment': 'topic_comment',
  'word order': 'word_order',
}

export function normalizeSkillId(value, fallback = 'word_order') {
  if (typeof value !== 'string') return fallback
  const normalized = value.trim().toLowerCase().replace(/_/g, ' ')
  if (SKILL_IDS.includes(value)) return value
  return aliases[normalized] || fallback
}
