// Reviewed reading passages used when the live model is unavailable (rate limit
// or outage). This keeps Read & Decode working in a demo the same way the grammar
// agent already degrades gracefully — no learner ever sees an error.

const PASSAGES = {
  Animals: {
    title: 'The Red Fox',
    passage: ['A red fox lives in the woods.', 'The fox has a long tail.', 'It hunts at night.', 'In the day, it sleeps in a den.', 'The fox is quick and quiet.'],
    keyVocab: [
      { word: 'fox', meaning: 'a small wild animal with pointed ears and a bushy tail', aslTip: 'Picture the pointed ears on top of the head.' },
      { word: 'den', meaning: 'a safe home where an animal rests', aslTip: 'Imagine a cozy space hidden under the ground.' },
      { word: 'hunt', meaning: 'to look for food to catch', aslTip: 'Show eyes searching and hands reaching.' },
    ],
    questions: [
      { question: 'Where does the fox live?', options: ['In the woods', 'In a city', 'In the sea', 'On a farm'], answerIndex: 0, explanation: 'The first line says the fox lives in the woods.' },
      { question: 'When does the fox hunt?', options: ['At night', 'At noon', 'In the morning', 'Never'], answerIndex: 0, explanation: 'The passage says it hunts at night.' },
      { question: 'What is the fox like?', options: ['Quick and quiet', 'Slow and loud', 'Big and heavy', 'Tired and sick'], answerIndex: 0, explanation: 'The last line says the fox is quick and quiet.' },
    ],
  },
  Space: {
    title: 'The Bright Moon',
    passage: ['The moon is in the sky at night.', 'It looks round and bright.', 'The moon has no light of its own.', 'It shines with light from the sun.', 'People have walked on the moon.'],
    keyVocab: [
      { word: 'moon', meaning: 'the round object that shines in the night sky', aslTip: 'Trace a circle high above your head.' },
      { word: 'bright', meaning: 'giving a lot of light', aslTip: 'Open your hands wide like light spreading out.' },
      { word: 'shine', meaning: 'to give off light', aslTip: 'Show light coming from one place outward.' },
    ],
    questions: [
      { question: 'When do we see the moon?', options: ['At night', 'At lunch', 'In a cave', 'Underwater'], answerIndex: 0, explanation: 'The moon is in the sky at night.' },
      { question: 'Where does the moon get its light?', options: ['From the sun', 'From a lamp', 'From the sea', 'From itself'], answerIndex: 0, explanation: 'It shines with light from the sun.' },
      { question: 'What shape does the moon look like?', options: ['Round', 'Square', 'Flat', 'Long'], answerIndex: 0, explanation: 'It looks round and bright.' },
    ],
  },
  Food: {
    title: 'A Bowl of Soup',
    passage: ['Maya makes soup for dinner.', 'She cuts carrots and beans.', 'The soup cooks in a big pot.', 'It smells warm and good.', 'The family eats together.'],
    keyVocab: [
      { word: 'soup', meaning: 'a warm food you eat with a spoon', aslTip: 'Show a spoon moving from a bowl to your mouth.' },
      { word: 'pot', meaning: 'a deep round container for cooking', aslTip: 'Cup both hands like a wide round bowl.' },
      { word: 'cook', meaning: 'to make food ready with heat', aslTip: 'Show stirring over a warm stove.' },
    ],
    questions: [
      { question: 'What does Maya make?', options: ['Soup', 'Cake', 'Bread', 'Juice'], answerIndex: 0, explanation: 'Maya makes soup for dinner.' },
      { question: 'What does she cut?', options: ['Carrots and beans', 'Apples', 'Paper', 'Wood'], answerIndex: 0, explanation: 'She cuts carrots and beans.' },
      { question: 'Who eats the soup?', options: ['The family', 'A dog', 'No one', 'A teacher'], answerIndex: 0, explanation: 'The family eats together.' },
    ],
  },
  Sports: {
    title: 'The Big Game',
    passage: ['The team plays soccer today.', 'They run fast on the green field.', 'Sam kicks the ball hard.', 'The ball goes into the net.', 'The team wins the game.'],
    keyVocab: [
      { word: 'team', meaning: 'a group of people who play together', aslTip: 'Draw a circle to show people grouped together.' },
      { word: 'field', meaning: 'a wide open space for playing', aslTip: 'Sweep your hands flat and wide.' },
      { word: 'win', meaning: 'to come first in a game', aslTip: 'Raise a strong fist up high.' },
    ],
    questions: [
      { question: 'What sport does the team play?', options: ['Soccer', 'Swimming', 'Chess', 'Tennis'], answerIndex: 0, explanation: 'The team plays soccer today.' },
      { question: 'Where does the ball go?', options: ['Into the net', 'Over the wall', 'Into the sea', 'Under a car'], answerIndex: 0, explanation: 'The ball goes into the net.' },
      { question: 'How does the game end?', options: ['The team wins', 'The team loses', 'It rains', 'No one plays'], answerIndex: 0, explanation: 'The team wins the game.' },
    ],
  },
  Weather: {
    title: 'A Rainy Day',
    passage: ['Dark clouds fill the sky.', 'Soon the rain starts to fall.', 'Ben opens his blue umbrella.', 'He jumps over a puddle.', 'After the rain, the sun comes back.'],
    keyVocab: [
      { word: 'cloud', meaning: 'a white or gray shape in the sky that can bring rain', aslTip: 'Draw soft round shapes high in the air.' },
      { word: 'umbrella', meaning: 'a cover you hold to stay dry in the rain', aslTip: 'Mime opening one over your head.' },
      { word: 'puddle', meaning: 'a small pool of water on the ground', aslTip: 'Show a small flat circle of water below you.' },
    ],
    questions: [
      { question: 'What fills the sky first?', options: ['Dark clouds', 'Bright stars', 'Birds', 'Smoke'], answerIndex: 0, explanation: 'Dark clouds fill the sky.' },
      { question: 'What does Ben open?', options: ['His umbrella', 'A door', 'A book', 'A box'], answerIndex: 0, explanation: 'Ben opens his blue umbrella.' },
      { question: 'What happens after the rain?', options: ['The sun comes back', 'It snows', 'It is night', 'The wind stops'], answerIndex: 0, explanation: 'After the rain, the sun comes back.' },
    ],
  },
  Friendship: {
    title: 'A New Friend',
    passage: ['Tara is new at school.', 'She sits alone at lunch.', 'Leo walks over and smiles.', 'They talk and share food.', 'Now they are good friends.'],
    keyVocab: [
      { word: 'friend', meaning: 'a person you like and trust', aslTip: 'Hook your two index fingers together.' },
      { word: 'share', meaning: 'to give part of what you have to someone', aslTip: 'Move a flat hand back and forth between two people.' },
      { word: 'smile', meaning: 'a happy look on your face', aslTip: 'Trace the corners of your mouth going up.' },
    ],
    questions: [
      { question: 'Why does Tara sit alone?', options: ['She is new', 'She is tired', 'She is sick', 'She is late'], answerIndex: 0, explanation: 'Tara is new at school, so she sits alone.' },
      { question: 'What does Leo do?', options: ['Walks over and smiles', 'Runs away', 'Falls asleep', 'Shouts'], answerIndex: 0, explanation: 'Leo walks over and smiles.' },
      { question: 'How does the story end?', options: ['They become friends', 'They argue', 'Tara leaves', 'Leo cries'], answerIndex: 0, explanation: 'Now they are good friends.' },
    ],
  },
  'The Ocean': {
    title: 'Under the Waves',
    passage: ['The ocean is deep and blue.', 'Many fish swim in groups.', 'A green turtle floats by.', 'Coral grows on the rocks.', 'The waves move all day.'],
    keyVocab: [
      { word: 'ocean', meaning: 'a very large body of salt water', aslTip: 'Show wide rolling waves with your hands.' },
      { word: 'turtle', meaning: 'an animal with a hard shell that swims', aslTip: 'Cover one fist with your other hand like a shell.' },
      { word: 'coral', meaning: 'hard, colorful shapes that grow in the sea', aslTip: 'Spread your fingers like branching shapes.' },
    ],
    questions: [
      { question: 'What is the ocean like?', options: ['Deep and blue', 'Small and dry', 'Hot and red', 'Flat and white'], answerIndex: 0, explanation: 'The ocean is deep and blue.' },
      { question: 'What floats by?', options: ['A green turtle', 'A red car', 'A bird', 'A boat'], answerIndex: 0, explanation: 'A green turtle floats by.' },
      { question: 'Where does coral grow?', options: ['On the rocks', 'In the sky', 'On a tree', 'In the sand only'], answerIndex: 0, explanation: 'Coral grows on the rocks.' },
    ],
  },
  Plants: {
    title: 'The Little Seed',
    passage: ['A small seed sits in the soil.', 'Rain and sun help it grow.', 'A green stem pushes up.', 'Soon leaves open wide.', 'The plant becomes a tall flower.'],
    keyVocab: [
      { word: 'seed', meaning: 'a tiny part of a plant that grows into a new plant', aslTip: 'Pinch your fingers to show something very small.' },
      { word: 'soil', meaning: 'the dirt that plants grow in', aslTip: 'Rub your fingers like loose earth.' },
      { word: 'grow', meaning: 'to get bigger over time', aslTip: 'Raise one hand slowly upward.' },
    ],
    questions: [
      { question: 'Where does the seed sit?', options: ['In the soil', 'On a shelf', 'In the sky', 'In water'], answerIndex: 0, explanation: 'A small seed sits in the soil.' },
      { question: 'What helps the seed grow?', options: ['Rain and sun', 'Wind and snow', 'Noise', 'Cars'], answerIndex: 0, explanation: 'Rain and sun help it grow.' },
      { question: 'What does the plant become?', options: ['A tall flower', 'A small rock', 'A bird', 'A tree stump'], answerIndex: 0, explanation: 'The plant becomes a tall flower.' },
    ],
  },
}

export function fallbackPassage(topic, level, skillFocus = null) {
  const base = PASSAGES[topic] || PASSAGES.Animals
  return { mode: 'fallback', level: Number(level) || 2, ...base, skillFocus }
}

// Deterministic fallback for "bring your own content": when the model is
// unavailable we still show the teacher's text, chunked into readable lines,
// so the lesson never fails outright (vocab/questions need the model).
export function chunkSourceToPassage(sourceText, level, skillFocus = null) {
  const clean = String(sourceText || '').replace(/\s+/g, ' ').trim()
  const sentences = clean.split(/(?<=[.!?])\s+/).filter(Boolean)
  const maxLines = Number(level) <= 2 ? 6 : 10
  const lines = (sentences.length ? sentences : [clean]).slice(0, maxLines)
  const title = clean.split(' ').slice(0, 5).join(' ') || 'Your reading'
  return { mode: 'fallback', source: 'byoc', level: Number(level) || 2, title, passage: lines, keyVocab: [], questions: [], skillFocus }
}
