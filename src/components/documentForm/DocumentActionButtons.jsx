import { Save, PenLine, Eye } from 'lucide-react';
import Spinner from '../Spinner';

function ActionIcon({ children }) {
    return (
        <span className="inline-flex shrink-0 items-center justify-center leading-none" aria-hidden>
            {children}
        </span>
    );
}

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
    onPreview,
    previewLabel = 'Preview',
    onSend,
}) {
    const actionBtn =
        variant === 'desktop'
            ? 'w-full text-sm py-2.5 px-4 gap-2 whitespace-nowrap min-h-[44px]'
            : 'w-full min-h-[44px] gap-1 px-1.5 py-2 text-[11px] leading-tight sm:gap-2 sm:px-3 sm:py-2.5 sm:text-sm flex-col sm:flex-row';
    const layoutClass =
        variant === 'desktop'
            ? 'flex flex-col gap-2 w-full'
            : 'grid grid-cols-3 gap-1.5 sm:gap-3 w-full';

    if (isDraftFlow) {
        return (
            <div className={layoutClass}>
                <button
                    type="button"
                    onClick={onSaveDraft}
                    className={`btn-secondary ${actionBtn} disabled:opacity-60`}
                    disabled={saving || sending}
                    aria-label="Save as draft"
                >
                    {saving ? (
                        <>
                            <Spinner size="sm" inline />
                            <span>Saving…</span>
                        </>
                    ) : (
                        <>
                            <ActionIcon>
                                <PenLine size={18} strokeWidth={2} />
                            </ActionIcon>
                            <span className="sm:hidden">Draft</span>
                            <span className="hidden sm:inline">Save as draft</span>
                        </>
                    )}
                </button>
                <button
                    type="button"
                    onClick={onPreview}
                    className={`btn-secondary ${actionBtn}`}
                    disabled={saving || sending}
                    aria-label={previewLabel}
                >
                    <ActionIcon>
                        <Eye size={18} strokeWidth={2} />
                    </ActionIcon>
                    <span>{previewLabel}</span>
                </button>
                <button
                    type="button"
                    onClick={onSend}
                    className={`btn-primary ${actionBtn} disabled:opacity-60`}
                    disabled={!sendReady || sending || saving}
                    aria-label={sendLabel}
                >
                    {sending ? (
                        <>
                            <Spinner size="sm" inline />
                            <span>Saving…</span>
                        </>
                    ) : (
                        <>
                            <ActionIcon>
                                <SendIcon size={18} strokeWidth={2} />
                            </ActionIcon>
                            <span className="sm:hidden">Create</span>
                            <span className="hidden sm:inline">{sendLabel}</span>
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
            className={`btn-primary w-full text-sm py-2.5 px-4 gap-2 whitespace-nowrap min-h-[44px] disabled:opacity-60`}
            disabled={saving}
        >
            {saving ? (
                <>
                    <Spinner size="sm" inline />
                    Saving…
                </>
            ) : (
                <>
                    <ActionIcon>
                        <Save size={18} strokeWidth={2} />
                    </ActionIcon>
                    Save changes
                </>
            )}
        </button>
    );
}
