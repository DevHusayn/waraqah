import { useEffect, useRef, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { authFetch, applyLoginResponse, prepareForLogin } from '../../utils/api';
import { clearGoogleAuthSession } from '../../utils/googleAuth';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const APPLE_CLIENT_ID = import.meta.env.VITE_APPLE_CLIENT_ID || '';

function GoogleIcon() {
    return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
            <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
        </svg>
    );
}

function AppleIcon() {
    return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
            <path
                fill="currentColor"
                d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
            />
        </svg>
    );
}

function AuthDivider({ label }) {
    return (
        <div className="relative py-1">
            <div className="absolute inset-0 flex items-center" aria-hidden>
                <div className="w-full border-t border-zinc-200" />
            </div>
            <p className="relative flex justify-center text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                <span className="bg-white px-2">{label}</span>
            </p>
        </div>
    );
}

export default function SocialAuthButtons({
    onSuccess,
    onError,
    disabled = false,
    variant = 'login',
}) {
    const [appleReady, setAppleReady] = useState(false);
    const [appleLoading, setAppleLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [googleButtonKey, setGoogleButtonKey] = useState(0);
    const googleButtonHostRef = useRef(null);

    useEffect(() => {
        const onLogout = () => {
            clearGoogleAuthSession();
            setGoogleButtonKey((key) => key + 1);
        };

        window.addEventListener('app-logout', onLogout);
        return () => window.removeEventListener('app-logout', onLogout);
    }, []);

    useEffect(() => {
        if (!APPLE_CLIENT_ID || typeof window === 'undefined') return undefined;

        const scriptId = 'apple-signin-script';
        if (document.getElementById(scriptId)) {
            setAppleReady(Boolean(window.AppleID));
            return undefined;
        }

        const script = document.createElement('script');
        script.id = scriptId;
        script.src =
            'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
        script.async = true;
        script.onload = () => {
            if (window.AppleID?.auth) {
                window.AppleID.auth.init({
                    clientId: APPLE_CLIENT_ID,
                    scope: 'name email',
                    redirectURI: window.location.origin,
                    usePopup: true,
                });
                setAppleReady(true);
            }
        };
        document.body.appendChild(script);

        return () => {
            /* keep script loaded for session */
        };
    }, []);

    const finishAuth = async (path, body) => {
        await prepareForLogin();
        const data = await authFetch(path, {
            method: 'POST',
            body: JSON.stringify(body),
        });
        applyLoginResponse(data);
        onSuccess(data);
    };

    const handleGoogleSuccess = async (response) => {
        setGoogleLoading(true);
        try {
            await finishAuth('/auth/google', { credential: response.credential });
        } catch (err) {
            onError(err.message || 'Google sign-in failed.');
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleAppleSignIn = async () => {
        if (!window.AppleID?.auth) {
            onError('Apple sign-in is still loading. Try again in a moment.');
            return;
        }

        setAppleLoading(true);
        try {
            const result = await window.AppleID.auth.signIn();
            const identityToken = result?.authorization?.id_token;
            const fullName = result?.user?.name;
            const name = [fullName?.firstName, fullName?.lastName].filter(Boolean).join(' ').trim();

            await finishAuth('/auth/apple', {
                identityToken,
                name: name || undefined,
            });
        } catch (err) {
            if (err?.error !== 'popup_closed_by_user') {
                onError(err.message || 'Apple sign-in failed.');
            }
        } finally {
            setAppleLoading(false);
        }
    };

    const socialBusy = googleLoading || appleLoading;

    const triggerGoogleSignIn = () => {
        const googleButton = googleButtonHostRef.current?.querySelector('[role="button"]');
        googleButton?.click();
    };

    if (!GOOGLE_CLIENT_ID && !APPLE_CLIENT_ID) {
        return null;
    }

    const isRegister = variant === 'register';
    const googleLabel = isRegister
        ? googleLoading
            ? 'Signing up with Google…'
            : 'Sign up with Google'
        : googleLoading
          ? 'Signing in with Google…'
          : 'Sign in with Google';
    const appleLabel = isRegister
        ? appleLoading
            ? 'Signing up with Apple…'
            : 'Sign up with Apple'
        : appleLoading
          ? 'Signing in with Apple…'
          : 'Continue with Apple';

    const googleButton = GOOGLE_CLIENT_ID ? (
        <>
            <button
                type="button"
                onClick={triggerGoogleSignIn}
                disabled={disabled || socialBusy}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
            >
                <GoogleIcon />
                {googleLabel}
            </button>
            <div
                ref={googleButtonHostRef}
                key={googleButtonKey}
                className="fixed -left-[9999px] top-0 h-px w-px overflow-hidden"
                aria-hidden
            >
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={(err) => {
                        console.error('Google sign-in error:', err);
                        onError('Google sign-in was cancelled or failed.');
                    }}
                    theme="outline"
                    size="large"
                    shape="rectangular"
                    text={isRegister ? 'signup_with' : 'signin_with'}
                    width="400"
                    useOneTap={false}
                    ux_mode="popup"
                />
            </div>
        </>
    ) : null;

    const appleButton = APPLE_CLIENT_ID ? (
        <button
            type="button"
            onClick={handleAppleSignIn}
            disabled={disabled || !appleReady || socialBusy}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
        >
            <AppleIcon />
            {appleLabel}
        </button>
    ) : null;

    if (isRegister) {
        return (
            <div className="space-y-3 mb-6">
                {googleButton}
                {appleButton}
                <AuthDivider label="Or" />
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <AuthDivider label="Or" />
            {googleButton}
            {appleButton}
        </div>
    );
}
