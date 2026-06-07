# Demb

**Protect your time, energy, and focus.**

Demb is a digital wellness recovery app built around one simple idea: people do not only need another productivity timer; they need a supportive system that helps them notice draining patterns, pause before spiraling, recover with small actions, and stay accountable with people who care.

This repository contains the Demb demo version: a polished, runnable mobile experience that shows the product vision, core recovery loop, AI support flow, social accountability layer, and integration-ready architecture.

<p align="center">
  <img src="./assets/images/demb-app-logo.png" alt="Demb app character" width="220" />
</p>

## What We Built

Demb turns digital burnout prevention into a guided mobile experience:

- **Personal onboarding** that learns the user's challenges, goals, stress level, habits, and preferred recovery style.
- **Recovery score** that translates behavior signals into a clear wellness snapshot.
- **Digital Balance dashboard** for screen-time awareness and high-dopamine app patterns.
- **Break Loop missions** that give the user an immediate recovery action instead of another empty warning.
- **Shield flow** that previews focused app restriction sessions and the lock-screen recovery experience.
- **AI support chat** for warm, private, emotionally aware recovery conversations.
- **AI recovery plans** that connect risk signals, recovery tasks, digital rules, and supportive prompts.
- **Buddy circles** for accountability, encouragement, shared streaks, and group progress.
- **Recovery tree and rewards** that make progress visible through points, achievements, and growth.
- **Local-first state** using Zustand and Expo SQLite so the app feels responsive.
- **Supabase-ready backend layer** for auth, profiles, buddy feeds, recovery tree sync, and Edge Functions.
- **Python FastAPI AI service** for recovery-plan and support-chat orchestration.
- **Android native plugin foundation** for future device-level focus protection and recovery signals.

## Why It Matters

Most digital wellness tools stop at tracking or blocking. Demb goes further: it gives the user a recovery path at the exact moment they are most likely to fall back into the loop.

The experience is designed to feel supportive, not punitive. A user can see their state, start a small mission, talk through an urge, build streaks with buddies, and return to their day with a little more control.

## Product Preview

<p align="center">
  <img src="./assets/readme/welcome.png" alt="Demb welcome screen" width="180" />
  <img src="./assets/readme/home.png" alt="Demb home recovery screen" width="180" />
</p>

## Demo Walkthrough

For a quick review, run the app and try this flow:

1. Start at the welcome screen and complete onboarding.
2. Open Home to see the recovery score, mission card, plan entry, and Digital Balance area.
3. Start a recovery mission from the Challenge or Start Recovery button.
4. Visit Support and send a message to experience the AI companion flow.
5. Open Buddies to see circles, encouragement, group progress, and social accountability.
6. Open Shield to preview a focused restriction session.
7. Check Rewards and Profile to see progress, points, streaks, achievements, and plan status.

## Expo Go Demo Note

The fastest way to try Demb is through Expo Go. This demo version shows the product experience and core app flows immediately.

Expo Go does not reach Demb's custom phone-sensor and native Android permission layer yet, so sensor-based and native permission-driven behavior is being prepared through custom Android builds while the Expo Go demo stays easy to run.

## Tech Stack

- Expo SDK 54
- React 19 and React Native 0.81
- Expo Router
- TypeScript
- Zustand
- Expo SQLite
- Supabase JS
- Supabase Edge Functions
- Python FastAPI AI service
- EAS Build for native Android testing

## Architecture

```text
.
|-- AI/                         # Python AI recovery-plan and support service
|-- assets/                     # App icons, splash, fonts, images, README media
|-- plugins/                    # Custom Expo native config plugins
|-- src/
|   |-- app/                    # Expo Router screens and layouts
|   |-- components/             # Shared UI components
|   |-- constants/              # Theme, colors, app constants
|   |-- types/                  # TypeScript domain types
|   |-- utils/                  # Supabase, AI, native, and wellness helpers
|   |-- db.ts                   # SQLite schema and persistence helpers
|   `-- store.ts                # Main Zustand app store
|-- supabase/functions/         # Supabase Edge Functions
|-- app.json                    # Expo app config
|-- eas.json                    # EAS build profiles
`-- package.json                # Scripts and dependencies
```

## Run The Demo

### Requirements

- Node.js 20 or newer
- npm
- Expo Go on Android or iOS
- A phone and computer on the same Wi-Fi network, or Expo tunnel mode

### Install

```bash
npm install
```

### Start

```bash
npm start
```

Then scan the QR code with Expo Go.

If your phone is on a different network, use tunnel mode:

```bash
npx expo start --tunnel
```

For a quick browser preview:

```bash
npm run web
```

## Environment

Create a local environment file:

```bash
copy .env.example .env.local
```

Update values when using your own services:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=your-supabase-anon-or-publishable-key
EXPO_PUBLIC_AI_ENGINE_URL=https://your-ai-engine-url.example.com
```

These are public client values. Do not put Supabase service-role keys in the mobile app.

## Supabase Layer

Demb is structured for cloud-backed growth:

- Supabase Auth for user identity.
- Profile sync for recovery state and settings.
- Buddy feed and buddy group records for accountability loops.
- Recovery tree sync for shared progress.
- Edge Functions for Groq-powered recovery plans and support chat.

Deploy functions from the project root:

```bash
supabase functions deploy groq-recovery-plan
supabase functions deploy groq-support-chat
```

Set provider secrets in Supabase:

```bash
supabase secrets set GROQ_API_KEY=your_key
```

## AI Engine

The `AI/` folder contains a FastAPI service that can power the recovery-plan and support-chat experience.

Run locally:

```bash
cd AI
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

Then point the app to it:

```bash
EXPO_PUBLIC_AI_ENGINE_URL=http://localhost:8000
```

For a physical phone, use a LAN address or public HTTPS URL instead of `localhost`.

## Native Android Path

Demb already includes an Android-native plugin foundation in `plugins/withDembNativeBlocker.js`. That path is where the deeper phone-sensor and permission-based focus protection work connects into the React Native experience.

For native development:

```bash
npm run android
```

After installing a custom development build:

```bash
npm run dev
```

## Useful Commands

```bash
npm install
npm start
npx expo start --tunnel
npx expo start --clear
npm run web
npm run lint
npm run android
npm run dev
```

## Project Signal

Demb demonstrates a complete product direction, not just a screen mockup: a recovery-focused mobile UI, local persistence, social accountability, AI-guided support, Supabase integration points, and native Android expansion architecture. The result is a strong foundation for a real digital wellness product that helps people recover attention with care instead of shame.
