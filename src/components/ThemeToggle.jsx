import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ className = '', showLabel = false }) {
    const { themeMode, toggleThemeMode, isDark, oppositeOfSystem } = useTheme();
    const Icon = isDark ? Sun : Moon;
    const followingSystem = themeMode === 'system';
    const nextLabel = isDark ? 'light' : 'dark';
    const label = followingSystem
        ? `Use ${oppositeOfSystem} theme`
        : 'Match system theme';

    return (
        <button
            type="button"
            onClick={toggleThemeMode}
            className={`inline-flex items-center justify-center gap-1.5 rounded-md p-2 text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-colors ${className}`.trim()}
            aria-label={label}
            aria-pressed={!followingSystem}
            title={label}
        >
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
            {showLabel ? <span className="text-[13px] font-medium capitalize">{nextLabel}</span> : null}
        </button>
    );
}
