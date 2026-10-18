import { apiFetch } from './api';

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(base64);
    const output = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i += 1) {
        output[i] = raw.charCodeAt(i);
    }
    return output;
}

export function isPushSupported() {
    return window.isSecureContext
        && 'serviceWorker' in navigator
        && 'PushManager' in window
        && 'Notification' in window;
}

export function isStandalonePwa() {
    return window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true;
}

export function isIosDevice() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent)
        || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/** Re-bind an existing browser subscription to the signed-in user. */
export async function syncDeviceSubscription() {
    const subscription = await getDeviceSubscription();
    if (!subscription) return false;
    const json = subscription.toJSON();
    if (!json?.endpoint || !json?.keys?.p256dh || !json?.keys?.auth) return false;
    await apiFetch('/push/subscribe', {
        method: 'POST',
        body: JSON.stringify({
            endpoint: json.endpoint,
            keys: json.keys,
        }),
    });
    return true;
}

export async function getDeviceSubscription() {
    if (!('serviceWorker' in navigator)) return null;
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration?.pushManager) return null;
    return registration.pushManager.getSubscription();
}

/** Drop this browser's subscription while the user is still signed in. */
export async function unsubscribeThisDevice() {
    const subscription = await getDeviceSubscription();
    if (!subscription) return;
    try {
        await apiFetch('/push/unsubscribe', {
            method: 'POST',
            body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
    } catch {
        /* still remove it locally so the next account does not inherit it */
    }
    try {
        await subscription.unsubscribe();
    } catch {
        /* the server copy is already gone */
    }
}

export async function enableDevicePush() {
    if (!isPushSupported()) {
        throw new Error('This browser cannot receive push notifications.');
    }
    if (isIosDevice() && !isStandalonePwa()) {
        throw new Error('On iPhone and iPad, install Waraqah to your Home Screen, then turn this on.');
    }
    if (Notification.permission === 'denied') {
        throw new Error('Notifications are blocked. Allow them in the browser settings, then try again.');
    }

    const config = await apiFetch('/push/config');
    if (!config?.configured || !config.publicKey) {
        throw new Error('Push notifications are not available yet.');
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
        throw new Error('Notifications are blocked. Allow them in the browser settings, then try again.');
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(config.publicKey),
        });
    }

    const json = subscription.toJSON();
    await apiFetch('/push/subscribe', {
        method: 'POST',
        body: JSON.stringify({
            endpoint: json.endpoint,
            keys: json.keys,
        }),
    });
}
