import { Platform } from 'react-native';

/** Soft UI elevation matching the Waraqah mobile mockup */
export const shadows = {
    none: {},
    soft: Platform.select({
        ios: {
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
        },
        android: { elevation: 2 },
        default: {},
    }),
    card: Platform.select({
        ios: {
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.07,
            shadowRadius: 16,
        },
        android: { elevation: 3 },
        default: {},
    }),
    fab: Platform.select({
        ios: {
            shadowColor: '#16A34A',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
            shadowRadius: 14,
        },
        android: { elevation: 8 },
        default: {},
    }),
};
