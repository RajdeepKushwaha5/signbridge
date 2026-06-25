# SignBridge - from sign to sentence

**An AI literacy bridge for Deaf and sign-first learners.**

SignBridge is not just an English tutor and not a grammar checker. It is an adaptive learning system that helps Deaf and sign-first learners move between **sign-language thinking**, **written English**, **visual reading**, **fingerspelling**, and **teacher-visible progress**.

Built for **EdTech 3.0 - AI in Education Hackathon**  
Primary track: **Track 3 - Accessibility & Inclusive Learning**  
Also relevant to: **Track 1 - AI Tutors & Personalized Learning**

- Live app: https://signbridge-delta.vercel.app/
- Backend health: https://signbridge-api-49qf.onrender.com/health
- Repository: https://github.com/RajdeepKushwaha5/signbridge

---

## The one-line pitch

**SignBridge maps a learner's sign-influenced sentence into visual meaning cards, teaches one useful written-English pattern, proves learning with an unseen transfer sentence, remembers misconceptions, and helps teachers turn real classroom content into accessible literacy practice.**

---

## Why this matters

For many Deaf learners, sign language is their first language. It is the language they think in, learn in, and express ideas in.

Written English is a different language system:

- English has different word order.
- English uses small grammar words like `a`, `the`, `is`, and `to`.
- English changes verbs to show time, like `go` becoming `went`.
- Sign languages often express meaning visually and spatially.

Most education tools treat Deaf learners' writing as ordinary English errors. SignBridge treats it as a **language bridge problem**.

The learner is not "bad at English." The learner is crossing from one language structure into another. SignBridge makes that crossing visible, teachable, measurable, and adaptive.

---

## What SignBridge is

SignBridge is a multi-part AI literacy workspace:

1. **Grammar Bridge** - an adaptive AI writing agent.
2. **Visual Concept Bridge** - visual role cards that show how meaning transforms into written-English structure.
3. **Read & Decode** - an adaptive reading coach with visual passages, vocabulary support, and quizzes.
4. **Bring Your Own Content** - paste text or upload a PDF and turn classroom material into an accessible reading lesson.
5. **Fingerspell** - live on-device ASL manual alphabet practice with webcam hand tracking.
6. **Teacher View** - read-only mastery dashboard with CSV/JSON export.
7. **Offline PWA** - installable app shell and reviewed fallback lessons for low-connectivity settings.
8. **Accessibility shell** - dyslexia-friendly mode, text scaling, high contrast, and reduced-motion support.

The core learning loop:

```text
write -> diagnose -> visual bridge -> mini lesson -> guided rewrite
      -> hints/retry -> unseen transfer -> mastery update -> session summary
```

---

## What makes this different

### 1. It is not a chatbot wrapper

A chatbot can correct a sentence. SignBridge runs a full tutoring loop:

- selects one focus skill,
- explains why it selected that skill,
- avoids teaching every error at once,
- uses visual concept cards,
- gives graduated hints,
- verifies with unseen transfer,
- updates deterministic mastery,
- remembers qualitative misconceptions,
- chooses the next route.

### 2. It teaches the bridge, not just the answer

For example:

```text
Learner writes: Store I go yesterday.
Written English: I went to the store yesterday.
```

SignBridge does not only output the correction. It maps the idea into role cards:

- `PLACE`: store -> to the store
- `PERSON`: I -> I
- `ACTION`: go -> went
- `TIME`: yesterday -> yesterday

Then the learner sees the same meaning reorganized into written-English structure.

### 3. It makes AI reasoning visible

The learner and judge can see:

- why the agent chose the focus skill,
- what else it noticed but did not teach yet,
- confidence,
- the agent decision timeline,
- the next route selected by the agent.

### 4. It remembers real misconceptions

SignBridge stores meaningful learning patterns, not personal identity.

Example:

```text
You previously omitted past-tense markers twice.
Today you marked the time on the verb independently.
```

This is stronger than a simple score because it tells the learner and teacher what is changing.

### 5. It proves learning with unseen transfer

The learner does not just copy a corrected sentence. After guided practice, SignBridge gives a new sentence that tests the same skill.

This checks whether the learner can apply the pattern independently.

### 6. It connects writing, reading, vocabulary, fingerspelling, and teacher evidence

One learner profile powers the literacy experience. The writing agent builds the mastery profile, and the reading coach can use the same profile to reinforce weak skills in stories.

---

## Core use cases

### Use case 1: A learner writes the way they think

The learner enters:

```text
Store I go yesterday.
```

SignBridge:

- preserves the intended meaning,
- diagnoses one high-value written-English pattern,
- chooses a focus skill such as verb tense,
- explains why it chose the skill,
- shows the corrected sentence,
- opens the Visual Concept Bridge.

### Use case 2: The learner sees how English changes

The Visual Concept Bridge separates meaning into cards:

- `TIME`
- `TOPIC`
- `PERSON`
- `ACTION`
- `OBJECT`
- `PLACE`

The learner can rebuild the sentence by moving cards into written-English order. Changed words are highlighted.

Important design note: SignBridge does **not** claim there is one universal ASL or sign-language word order. The cards are a contrastive learning aid.

### Use case 3: The learner gets supported practice

The learner tries a guided rewrite. If the answer is wrong:

1. Hint 1 gives a reusable rule.
2. Hint 2 gives a sentence scaffold.
3. A model answer appears only after final support is needed.

This teaches before revealing.

### Use case 4: The learner proves transfer

After guided success, the learner gets a new sentence. This is the unseen transfer step.

Independent transfer gives the largest mastery gain because it is stronger evidence of learning.

### Use case 5: The teacher brings real material

A teacher can paste a paragraph or upload a PDF worksheet. SignBridge turns it into:

- a leveled reading passage,
- short visual lines,
- key vocabulary,
- visual/sign-related vocabulary cues,
- comprehension questions,
- an adaptive reading level update.

### Use case 6: The learner connects print to fingerspelling

Vocabulary from Read & Decode can be sent to Fingerspell. The learner practices the word through handshapes.

Fingerspell runs on-device with MediaPipe hand tracking:

- no video upload,
- no server-side video processing,
- no per-use AI cost,
- private by design.

### Use case 7: The teacher sees evidence

Teacher View shows:

- sessions completed,
- skills practiced,
- reading level,
- mastery across eight grammar skills,
- skills needing support,
- recent sessions,
- milestones,
- CSV/JSON export.

In this hackathon version, the profile is local and anonymous. In a production classroom version, this can expand into accounts, rosters, and multi-learner dashboards.

---

## Feature inventory

### Grammar Bridge

- AI diagnosis of sign-influenced written English.
- Single focus skill selection.
- `Why this skill?` reasoning.
- `Also noticed, not teaching yet` explanation.
- Meaning-preserving correction.
- Mini lesson.
- Guided rewrite.
- Two graduated hints.
- Model support only after failed attempts.
- Unseen transfer practice.
- Deterministic mastery update.
- Session summary.
- Learning Proof card.

### Visual Concept Bridge

- Role cards: `TIME`, `TOPIC`, `PERSON`, `ACTION`, `OBJECT`, `PLACE`.
- Learner thought structure.
- Written-English structure.
- Interactive card movement.
- Transformation/reveal support.
- Changed-word highlighting.
- Respectful note that concept cards are a learning aid, not a universal sign-language grammar claim.

### Agent intelligence

- Canonical skill model.
- Visible agent decision reason.
- Agent decision timeline.
- Adaptive route selection:
  - another scaffold,
  - visual explanation,
  - reading reinforcement,
  - unseen transfer,
  - mastery challenge.
- Qualitative misconception memory.
- Local profile used across sessions.

### Learner profile and mastery

- Versioned local profile.
- Per-skill attempts.
- Independent successes.
- Hinted successes.
- Transfer successes.
- Streak.
- Mastery percentage.
- Mastered status.
- Last practiced date.
- Next review date.
- Bounded session history.
- JSON export/import/reset.
- Legacy profile migration.

### Read & Decode

- AI-generated reading passages.
- Level 1-5 adaptive reading.
- Visual/short-line passage style.
- Key vocabulary cards.
- Visual or sign-related vocabulary cues.
- Comprehension quiz.
- Reading level adjustment.
- Skill-focused reading reinforcement from the same learner profile.

### Bring Your Own Content

- Paste classroom text.
- Upload PDF.
- Extract PDF text in the browser.
- Adapt real material into a leveled lesson.
- Fallback mode preserves readable chunks if live AI is unavailable.

### Fingerspell

- Webcam-based ASL manual alphabet practice.
- MediaPipe hand landmarks.
- Geometric classifier for recognizable letters.
- Word practice.
- Vocabulary handoff from Read & Decode.
- On-device and private.
- No uploaded video.

### Teacher View

- Skill mastery table.
- Lowest-mastery skills needing support.
- Recent sessions.
- Reading level summary.
- Milestones.
- CSV export.
- JSON export.

### Accessibility

- Dyslexia-friendly mode.
- Adjustable text size.
- High contrast.
- Reduced-motion support.
- Keyboard-accessible flow.
- Caption-first demo guidance.
- Sign-welcome slot for a real signer, without fabricating sign language.

### Reliability and deployment

- Vercel frontend.
- Render backend.
- Health endpoint.
- CORS configuration for Vercel deployments.
- Server-side API keys only.
- Gemini key rotation across up to three keys.
- Timeout and retry behavior.
- Strict JSON schemas.
- Server-side validation.
- Local deterministic fallbacks.
- Installable PWA.
- Offline-ready app shell.

---

## The eight canonical grammar skills

SignBridge does not give random grammar advice. It normalizes every diagnosis into one of eight canonical skills:

| Skill | What it teaches |
|---|---|
| Articles | `a`, `an`, `the` before nouns |
| Verb tense | marking time through verbs, such as `go` -> `went` |
| Subject-verb agreement | matching subject and verb, such as `she plays` |
| Copula / to be | using `am`, `is`, `are` |
| Plurals | marking more than one, such as `cat` -> `cats` |
| Prepositions | connectors like `to`, `at`, `in`, `on` |
| Topic-comment transfer | rebuilding topic-first ideas into written-English order |
| English word order | subject -> verb -> object structure |

---

## AI pipeline

### Model

SignBridge uses **Google Gemini 2.5 Flash** through a backend-only API layer.

The frontend never receives Gemini credentials.

### Diagnosis endpoint

`POST /api/grammar/bridge`

Inputs:

- learner sentence,
- local mastery profile summary,
- qualitative misconception memory.

Outputs:

- corrected sentence,
- meaning-preservation flag,
- confidence,
- detected errors,
- one focus skill,
- decision reason,
- Visual Concept Bridge cards,
- mini lesson,
- guided practice,
- unseen transfer practice,
- encouragement,
- response mode (`live` or `fallback`).

### Practice checking endpoint

`POST /api/grammar/practice/check`

Checks whether the learner's rewrite:

- preserves meaning,
- uses the target skill,
- should advance or retry,
- should receive hint or model support.

### Reading endpoints

`POST /api/reading/passage`  
`POST /api/reading/from-text`

These generate or adapt reading content using the learner profile when available.

---

## Reliability model

Hackathon demos often fail because the model rate-limits or returns malformed output. SignBridge is designed not to break.

If live AI is unavailable:

- grammar loads reviewed fallback lessons,
- reading loads reviewed passages or readable chunks,
- practice still gives hints and support,
- the UI clearly labels reliable practice mode,
- fallback is never presented as live AI.

This is important for real schools as well as demos. A student should not lose a learning session just because the model provider is busy.

---

## Privacy and responsible AI

SignBridge is designed for minors and accessibility contexts.

- No names are required.
- No school IDs are stored.
- No disability records are stored.
- No video is uploaded.
- Fingerspell camera processing runs on-device.
- Learner progress is local and anonymous in this version.
- Technical benchmark results and learner outcomes are reported separately.
- SignBridge does not fabricate sign-language video.
- Concept cards are framed as learning aids, not universal claims about ASL or any sign language.

---

## Why this can win

### Educational impact

SignBridge targets a serious and overlooked literacy gap: Deaf/sign-first learners often need explicit support crossing from sign-language structure into written language.

The app teaches one pattern at a time and verifies learning through unseen transfer.

### Agent intelligence

The AI does not just respond. It:

- diagnoses,
- chooses a skill,
- explains its decision,
- maps meaning visually,
- adapts the route,
- remembers misconceptions,
- updates mastery,
- recommends the next step.

### Scalability

The system is deployable on free-tier infrastructure, works as an installable PWA, and keeps functioning with reviewed offline fallback lessons.

Bring Your Own Content also means teachers can use their own materials instead of waiting for a custom curriculum.

### User experience

The learner sees language structure visually. The teacher sees progress clearly. Accessibility controls are built into the shell instead of being added later.

### X-factor

The Visual Concept Bridge is the memorable part:

```text
sign-influenced thought structure -> visual role cards -> written-English structure
```

It makes the invisible language transfer visible.

---

## Judge walkthrough

If you have only a few minutes, evaluate this flow:

1. Open Grammar Bridge.
2. Click `Try a live example`.
3. Open `Why did the tutor choose this skill?`.
4. Open the Visual Concept Bridge.
5. Move or reveal the cards.
6. Give one wrong guided answer to see hints.
7. Give the correct answer.
8. Complete unseen transfer.
9. Show Learning Proof, Agent Memory, and Agent Decision Timeline.
10. Open Read & Decode and show that the same profile supports reading.
11. Open Fingerspell and show on-device hand tracking.
12. Open Teacher View and export progress.

---

## Demo script

The full demo video script is in:

```text
DEMO-VIDEO.md
```

The recommended demo message:

```text
SignBridge is not a grammar checker.
It is an AI literacy bridge for Deaf and sign-first learners.
It maps meaning visually, teaches one useful pattern, proves transfer,
remembers misconceptions, supports reading and fingerspelling,
and gives teachers evidence.
```

---

## Evidence and evaluation

The `evaluation/` folder includes:

- a 48-case grammar diagnosis benchmark,
- a fixed 10-item pre/post assessment,
- a Deaf educator pilot protocol,
- pilot result templates,
- pilot summarizer,
- benchmark runner.

Run:

```bash
node evaluation/run-benchmark.mjs --limit=5
```

Important reporting rule:

- Report live AI accuracy separately from fallback reliability.
- Report benchmark behavior separately from learner outcomes.
- Do not claim real learner improvement unless a real learner pilot was completed.

The goal is honest evidence, not inflated claims.

---

## Architecture

```text
signbridge/
├── frontend/                 # React + Vite PWA deployed to Vercel
│   ├── src/app/              # shell, onboarding, accessibility, PWA status
│   ├── src/features/         # grammar, reading, fingerspell, teacher, progress
│   ├── src/shared/           # API client and shared UI components
│   └── src/styles/           # editorial design system
├── backend/                  # Express API deployed to Render
│   └── src/
│       ├── features/         # grammar and reading routes
│       ├── domain/           # skills, validation, fallback lessons
│       ├── middleware/       # rate limiting
│       └── services/         # Gemini transport and key failover
├── evaluation/               # benchmark, assessment, pilot protocol
├── render.yaml               # Render Blueprint
└── README.md
```

---

## Local development

Requires **Node.js 20+**.

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Add GEMINI_API_KEY in .env
npm run dev
```

Backend runs on:

```text
http://localhost:3001
```

Health check:

```text
http://localhost:3001/health
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# VITE_API_BASE_URL=http://localhost:3001
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

---

## Tests

Backend:

```bash
cd backend
npm test
```

Frontend:

```bash
cd frontend
npm test
```

PWA verification:

```bash
cd frontend
npm run verify:pwa
```

Production build:

```bash
cd frontend
npm run build
```

---

## Deployment

### Backend on Render

Root:

```text
backend
```

Build:

```bash
npm install
```

Start:

```bash
npm start
```

Environment variables:

```text
GEMINI_API_KEY=...
GEMINI_API_KEY_2=...        # optional
GEMINI_API_KEY_3=...        # optional
ALLOWED_ORIGINS=https://signbridge-delta.vercel.app
```

### Frontend on Vercel

Root:

```text
frontend
```

Framework:

```text
Vite
```

Output:

```text
dist
```

Environment variable:

```text
VITE_API_BASE_URL=https://signbridge-api-49qf.onrender.com
```

---

## Current limitations

These are honest limitations, not hidden weaknesses:

- Deaf educator review protocol is ready, but final classroom outcome claims require real review and learner testing.
- Fingerspell recognizes a reliable subset of manual alphabet handshapes; full sign recognition is future work.
- The teacher dashboard is local-device based in this hackathon version; full classroom rosters need auth and database persistence.
- Learner profiles are local and anonymous; multi-device sync is future work.
- Fallback lessons are reviewed and reliable, but live AI behavior should be reported separately from fallback reliability.

---

## Roadmap

Next steps after the hackathon:

1. Deaf educator review of Visual Concept Bridge cards and language.
2. Small supervised learner pilot using the included pre/post assessment.
3. Classroom roster dashboard.
4. Teacher assignment generator.
5. Family-friendly progress reports.
6. Expanded fingerspelling recognition.
7. More sign-language contexts beyond ASL.
8. Database-backed anonymous classroom deployment.

---

## Final positioning

SignBridge is a product about access, language, and agency.

It starts with Deaf and sign-first learners because this is one of the most overlooked literacy gaps in education.

But the larger idea is universal:

**Many learners think in one language and are asked to read and write in another. SignBridge shows the bridge.**

**SignBridge - from sign to sentence.**
