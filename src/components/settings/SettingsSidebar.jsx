import { NavLink } from 'react-router-dom';
import { SETTINGS_SIDEBAR } from '../../constants/settingsNav';

function linkClass(isActive) {
    return isActive
        ? 'bg-brand-light text-brand'
        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950';
}

export default function SettingsSidebar() {
    return (
        <nav aria-label="Settings navigation" className="space-y-1">
            {SETTINGS_SIDEBAR.map((item) => {
                const Icon = item.icon;
                const isSublink = item.type === 'sublink';
                const isGroup = item.type === 'group';

                return (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/settings'}
                        className={({ isActive }) =>
                            `w-full flex items-center gap-2.5 rounded-md transition-colors text-left ${
                                isGroup
                                    ? 'px-2.5 py-2 text-[13px] font-semibold'
                                    : isSublink
                                      ? 'pl-8 pr-2.5 py-1.5 text-[13px] font-medium'
                                      : 'px-2.5 py-2 text-[13px] font-medium'
                            } ${linkClass(isActive)}`
                        }
                    >
                        {Icon && !isSublink ? <Icon className="h-4 w-4 shrink-0" aria-hidden /> : null}
                        {item.title}
                    </NavLink>
                );
            })}
        </nav>
    );
}
