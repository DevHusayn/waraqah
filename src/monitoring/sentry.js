import * as Sentry from '@sentry/react';
import { APP_VERSION } from '../constants/brand';

let initialized = false;

/** Initialize Sentry when VITE_SENTRY_DSN is set. Safe to call multiple times. */
export function initMonitoring() {
    if (initialized) return Boolean(Sentry.getClient());

    const dsn = (import.meta.env.VITE_SENTRY_DSN || '').trim();
    if (!dsn) return false;

    Sentry.init({
        dsn,
        environment: import.meta.env.MODE,
        release: `waraqah-web@${import.meta.env.VITE_APP_VERSION || APP_VERSION}`,
        dataCollection: {
            // To disable sending user data and HTTP bodies, uncomment:
            // userInfo: false,
            // httpBodies: [],
        },
        sendDefaultPii: false,
        beforeSend(event) {
            if (event.request?.headers?.Authorization) {
                delete event.request.headers.Authorization;
            }
            return event;
        },
    });

    initialized = true;
    return true;
}

export function captureException(error, context) {
    if (!initialized) return;
    Sentry.captureException(error, context ? { extra: context } : undefined);
}
