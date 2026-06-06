---
title: Demb AI Engine
emoji: 🧠
colorFrom: green
colorTo: purple
sdk: docker
pinned: false
license: mit
---

# Demb AI Engine

Deploy this folder as a Hugging Face Docker Space.

## Secrets

Set these Space secrets:

- `GROQ_API_KEY`: your Groq API key.
- `GROQ_MODEL`: optional. Default is `llama-3.1-8b-instant`.

## Endpoints

- `GET /health`
- `POST /support-chat`
- `POST /recovery-plan`

## Local Run

```bash
cd AI
pip install -r requirements.txt
set GROQ_API_KEY=your_key_here
uvicorn app:app --host 0.0.0.0 --port 7860
```

## App Connection

After deploying the Space, set this in the Expo app environment:

```bash
EXPO_PUBLIC_AI_ENGINE_URL=https://your-space-url.hf.space
```

The mobile app calls this engine first. If it is unavailable, it falls back to Supabase Edge Functions, then local offline support.

## Safety

This AI gives digital-wellness support, not medical care. It avoids diagnosis and includes crisis routing for self-harm, suicide, harm-to-others, abuse, or immediate danger language.
