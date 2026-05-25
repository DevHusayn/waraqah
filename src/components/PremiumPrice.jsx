import {
    PREMIUM_PRICE_NGN,
    PREMIUM_LIST_PRICE_NGN,
    PREMIUM_LAUNCH_LABEL,
    formatPremiumPrice,
} from '../constants/pricing';

/**
 * Premium price with optional launch strikethrough.
 * @param {'lg'|'sm'} size
 */
export default function PremiumPrice({
    amount = PREMIUM_PRICE_NGN,
    listAmount = PREMIUM_LIST_PRICE_NGN,
    size = 'lg',
    showLaunchBadge = true,
    showStrikethrough = true,
    suffix = '/month',
    className = '',
}) {
    const isLarge = size === 'lg';
    const showStrike = showStrikethrough && listAmount > amount;

    return (
        <div className={className}>
            {showLaunchBadge && (
                <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800 mb-2">
                    {PREMIUM_LAUNCH_LABEL}
                </span>
            )}
            <div className={`flex items-baseline gap-2 flex-wrap ${showLaunchBadge ? '' : 'mt-2'}`}>
                {showStrike && (
                    <span
                        className={`${
                            isLarge ? 'text-xl' : 'text-base'
                        } font-semibold text-slate-400 line-through`}
                    >
                        ₦{formatPremiumPrice(listAmount)}
                    </span>
                )}
                <span
                    className={`${
                        isLarge ? 'text-4xl' : 'text-2xl'
                    } font-bold text-slate-900 tracking-tight`}
                >
                    ₦{formatPremiumPrice(amount)}
                </span>
                {suffix ? (
                    <span className={`${isLarge ? 'text-base' : 'text-sm'} font-normal text-slate-500`}>
                        {suffix}
                    </span>
                ) : null}
            </div>
        </div>
    );
}
