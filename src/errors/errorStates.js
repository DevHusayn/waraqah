import { AlertTriangle, ServerOff, WifiOff } from 'lucide-react';

export const ERROR_TYPES = {
    OFFLINE: 'offline',
    SERVER: 'server',
    UNEXPECTED: 'unexpected',
};

/**
 * Shared copy + visuals for full-page error states.
 * Add new types here to extend error handling without rewriting UI.
 */
export const ERROR_STATES = {
    [ERROR_TYPES.OFFLINE]: {
        type: ERROR_TYPES.OFFLINE,
        title: "You're offline",
        description: "We couldn't connect to the internet. Check your connection and try again.",
        Icon: WifiOff,
        iconClassName: 'text-amber-600',
        iconWrapClassName: 'border-amber-200/80 bg-amber-50',
    },
    [ERROR_TYPES.SERVER]: {
        type: ERROR_TYPES.SERVER,
        title: 'Service temporarily unavailable',
        description: "We're having trouble on our end. Please try again in a few minutes.",
        Icon: ServerOff,
        iconClassName: 'text-orange-600',
        iconWrapClassName: 'border-orange-200/80 bg-orange-50',
    },
    [ERROR_TYPES.UNEXPECTED]: {
        type: ERROR_TYPES.UNEXPECTED,
        title: 'Something went wrong',
        description:
            'We ran into an unexpected problem. Please try again. If it continues, contact support.',
        Icon: AlertTriangle,
        iconClassName: 'text-red-600',
        iconWrapClassName: 'border-red-200/80 bg-red-50',
    },
};

export function getErrorState(type) {
    return ERROR_STATES[type] || ERROR_STATES[ERROR_TYPES.UNEXPECTED];
}
