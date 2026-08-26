import { Moon, Sun } from 'lucide-react';
import SettingsListItem from './SettingsListItem';
import { useTheme } from '../../context/ThemeContext';

export default function AppearanceSettings() {
    const { themeMode, toggleThemeMode, isDark, oppositeOfSystem } = useTheme();
    const followingSystem = themeMode === 'system';
    const Icon = isDark ? Sun : Moon;
    const overrideLabel = oppositeOfSystem === 'dark' ? 'Dark' : 'Light';

    return (
        <SettingsListItem
            icon={Icon}
            title="Appearance"
            description={
                followingSystem
                    ? `Following system · tap for ${overrideLabel.toLowerCase()}`
                    : `${overrideLabel} · tap to match system`
            }
            onClick={toggleThemeMode}
            right={
                <span className="text-[13px] font-medium text-foreground-muted">
                    {followingSystem ? 'System' : overrideLabel}
                </span>
            }
        />
    );
}
