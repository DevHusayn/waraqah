import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Crown } from 'lucide-react';

const NavLinks = memo(function NavLinks({ items, isActive, onNavigate, premium, badges, className = '' }) {
    return (
        <div className={`flex flex-col gap-0.5 ${className}`.trim()}>
            {items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                const showPremiumBadge = item.premiumFeature && !premium;
                const badge = item.badgeKey ? badges[item.badgeKey] : 0;
                return (
                    <Link
                        key={item.name}
                        to={item.href}
                        onClick={onNavigate}
                        className={active ? 'nav-link nav-link-active' : 'nav-link'}
                    >
                        <Icon className="h-4 w-4 flex-shrink-0 opacity-80" strokeWidth={1.75} />
                        <span className="flex-1">{item.name}</span>
                        {showPremiumBadge ? (
                            <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" aria-label="Premium" />
                        ) : null}
                        {badge > 0 ? (
                            <span className="inline-flex min-w-[1.125rem] h-[18px] items-center justify-center rounded bg-brand text-white text-[10px] font-medium px-1 tabular-nums">
                                {badge > 99 ? '99+' : badge}
                            </span>
                        ) : null}
                    </Link>
                );
            })}
        </div>
    );
});

export default NavLinks;
