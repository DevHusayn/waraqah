import { useEffect } from 'react';
import { APP_NAME, APP_TAGLINE } from '../constants/brand';
import { markSplashSeen } from '../utils/splashSession';

const SPLASH_DURATION_MS = 2600;

export default function SplashScreen({ onFinish }) {
    useEffect(() => {
        markSplashSeen();
        document.body.classList.add('splash-active');

        const timer = window.setTimeout(() => {
            document.body.classList.remove('splash-active');
            onFinish?.();
        }, SPLASH_DURATION_MS);

        return () => {
            window.clearTimeout(timer);
            document.body.classList.remove('splash-active');
        };
    }, [onFinish]);

    return (
        <div
            className="waraqah-splash"
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
