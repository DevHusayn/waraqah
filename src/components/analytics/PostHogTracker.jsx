import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PostHogProvider } from 'posthog-js/react';
import { useAuth } from '../../context/AuthContext';
import {
    capturePageView,
    getPostHogClient,
    identifyUser,
    initAnalytics,
} from '../../monitoring/posthog';

export function AnalyticsProvider({ children }) {
    initAnalytics();
    const client = getPostHogClient();

    if (!client) {
        return children;
    }

    return <PostHogProvider client={client}>{children}</PostHogProvider>;
}

export function PostHogPageView() {
    const location = useLocation();

    useEffect(() => {
        capturePageView(location.pathname + location.search);
    }, [location.pathname, location.search]);

    return null;
}

export function PostHogAuthSync() {
    const { user } = useAuth();

    useEffect(() => {
        if (user?.id) {
            identifyUser(user);
        }
    }, [user]);

    return null;
}
