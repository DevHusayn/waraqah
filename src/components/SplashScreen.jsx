import { useEffect, useState } from 'react';
import { APP_NAME, APP_TAGLINE } from '../constants/brand';

const SPLASH_DURATION_MS = 2600;

export default function SplashScreen({ onFinish }) {
    const [continuedFromStatic] = useState(() => !!document.getElementById('pwa-splash'));

    useEffect(() => {
        document.body.classList.add('splash-active');
        document.getElementById('pwa-splash')?.remove();

        const timer = window.setTimeout(() => {
            document.body.classList.remove('splash-active');
            onFinish?.();
        }, continuedFromStatic ? SPLASH_DURATION_MS - 500 : SPLASH_DURATION_MS);

        return () => {
            window.clearTimeout(timer);
            document.body.classList.remove('splash-active');
        };
    }, [continuedFromStatic, onFinish]);

    return (
        <div
            className="waraqah-splash"
            role="status"
            aria-label={`${APP_NAME} splash screen`}
            aria-live="polite"
        >
            <div className="waraqah-splash__content">
                <div className="waraqah-splash__wordmark" aria-hidden>
                    <span
                        className={`waraqah-splash__w${
                            continuedFromStatic ? ' waraqah-splash__w--ready' : ''
                        }`}
                    >
                        W
                    </span>
                    <span
                        className={`waraqah-splash__rest${
                            continuedFromStatic ? ' waraqah-splash__rest--ready' : ''
                        }`}
                    >
                        <span
                            className={`waraqah-splash__rest-text${
                                continuedFromStatic ? ' waraqah-splash__rest-text--ready' : ''
                            }`}
                        >
                            araqah
                        </span>
                    </span>
                </div>
                <p className="waraqah-splash__tagline">{APP_TAGLINE}</p>
            </div>
        </div>
    );
}
