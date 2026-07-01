import { useEffect, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { authFetch, applyLoginResponse } from '../../utils/api';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const APPLE_CLIENT_ID = import.meta.env.VITE_APPLE_CLIENT_ID || '';

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

export default function SocialAuthButtons({ onSuccess, onError, disabled = false }) {
    const [appleReady, setAppleReady] = useState(false);
    const [appleLoading, setAppleLoading] = useState(false);

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
        const data = await authFetch(path, {
            method: 'POST',
            body: JSON.stringify(body),
        });
        applyLoginResponse(data);
        onSuccess(data);
    };

    const handleGoogleSuccess = async (response) => {
        try {
            await finishAuth('/auth/google', { credential: response.credential });
        } catch (err) {
            onError(err.message || 'Google sign-in failed.');
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

    if (!GOOGLE_CLIENT_ID && !APPLE_CLIENT_ID) {
        return null;
    }

    return (
        <div className="space-y-3">
            <div className="relative py-1">
                <div className="absolute inset-0 flex items-center" aria-hidden>
                    <div className="w-full border-t border-zinc-200" />
                </div>
                <p className="relative flex justify-center text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                    <span className="bg-white px-2">Or continue with</span>
                </p>
            </div>

            {GOOGLE_CLIENT_ID ? (
                <div className="w-full [&>div]:!w-full [&>div>div]:!w-full">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => onError('Google sign-in was cancelled or failed.')}
                        theme="outline"
                        size="large"
                        shape="rectangular"
                        text="continue_with"
                        useOneTap={false}
                    />
                </div>
            ) : null}

            {APPLE_CLIENT_ID ? (
                <button
                    type="button"
                    onClick={handleAppleSignIn}
                    disabled={disabled || !appleReady || appleLoading}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
                >
                    <AppleIcon />
                    {appleLoading ? 'Signing in with Apple…' : 'Continue with Apple'}
                </button>
            ) : null}
        </div>
    );
}
