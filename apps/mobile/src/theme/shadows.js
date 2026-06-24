import { Platform } from 'react-native';

export const shadows = {
    soft: Platform.select({
        ios: {
            shadowColor: '#0f172a',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.06,
            shadowRadius: 4,
        },
        android: { elevation: 2 },
        default: {},
    }),
    card: Platform.select({
        ios: {
            shadowColor: '#0f172a',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
        },
        android: { elevation: 3 },
        default: {},
    }),
    fab: Platform.select({
        ios: {
            shadowColor: '#0284c7',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
        },
        android: { elevation: 6 },
        default: {},
    }),
};
