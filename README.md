# SignBridge — *from sign to sentence*

**An adaptive AI tutor that bridges sign-language grammar to written English for Deaf and Hard-of-Hearing learners.**

> Built for **EdTech 3.0 — AI in Education Hackathon** · Track 3: Accessibility & Inclusive Learning.

- 🌐 **Live app:** https://signbridge-delta.vercel.app/
- ❤️ **Backend health:** https://signbridge-api-49qf.onrender.com/health
- 💻 **Repository:** https://github.com/RajdeepKushwaha5/signbridge

---

## The problem

For many Deaf people, a signed language is their **first** language, and **written English is a second language with completely different grammar** — different word order, no articles, time-words instead of verb endings. Yet reading is almost always taught as if English were their first language. The result is one of education's oldest, most overlooked equity gaps: in some regions **three out of four Deaf adults read below grade level** — not from any lack of ability, but from instruction that never bridges their two languages.

**SignBridge treats written English as a second language and teaches the bridge — one pattern at a time.**

---

## What it does

| Feature | What it does | Why it matters |
|---|---|---|
| **🌉 Grammar Bridge** | An adaptive agent diagnoses one high-value grammar skill in the learner's writing, teaches it, and proves it with a new sentence | The core adaptive tutor — reasons, adapts, and remembers |
| **🧩 Visual Concept Bridge** | Maps meaning into `TIME / PERSON / ACTION / OBJECT / PLACE` cards and animates them from sign-order into English-order | Teaches grammar *visually*, preserving meaning — not rote rules |
| **📖 Read & Decode** | Generates leveled, **illustrated** passages with key vocabulary and a comprehension quiz; adapts difficulty | Visual-first reading practice, personalized to the learner |
| **📄 Bring Your Own Content** | A teacher pastes text or uploads a **PDF**; SignBridge turns real classroom material into an accessible, leveled lesson | Works on real-world materials, not just AI topics |
| **🤟 Fingerspell** | Live, **on-device** recognition of the ASL manual alphabet via webcam | Genuinely sign-aware; free; works offline; no video uploaded |
| **👩‍🏫 Teacher view** | Read-only mastery dashboard + exportable CSV/JSON progress report | Real-classroom readiness |
| **📲 Installable PWA** | Installs like an app; reviewed lessons work **offline** | Deployable in low-connectivity, under-resourced schools |

Accessibility is first-class throughout: an **OpenDyslexic** font toggle, adjustable text size, high-contrast mode, reduced-motion support, and a signed-welcome slot for a real Deaf presenter.

---

## What makes it different

This is not a chatbot wrapper. The standout, defensible ideas:

1. **The agent explains its own decision from a persistent learner model** — e.g. *"focusing on verb tense because your mastery there is low."* Visible autonomy, not a generic reply.
2. **The Visual Concept Bridge** — a novel way to *teach* the L1→L2 grammar shift by physically rearranging meaning cards, with an explicit disclaimer that there is no single universal sign-language word order.
3. **One learner model powers everything** — the reading coach personalizes to the *same* mastery profile the writing agent builds. One adaptive agent, not two separate tools.
4. **On-device sign recognition** — Fingerspell runs entirely in the browser (MediaPipe), at zero cost, offline-capable.
5. **It never breaks** — every AI feature has a reviewed, deterministic fallback, so a learner (or a judge) never hits an error, even offline or rate-limited.

---

## The AI pipeline (models · data · decisions)

- **Model:** Google **Gemini 2.5 Flash**, called with **strict structured-JSON schemas** so every tutoring response is reliable and parseable. API keys live **only on the backend** and rotate across up to three keys with automatic failover on rate-limit/quota errors; requests time out at 25s with a one-shot retry on provider 5xx.
- **Diagnosis (`/api/grammar/bridge`):** given the learner's sentence and mastery profile, the model returns a structured diagnosis — corrected sentence, the single focus skill (one of eight canonical skills), a plain-language reason for the choice, the concept-bridge cards + orderings, a mini-lesson, and two practice items (guided + unseen transfer), each with graduated hints. Every response is **schema-validated server-side**; invalid output is rejected.
- **Evaluation (`/api/grammar/practice/check`):** a deterministic exact-match shortcut handles obvious cases for free; otherwise the model judges meaning-preservation and correct skill use, accepting natural alternatives.
- **Reading (`/api/reading/passage`, `/api/reading/from-text`):** generates or *adapts* a passage to a target reading level, biased toward the learner's weakest skill, with vocabulary and comprehension questions.
- **Illustrations:** free, key-less, deterministic-seed AI images (client-side) — graceful skeleton while loading, silently removed if unavailable.
- **Fingerspell:** MediaPipe hand-landmark model in the browser + a geometric classifier for the recognizable manual-alphabet letters. No server, no cost.
- **Learner model:** a versioned, **anonymous, local** per-skill mastery profile (attempts, independent vs. hinted success, transfer success, mastery %, review scheduling) plus bounded qualitative misconception memory. No names, video, or identifiers are stored.

### The adaptive loop

```text
write → diagnose → visual concept bridge → mini-lesson → guided rewrite
      → graduated hints / retry → unseen transfer → mastery update → summary
```

Adaptive routing chooses the next action from assessed performance (another scaffold · visual explanation · reading reinforcement · unseen transfer · mastery challenge), and a **visible decision timeline** shows what the agent observed, selected, and changed.

---

## How it maps to the judging criteria

| Criterion | How SignBridge addresses it |
|---|---|
| **Educational Impact (30%)** | Research-grounded L1→L2 bridge for a severe, documented literacy gap; a per-skill mastery model; a ready paired pre/post assessment + consent-focused pilot protocol (`evaluation/`). *Honest status: technical accuracy is measured; learner-outcome evidence requires a Deaf-educator-supervised pilot and is reported separately.* |
| **Agent Intelligence & Autonomy (30%)** | Full diagnose→teach→practice→verify→adapt loop; the agent reasons from a persistent mastery model and **explains its choices**; adaptive routing; cross-session misconception memory; visible decision timeline. |
| **Scalability (20%)** | Stateless backend, free-tier infrastructure, server-side key rotation, installable offline PWA, and Bring-Your-Own-Content so it scales to any classroom's real materials. |
| **UX for Learners & Teachers (20%)** | Visual-first concept cards, illustrated reading, accessibility shell (OpenDyslexic / contrast / text size / reduced motion), guided onboarding, and a read-only teacher dashboard. |

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

The browser never receives provider credentials — all prompts, schemas, model selection, and keys are server-side.

---

## Responsible AI & accessibility

- **No identity data.** The learner profile is anonymous and local; no names, video, contact, disability records, or school identifiers are stored.
- **Honest reporting.** Technical benchmark accuracy and learner-outcome evidence are always reported separately; offline mode never pretends a canned response came from the live model.
- **No fabricated sign content.** The signed-welcome slot waits for a clip from a real signer — SignBridge never auto-generates or fakes sign language.
- **Pedagogical humility.** The concept bridge explicitly states there is no single universal sign-language word order; it is a contrastive learning aid, pending Deaf-educator review.

---

## Evidence & evaluation

```bash
cd backend  && npm test          # backend unit/integration tests
cd frontend && npm test          # frontend logic tests
cd frontend && npm run verify:pwa
node evaluation/run-benchmark.mjs --limit=5
```

`evaluation/` contains a 48-case technical skill-diagnosis benchmark, a paired 10-item pre/post assessment, a consent-focused pilot protocol, and a results template. **These outcome materials are marked pending Deaf-educator review and have not yet been run with learners** — benchmark accuracy and learner outcomes are never conflated.

---

## Run locally

Requires **Node.js 20+**.

```bash
# Terminal 1 — backend
cd backend && cp .env.example .env   # add at least GEMINI_API_KEY
npm install && npm run dev           # http://localhost:3001

# Terminal 2 — frontend
cd frontend && cp .env.example .env  # VITE_API_BASE_URL=http://localhost:3001
npm install && npm run dev           # http://localhost:5173
```

Get a free Gemini key at https://aistudio.google.com/apikey. Add up to three (`GEMINI_API_KEY`, `_2`, `_3`) for automatic failover.

## Deploy

**Backend (Render):** root `backend`, build `npm install`, start `npm start`, health `/health`. Env: `GEMINI_API_KEY` (+ optional `_2`/`_3`), and **`ALLOWED_ORIGINS=https://signbridge-delta.vercel.app`** (must exactly match the frontend origin).

**Frontend (Vercel):** root `frontend`, framework Vite, output `dist`. Env: `VITE_API_BASE_URL=https://signbridge-api-49qf.onrender.com`.

> ⚠️ **CORS is the #1 deploy gotcha:** `ALLOWED_ORIGINS` on Render must contain the exact Vercel origin (no trailing slash) or the live site silently falls back to offline lessons.

---

## Honest limitations & roadmap

- **Learner-outcome evidence is pending** a Deaf-educator-supervised pilot (protocol is ready in `evaluation/`).
- **Fingerspell** reliably recognizes a curated subset of the manual alphabet (geometrically distinct letters); full sign recognition is future work.
- **The learner profile is per-device** (local) — multi-device accounts and a real classroom roster are the natural next step.
- **A signed (ASL) welcome** is wired and waiting for a clip recorded by a real Deaf presenter.

## Tech stack

React · Vite · Vite-PWA/Workbox · Express · Google Gemini 2.5 Flash · MediaPipe Tasks Vision · Node test runner.
