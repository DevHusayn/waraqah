import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Crown } from 'lucide-react';

const NavLinks = memo(function NavLinks({ items, sections, isActive, onNavigate, premium, badges, className = '' }) {
    const renderLink = (item) => {
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
    };

    if (sections?.length) {
        return (
            <div className={`flex flex-col ${className}`.trim()}>
                {sections.map((section, index) => (
                    <div key={section.label ?? `section-${index}`}>
                        {section.label ? <p className="nav-section-label">{section.label}</p> : null}
                        <div className="flex flex-col gap-0.5">{section.items.map(renderLink)}</div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className={`flex flex-col gap-0.5 ${className}`.trim()}>
            {items.map(renderLink)}
        </div>
    );
});

export default NavLinks;
