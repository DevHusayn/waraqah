# Waraqah Mobile

Native iOS & Android app built with **Expo**, **React Native**, and **TypeScript-ready** JavaScript. It talks to the same Waraqah backend APIs as the web app — not a WebView wrapper.

## Stack

| Layer | Choice |
|-------|--------|
| Runtime | Expo SDK 56 |
| Navigation | React Navigation (native stack + tabs) |
| Server state | TanStack Query |
| Client state | Zustand |
| Forms | React Hook Form + Zod |
| HTTP | Axios |
| Tokens | Expo SecureStore |
| Motion | Reanimated + Gesture Handler |
| Shared logic | `@waraqah/shared` |

## Folder structure

```
apps/mobile/
├── App.js                     # Fonts + providers entry
├── app.json                   # Expo config, icons, deep links
├── src/
│   ├── api/                   # Axios client, config, SecureStore
│   ├── components/            # UI kit + shared widgets
│   ├── constants/             # Brand strings
│   ├── context/               # Auth, invoices, settings, toasts
│   ├── hooks/
│   ├── navigation/            # Root, tabs, stacks
│   ├── providers/             # Query + network + app shell
│   ├── schemas/               # Zod validators
│   ├── screens/               # Feature screens
│   ├── stores/                # Zustand (onboarding, theme, offline)
│   ├── theme/                 # Waraqah design tokens
│   └── utils/
```

## Setup

1. Copy env file and set the API base URL (must include `/api`):

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

```env
EXPO_PUBLIC_API_URL=https://api.mywaraqah.com/api

# Physical device → use your PC LAN IP instead of localhost
# EXPO_PUBLIC_API_URL=http://192.168.1.100:5000/api
```

2. Install from the **repo root**:

```bash
npm install
```

3. Start Expo:

```bash
npm run mobile
```

Or from this package:

```bash
cd apps/mobile
npx expo start
```

## Auth flow

1. Animated splash → onboarding (first launch) → welcome  
2. Login / Register / Forgot & reset password  
3. Email verification gate (`CheckEmail`) — matches backend (no auto-login on register)  
4. JWT stored in SecureStore; `GET /auth/me` validates session on boot  
5. 401 responses clear the session and return to auth

## Navigation

Bottom tabs:

- **Home** — greeting, revenue, quick actions, recent activity  
- **Invoices** — list, create, detail, drafts  
- **Clients**  
- **Products**  
- **Profile** — settings, statements, upgrade, theme, logout  

## Deep links

Scheme: `waraqah://`

| Link | Purpose |
|------|---------|
| `waraqah://reset-password/:token` | Password reset |
| `waraqah://upgrade/callback?reference=...` | Paystack return |

## Offline

- NetInfo drives a global offline banner  
- TanStack Query caches list/dashboard responses  
- Failed mutations surface retry-friendly errors  

## EAS builds

```bash
cd apps/mobile
npx eas-cli build --profile preview
npx eas-cli build --profile production
```

Profiles: [`eas.json`](./eas.json)

## Brand

- Primary: `#16A34A`  
- Tagline: `Invoice. Get Paid. Grow.`  
- Font: Inter  
- Splash / adaptive icon backgrounds use brand emerald (not legacy blue)

## Future-ready

Architecture leaves room for payment links, teams, multi-business, inventory, expenses, AI assistant, OCR, bank sync, and push notifications without rewriting the shell.
