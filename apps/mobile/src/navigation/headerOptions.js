import { fontFamily } from '../theme/typography';
import { colors } from '../theme/colors';

export const stackScreenOptions = {
    headerStyle: { backgroundColor: colors.surface },
    headerTintColor: colors.brand,
    headerTitleStyle: {
        fontFamily: fontFamily.bold,
        fontWeight: '700',
        color: colors.foreground,
    },
    headerShadowVisible: false,
    headerBackTitleVisible: false,
    contentStyle: { backgroundColor: colors.surfaceMuted },
};
