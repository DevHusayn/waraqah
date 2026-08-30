import { useEffect, useRef } from 'react';
import { hasAutoSaveDraftContent } from '../utils/documentFormHelpers';

/**
 * Persist a dirty draft only when the create page unmounts (sidebar nav, etc.).
 * Do not depend on persistDraft — it gets a new identity every render and would
 * auto-save while issuing, which briefly inflates the sidebar draft count.
 */
export function useUnmountDraftAutosave({
    persistDraft,
    isDraftFlow,
    isDirtyRef,
    formDataRef,
    extraCheck,
}) {
    const persistDraftRef = useRef(persistDraft);
    const isDraftFlowRef = useRef(isDraftFlow);
    const extraCheckRef = useRef(extraCheck);
    persistDraftRef.current = persistDraft;
    isDraftFlowRef.current = isDraftFlow;
    extraCheckRef.current = extraCheck;

    useEffect(() => {
        return () => {
            if (!isDraftFlowRef.current) return;
            if (!isDirtyRef.current) return;
            const check = extraCheckRef.current;
            if (
                !hasAutoSaveDraftContent(
                    formDataRef.current,
                    check ? { extraCheck: check } : undefined
                )
            ) {
                return;
            }
            persistDraftRef.current({ silent: true, redirectAfterCreate: false });
        };
    }, [formDataRef, isDirtyRef]);
}
