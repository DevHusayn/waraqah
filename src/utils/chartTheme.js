export function getChartTheme(isDark) {
    return {
        grid: isDark ? '#334155' : '#e4e4e7',
        tick: isDark ? '#94a3b8' : '#71717a',
        tooltipPanel: isDark
            ? 'rounded-lg border border-border/80 bg-surface-elevated px-3 py-2 shadow-soft text-xs'
            : 'rounded-lg border border-border/80 bg-surface px-3 py-2 shadow-soft text-xs',
        tooltipTitle: 'font-medium text-foreground',
        tooltipMuted: 'text-foreground-muted',
        tooltipValue: 'font-medium text-foreground',
        emptyHint: 'mt-3 text-center text-xs text-foreground-muted',
        activeDotStroke: isDark ? '#1e293b' : '#ffffff',
    };
}
