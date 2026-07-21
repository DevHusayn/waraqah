import { fontFamily } from '../theme/typography';
import { colors } from '../theme/colors';

export const stackScreenOptions = {
    headerStyle: {
        backgroundColor: colors.surface,
    },
    headerTintColor: colors.foreground,
    headerTitleStyle: {
        fontFamily: fontFamily.semibold,
        fontWeight: '600',
        fontSize: 17,
        color: colors.foreground,
    },
    headerShadowVisible: false,
    headerBackTitleVisible: false,
    headerBackButtonDisplayMode: 'minimal',
    contentStyle: { backgroundColor: colors.surface },
};
