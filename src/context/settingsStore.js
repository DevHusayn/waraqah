import { createContext } from 'react';

/** Isolated so Vite HMR can remount SettingsProvider without replacing this object. */
export const SettingsContext = createContext(null);
