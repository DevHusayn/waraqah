import { useEffect, useLayoutEffect } from 'react';
import { APP_NAME, APP_TAGLINE } from '../constants/brand';
import { markPwaSessionAlive, clearPwaColdStartShell } from '../utils/splashSession';

const SPLASH_DURATION_MS = 2600;
const OS_HANDOFF_SPLASH_DURATION_MS = 1800;

export default function SplashScreen({ onFinish, handoffFromOsSplash = false }) {
    const durationMs = handoffFromOsSplash ? OS_HANDOFF_SPLASH_DURATION_MS : SPLASH_DURATION_MS;

    useLayoutEffect(() => {
        clearPwaColdStartShell();
    }, []);

    useEffect(() => {
        document.body.classList.add('splash-active');

        const timer = window.setTimeout(() => {
            document.body.classList.remove('splash-active');
            markPwaSessionAlive();
            onFinish?.();
        }, durationMs);

        return () => {
            window.clearTimeout(timer);
            document.body.classList.remove('splash-active');
        };
    }, [durationMs, onFinish]);

    return (
        <div
            className={`waraqah-splash${handoffFromOsSplash ? ' waraqah-splash--os-handoff' : ''}`}
            role="status"
            aria-label={`${APP_NAME} splash screen`}
            aria-live="polite"
        >
            <div className="waraqah-splash__content">
                <div className="waraqah-splash__wordmark" aria-hidden>
                    <span className="waraqah-splash__w">W</span>
                    <span className="waraqah-splash__rest">
                        <span className="waraqah-splash__rest-text">araqah</span>
                    </span>
                </div>
                <p className="waraqah-splash__tagline">{APP_TAGLINE}</p>
            </div>
        </div>
    );
}
