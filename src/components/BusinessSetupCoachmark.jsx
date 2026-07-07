import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import {
    clearBusinessSetupCoachmarkFlag,
    dismissBusinessSetupCoachmark,
} from '../utils/businessSetupCoachmark';

const AVATAR_ANCHOR_SELECTOR = '[data-business-setup-anchor]';

function getVisibleAvatarAnchor() {
    const anchors = document.querySelectorAll(AVATAR_ANCHOR_SELECTOR);
    for (const anchor of anchors) {
        const rect = anchor.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
            return anchor;
        }
    }
    return anchors[0] || null;
}

function getCoachmarkMessage(authProvider) {
    if (authProvider === 'google') {
        return 'You signed in with Google. Add your business details so your invoices look professional.';
    }
    if (authProvider === 'apple') {
        return 'You signed in with Apple. Add your business details so your invoices look professional.';
    }
    return 'Complete your business profile to start creating invoices.';
}

export default function BusinessSetupCoachmark({ userId, authProvider, onDismiss }) {
    const [anchorRect, setAnchorRect] = useState(null);

    const updatePosition = useCallback(() => {
        const anchor = getVisibleAvatarAnchor();
        if (!anchor) {
            setAnchorRect(null);
            return;
        }
        setAnchorRect(anchor.getBoundingClientRect());
    }, []);

    useEffect(() => {
        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [updatePosition]);

    const handleDismiss = () => {
        dismissBusinessSetupCoachmark(userId);
        onDismiss?.();
    };

    const handleSetup = () => {
        clearBusinessSetupCoachmarkFlag();
        onDismiss?.();
    };

    if (!anchorRect) return null;

    const bubbleWidth = 280;
    const bubbleLeft = Math.min(
        Math.max(16, anchorRect.left + anchorRect.width / 2 - bubbleWidth / 2),
        window.innerWidth - bubbleWidth - 16
    );
    const bubbleTop = anchorRect.bottom + 12;
    const ringPadding = 6;

    return (
        <div className="fixed inset-0 z-[100]" role="presentation">
            <button
                type="button"
                className="absolute inset-0 bg-zinc-950/40"
                aria-label="Dismiss business setup guide"
                onClick={handleDismiss}
            />

            <div
                className="pointer-events-none absolute rounded-full ring-4 ring-brand/90 ring-offset-2 ring-offset-white shadow-lg"
                style={{
                    top: anchorRect.top - ringPadding,
                    left: anchorRect.left - ringPadding,
                    width: anchorRect.width + ringPadding * 2,
                    height: anchorRect.height + ringPadding * 2,
                }}
            />

            <div
                className="absolute w-[280px] rounded-xl border border-zinc-200 bg-white p-4 shadow-xl"
                style={{ top: bubbleTop, left: bubbleLeft }}
                role="dialog"
                aria-labelledby="business-setup-coachmark-title"
            >
                <div
                    className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-l border-t border-zinc-200 bg-white"
                    aria-hidden
                />
                <div className="flex items-start justify-between gap-2">
                    <p
                        id="business-setup-coachmark-title"
                        className="text-sm font-semibold text-zinc-900"
                    >
                        Finish your business setup
                    </p>
                    <button
                        type="button"
                        onClick={handleDismiss}
                        className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-zinc-600">
                    {getCoachmarkMessage(authProvider)}
                </p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <Link
                        to="/settings/business/company-profile"
                        onClick={handleSetup}
                        className="btn-primary flex-1 !py-2 text-center text-[13px]"
                    >
                        Set up business
                    </Link>
                    <button
                        type="button"
                        onClick={handleDismiss}
                        className="btn-secondary flex-1 !py-2 text-[13px]"
                    >
                        Remind me later
                    </button>
                </div>
            </div>
        </div>
    );
}

export { AVATAR_ANCHOR_SELECTOR };
