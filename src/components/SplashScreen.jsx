import { useEffect } from 'react';
import { APP_NAME } from '../constants/brand';
import { markPwaSessionAlive, clearPwaColdStartBackground } from '../utils/splashSession';

const TAGLINE_PARTS = ['Quote', 'Invoice', 'Get Paid'];

const SPLASH_DURATION_MS = 2800;
const OS_HANDOFF_SPLASH_DURATION_MS = 2200;

export default function SplashScreen({ onFinish, handoffFromOsSplash = false }) {
    const durationMs = handoffFromOsSplash ? OS_HANDOFF_SPLASH_DURATION_MS : SPLASH_DURATION_MS;

    useEffect(() => {
        document.documentElement.classList.add('splash-active');
        document.body.classList.add('splash-active');

        const timer = window.setTimeout(() => {
            document.body.classList.remove('splash-active');
            document.documentElement.classList.remove('splash-active');
            clearPwaColdStartBackground();
            markPwaSessionAlive();
            onFinish?.();
        }, durationMs);

        return () => {
            window.clearTimeout(timer);
            document.body.classList.remove('splash-active');
            document.documentElement.classList.remove('splash-active');
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
                <p className="waraqah-splash__tagline" aria-label="Quote. Invoice. Get Paid.">
                    {TAGLINE_PARTS.map((part, index) => (
                        <span
                            key={part}
                            className="waraqah-splash__tagline-word"
                            style={{ '--i': index }}
                        >
                            {part}
                        </span>
                    ))}
                </p>
            </div>
        </div>
    );
}
