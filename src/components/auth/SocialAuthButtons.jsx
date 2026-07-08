import { useEffect, useRef, useState } from 'react';
import { GoogleLogin, useGoogleOAuth } from '@react-oauth/google';
import { authFetch, applyLoginResponse, prepareForLogin } from '../../utils/api';
import { clearGoogleAuthSession } from '../../utils/googleAuth';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const GOOGLE_BUTTON_HEIGHT = 40;

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

function GoogleSignInButton({
    label,
    loadingLabel,
    loading = false,
    disabled = false,
    isRegister,
    onSuccess,
    onError,
    onStart,
    onCancel,
    buttonKey,
}) {
    const hostRef = useRef(null);
    const [buttonWidth, setButtonWidth] = useState(0);
    const { scriptLoadedSuccessfully } = useGoogleOAuth();

    useEffect(() => {
        const host = hostRef.current;
        if (!host) return undefined;

        const updateWidth = () => {
            setButtonWidth(Math.max(host.offsetWidth, 200));
        };

        updateWidth();

        if (typeof ResizeObserver === 'undefined') {
            window.addEventListener('resize', updateWidth);
            return () => window.removeEventListener('resize', updateWidth);
        }

        const observer = new ResizeObserver(updateWidth);
        observer.observe(host);
        return () => observer.disconnect();
    }, [buttonKey]);

    const isDisabled = disabled || loading || !scriptLoadedSuccessfully || buttonWidth === 0;

    return (
        <div
            ref={hostRef}
            key={buttonKey}
            className="relative w-full"
            style={{ height: GOOGLE_BUTTON_HEIGHT }}
        >
            <div
                aria-hidden
                className={`pointer-events-none absolute inset-0 z-[1] inline-flex items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-900 ${
                    isDisabled ? 'opacity-50' : ''
                }`}
            >
                <GoogleIcon />
                {loading ? loadingLabel : label}
            </div>

            {scriptLoadedSuccessfully && buttonWidth > 0 ? (
                <GoogleLogin
                    onSuccess={onSuccess}
                    onError={() => {
                        onCancel?.();
                        onError('Google sign-in was cancelled or failed.');
                    }}
                    click_listener={() => {
                        onStart?.();
                    }}
                    theme="outline"
                    size="large"
                    shape="rectangular"
                    text={isRegister ? 'signup_with' : 'signin_with'}
                    width={buttonWidth}
                    useOneTap={false}
                    ux_mode="popup"
                    containerProps={{
                        className: `absolute inset-0 z-[2] w-full opacity-[0.01] ${
                            isDisabled ? 'pointer-events-none' : ''
                        }`,
                        style: { height: GOOGLE_BUTTON_HEIGHT },
                    }}
                />
            ) : null}
        </div>
    );
}

export default function SocialAuthButtons({
    onSuccess,
    onError,
    disabled = false,
    variant = 'login',
}) {
    const [googleLoading, setGoogleLoading] = useState(false);
    const [googleButtonKey, setGoogleButtonKey] = useState(0);

    useEffect(() => {
        const onLogout = () => {
            clearGoogleAuthSession();
            setGoogleButtonKey((key) => key + 1);
        };

        window.addEventListener('app-logout', onLogout);
        return () => window.removeEventListener('app-logout', onLogout);
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

    const handleGoogleStart = () => {
        setGoogleLoading(true);
    };

    const handleGoogleCancel = () => {
        setGoogleLoading(false);
    };

    if (!GOOGLE_CLIENT_ID) {
        return null;
    }

    const isRegister = variant === 'register';
    const googleLabel = isRegister ? 'Sign up with Google' : 'Sign in with Google';
    const googleLoadingLabel = isRegister ? 'Signing up with Google…' : 'Signing in with Google…';

    const googleButton = (
        <GoogleSignInButton
            label={googleLabel}
            loadingLabel={googleLoadingLabel}
            loading={googleLoading}
            disabled={disabled}
            isRegister={isRegister}
            buttonKey={googleButtonKey}
            onSuccess={handleGoogleSuccess}
            onError={onError}
            onStart={handleGoogleStart}
            onCancel={handleGoogleCancel}
        />
    );

    if (isRegister) {
        return (
            <div className="space-y-3 mb-6">
                {googleButton}
                <AuthDivider label="Or" />
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <AuthDivider label="Or" />
            {googleButton}
        </div>
    );
}
