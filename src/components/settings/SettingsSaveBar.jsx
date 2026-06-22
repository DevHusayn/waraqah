import { Save, X } from 'lucide-react';
import Spinner from '../Spinner';

export default function SettingsSaveBar({
    formId,
    saving,
    onCancel,
    mobileOnly = false,
    desktopOnly = false,
}) {
    const wrapperClass = mobileOnly
        ? 'fixed bottom-0 inset-x-0 z-40 lg:hidden border-t border-zinc-200 bg-white/95 backdrop-blur-sm shadow-[0_-4px_24px_rgba(15,23,42,0.08)]'
        : desktopOnly
          ? 'hidden lg:block'
          : '';

    const content = (
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 sm:justify-end">
            <button
                type="button"
                onClick={onCancel}
                disabled={saving}
                className="btn-secondary sm:min-w-[120px]"
            >
                <X size={18} aria-hidden />
                Cancel
            </button>
            <button
                type="submit"
                form={formId}
                disabled={saving}
                className="btn-primary sm:min-w-[160px]"
            >
                {saving ? (
                    <>
                        <Spinner size="sm" inline />
                        Saving…
                    </>
                ) : (
                    <>
                        <Save size={18} aria-hidden />
                        Save changes
                    </>
                )}
            </button>
        </div>
    );

    if (mobileOnly) {
        return (
            <div className={wrapperClass}>
                <div className="max-w-6xl mx-auto px-4 py-3">{content}</div>
            </div>
        );
    }

    if (desktopOnly) {
        return <div className={wrapperClass}>{content}</div>;
    }

    return content;
}

export function SettingsEditingBanner() {
    return (
        <div className="mb-6 rounded-xl border border-brand/20 bg-brand-subtle/60 px-4 py-3 text-sm text-zinc-700">
            You are editing your settings. Changes apply to all future invoices and PDFs.
        </div>
    );
}
