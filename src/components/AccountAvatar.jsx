import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { isPremiumUser, getBusinessInitials } from '../utils/premium';
import { getCompanyLogoAvatarUrl } from '../utils/brandAssets';
import { hasLikelyAuthSession } from '../utils/authHint';

const SIZE_CLASSES = {
    sm: {
        box: 'h-8 w-8',
        text: 'text-[11px]',
    },
    md: {
        box: 'h-9 w-9',
        text: 'text-xs',
    },
};

function AvatarContent({ businessInfo, premium, size }) {
    const logo = getCompanyLogoAvatarUrl(businessInfo);
    const showLogo = premium && logo.length > 0;
    const initials = getBusinessInitials(businessInfo.name);
    const brandColor = businessInfo.brandColor || '#16A34A';
    const { box, text } = SIZE_CLASSES[size] || SIZE_CLASSES.sm;

    if (showLogo) {
        return (
            <img
                src={logo}
                alt=""
                className={`${box} rounded-full object-cover bg-surface border border-border/60 shadow-soft`}
            />
        );
    }

    return (
        <div
            className={`flex ${box} flex-shrink-0 items-center justify-center rounded-full ${text} font-medium text-white shadow-soft`}
            style={{ backgroundColor: brandColor }}
            aria-hidden
        >
            {initials}
        </div>
    );
}

export default function AccountAvatar({ size = 'sm' }) {
    const { isAuthenticated } = useAuth();
    const { businessInfo } = useSettings();
    const premium = isPremiumUser(businessInfo);
    const likelySession = hasLikelyAuthSession();

    if (!isAuthenticated && !likelySession) {
        return null;
    }

    return <AvatarContent businessInfo={businessInfo} premium={premium} size={size} />;
}
