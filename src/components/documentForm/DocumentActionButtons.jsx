import { Save, PenLine } from 'lucide-react';
import Spinner from '../Spinner';

export default function DocumentActionButtons({
    variant = 'mobile',
    isDraftFlow,
    saving,
    sending,
    sendReady,
    formId,
    sendIcon: SendIcon,
    sendLabel,
    onSaveDraft,
    onSend,
}) {
    const actionBtn = 'w-full text-sm py-2.5 px-4 gap-2 whitespace-nowrap min-h-[44px]';
    const layoutClass =
        variant === 'desktop'
            ? 'flex flex-col gap-2 w-full'
            : 'grid grid-cols-2 gap-2 sm:gap-3 w-full';

    if (isDraftFlow) {
        return (
            <div className={layoutClass}>
                <button
                    type="button"
                    onClick={onSaveDraft}
                    className={`btn-secondary ${actionBtn} disabled:opacity-60`}
                    disabled={saving || sending}
                >
                    {saving ? (
                        <>
                            <Spinner size="sm" inline />
                            Saving…
                        </>
                    ) : (
                        <>
                            <PenLine size={16} className="shrink-0" aria-hidden />
                            Save as draft
                        </>
                    )}
                </button>
                <button
                    type="button"
                    onClick={onSend}
                    className={`btn-primary ${actionBtn} disabled:opacity-60`}
                    disabled={!sendReady || sending || saving}
                >
                    {sending ? (
                        <>
                            <Spinner size="sm" inline />
                            Saving…
                        </>
                    ) : (
                        <>
                            <SendIcon size={16} className="shrink-0" aria-hidden />
                            {sendLabel}
                        </>
                    )}
                </button>
            </div>
        );
    }

    return (
        <button
            type="submit"
            form={formId}
            className={`btn-primary ${actionBtn} disabled:opacity-60`}
            disabled={saving}
        >
            {saving ? (
                <>
                    <Spinner size="sm" inline />
                    Saving…
                </>
            ) : (
                <>
                    <Save size={16} className="shrink-0" aria-hidden />
                    Save changes
                </>
            )}
        </button>
    );
}
