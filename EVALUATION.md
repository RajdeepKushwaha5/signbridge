# SignBridge Evaluation

This document reports how SignBridge's AI behaves on a fixed, reproducible benchmark. It measures **model behavior** (does the agent diagnose the right skill, and does it always return a valid, safe, structured response), not learner outcomes. Classroom impact is a separate question, covered by the pre/post assessment and pilot protocol in `evaluation/` and reported separately.

- **Model:** Google Gemini 2.5 Flash (structured-JSON output)
- **Benchmark:** `evaluation/benchmark.json` (version 1), 48 cases
- **Run date:** 2026-06-25
- **Reproduce:** start the backend, then `node evaluation/run-benchmark.mjs`

---

## What the benchmark contains

48 fixed cases:

- **40 skill cases**, five for each of the eight canonical grammar skills (articles, verb tense, subject-verb agreement, copula, plurals, prepositions, topic-comment, word order). Each case has a sentence written in sign-influenced English and the expected focus skill.
- **8 control cases** with no expected skill: already-correct English, ambiguous meaning, general sentences, and adversarial or oversized input. These check that the system stays safe and valid on inputs that should not be force-corrected.

The runner paces requests to respect the free-tier rate limit. When the live model is rate-limited, the request falls back to a reviewed deterministic path; those cases are reported separately and never counted as live model accuracy.

---

## Results (run of 2026-06-25)

| Metric | Result |
|---|---|
| **Live skill-diagnosis accuracy** | **87.5% (28 / 32)** |
| **Concept-bridge structural validity** | **100% (48 / 48)** |
| **Valid, safe response rate** | **100% (48 / 48)** |
| Request failures | 0 |
| Cases served live vs. fallback | 32 live, 16 fallback |
| Fallback reliability | 16 / 16 degraded gracefully, 0 errors |
| Response latency (full structured lesson, live) | p50 ~12.5s, p90 ~18s |

Notes on each metric:

- **Skill-diagnosis accuracy** measures whether the agent selected the same focus skill a human reviewer expected, on the cases that ran on the live model. Following standard practice, only live responses are counted as model performance; fallback responses are reported separately as reliability.
- **Concept-bridge structural validity** checks that every response returned a well-formed visual concept bridge: a non-empty set of role cards, and learner-order and English-order lists that are consistent permutations of the same card IDs. This held for every case, live and fallback.
- **Valid, safe response rate** checks that every request returned a schema-valid response and no case produced an error, including the adversarial and oversized control inputs.
- **Latency** is the time for a single call that returns the entire lesson (corrected sentence, focus skill and reason, concept-bridge cards and orderings, mini-lesson, and two practice items with graduated hints) in one structured generation. The deterministic exact-match and fallback paths return instantly.

---

## Error analysis

All four live misses were the same confusion: a `topic-comment` sentence was diagnosed as `word_order`.

```text
topic-01  expected topic_comment  ->  diagnosed word_order
topic-02  expected topic_comment  ->  diagnosed word_order
topic-03  expected topic_comment  ->  diagnosed word_order
topic-05  expected topic_comment  ->  diagnosed word_order
```

This is an explainable, adjacent-skill confusion rather than random error. Topic-comment and word order are closely related: both concern how the order of ideas changes between sign-influenced structure and written English. In each of these cases the agent still produced a meaning-preserving correction and a valid concept bridge; it chose a neighboring word-order skill rather than the most specific label. This is the kind of failure mode that is safe to ship and straightforward to tighten in the diagnosis prompt.

---

## What these numbers do and do not show

- **They show** that the agent reliably returns structured, schema-valid, safe responses (including on adversarial input), that it builds a structurally valid visual concept bridge every time, and that it selects the expected focus skill in a large majority of live cases, with a single, explainable failure mode.
- **They do not show** classroom learning outcomes. Model accuracy and learner outcomes are different questions and are reported separately. The `evaluation/` folder includes a paired 10-item pre/post assessment and a consent-focused pilot protocol designed for supervised classroom validation.

---

## Reproducing this run

```bash
# 1. Start the backend with at least one Gemini key
cd backend && npm run dev

# 2. Run the benchmark (paced for the free tier)
node evaluation/run-benchmark.mjs

# Optional: a quick subset
node evaluation/run-benchmark.mjs --limit=5
```

Each run writes a full per-case JSON report to `evaluation/results/` and prints a summary. Skill accuracy is reported for live responses only; fallback counts are reported separately.
