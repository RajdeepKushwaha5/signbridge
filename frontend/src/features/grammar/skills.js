export const SKILLS = {
  articles: { label: 'Articles', short: 'a / an / the', rule: 'English often puts a, an, or the before a noun.' },
  tense: { label: 'Verb tense', short: 'when it happened', rule: 'English changes the verb to show when something happened.' },
  agreement: { label: 'Subject-verb agreement', short: 'subject + verb match', rule: 'The subject and verb must match in English.' },
  copula: { label: 'The verb “to be”', short: 'am / is / are', rule: 'English uses am, is, or are to connect a person or thing with a description.' },
  plurals: { label: 'Plural marking', short: 'more than one', rule: 'English usually adds -s or -es when there is more than one.' },
  prepositions: { label: 'Prepositions', short: 'to / at / in / on', rule: 'English uses words such as to, at, in, and on to connect ideas.' },
  topic_comment: { label: 'Topic-comment transfer', short: 'topic to English order', rule: 'English usually places the subject before the verb and object.' },
  word_order: { label: 'English word order', short: 'subject + verb + object', rule: 'A common English pattern is subject, verb, then object.' },
}

export const SKILL_IDS = Object.keys(SKILLS)

export function normalizeLegacyLabel(label) {
  const text = String(label || '').toLowerCase()
  if (text.includes('article')) return 'articles'
  if (text.includes('tense')) return 'tense'
  if (text.includes('agreement')) return 'agreement'
  if (text.includes('copula') || text.includes('to be')) return 'copula'
  if (text.includes('plural')) return 'plurals'
  if (text.includes('preposition')) return 'prepositions'
  if (text.includes('topic')) return 'topic_comment'
  return 'word_order'
}
