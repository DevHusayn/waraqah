import { googleLogout } from '@react-oauth/google';

export function clearGoogleAuthSession(email) {
    if (typeof window === 'undefined') return;

    googleLogout();

    const googleAccounts = window.google?.accounts?.id;
    if (!googleAccounts || !email) return;

    googleAccounts.revoke(email, () => {});
}
