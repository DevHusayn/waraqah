import { PostHogMaskView } from 'posthog-react-native';

/** Hide children from PostHog session replay (client PII, bank details, document previews). */
export function ReplayMask({ children, style }) {
    return <PostHogMaskView style={style}>{children}</PostHogMaskView>;
}
