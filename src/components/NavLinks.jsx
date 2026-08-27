import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Crown } from 'lucide-react';
import HoverTooltip from './HoverTooltip';

const NavLinks = memo(function NavLinks({
    items,
    sections,
    isActive,
    onNavigate,
    premium,
    badges,
    className = '',
    iconOnly = false,
}) {
    const renderLink = (item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        const showPremiumBadge = item.premiumFeature && !premium;
        const badge = item.badgeKey ? badges[item.badgeKey] : 0;
        const tooltipLabel = showPremiumBadge ? `${item.name} · Premium` : item.name;
        const linkClass = `${active ? 'nav-link nav-link-active' : 'nav-link'}${
            iconOnly ? ' nav-link-icon' : ''
        }`;

        return (
            <HoverTooltip key={item.name} label={tooltipLabel} enabled={iconOnly}>
                <Link
                    to={item.href}
                    onClick={onNavigate}
                    className={linkClass}
                    aria-label={iconOnly ? tooltipLabel : undefined}
                    aria-current={active ? 'page' : undefined}
                >
                    <span className="relative inline-flex shrink-0">
                        <Icon
                            className={`${iconOnly ? 'h-[18px] w-[18px]' : 'h-4 w-4'} flex-shrink-0 opacity-80`}
                            strokeWidth={1.75}
                        />
                        {iconOnly && showPremiumBadge ? (
                            <Crown
                                className="absolute -right-1.5 -top-1.5 h-3 w-3 text-amber-500"
                                aria-hidden
                            />
                        ) : null}
                        {iconOnly && badge > 0 ? (
                            <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-[1rem] h-4 items-center justify-center rounded bg-brand text-white text-[9px] font-medium px-0.5 tabular-nums leading-none">
                                {badge > 99 ? '99+' : badge}
                            </span>
                        ) : null}
                    </span>
                    {iconOnly ? null : (
                        <>
                            <span className="flex-1">{item.name}</span>
                            {showPremiumBadge ? (
                                <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" aria-label="Premium" />
                            ) : null}
                            {badge > 0 ? (
                                <span className="inline-flex min-w-[1.125rem] h-[18px] items-center justify-center rounded bg-brand text-white text-[10px] font-medium px-1 tabular-nums">
                                    {badge > 99 ? '99+' : badge}
                                </span>
                            ) : null}
                        </>
                    )}
                </Link>
            </HoverTooltip>
        );
    };

    if (sections?.length) {
        return (
            <div className={`flex flex-col ${className}`.trim()}>
                {sections.map((section, index) => (
                    <div key={section.label ?? `section-${index}`}>
                        {section.label ? (
                            iconOnly ? (
                                <div
                                    className="mx-auto my-2 h-px w-5 bg-border/70"
                                    role="separator"
                                    aria-hidden
                                />
                            ) : (
                                <p className="nav-section-label">{section.label}</p>
                            )
                        ) : null}
                        <div className={`flex flex-col ${iconOnly ? 'gap-1' : 'gap-0.5'}`}>
                            {section.items.map(renderLink)}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className={`flex flex-col ${iconOnly ? 'gap-1' : 'gap-0.5'} ${className}`.trim()}>
            {items.map(renderLink)}
        </div>
    );
});

export default NavLinks;
