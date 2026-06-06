# Demb

**Protect your time, energy, and focus.**

Demb is a playful recovery and focus app for people who want to break scrolling loops, rebuild attention, and stay connected with supportive buddies. It combines recovery scoring, focus missions, streaks, buddy circles, Supabase sync, and AI-supported recovery plans.

<p align="center">
  <img src="./assets/images/demb-app-logo.png" alt="Demb app character" width="220" />
</p>

## Current Demo Status

Demb is currently a demo mocked version. The app is usable for trying the product flow, screen design, onboarding, recovery missions, support chat, buddy circles, rewards, and profile experience, but some production behavior is still being implemented.

Several flows use seeded, local, fallback, or simulated data while we finish the real integrations. Because this demo runs through Expo Go, it cannot fully access custom native modules, phone sensors, Usage Access, overlay permissions, Health Connect, background services, or other special Android permissions right now. Features that depend on those capabilities may show the UI, use fallback data, or behave as a preview instead of a complete native implementation.

## Why Demb Exists

Modern burnout is not always dramatic. Sometimes it looks like opening the same apps again, losing track of time, feeling foggy, or needing a small nudge to recover. Demb turns that nudge into a friendly mobile experience: check your recovery score, start a mission, lock into a healthier rhythm, and keep your streak alive with buddy support.

## App Preview

<p align="center">
  <img src="./assets/readme/welcome.png" alt="Demb welcome screen" width="180" />
  <img src="./assets/readme/home.png" alt="Demb home recovery screen" width="180" />
</p>

## Features In This Demo

- **Onboarding:** Choose your main challenges, goals, habits, stress level, and preferred recovery style.
- **Recovery score:** See a friendly snapshot of current recovery state, burnout risk, and suggested actions.
- **Mood check-ins:** Log mood, energy, stress, focus, overwhelm, and notes.
- **Break Loop missions:** Try guided recovery tasks such as breathing, walking, screen-off resets, sound therapy, and other small actions.
- **Focus lock preview:** Explore the Shield and focus-lock flow that will later connect to native Android blocking.
- **Support chat:** Use supportive AI-style recovery prompts with local fallback responses.
- **AI recovery plans:** Generate personalized recovery plan previews using local fallback logic and configured AI/Supabase services when available.
- **Buddy support:** View buddy circles, group streaks, feed activity, cheers, encouragement, and shared progress.
- **Recovery tree and rewards:** Track progress, points, achievements, tree growth, and profile milestones.
- **Local persistence:** Zustand and Expo SQLite keep demo state responsive locally.
- **Supabase-ready sync:** Auth, profile sync, buddy feed, buddy groups, and recovery tree sync hooks are included for configured Supabase projects.

## Expo Go Disclaimer

Expo Go is the recommended way to try this demo right now. It is fast and does not require downloading an app package from this repository.

Expo Go has important limits for Demb:

- It cannot load the custom native Android blocker in `plugins/withDembNativeBlocker.js`.
- It cannot provide real Usage Access, overlay blocking, boot receivers, foreground services, or Health Connect permissions for this project.
- Phone sensors and location-based mission checks may not be available or may fall back to simulated progress.
- The Shield and focus-lock screens are useful for previewing the product flow, but real app blocking requires a custom native build.
- Production-grade permissions, real sensor access, and deeper native behavior are still being implemented.

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

## Project Structure

```text
.
|-- AI/                         # Python AI recovery-plan service
|-- assets/                     # App icons, splash, fonts, images
|-- plugins/                    # Custom Expo native config plugins
|-- src/
|   |-- app/                    # Expo Router screens and layouts
|   |-- components/             # Shared UI components
|   |-- constants/              # Theme, colors, app constants
|   |-- types/                  # TypeScript domain types
|   |-- utils/                  # Supabase, AI, native helpers
|   |-- db.ts                   # SQLite schema and persistence helpers
|   `-- store.ts                # Main Zustand app store
|-- supabase/functions/         # Supabase Edge Functions
|-- app.json                    # Expo app config
|-- eas.json                    # EAS build profiles
`-- package.json                # Scripts and dependencies
```

## Requirements

- Node.js 20 or newer
- npm
- Expo Go installed on your Android or iOS phone
- A phone and computer on the same Wi-Fi network, or Expo tunnel mode
- Optional: Android Studio and an emulator for local Android development
- Optional: Supabase project access for cloud sync
- Optional: Python 3.11+ for running the AI service locally

## Environment

Copy the example environment file before local development:

```bash
copy .env.example .env.local
```

Then update `.env.local` if you have your own services:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=your-supabase-anon-or-publishable-key
EXPO_PUBLIC_AI_ENGINE_URL=https://your-ai-engine-url.example.com
```

These values are public client configuration. Do not place Supabase service-role keys in this app.

The app can still run as a demo when some services are unavailable, but Supabase sync and hosted AI features require valid configuration.

## Install

```bash
npm install
```

## Run With Expo Go

Start the Expo development server:

```bash
npm start
```

Then open the app on a phone:

1. Install **Expo Go** from Google Play or the App Store.
2. Make sure your phone and computer are on the same Wi-Fi network.
3. Scan the QR code shown in the terminal or Expo DevTools.
4. Wait for Metro to bundle the app.
5. Walk through Welcome, onboarding, Home, Support, Buddies, Shield, Rewards, and Profile.

If the phone cannot connect on the same network, start Expo with a tunnel:

```bash
npx expo start --tunnel
```

For an Android emulator, start Expo and press `a` in the terminal:

```bash
npm start
```

For a quick browser preview:

```bash
npm run web
```

The web preview is useful for checking screens, but the mobile experience should be tried in Expo Go.

## What To Try First

- Complete onboarding with a recovery goal such as focus, sleep, movement, or wellbeing.
- Open Home and review the recovery score, active recommendations, buddy snapshot, and mission entry points.
- Start a Break Loop mission and complete the timer-based flow.
- Try the walking mission, knowing that sensor or GPS checks may fall back to simulated progress in Expo Go.
- Open Support and send a message to see the recovery-support flow.
- Visit Buddies to review circles, group progress, cheers, and encouragement.
- Open Shield to preview the focus lock and app-blocking flow without expecting real native blocking in Expo Go.
- Check Rewards and Profile for points, achievements, streaks, and profile state.

## Native Development Notes

Expo Go is for the current demo. Native behavior needs a custom development build because Demb includes custom Android configuration and permissions.

Use this only when working on native behavior:

```bash
npm run android
```

After a custom development build is installed, start Metro for that dev client:

```bash
npm run dev
```

Native behavior that requires a custom build includes app usage monitoring, overlay blocking, foreground services, boot handling, Health Connect, and the custom Android blocker plugin.

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

This fallback chain lets local development and native builds use the same public client configuration pattern.

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

For a physical phone, `localhost` means the phone itself, not your computer. Use a reachable LAN address or a public HTTPS URL if the mobile app needs to call the AI service.

## Troubleshooting

### Expo Go does not open the app

- Confirm your phone and computer are on the same Wi-Fi network.
- Restart Metro with `npm start`.
- Try tunnel mode with `npx expo start --tunnel`.
- Clear the Expo cache with `npx expo start --clear` if bundling gets stuck.

### Supabase is not configured

- Confirm `.env.local` exists for local development.
- Confirm `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_KEY` are set.
- Restart Expo after changing public Expo environment values.

### AI plans fail

- Confirm `EXPO_PUBLIC_AI_ENGINE_URL` points to a reachable service.
- Use a LAN or HTTPS URL when testing from a physical phone.
- Check Supabase Edge Function logs if the app is calling a Supabase function.
- Check the AI service health endpoint or hosting logs.

### Sensors, permissions, or app blocking do not work

- This is expected in the Expo Go demo.
- Expo Go cannot load Demb's custom Android blocker module.
- Sensor, Health Connect, Usage Access, overlay, and background-service features require custom native implementation and a custom development build.

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

## Implementation Status

Demb is actively being implemented. The current repository is intended to show the app direction, product experience, UI, local recovery flows, mocked support behavior, and integration points. Native permissions, real device-sensor access, production app blocking, and complete cloud-backed behavior are still in progress.
