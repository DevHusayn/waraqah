import { normalizeBusinessTimezone } from '@waraqah/shared';

export function getTimeOfDayGreeting(timeZone, now = new Date()) {
    const tz = normalizeBusinessTimezone(timeZone);
    const hour = Number.parseInt(
        new Intl.DateTimeFormat('en-US', {
            timeZone: tz,
            hour: 'numeric',
            hour12: false,
        }).format(now),
        10
    );

    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    return 'Good evening';
}

export function formatDashboardDate(timeZone, now = new Date()) {
    const tz = normalizeBusinessTimezone(timeZone);
    return new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(now);
}
