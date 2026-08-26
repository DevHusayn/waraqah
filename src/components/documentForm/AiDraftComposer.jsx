import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Sparkles } from 'lucide-react';
import { AI_MAX_PROMPT_LENGTH, ANALYTICS_EVENTS, REPLAY_MASK } from '@waraqah/shared';
import FormSection from '../FormSection';
import Spinner from '../Spinner';
import { apiFetch } from '../../utils/api';
import { captureEvent } from '../../monitoring/posthog';
import { inputClass } from '../../utils/formFieldValidation';

const PLACEHOLDER = 'Invoice Ahmed 3 bags of cement at 8500 and delivery 2000';

export default function AiDraftComposer({
    documentType = 'invoice',
    premium = false,
    disabled = false,
    onApply,
}) {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [warnings, setWarnings] = useState([]);
    const label = documentType === 'quotation' ? 'quotation' : 'invoice';

    const handleDraft = async () => {
        const text = prompt.trim();
        if (!text) {
            setError('Describe the job first.');
            return;
        }

        setLoading(true);
        setError('');
        setWarnings([]);
        captureEvent(ANALYTICS_EVENTS.AI_DRAFT_STARTED, { document_type: documentType });

        try {
            const draft = await apiFetch('/ai/draft-document', {
                method: 'POST',
                body: JSON.stringify({ prompt: text, documentType }),
                timeoutMs: 45000,
            });
            onApply?.(draft);
            setWarnings(Array.isArray(draft?.warnings) ? draft.warnings : []);
            captureEvent(ANALYTICS_EVENTS.AI_DRAFT_APPLIED, {
                document_type: documentType,
                item_count: Array.isArray(draft?.items) ? draft.items.length : 0,
            });
        } catch (err) {
            setError(err.message || 'Could not draft the document.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <FormSection
            icon={Sparkles}
            title="Draft from a sentence"
            description={`Describe the ${label}. We fill the form — you still review and save.`}
        >
            {premium ? (
                <div className="space-y-3">
                    <textarea
                        value={prompt}
                        onChange={(event) => {
                            setPrompt(event.target.value.slice(0, AI_MAX_PROMPT_LENGTH));
                            if (error) setError('');
                        }}
                        className={`${inputClass(Boolean(error), 'resize-none min-h-[88px]')} ${REPLAY_MASK.SENSITIVE}`}
                        rows={3}
                        maxLength={AI_MAX_PROMPT_LENGTH}
                        placeholder={PLACEHOLDER}
                        disabled={loading || disabled}
                        aria-label={`Describe the ${label}`}
                    />
                    {error ? <p className="text-sm text-red-600">{error}</p> : null}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <button
                            type="button"
                            onClick={handleDraft}
                            disabled={loading || disabled}
                            className="btn-primary inline-flex items-center justify-center gap-2"
                        >
                            {loading ? <Spinner size="sm" tone="on-color" inline /> : <Sparkles size={16} aria-hidden />}
                            {loading ? 'Drafting…' : `Draft ${label}`}
                        </button>
                        <p className="text-xs text-foreground-muted">
                            Nothing is saved or sent until you use the buttons below.
                        </p>
                    </div>
                    {warnings.length > 0 ? (
                        <ul className="text-xs text-amber-800 dark:text-amber-200 space-y-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 rounded-lg px-3 py-2">
                            {warnings.map((warning) => (
                                <li key={warning}>{warning}</li>
                            ))}
                        </ul>
                    ) : null}
                </div>
            ) : (
                <div className="premium-card p-5">
                    <p className="text-sm text-foreground-muted mb-4">
                        Premium can turn a sentence into a draft {label} using your clients and products.
                        You still review the form before saving.
                    </p>
                    <Link to="/upgrade" className="premium-upgrade-btn text-sm py-2 px-4">
                        <Crown size={16} className="text-amber-600 shrink-0" aria-hidden />
                        Upgrade to Premium
                    </Link>
                </div>
            )}
        </FormSection>
    );
}
