# Waraqah Mobile — Architecture

## Principles

1. **Native-first** — React Native screens, native navigation, haptics, gestures. No WebView shell.
2. **Shared domain** — Business rules live in `@waraqah/shared`; mobile owns presentation and device APIs.
3. **Secure auth** — JWT in SecureStore only; never AsyncStorage for tokens.
4. **Optimistic UX** — Skeletons, empty/error/offline states, pull-to-refresh on every list.

## Layers

```
UI (screens/components)
  → hooks / React Query
    → api (axios)
      → Waraqah REST API
Zustand / Context — session, settings, ephemeral UI
```

## State ownership

| Concern | Store |
|---------|--------|
| JWT + user session | `AuthContext` + SecureStore |
| Invoices / clients / products cache | `InvoiceContext` (+ Query for new screens) |
| Business settings | `SettingsContext` |
| Onboarding, theme preference, offline flag | Zustand `useAppStore` |
| Toasts | `ToastContext` |

## Extending features

Add a feature folder under `src/features/<name>/` when a domain grows beyond one screen:

```
features/payments/
  api.ts
  hooks.ts
  screens/
  components/
```

Keep route registration in `src/navigation`.

## Auth notes

- Backend does **not** issue refresh tokens (24h JWT). Re-login on expiry.
- Register returns a message only — navigate to `CheckEmail`, then Login after verify.
- Bearer auth skips CSRF (cookie sessions are web-only).
