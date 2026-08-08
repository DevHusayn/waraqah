import posthog from 'posthog-js';
import { ANALYTICS_PLATFORMS, REPLAY_MASK } from '@waraqah/shared';

let initialized = false;

const DEFAULT_HOST = 'https://us.i.posthog.com';

/** Initialize PostHog when VITE_POSTHOG_KEY is set. Safe to call multiple times. */
export function initAnalytics() {
    if (initialized) return Boolean(posthog.__loaded);

    const key = (import.meta.env.VITE_POSTHOG_KEY || '').trim();
    if (!key) return false;

    const apiHost = (import.meta.env.VITE_POSTHOG_HOST || DEFAULT_HOST).trim().replace(/\/$/, '');

    posthog.init(key, {
        api_host: apiHost,
        person_profiles: 'identified_only',
        capture_pageview: false,
        capture_pageleave: true,
        disable_session_recording: false,
        session_recording: {
            maskAllInputs: true,
            maskTextSelector: `.${REPLAY_MASK.SENSITIVE}, .${REPLAY_MASK.NO_CAPTURE}`,
        },
    });

    initialized = true;
    return true;
}

export function getPostHogClient() {
    return initialized ? posthog : null;
}

export function identifyUser(user) {
    if (!initialized || !user?.id) return;
    posthog.identify(String(user.id), {
        auth_provider: user.authProvider || 'local',
        is_admin: Boolean(user.isAdmin),
        platform: ANALYTICS_PLATFORMS.WEB,
    });
}

export function resetUser() {
    if (!initialized) return;
    posthog.reset();
}

export function captureEvent(name, properties = {}) {
    if (!initialized) return;
    posthog.capture(name, {
        platform: ANALYTICS_PLATFORMS.WEB,
        ...properties,
    });
}

export function capturePageView(path) {
    if (!initialized) return;
    posthog.capture('$pageview', {
        $current_url: window.location.origin + path,
    });
}
