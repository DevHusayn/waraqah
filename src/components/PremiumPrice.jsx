import { PREMIUM_PRICE_NGN, formatPremiumPrice } from '../constants/pricing';

/**
 * Premium price display.
 * @param {'lg'|'sm'} size
 */
export default function PremiumPrice({
    amount = PREMIUM_PRICE_NGN,
    size = 'lg',
    suffix = '/month',
    savingsLabel = '',
    className = '',
}) {
    const isLarge = size === 'lg';

    return (
        <div className={className}>
            <div className="flex items-baseline gap-2 flex-wrap mt-2">
                <span
                    className={`${
                        isLarge ? 'text-4xl' : 'text-2xl'
                    } font-bold text-zinc-900 tracking-tight`}
                >
                    ₦{formatPremiumPrice(amount)}
                </span>
                {suffix ? (
                    <span className={`${isLarge ? 'text-base' : 'text-sm'} font-normal text-zinc-500`}>
                        {suffix}
                    </span>
                ) : null}
            </div>
            {savingsLabel ? (
                <p className="mt-1 text-xs font-semibold text-green-700">{savingsLabel}</p>
            ) : null}
        </div>
    );
}
