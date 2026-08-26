import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { getDisplayBusinessName } from '@waraqah/shared';
import { hasLikelyAuthSession } from '../utils/authHint';
import AccountAvatar from './AccountAvatar';

/**
 * Header account control: avatar + business name in a pill, or avatar-only when compact.
 */
export default function AccountAvatarPill({ className = '', compact = false }) {
    const { businessInfo } = useSettings();
    const { isAuthenticated } = useAuth();
    const likelySession = hasLikelyAuthSession();
    const displayName = getDisplayBusinessName(businessInfo);

    if (!isAuthenticated && !likelySession) {
        return null;
    }

    return (
        <Link
            to="/settings"
            data-business-setup-anchor
            aria-label={`Settings for ${displayName}`}
            title={displayName}
            className={
                compact
                    ? `inline-flex rounded-full outline-none transition-opacity duration-150 ease-smooth hover:opacity-90 focus-visible:ring-2 focus-visible:ring-zinc-900/10 ${className}`.trim()
                    : `inline-flex min-w-0 max-w-full items-center gap-2 rounded-full border border-border/80 bg-surface py-0.5 pl-0.5 pr-2.5 sm:pr-3 outline-none transition-colors duration-150 ease-smooth hover:bg-surface-muted/90 focus-visible:ring-2 focus-visible:ring-zinc-900/10 ${className}`.trim()
            }
        >
            <AccountAvatar size="sm" />
            {compact ? null : (
                <span className="block min-w-0 max-w-[100px] sm:max-w-[130px] truncate text-[12px] sm:text-[13px] font-semibold text-foreground leading-none">
                    {displayName}
                </span>
            )}
        </Link>
    );
}
