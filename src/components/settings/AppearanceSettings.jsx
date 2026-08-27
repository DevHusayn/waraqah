import { Moon, Sun } from 'lucide-react';
import SettingsListItem from './SettingsListItem';
import { useTheme } from '../../context/ThemeContext';

export default function AppearanceSettings() {
    const { toggleThemeMode, isDark } = useTheme();
    const Icon = isDark ? Sun : Moon;
    const currentLabel = isDark ? 'Dark' : 'Light';
    const nextLabel = isDark ? 'light' : 'dark';

    return (
        <SettingsListItem
            icon={Icon}
            title="Appearance"
            description={`${currentLabel} · tap for ${nextLabel}`}
            onClick={toggleThemeMode}
            right={
                <span className="text-[13px] font-medium text-foreground-muted">
                    {currentLabel}
                </span>
            }
        />
    );
}
