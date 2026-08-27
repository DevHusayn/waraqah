import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ className = '', showLabel = false }) {
    const { toggleThemeMode, isDark } = useTheme();
    const Icon = isDark ? Sun : Moon;
    const nextLabel = isDark ? 'light' : 'dark';
    const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';

    return (
        <button
            type="button"
            onClick={toggleThemeMode}
            className={`inline-flex items-center justify-center gap-1.5 rounded-md p-2 text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-colors ${className}`.trim()}
            aria-label={label}
            aria-pressed={!isDark}
            title={label}
        >
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
            {showLabel ? <span className="text-[13px] font-medium capitalize">{nextLabel}</span> : null}
        </button>
    );
}
