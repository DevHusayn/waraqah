import { Edit } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import SettingsSidebar from '../../components/settings/SettingsSidebar';

export default function SettingsLayout() {
    return (
        <div className="max-w-6xl mx-auto pb-8">
            <div className="lg:grid lg:grid-cols-12 lg:gap-8">
                <aside className="hidden lg:block lg:col-span-3">
                    <div className="sticky top-24">
                        <p className="px-2.5 mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                            Settings
                        </p>
                        <div className="card !p-3">
                            <SettingsSidebar />
                        </div>
                    </div>
                </aside>
                <div className="lg:col-span-9 min-w-0">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}

export function SettingsEditButton({ onClick }) {
    return (
        <button type="button" onClick={onClick} className="btn-primary text-sm py-2">
            <Edit size={16} aria-hidden />
            Edit
        </button>
    );
}

export function SettingsEditingStatus() {
    return (
        <span className="inline-flex items-center gap-2 text-sm font-medium text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" aria-hidden />
            Editing
        </span>
    );
}
