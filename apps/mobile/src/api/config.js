export const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

export function getNetworkErrorMessage() {
    return "We couldn't connect right now. Please check your internet connection and try again.";
}
