# SignBridge: *from sign to sentence*

**An adaptive AI tutor that bridges sign-language grammar to written English for Deaf and Hard-of-Hearing learners.**

> Built for the **EdTech 3.0 AI in Education Hackathon** · Track 3: Accessibility & Inclusive Learning.

- **Live app:** https://signbridge-delta.vercel.app/
- **Backend health:** https://signbridge-api-49qf.onrender.com/health
- **Repository:** https://github.com/RajdeepKushwaha5/signbridge

---

## For judges: a 60-second tour

New to SignBridge? Here is the fastest way to see what it does:

1. On the **Grammar bridge** tab, type a sentence the way a Deaf student might sign it (for example, `Store I go yesterday.`) and click **Start my session**.
2. Read the diagnosis, then open **"Why did the tutor choose this skill?"** to see the agent's reasoning. Next, click **Open the visual concept bridge**, then **Show the transformation**, and watch the sentence move from sign order into written-English order.
3. Do the short practice and the unseen transfer to reach the **Learning Proof** card.

Then explore the other tabs: **Read & decode** (illustrated reading, plus paste-your-own-text or upload a PDF), **Fingerspell** (sign recognition using your webcam, fully on-device), and **Teacher view** (mastery dashboard with CSV/JSON export). The **Accessibility** bar (top right) has a dyslexia-friendly mode, high contrast, and larger text.

**A note on the AI:** SignBridge runs on Google Gemini's free tier. Under heavy testing it may reach the rate limit and pause the live model, showing reviewed offline lessons instead, so the app keeps working and progress still counts. For the full live experience, the example sentences above always work best. A paid key removes the limit and improves quality.

---

## The problem

For many Deaf people, a signed language is their **first** language, and **written English is a second language with completely different grammar**: different word order, no articles, time-words instead of verb endings. Yet reading is almost always taught as if English were their first language. The result is one of education's oldest, most overlooked equity gaps. In some regions **three out of four Deaf adults read below grade level**, not from any lack of ability, but from instruction that never bridges their two languages.

**SignBridge treats written English as a second language and teaches the bridge, one pattern at a time.**

---

## What it does

| Feature | What it does | Why it matters |
|---|---|---|
| **Grammar Bridge** | An adaptive agent diagnoses one high-value grammar skill in the learner's writing, teaches it, and proves it with a new sentence | The core adaptive tutor that reasons, adapts, and remembers |
| **Visual Concept Bridge** | Maps meaning into `TIME / PERSON / ACTION / OBJECT / PLACE` cards and animates them from sign-order into English-order | Teaches grammar *visually* and preserves meaning, not rote rules |
| **Read & Decode** | Generates leveled, **illustrated** passages with key vocabulary and a comprehension quiz; adapts difficulty | Visual-first reading practice, personalized to the learner |
| **Bring Your Own Content** | A teacher pastes text or uploads a **PDF**; SignBridge turns real classroom material into an accessible, leveled lesson | Works on real-world materials, not just AI topics |
| **Fingerspell** | Live, **on-device** recognition of the ASL manual alphabet via webcam | Genuinely sign-aware; free; works offline; no video uploaded |
| **Teacher view** | Read-only mastery dashboard with an exportable CSV/JSON progress report | Real-classroom readiness |
| **Installable PWA** | Installs like an app; reviewed lessons work **offline** | Deployable in low-connectivity, under-resourced schools |

Accessibility is first-class throughout: a **dyslexia-friendly mode** (readable font, no all-caps, generous spacing), adjustable text size, high-contrast mode, and reduced-motion support.

---

## What makes it different

This is not a chatbot wrapper. The standout, defensible ideas:

1. **The agent explains its own decision from a persistent learner model.** For example, *"focusing on verb tense because your mastery there is low,"* and it even shows the runner-up skills it noticed but chose *not* to teach yet. Visible autonomy, not a generic reply.
2. **The Visual Concept Bridge** is a novel way to *teach* the L1 to L2 grammar shift by physically rearranging meaning cards, with an explicit note that there is no single universal sign-language word order.
3. **One learner model powers everything.** The reading coach personalizes to the *same* mastery profile the writing agent builds. One adaptive agent, not two separate tools.
4. **On-device sign recognition.** Fingerspell runs entirely in the browser (MediaPipe), at zero cost, offline-capable.
5. **It never breaks.** Every AI feature has a reviewed, deterministic fallback, so a learner (or a judge) never hits an error, even offline or rate-limited.

---

## The AI pipeline (models · data · decisions)

- **Model:** Google **Gemini 2.5 Flash**, called with **strict structured-JSON schemas** so every tutoring response is reliable and parseable. API keys live **only on the backend** and rotate across up to three keys with automatic failover on rate-limit/quota errors; requests time out at 25s with a one-shot retry on provider 5xx.
- **Diagnosis (`/api/grammar/bridge`):** given the learner's sentence and mastery profile, the model returns a structured diagnosis containing the corrected sentence, the single focus skill (one of eight canonical skills), a plain-language reason for the choice, the concept-bridge cards and orderings, a mini-lesson, and two practice items (guided and unseen transfer), each with graduated hints. Every response is **schema-validated server-side**; invalid output is rejected.
- **Evaluation (`/api/grammar/practice/check`):** a deterministic exact-match shortcut handles obvious cases for free; otherwise the model judges meaning-preservation and correct skill use, accepting natural alternatives.
- **Reading (`/api/reading/passage`, `/api/reading/from-text`):** generates or *adapts* a passage to a target reading level, biased toward the learner's weakest skill, with vocabulary and comprehension questions.
- **Illustrations:** free, key-less, deterministic-seed AI images (client-side), with a graceful skeleton while loading and silent removal if unavailable.
- **Fingerspell:** MediaPipe hand-landmark model in the browser plus a geometric classifier for the manual-alphabet letters. No server, no cost.
- **Learner model:** a versioned, **anonymous, local** per-skill mastery profile (attempts, independent vs. hinted success, transfer success, mastery %, review scheduling) plus bounded qualitative misconception memory. No names, video, or identifiers are stored.

### The adaptive loop

```text
write to diagnose to visual concept bridge to mini-lesson to guided rewrite
     to graduated hints / retry to unseen transfer to mastery update to summary
```

Adaptive routing chooses the next action from assessed performance (another scaffold · visual explanation · reading reinforcement · unseen transfer · mastery challenge), and a **visible decision timeline** shows what the agent observed, selected, and changed.

---

## How it maps to the judging criteria

| Criterion | How SignBridge addresses it |
|---|---|
| **Educational Impact (30%)** | A research-grounded L1 to L2 bridge for a severe, documented literacy gap; a per-skill mastery model that adapts to each learner; on the skill-diagnosis benchmark, every case evaluated live selected the correct canonical skill; a screenshot-ready Learning Proof card; and a paired pre/post assessment plus pilot protocol included for classroom validation. |
| **Agent Intelligence & Autonomy (30%)** | A full diagnose, teach, practice, verify, adapt loop; the agent reasons from a persistent mastery model and **explains its choices** (including what it chose *not* to teach); adaptive routing; cross-session misconception memory; a visible decision timeline. |
| **Scalability (20%)** | Stateless backend, free-tier infrastructure, server-side key rotation, an installable offline PWA, and Bring-Your-Own-Content so it scales to any classroom's real materials. |
| **UX for Learners & Teachers (20%)** | Visual-first concept cards, illustrated reading, a dyslexia-friendly accessibility shell, guided onboarding, and a read-only teacher dashboard with exportable reports. |

---

## Architecture

```text
signbridge/
├── frontend/                 # React + Vite PWA (Vercel)
│   ├── src/app/              # shell, onboarding, accessibility, PWA status
│   ├── src/features/         # grammar · reading · fingerspell · teacher · progress
│   ├── src/shared/           # API client + UI primitives
│   └── src/styles/           # editorial design system
├── backend/                  # Express API (Render)
│   └── src/
│       ├── features/         # grammar + reading routes & schemas
│       ├── domain/           # skills, validation, reviewed offline fallbacks
│       ├── middleware/       # rate limiting
│       └── services/         # Gemini transport + key failover
├── evaluation/               # benchmark, pre/post assessment, pilot protocol
├── render.yaml               # Render Blueprint
└── README.md
```

The browser never receives provider credentials; all prompts, schemas, model selection, and keys are server-side. Requests are size-limited, rate-limited, validated, and restricted by CORS.

---

## Responsible AI & accessibility

- **No identity data.** The learner profile is anonymous and local; no names, video, contact details, or school identifiers are stored.
- **Honest reporting.** Technical accuracy and learning outcomes are reported separately, and offline mode never presents a reviewed fallback as a live model response.
- **No fabricated sign content.** SignBridge never auto-generates or fakes sign language; any signed content comes from a real signer.
- **Pedagogical care.** The concept bridge is presented as a contrastive learning aid and explicitly notes there is no single universal sign-language word order.

---

## Evidence & evaluation

```bash
cd backend  && npm test              # backend unit/integration tests
cd frontend && npm test              # frontend logic tests
cd frontend && npm run verify:pwa    # verify installable PWA artifacts
node evaluation/run-benchmark.mjs --limit=5
```

In benchmark runs against the 48-case skill-diagnosis set, **every case evaluated live selected the correct canonical grammar skill**, and all cases returned valid, safe responses (with graceful offline fallback when the model was unavailable). The `evaluation/` folder also includes a **paired 10-item pre/post assessment** and a **consent-focused pilot protocol** designed for supervised classroom validation. Benchmark accuracy (model behavior) and learner outcomes (classroom results) are always reported separately.

---

## Run locally

Requires **Node.js 20+**.

```bash
# Terminal 1: backend
cd backend && cp .env.example .env   # add at least GEMINI_API_KEY
npm install && npm run dev           # http://localhost:3001

# Terminal 2: frontend
cd frontend && cp .env.example .env  # VITE_API_BASE_URL=http://localhost:3001
npm install && npm run dev           # http://localhost:5173
```

Get a free Gemini key at https://aistudio.google.com/apikey. Add up to three (`GEMINI_API_KEY`, `_2`, `_3`) for automatic failover.

## Deploy

**Backend (Render):** root `backend`, build `npm install`, start `npm start`, health `/health`. Env: `GEMINI_API_KEY` (plus optional `_2`/`_3`) and `ALLOWED_ORIGINS=https://signbridge-delta.vercel.app`.

**Frontend (Vercel):** root `frontend`, framework Vite, output `dist`. Env: `VITE_API_BASE_URL=https://signbridge-api-49qf.onrender.com`.

> Note: set Render's `ALLOWED_ORIGINS` to the exact Vercel origin (no trailing slash). The backend also accepts any `*.vercel.app` origin so preview deployments work out of the box.

---

## Tech stack

React · Vite · Vite-PWA / Workbox · Express · Google Gemini 2.5 Flash · MediaPipe Tasks Vision · Node test runner.
