import { useEffect, useState } from 'react';
import {
    DASHBOARD_VISIT_STORAGE_KEY,
    resolveDashboardGreetingPhrase,
} from '@waraqah/shared';

function readHasVisitedBefore() {
    try {
        return localStorage.getItem(DASHBOARD_VISIT_STORAGE_KEY) === '1';
    } catch {
        return true;
    }
}

function markDashboardVisited() {
    try {
        localStorage.setItem(DASHBOARD_VISIT_STORAGE_KEY, '1');
    } catch {
        /* private browsing / storage blocked */
    }
}

export function useDashboardGreeting() {
    const [greetingPhrase] = useState(() =>
        resolveDashboardGreetingPhrase(readHasVisitedBefore())
    );

    useEffect(() => {
        markDashboardVisited();
    }, []);

    return greetingPhrase;
}
