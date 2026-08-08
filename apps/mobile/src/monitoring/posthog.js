import { useEffect } from 'react';
import { PostHogProvider, usePostHog } from 'posthog-react-native';
import { ANALYTICS_PLATFORMS } from '@waraqah/shared';

const DEFAULT_HOST = 'https://us.i.posthog.com';

let client = null;

function getConfig() {
    const apiKey = (process.env.EXPO_PUBLIC_POSTHOG_KEY || '').trim();
    if (!apiKey) return null;

    return {
        apiKey,
        host: (process.env.EXPO_PUBLIC_POSTHOG_HOST || DEFAULT_HOST).trim().replace(/\/$/, ''),
    };
}

function PostHogClientRef() {
    const posthog = usePostHog();

    useEffect(() => {
        client = posthog;
        return () => {
            client = null;
        };
    }, [posthog]);

    return null;
}

export function PostHogClientProvider({ children }) {
    const config = getConfig();
    if (!config) {
        return children;
    }

    return (
        <PostHogProvider
            apiKey={config.apiKey}
            options={{
                host: config.host,
                person_profiles: 'identified_only',
                enableSessionReplay: true,
                sessionReplayConfig: {
                    maskAllTextInputs: true,
                    maskAllImages: true,
                },
            }}
            autocapture={{
                captureScreens: false,
                captureTouches: false,
                captureAppLifecycleEvents: true,
            }}
        >
            <PostHogClientRef />
            {children}
        </PostHogProvider>
    );
}

export function identifyUser(user) {
    if (!client || !user?.id) return;
    client.identify(String(user.id), {
        auth_provider: user.authProvider || 'local',
        is_admin: Boolean(user.isAdmin),
        platform: ANALYTICS_PLATFORMS.MOBILE,
    });
}

export function resetUser() {
    if (!client) return;
    client.reset();
}

export function captureEvent(name, properties = {}) {
    if (!client) return;
    client.capture(name, {
        platform: ANALYTICS_PLATFORMS.MOBILE,
        ...properties,
    });
}

export function captureScreen(screenName) {
    if (!client || !screenName) return;
    client.screen(screenName);
}

export function getActiveRouteName(state) {
    if (!state) return null;
    const route = state.routes[state.index];
    if (route.state) {
        return getActiveRouteName(route.state);
    }
    return route.name;
}
