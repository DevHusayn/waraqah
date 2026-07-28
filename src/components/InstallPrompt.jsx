import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { APP_NAME } from '../constants/brand';
import { isStandalonePwa } from '../utils/isStandalonePwa';

const DISMISS_KEY = 'waraqah-pwa-install-dismissed';

function isMobileViewport() {
    return window.matchMedia('(max-width: 768px)').matches;
}

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (isStandalonePwa() || localStorage.getItem(DISMISS_KEY) === '1') {
            return undefined;
        }

        const onBeforeInstallPrompt = (event) => {
            event.preventDefault();
            if (!isMobileViewport()) {
                return;
            }
            setDeferredPrompt(event);
            setVisible(true);
        };

        window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    }, []);

    const dismiss = () => {
        localStorage.setItem(DISMISS_KEY, '1');
        setVisible(false);
        setDeferredPrompt(null);
    };

    const install = async () => {
        if (!deferredPrompt) {
            return;
        }

        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        dismiss();
    };

    if (!visible || !deferredPrompt) {
        return null;
    }

    return (
        <div className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-4 md:hidden pointer-events-none">
            <div className="pointer-events-auto mx-auto flex max-w-lg items-center gap-3 rounded-xl border border-zinc-200/80 bg-white p-3 shadow-lift">
                <img
                    src="/pwa/apple-touch-icon.png"
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-lg"
                    aria-hidden
                />
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-zinc-950">Install {APP_NAME}</p>
                    <p className="text-xs text-zinc-500">Add to your home screen for quick access.</p>
                </div>
                <button
                    type="button"
                    onClick={install}
                    className="btn-primary shrink-0 px-3 py-2 text-xs"
                >
                    <Download className="h-3.5 w-3.5" aria-hidden />
                    Install
                </button>
                <button
                    type="button"
                    onClick={dismiss}
                    className="btn-ghost shrink-0 p-2"
                    aria-label="Dismiss install prompt"
                >
                    <X className="h-4 w-4" aria-hidden />
                </button>
            </div>
        </div>
    );
}
