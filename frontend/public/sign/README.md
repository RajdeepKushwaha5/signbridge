# Signed welcome clip — drop your file here

SignBridge shows a **"Watch this welcome in sign language"** button on the first
onboarding screen. It appears **only** when a real clip is present, and hides
gracefully otherwise. We never fabricate or auto-generate sign language.

## What to add

1. **`welcome.mp4`** — a 20–40 second clip of a **real signer** (a Deaf presenter
   is strongly preferred — this is also what earns authenticity with judges)
   signing the welcome. Place it in this folder: `public/sign/welcome.mp4`.
2. **`welcome.vtt`** *(optional but recommended)* — English captions for the clip,
   so the welcome is accessible in both sign and text. Template below.

That's it — no code changes. The button and player pick the files up automatically.

## Suggested script for the signed welcome (~30s)

> "Welcome to SignBridge. For many Deaf people, sign is our first language, and
> written English is a second language with different grammar. SignBridge is a
> tutor that helps you bridge the two — at your own pace. Let's begin."

Sign it naturally in ASL (or your sign language) — do not sign English word-for-word.
Film in landscape, good lighting, plain background, hands and face clearly visible.

## `welcome.vtt` caption template (edit the timings to match your clip)

```
WEBVTT

00:00:00.000 --> 00:00:06.000
Welcome to SignBridge.

00:00:06.000 --> 00:00:16.000
For many Deaf people, sign is our first language, and written English is a second language with different grammar.

00:00:16.000 --> 00:00:26.000
SignBridge is a tutor that helps you bridge the two — at your own pace.

00:00:26.000 --> 00:00:30.000
Let's begin.
```

## Recording it with a Deaf collaborator (recommended)

Having a Deaf person record this clip does two things at once:
1. Gives you an **authentic, sign-first** welcome (closes the UX/authenticity gap).
2. Counts as **Deaf-community validation** of the project — quote them in your demo.
