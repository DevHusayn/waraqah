import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { getDisplayBusinessName } from '@waraqah/shared';
import { hasLikelyAuthSession } from '../utils/authHint';
import AccountAvatar from './AccountAvatar';

/**
 * Header account control: avatar + business name in a pill (name hidden below sm).
 */
export default function AccountAvatarPill({ className = '' }) {
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
            className={`inline-flex max-w-full items-center gap-2 rounded-full outline-none transition-colors duration-150 ease-smooth focus-visible:ring-2 focus-visible:ring-zinc-900/10 p-0.5 hover:bg-zinc-100/80 sm:border sm:border-zinc-200/80 sm:bg-white sm:py-0.5 sm:pl-0.5 sm:pr-3 sm:hover:bg-zinc-50/90 ${className}`.trim()}
        >
            <AccountAvatar size="sm" />
            <span className="hidden sm:block max-w-[130px] truncate text-[13px] font-semibold text-zinc-800 leading-none">
                {displayName}
            </span>
        </Link>
    );
}
