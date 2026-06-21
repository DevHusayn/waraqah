# Waraqah Mobile (Expo)

React Native app for iOS and Android — full feature parity with the web app.

## Setup

1. Copy `.env.example` to `.env` and set your API URL:

```bash
EXPO_PUBLIC_API_URL=https://your-api.vercel.app/api
```

2. From the repo root, install dependencies:

```bash
npm install
```

3. Start the app:

```bash
npm run mobile
```

## Build (EAS)

```bash
cd apps/mobile
npx eas-cli build --profile preview
npx eas-cli build --profile production
```

Profiles are defined in [`eas.json`](./eas.json).

## Deep links

- Paystack return: `waraqah://upgrade/callback?reference=...`
- Password reset: configure your backend email links to open the app or web reset flow

## Shared code

Business logic lives in [`packages/shared`](../packages/shared) and is used by both web and mobile.
