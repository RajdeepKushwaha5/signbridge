# SignBridge

> from sign to sentence

SignBridge is an AI literacy platform for Deaf and sign-first learners. It addresses a long-standing equity gap in education: written language is usually taught to Deaf students as if it were their first language, when for many it is a *second* language acquired through a different, visual-spatial modality. SignBridge bridges sign-language thinking and written literacy across writing, reading, vocabulary, fingerspelling, and teacher-visible progress, in one adaptive system.

**Live app:** https://signbridge-delta.vercel.app/
**Repository:** https://github.com/RajdeepKushwaha5/signbridge
**Backend health:** https://signbridge-api-49qf.onrender.com/health

Built for the EdTech 3.0 AI in Education Hackathon (Track 3: Accessibility & Inclusive Learning).

---

## Table of contents

- [The problem](#the-problem)
- [Overview](#overview)
- [Features](#features)
- [How it works](#how-it-works)
- [Architecture](#architecture)
- [AI and on-device pipeline](#ai-and-on-device-pipeline)
- [Quick start](#quick-start)
- [Deployment](#deployment)
- [Project structure](#project-structure)
- [Accessibility and responsible AI](#accessibility-and-responsible-ai)
- [Tech stack](#tech-stack)

---

## The problem

For many Deaf people, a signed language is their first language. It is the language they think in, learn in, and express ideas in. Written English is a separate language system with different word order, grammar words such as `a`, `the`, `is`, and `to`, and verb changes that mark time (for example, `go` becoming `went`).

When a Deaf learner writes English, they are crossing from one language structure into another. Most educational tools treat the result as ordinary spelling and grammar errors, which misses the real task. The outcome is one of education's most overlooked equity gaps: in some regions, a majority of Deaf adults read below grade level, not from any lack of ability, but from instruction that never makes the bridge between their two languages visible and teachable.

SignBridge is built around that bridge.

---

## Overview

SignBridge combines an adaptive writing tutor, a reading coach, sign-aware vocabulary and fingerspelling practice, and a teacher dashboard, all driven by a single learner model.

The learner writes a sentence in their own way. An AI agent identifies one high-value written-English pattern, explains why it chose that pattern, teaches it through visual meaning cards, supports the learner with graduated hints, and then verifies real learning with a new, unseen sentence. Progress is tracked per skill and surfaced to teachers, and the same learner model personalizes reading practice.

---

## Features

**Grammar Bridge.** An adaptive writing agent that diagnoses one focus skill, explains its choice (and what it noticed but chose not to teach yet), gives a short lesson and guided practice with graduated hints, and confirms learning with an unseen transfer sentence. The session ends with a Learning Proof card summarizing the journey.

**Visual Concept Bridge.** The learner's sentence is broken into meaning cards (`TIME`, `TOPIC`, `PERSON`, `ACTION`, `OBJECT`, `PLACE`). The learner rearranges them into written-English order and sees the changed words highlighted, making the language transformation visible rather than abstract.

**Read & Decode.** An adaptive reading coach that generates illustrated, leveled passages with key vocabulary and a comprehension quiz, and adjusts the reading level based on performance. It reinforces the learner's weakest skill using the same mastery profile the writing agent builds.

**Bring Your Own Content.** Teachers paste classroom text or upload a PDF, and SignBridge turns real material into an accessible, leveled reading lesson with vocabulary and questions.

**Fingerspell.** Webcam-based practice of the ASL manual alphabet using on-device hand tracking. Vocabulary from Read & Decode can be sent here for handshape practice. No video is uploaded and there is no per-use AI cost.

**Teacher view.** A read-only dashboard showing mastery across eight grammar skills, skills needing support, recent sessions, and milestones, with CSV and JSON export.

**Offline and installable.** An installable Progressive Web App with reviewed fallback lessons, so core practice keeps working in low-connectivity settings.

**Accessibility shell.** A dyslexia-friendly mode (readable font, no all-caps, generous spacing), adjustable text size, high contrast, and reduced-motion support, applied across the whole app.

---

## How it works

The core learning loop:

```text
write -> diagnose -> visual concept bridge -> mini lesson -> guided rewrite
      -> graduated hints / retry -> unseen transfer -> mastery update -> session summary
```

The agent selects one of eight canonical skills, explains the reason for its choice, and adapts the next step from the learner's performance, choosing between another scaffold, a visual explanation, reading reinforcement, an unseen transfer, or a harder mastery challenge. A visible decision timeline records what the agent observed, selected, and changed, and a bounded, anonymous learner profile remembers recurring misconceptions across sessions.

A worked example:

```text
Learner writes:   Store I go yesterday.
Written English:  I went to the store yesterday.
```

The Visual Concept Bridge maps the idea into cards and reorganizes them into written-English structure:

```text
PLACE   store     -> to the store
PERSON  I         -> I
ACTION  go        -> went
TIME    yesterday -> yesterday
```

The concept cards are a contrastive learning aid. SignBridge makes no claim that there is a single universal sign-language word order.

---

## Architecture

SignBridge is a two-tier application. A React single-page app talks to a small stateless API, which is the only component that holds model credentials.

```text
signbridge/
├── frontend/                 # React + Vite Progressive Web App (Vercel)
│   ├── src/app/              # shell, onboarding, accessibility, PWA status
│   ├── src/features/         # grammar, reading, fingerspell, teacher, progress
│   ├── src/shared/           # API client and UI primitives
│   └── src/styles/           # design system
├── backend/                  # Express API (Render)
│   └── src/
│       ├── features/         # grammar and reading routes and schemas
│       ├── domain/           # skills, validation, reviewed offline fallbacks
│       ├── middleware/       # rate limiting
│       └── services/         # model transport and key failover
├── evaluation/               # benchmark, pre/post assessment, pilot protocol
├── render.yaml               # Render blueprint
└── README.md
```

The browser never receives provider credentials. All prompts, schemas, model selection, and keys live on the backend. Requests are size-limited, rate-limited, schema-validated, and restricted by CORS.

---

## AI and on-device pipeline

- **Model.** Google Gemini 2.5 Flash, called with strict structured-JSON schemas so every tutoring response is reliable and parseable. Keys rotate across up to three values with automatic failover on rate-limit errors, a 25-second timeout, and a single retry on provider errors.
- **Diagnosis.** Given the learner's sentence and mastery profile, the model returns the corrected sentence, one focus skill, a plain-language reason, the concept-bridge cards and orderings, a mini-lesson, and two practice items with graduated hints. Every response is validated server-side; invalid output is rejected.
- **Evaluation.** A deterministic exact-match check handles obvious answers without a model call; otherwise the model judges meaning preservation and correct skill use.
- **Reading.** The model generates or adapts a passage to a target reading level, biased toward the learner's weakest skill, with vocabulary and comprehension questions.
- **Fingerspell.** A MediaPipe hand-landmark model runs in the browser with a geometric classifier for the manual-alphabet letters. No server, no cost, works offline after first load.
- **Learner model.** A versioned, anonymous, local per-skill mastery profile (attempts, independent and hinted successes, transfer success, mastery percentage, review scheduling) with bounded qualitative misconception memory. No names, video, or identifiers are stored.
- **Reliability.** When the model is unavailable, reviewed deterministic fallbacks keep grammar and reading working, and the app clearly distinguishes live responses from offline practice.

---

## Quick start

Requirements: Node.js 20 or newer, and a free Gemini API key from https://aistudio.google.com/apikey.

```bash
# 1. Backend
cd backend
cp .env.example .env          # add at least GEMINI_API_KEY
npm install
npm run dev                   # http://localhost:3001

# 2. Frontend (in a second terminal)
cd frontend
cp .env.example .env          # VITE_API_BASE_URL=http://localhost:3001
npm install
npm run dev                   # http://localhost:5173
```

Add up to three keys (`GEMINI_API_KEY`, `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3`) for automatic failover and higher free-tier throughput.

To try the core experience, open the Grammar Bridge tab, type a sentence the way a Deaf student might sign it (for example, `Store I go yesterday.`), and start a session. Open the agent's reasoning, then open the Visual Concept Bridge and transform the sentence.

Run the tests and checks:

```bash
cd backend  && npm test
cd frontend && npm test
cd frontend && npm run verify:pwa
node evaluation/run-benchmark.mjs --limit=5
```

---

## Deployment

**Backend (Render).** Root directory `backend`, build `npm install`, start `npm start`, health check `/health`. Environment: `GEMINI_API_KEY` (plus optional `GEMINI_API_KEY_2` / `_3`) and `ALLOWED_ORIGINS` set to the frontend origin.

**Frontend (Vercel).** Root directory `frontend`, framework preset Vite, output `dist`. Environment: `VITE_API_BASE_URL` set to the Render backend URL.

Set `ALLOWED_ORIGINS` to the exact frontend origin (no trailing slash). The backend also accepts any `*.vercel.app` origin so preview deployments work out of the box.

---

## Project structure

- `frontend/src/features/grammar` adaptive writing agent, session machine, mastery profile, and agent policy.
- `frontend/src/features/reading` reading coach, illustrated passages, bring-your-own-content, and the quiz.
- `frontend/src/features/fingerspell` MediaPipe hand tracking and the manual-alphabet classifier.
- `frontend/src/features/teacher` mastery dashboard and report export.
- `backend/src/features` grammar and reading endpoints with strict schemas.
- `backend/src/domain` canonical skills, server-side validation, and reviewed offline fallbacks.
- `evaluation/` a technical skill-diagnosis benchmark, a paired pre/post assessment, and a consent-focused pilot protocol.

---

## Accessibility and responsible AI

- **Privacy by design.** The learner profile is anonymous and local. No names, video, contact details, or school identifiers are stored. Fingerspelling runs on-device and uploads no video.
- **Honest reporting.** Technical accuracy and learning outcomes are reported separately, and offline practice is never presented as a live model response.
- **Authentic sign content.** SignBridge does not auto-generate or fake sign language; any signed content comes from a real signer.
- **Pedagogical care.** The concept bridge is a contrastive learning aid and explicitly notes there is no single universal sign-language word order.
- **Inclusive by default.** Dyslexia-friendly typography, high contrast, text scaling, reduced motion, and keyboard-accessible flows are available throughout.

---

## Tech stack

React, Vite, Vite-PWA with Workbox, Express, Google Gemini 2.5 Flash, MediaPipe Tasks Vision, and the Node.js test runner.
