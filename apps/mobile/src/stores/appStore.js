import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'waraqah_onboarding_complete';
const THEME_KEY = 'waraqah_theme_mode';

export const useAppStore = create((set, get) => ({
    hydrated: false,
    onboardingComplete: false,
    themeMode: 'system', // 'light' | 'dark' | 'system'
    isOffline: false,

    hydrate: async () => {
        try {
            const [onboarding, theme] = await Promise.all([
                AsyncStorage.getItem(ONBOARDING_KEY),
                AsyncStorage.getItem(THEME_KEY),
            ]);
            set({
                onboardingComplete: onboarding === '1',
                themeMode: theme || 'system',
                hydrated: true,
            });
        } catch {
            set({ hydrated: true });
        }
    },

    completeOnboarding: async () => {
        try {
            await AsyncStorage.setItem(ONBOARDING_KEY, '1');
        } catch {
            // Still mark complete in-memory if storage is unavailable
        }
        set({ onboardingComplete: true });
    },

    resetOnboarding: async () => {
        try {
            await AsyncStorage.removeItem(ONBOARDING_KEY);
        } catch {
            // ignore
        }
        set({ onboardingComplete: false });
    },

    setThemeMode: async (mode) => {
        try {
            await AsyncStorage.setItem(THEME_KEY, mode);
        } catch {
            // ignore
        }
        set({ themeMode: mode });
    },

    setOffline: (isOffline) => {
        if (get().isOffline !== isOffline) set({ isOffline });
    },
}));
