# Demb

**Protect your time, energy, and focus.**

Demb is a playful recovery and focus app for people who want to break scrolling loops, rebuild attention, and stay connected with supportive buddies. It combines gentle character design, recovery scoring, focus missions, streaks, buddy circles, Supabase sync, and AI-supported recovery plans.

<p align="center">
  <img src="./assets/images/demb-app-logo.png" alt="Demb app character" width="220" />
</p>

## Why Demb Exists

Modern burnout is not always dramatic. Sometimes it looks like opening the same apps again, losing track of time, feeling foggy, or needing a small nudge to recover. Demb turns that nudge into a friendly mobile experience: check your recovery score, start a mission, lock into a healthier rhythm, and keep your streak alive with buddy support.

## App Preview

<p align="center">
  <img src="./assets/readme/welcome.png" alt="Demb welcome screen" width="180" />
  <img src="./assets/readme/home.png" alt="Demb home recovery screen" width="180" />
</p>

## Highlights

- **Recovery score:** A clear, friendly snapshot of the user's current rhythm.
- **Break Loop missions:** Guided recovery actions for stepping away from draining app loops.
- **Focus lock:** Native Android-oriented blocking and focus support.
- **Buddy support:** Circles, streak competition, feed events, cheers, and group progress.
- **Recovery tree:** A visual progress layer that grows with healthy behavior.
- **AI recovery plans:** Personalized suggestions through Supabase Edge Functions and the Python AI engine.
- **Local-first state:** SQLite and Zustand keep the experience responsive even before sync completes.
- **Build-ready configuration:** Supabase and AI public config are available to installed EAS builds.

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
- EAS Build for Android packages

## Project Structure

```text
.
├── AI/                         # Python AI recovery-plan service
├── assets/                     # App icons, splash, fonts, images
├── plugins/                    # Custom Expo native config plugins
├── src/
│   ├── app/                    # Expo Router screens and layouts
│   ├── components/             # Shared UI components
│   ├── constants/              # Theme, colors, app constants
│   ├── types/                  # TypeScript domain types
│   ├── utils/                  # Supabase, AI, native helpers
│   ├── db.ts                   # SQLite schema and persistence helpers
│   └── store.ts                # Main Zustand app store
├── supabase/functions/         # Supabase Edge Functions
├── app.json                    # Expo app config
├── eas.json                    # EAS build profiles
└── package.json                # Scripts and dependencies
```

## Requirements

- Node.js 20 or newer
- npm
- Expo CLI through `npx expo`
- Android Studio and an emulator, or a physical Android device
- EAS CLI for cloud builds: `npm install -g eas-cli`
- Supabase project access
- Optional: Python 3.11+ for running the AI service locally

## Environment

Create a local `.env.local` file for development:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://xgzdszsfnilsqgqrnkxo.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=your-supabase-anon-or-publishable-key
EXPO_PUBLIC_AI_ENGINE_URL=https://your-ai-engine-url.example.com
```

These values are public client configuration. The app also embeds them in Expo `extra` and `eas.json` so installed Android builds can connect to Supabase and the AI engine after EAS builds. Do not place Supabase service-role keys in this app.

## Install

```bash
npm install
```

## Run The App

Start Expo:

```bash
npm start
```

Run a development client build:

```bash
npm run dev
```

Run on Android:

```bash
npm run android
```

Run web for quick UI checks:

```bash
npm run web
```

Expo Go is not enough for every feature because this project uses native modules, custom permissions, and native blocking configuration. Use a development build or installed APK for realistic testing.

## Lint

```bash
npm run lint
```

The current lint setup may report warnings for older screens and hooks. Warnings do not block the script, but they are useful cleanup targets before a production release.

## Supabase Setup

The app expects Supabase Auth and app tables used by profile sync, buddy feed, buddy groups, and recovery tree progress.

Client configuration is loaded from:

1. `process.env.EXPO_PUBLIC_SUPABASE_URL`
2. `process.env.EXPO_PUBLIC_SUPABASE_KEY` or `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. Expo embedded `extra` values in `app.json`

This fallback chain prevents installed EAS builds from showing `Supabase is not configured` when local `.env.local` is not present inside the build environment.

## Supabase Edge Functions

Edge functions live in:

```text
supabase/functions/groq-recovery-plan
supabase/functions/groq-support-chat
```

Deploy them with the Supabase CLI from the project root:

```bash
supabase functions deploy groq-recovery-plan
supabase functions deploy groq-support-chat
```

Set provider secrets in Supabase, not in the mobile app:

```bash
supabase secrets set GROQ_API_KEY=your_key
```

## AI Engine

The `AI/` folder contains a small FastAPI service that can run separately from the mobile app.

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

For hosted builds, use a public HTTPS URL because installed Android apps cannot call your computer's `localhost`.

## Android Builds

Create a development APK:

```bash
npm run build:android:dev
```

Create an internal preview APK:

```bash
eas build --profile preview --platform android
```

Create a production Android App Bundle:

```bash
eas build --profile production --platform android
```

Build profiles in `eas.json` include the public Supabase and AI URLs required by installed builds.

## Native Notes

`plugins/withDembNativeBlocker.js` customizes Android native configuration for app blocking and related permissions. After changing native plugins, permissions, package name, or Android build settings, rebuild the development client or APK.

## Troubleshooting

### Supabase is not configured

- Confirm `.env.local` exists for local development.
- Confirm `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_KEY` are set in the EAS profile used for the build.
- Rebuild the app after changing public Expo environment values. They are embedded at build time.

### Auth works locally but not in the APK

- Install a fresh APK after changing `app.json`, `eas.json`, or `.env.local`.
- Confirm the built profile is `development`, `preview`, or `production` from this repo's `eas.json`.
- Check Supabase Auth settings and allowed redirect/deep-link URLs if using redirect flows.

### AI plans fail

- Confirm `EXPO_PUBLIC_AI_ENGINE_URL` points to a public HTTPS deployment for installed builds.
- Check Supabase Edge Function logs if the app is calling a Supabase function.
- Check the AI service health endpoint or hosting logs.

### Native behavior does not update

- Stop Metro.
- Rebuild the development client or APK.
- Reinstall the app on the device.

## Useful Commands

```bash
npm install
npm start
npm run dev
npm run android
npm run web
npm run lint
npm run build:android:dev
eas build --profile preview --platform android
eas build --profile production --platform android
```

## Release Checklist

- Run `npm run lint`
- Verify sign up and sign in on a clean installed APK
- Verify Supabase profile sync
- Verify buddy feed and recovery tree sync
- Verify focus-lock and mission flows on a real Android device
- Verify AI recovery plan generation
- Build with the intended EAS profile
