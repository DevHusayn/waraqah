/** PostHog session replay CSS classes — see posthog.com/docs/session-replay/privacy */

export const REPLAY_MASK = {
    /** Completely exclude element from recordings */
    NO_CAPTURE: 'ph-no-capture',
    /** Redact text content (used with session_recording.maskTextSelector on web) */
    SENSITIVE: 'ph-sensitive',
};
