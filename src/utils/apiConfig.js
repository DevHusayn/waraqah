/** Shared API base URL and production misconfiguration hints */

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/** Shown when fetch fails in production — often missing VITE_API_URL on Vercel */
export function getProductionApiMisconfigHint() {
    if (!import.meta.env.PROD) return null;

    const url = import.meta.env.VITE_API_URL || '';
    if (!url || url.includes('localhost') || url.includes('127.0.0.1')) {
        return (
            'This build has no production API URL. In your Vercel frontend project, set ' +
            'VITE_API_URL to your live backend (e.g. https://your-api.vercel.app/api), then redeploy.'
        );
    }
    if (!url.startsWith('https://')) {
        return 'VITE_API_URL must use HTTPS in production (required on mobile browsers).';
    }
    return null;
}

export function getNetworkErrorMessage() {
    return (
        getProductionApiMisconfigHint() ||
        'Unable to reach the server. Check your connection and that the backend is deployed and running.'
    );
}
