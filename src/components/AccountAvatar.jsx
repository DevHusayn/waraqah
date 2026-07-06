import { useSettings } from '../context/SettingsContext';
import { isPremiumUser, getBusinessInitials } from '../utils/premium';
import { getCompanyLogoAvatarUrl } from '../utils/brandAssets';

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
                className={`${box} rounded-full object-cover bg-white border border-zinc-200/60 shadow-soft`}
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

function AvatarSkeleton({ size }) {
    const { box } = SIZE_CLASSES[size] || SIZE_CLASSES.sm;
    return <div className={`${box} rounded-full bg-zinc-200/80 animate-pulse`} aria-hidden />;
}

export default function AccountAvatar({ size = 'sm' }) {
    const { businessInfo, loading } = useSettings();
    const premium = isPremiumUser(businessInfo);

    if (loading) {
        return <AvatarSkeleton size={size} />;
    }

    return <AvatarContent businessInfo={businessInfo} premium={premium} size={size} />;
}
