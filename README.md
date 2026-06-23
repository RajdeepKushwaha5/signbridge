# SignBridge — from sign to sentence

SignBridge is an adaptive literacy tutor for Deaf and Hard-of-Hearing learners. It bridges ASL-influenced writing into clear written English and creates leveled reading practice with visual vocabulary support.

Built for **EdTech 3.0 — AI in Education Hackathon**, Track 3: Accessibility & Inclusive Learning.

## Live links

- **Live app:** https://signbridge-delta.vercel.app/
- **Backend health:** https://signbridge-api-49qf.onrender.com/health
- **GitHub repository:** https://github.com/RajdeepKushwaha5/signbridge

## Repository structure

```text
signbridge/
├── frontend/                # React + Vite interface, deployed on Vercel
│   ├── src/
│   │   ├── app/             # shell, navigation, accessibility preferences
│   │   ├── features/        # grammar bridge and reading coach
│   │   ├── shared/          # API client and UI primitives
│   │   └── styles/          # design system and responsive rules
│   ├── .env.example
│   └── vercel.json
├── backend/                 # Express API, deployed on Render
│   ├── src/
│   │   ├── features/        # validated educational workflows and schemas
│   │   ├── middleware/      # request rate limiting
│   │   └── services/        # Gemini transport and key failover
│   └── .env.example
├── render.yaml              # Render Blueprint
└── README.md
```

Gemini keys, prompts, response schemas, model selection, and key rotation live only in the backend. The browser sends narrow task inputs and never receives provider credentials.

## Adaptive grammar loop

The judged core follows a complete tutoring cycle:

```text
write → diagnose → mini-lesson → guided rewrite → hints/retry
      → unseen transfer → mastery update → session summary
```

The agent selects one of eight canonical skills, explains why it chose that skill, and maps the learner's meaning into visual `TIME`, `TOPIC`, `PERSON`, `ACTION`, `OBJECT`, and `PLACE` cards. The learner rebuilds those cards in written-English structure before attempting guided and unseen-transfer rewrites.

Adaptive routing chooses between another scaffold, visual explanation, reading reinforcement, unseen transfer, and mastery challenge from assessed performance. The versioned anonymous local profile retains bounded qualitative misconception evidence and can produce grounded statements such as a learner independently resolving a previously observed tense pattern. A visible decision timeline shows what the agent observed, selected, and changed. Reviewed built-in exercises keep this complete loop available when the live model is unavailable.

## Install and offline learning

SignBridge is an installable Progressive Web App. After one successful online visit, the app shell and reviewed Grammar Bridge and Read & Decode lessons remain available without a network connection. The interface clearly labels offline lessons and automatically uses deterministic local exercises when the API or Gemini cannot be reached.

Fingerspell uses a larger third-party MediaPipe hand model. Its assets are cached after their first successful use, so it becomes offline-capable only after the learner has opened that feature online once. Live AI generation always requires a connection; offline mode never pretends a generated response came from Gemini.

## Local development

Requirements: Node.js 20 or newer.

1. Configure the backend:

```bash
cd backend
cp .env.example .env
# Add at least GEMINI_API_KEY
npm install
npm run dev
```

2. In a second terminal, start the frontend:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`; the API runs at `http://localhost:3001`.

## API

- `GET /health` — service and model configuration status.
- `POST /api/grammar/bridge` — accepts `{ sentence, profile }` and returns diagnosis, lesson, guided practice, and unseen transfer.
- `POST /api/grammar/practice/check` — accepts the practice context and learner rewrite for semantic evaluation.
- `POST /api/reading/passage` — accepts `{ level, topic }`.

Requests are size-limited, rate-limited, validated, restricted by CORS, and time out after 25 seconds at the model boundary.

## Tests and evidence

```bash
cd backend && npm test
cd frontend && npm test
cd frontend && npm run verify:pwa
node evaluation/run-benchmark.mjs --limit=5
node evaluation/summarize-pilot.mjs evaluation/pilot-results.json
```

`evaluation/` contains a 48-case technical benchmark, a paired 10-item pre/post assessment, a consent-focused pilot protocol, and a results template. These materials are marked pending Deaf educator review. Benchmark results and learner outcomes must always be reported separately and only from observed data.

## Deploy the backend on Render

The repository includes `render.yaml`, so it can be deployed as a Render Blueprint. Alternatively create a Web Service with:

- **Root directory:** `backend`
- **Build command:** `npm install`
- **Start command:** `npm start`
- **Health check:** `/health`

Set these Render environment variables:

```text
GEMINI_API_KEY=...
GEMINI_API_KEY_2=...        # optional failover
GEMINI_API_KEY_3=...        # optional failover
ALLOWED_ORIGINS=https://your-vercel-domain.vercel.app
```

For the current deployment:

```text
ALLOWED_ORIGINS=https://signbridge-delta.vercel.app
```

After deployment, verify `https://signbridge-api-49qf.onrender.com/health`.

## Deploy the frontend on Vercel

Import the same repository and configure:

- **Root directory:** `frontend`
- **Framework preset:** Vite
- **Build command:** `npm run build`
- **Output directory:** `dist`

Set one Vercel environment variable:

```text
VITE_API_BASE_URL=https://your-render-domain.onrender.com
```

For the current deployment:

```text
VITE_API_BASE_URL=https://signbridge-api-49qf.onrender.com
```

Redeploy the frontend whenever this URL changes. Add the final Vercel URL, currently `https://signbridge-delta.vercel.app`, to `ALLOWED_ORIGINS` on Render.

## Production checklist

- Confirm `/health` returns `configured: true`.
- Confirm Render `ALLOWED_ORIGINS` exactly matches the Vercel origin.
- Test Grammar Bridge and Read & Decode from the deployed Vercel site.
- Warm the Render service before recording or presenting the demo.
- Never add `.env` files to version control.
