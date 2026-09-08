import { useEffect, useMemo, useState } from 'react';
import { Mail } from 'lucide-react';
import ModalShell from '../ModalShell';
import Spinner from '../Spinner';
import RequiredLabel from '../RequiredLabel';
import FieldValidationMessage from '../FieldValidationMessage';
import CustomSelect from '../CustomSelect';
import { apiFetch } from '../../utils/api';
import {
    validateRequired,
    validateEmail,
    firstFieldError,
    inputClass,
    focusFieldById,
    clearFieldError,
} from '../../utils/formFieldValidation';

const EMPTY_FORM = {
    subject: '',
    preview: '',
    body: '',
    fromPreset: 'support',
    fromName: '',
    replyTo: '',
    actionPreset: 'none',
    actionPath: '',
    actionLabel: '',
};

function firstName(name) {
    return String(name || '').trim().split(/\s+/)[0] || '';
}

function shownAsLabel(fromName) {
    const name = String(fromName || '').trim();
    if (!name) return 'Waraqah';
    return /from\s+waraqah/i.test(name) ? name : `${name} from Waraqah`;
}

const FALLBACK_PRESETS = [
    {
        id: 'noreply',
        label: 'No-reply',
        from: 'Waraqah <noreply@mail.mywaraqah.com>',
        requiresReplyTo: false,
        hint: 'Sent as Waraqah <noreply@mail.mywaraqah.com>. The email tells recipients not to reply.',
    },
    {
        id: 'support',
        label: 'Support',
        from: 'Waraqah <support@mail.mywaraqah.com>',
        requiresReplyTo: false,
        hint: 'Sent from support@mail.mywaraqah.com. Replies go to support@mywaraqah.com.',
    },
    {
        id: 'custom',
        label: 'Custom reply address',
        from: 'Waraqah <support@mail.mywaraqah.com>',
        requiresReplyTo: true,
        hint: 'Add a name to show “Haybah from Waraqah”. Replies go to the address you enter.',
    },
];

const FALLBACK_ACTIONS = [
    { id: 'none', label: 'No button', requiresPath: false, defaultLabel: '' },
    { id: 'dashboard', label: 'Go to dashboard', requiresPath: false, defaultLabel: 'Go to dashboard' },
    { id: 'invoices', label: 'View invoices', requiresPath: false, defaultLabel: 'View invoices' },
    { id: 'quotations', label: 'View quotations', requiresPath: false, defaultLabel: 'View quotations' },
    { id: 'settings', label: 'Open settings', requiresPath: false, defaultLabel: 'Open settings' },
    { id: 'billing', label: 'Manage billing', requiresPath: false, defaultLabel: 'Manage billing' },
    { id: 'upgrade', label: 'Upgrade to Premium', requiresPath: false, defaultLabel: 'Upgrade to Premium' },
    { id: 'custom', label: 'Custom Waraqah link', requiresPath: true, defaultLabel: 'Open Waraqah' },
];

function buildFieldErrors(form, selectedPreset, selectedAction) {
    return {
        subject: validateRequired(form.subject, 'Please enter a subject.'),
        body: validateRequired(form.body, 'Please enter a message.'),
        replyTo: selectedPreset?.requiresReplyTo
            ? validateEmail(
                form.replyTo,
                'Enter a reply-to email.',
                'Please enter a valid email address.'
            )
            : '',
        actionPath: selectedAction?.requiresPath
            ? validateRequired(form.actionPath, 'Enter a Waraqah path or link.')
            : '',
    };
}

export default function AdminEmailModal({ open, user, senderName = '', onClose, onSent }) {
    const [form, setForm] = useState(EMPTY_FORM);
    const [presets, setPresets] = useState(FALLBACK_PRESETS);
    const [actions, setActions] = useState(FALLBACK_ACTIONS);
    const [fieldErrors, setFieldErrors] = useState({});
    const [previewHtml, setPreviewHtml] = useState('');
    const [previewMeta, setPreviewMeta] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState('');
    const [sending, setSending] = useState(false);
    const [submitError, setSubmitError] = useState('');

    const userId = user?.id;
    const selectedPreset = presets.find((preset) => preset.id === form.fromPreset) || presets[1];
    const selectedAction = actions.find((action) => action.id === form.actionPreset) || actions[0];

    useEffect(() => {
        if (!open) return undefined;
        setForm({ ...EMPTY_FORM, fromName: firstName(senderName) });
        setFieldErrors({});
        setPreviewHtml('');
        setPreviewMeta(null);
        setPreviewError('');
        setSubmitError('');
        setSending(false);

        let cancelled = false;
        apiFetch('/auth/admin/email-options')
            .then((data) => {
                if (cancelled) return;
                if (Array.isArray(data?.presets) && data.presets.length) {
                    setPresets(data.presets);
                }
                if (Array.isArray(data?.actions) && data.actions.length) {
                    setActions(data.actions);
                }
            })
            .catch(() => { });
        return () => {
            cancelled = true;
        };
    }, [open, userId, senderName]);

    useEffect(() => {
        if (!open || !userId) return undefined;
        const subject = form.subject.trim();
        const body = form.body.trim();
        if (!subject || !body) {
            setPreviewHtml('');
            setPreviewMeta(null);
            setPreviewError('');
            return undefined;
        }
        if (selectedPreset?.requiresReplyTo && !form.replyTo.trim()) {
            setPreviewHtml('');
            setPreviewMeta(null);
            return undefined;
        }
        if (selectedAction?.requiresPath && !form.actionPath.trim()) {
            setPreviewHtml('');
            setPreviewMeta(null);
            return undefined;
        }

        let cancelled = false;
        const timer = setTimeout(() => {
            setPreviewLoading(true);
            setPreviewError('');
            apiFetch(`/auth/admin/users/${userId}/email/preview`, {
                method: 'POST',
                body: JSON.stringify({
                    subject: form.subject,
                    preview: form.preview,
                    body: form.body,
                    fromPreset: form.fromPreset,
                    fromName: form.fromName,
                    replyTo: form.replyTo,
                    actionPreset: form.actionPreset,
                    actionPath: form.actionPath,
                    actionLabel: form.actionLabel,
                }),
            })
                .then((data) => {
                    if (cancelled) return;
                    setPreviewHtml(data.html || '');
                    setPreviewMeta({
                        from: data.from,
                        replyTo: data.replyTo,
                        to: data.to,
                        subject: data.subject,
                    });
                })
                .catch((err) => {
                    if (cancelled) return;
                    setPreviewError(err.message || 'Could not render preview.');
                })
                .finally(() => {
                    if (!cancelled) setPreviewLoading(false);
                });
        }, 400);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [open, userId, form.subject, form.preview, form.body, form.fromPreset, form.fromName, form.replyTo, form.actionPreset, form.actionPath, form.actionLabel, selectedPreset?.requiresReplyTo, selectedAction?.requiresPath]);

    const senderOptions = useMemo(
        () =>
            presets.map((preset) => ({
                value: preset.id,
                label: `${preset.label} · ${preset.from}`,
            })),
        [presets]
    );

    const actionOptions = useMemo(
        () =>
            actions.map((action) => ({
                value: action.id,
                label: action.label,
            })),
        [actions]
    );

    const handleChange = (name, value) => {
        setForm((prev) => ({ ...prev, [name]: value }));
        clearFieldError(setFieldErrors, name);
        setSubmitError('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const errors = buildFieldErrors(form, selectedPreset, selectedAction);
        const firstInvalid = firstFieldError(errors, ['subject', 'replyTo', 'body', 'actionPath']);
        if (firstInvalid) {
            setFieldErrors(errors);
            focusFieldById(`admin-email-${firstInvalid}`);
            return;
        }

        setSending(true);
        setSubmitError('');
        try {
            const result = await apiFetch(`/auth/admin/users/${userId}/email`, {
                method: 'POST',
                body: JSON.stringify({
                    subject: form.subject,
                    preview: form.preview,
                    body: form.body,
                    fromPreset: form.fromPreset,
                    fromName: form.fromName,
                    replyTo: form.replyTo,
                    actionPreset: form.actionPreset,
                    actionPath: form.actionPath,
                    actionLabel: form.actionLabel,
                }),
            });
            onSent?.(result.message || `Email sent to ${user.email}`);
            onClose();
        } catch (err) {
            setSubmitError(err.message || 'Failed to send email.');
        } finally {
            setSending(false);
        }
    };

    return (
        <ModalShell
            open={open}
            onClose={sending ? undefined : onClose}
            size="2xl"
            showClose
            ariaLabelledby="admin-email-title"
            panelClassName="sm:max-h-[90vh]"
        >
            <div className="px-6 pt-6 pb-4 border-b border-border/50">
                <div className="flex items-start gap-3 pr-8">
                    <div className="p-2.5 rounded-xl bg-brand-subtle shrink-0">
                        <Mail className="h-5 w-5 text-brand" aria-hidden />
                    </div>
                    <div className="min-w-0">
                        <h2 id="admin-email-title" className="text-lg font-semibold text-foreground">
                            Email user
                        </h2>
                        <p className="text-sm text-foreground-muted mt-0.5 truncate">
                            To {user?.name || 'this user'} · {user?.email}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4 min-w-0">
                        <div>
                            <label htmlFor="admin-email-from" className="label">
                                Sender
                            </label>
                            <CustomSelect
                                id="admin-email-from"
                                value={form.fromPreset}
                                onChange={(value) => handleChange('fromPreset', value)}
                                options={senderOptions}
                                aria-label="Sender"
                            />
                            <p className="mt-1.5 text-xs text-foreground-muted">
                                {selectedPreset?.hint}
                            </p>
                        </div>

                        <div>
                            <label htmlFor="admin-email-fromName" className="label">
                                Shown as{' '}
                                <span className="text-foreground-muted/70 font-normal">(optional)</span>
                            </label>
                            <input
                                id="admin-email-fromName"
                                type="text"
                                value={form.fromName}
                                onChange={(e) => handleChange('fromName', e.target.value)}
                                className="input-field"
                                placeholder="e.g. Haybah"
                                maxLength={80}
                                disabled={sending}
                            />
                            <p className="mt-1.5 text-xs text-foreground-muted">
                                Recipients see {shownAsLabel(form.fromName)}
                            </p>
                        </div>

                        {selectedPreset?.requiresReplyTo ? (
                            <div>
                                <RequiredLabel htmlFor="admin-email-replyTo">Reply-to</RequiredLabel>
                                <input
                                    id="admin-email-replyTo"
                                    type="email"
                                    value={form.replyTo}
                                    onChange={(e) => handleChange('replyTo', e.target.value)}
                                    className={inputClass(Boolean(fieldErrors.replyTo))}
                                    placeholder="name@example.com"
                                    aria-invalid={Boolean(fieldErrors.replyTo)}
                                    disabled={sending}
                                />
                                <FieldValidationMessage message={fieldErrors.replyTo} />
                            </div>
                        ) : null}

                        <div>
                            <RequiredLabel htmlFor="admin-email-subject">Subject</RequiredLabel>
                            <input
                                id="admin-email-subject"
                                type="text"
                                value={form.subject}
                                onChange={(e) => handleChange('subject', e.target.value)}
                                className={inputClass(Boolean(fieldErrors.subject))}
                                placeholder="Quick follow-up"
                                maxLength={200}
                                aria-invalid={Boolean(fieldErrors.subject)}
                                disabled={sending}
                            />
                            <FieldValidationMessage message={fieldErrors.subject} />
                        </div>

                        <div>
                            <label htmlFor="admin-email-preview" className="label">
                                Inbox preview{' '}
                                <span className="text-foreground-muted/70 font-normal">(optional)</span>
                            </label>
                            <input
                                id="admin-email-preview"
                                type="text"
                                value={form.preview}
                                onChange={(e) => handleChange('preview', e.target.value)}
                                className="input-field"
                                placeholder="Shown next to the subject in the inbox"
                                maxLength={200}
                                disabled={sending}
                            />
                        </div>

                        <div>
                            <RequiredLabel htmlFor="admin-email-body">Message</RequiredLabel>
                            <textarea
                                id="admin-email-body"
                                value={form.body}
                                onChange={(e) => handleChange('body', e.target.value)}
                                className={inputClass(Boolean(fieldErrors.body), 'resize-y min-h-[180px]')}
                                placeholder="Write the message. Blank lines start a new paragraph."
                                maxLength={8000}
                                aria-invalid={Boolean(fieldErrors.body)}
                                disabled={sending}
                            />
                            <FieldValidationMessage message={fieldErrors.body} />
                        </div>

                        <div>
                            <label htmlFor="admin-email-action" className="label">
                                Action button{' '}
                                <span className="text-foreground-muted/70 font-normal">(optional)</span>
                            </label>
                            <CustomSelect
                                id="admin-email-action"
                                value={form.actionPreset}
                                onChange={(value) => handleChange('actionPreset', value)}
                                options={actionOptions}
                                aria-label="Action button"
                            />
                            <p className="mt-1.5 text-xs text-foreground-muted">
                                Adds a button at the bottom of the email. Links stay on Waraqah.
                            </p>
                        </div>

                        {selectedAction?.requiresPath ? (
                            <div>
                                <RequiredLabel htmlFor="admin-email-actionPath">Button link</RequiredLabel>
                                <input
                                    id="admin-email-actionPath"
                                    type="text"
                                    value={form.actionPath}
                                    onChange={(e) => handleChange('actionPath', e.target.value)}
                                    className={inputClass(Boolean(fieldErrors.actionPath))}
                                    placeholder="/invoices or https://mywaraqah.com/upgrade"
                                    maxLength={300}
                                    aria-invalid={Boolean(fieldErrors.actionPath)}
                                    disabled={sending}
                                />
                                <FieldValidationMessage message={fieldErrors.actionPath} />
                            </div>
                        ) : null}

                        {form.actionPreset !== 'none' ? (
                            <div>
                                <label htmlFor="admin-email-actionLabel" className="label">
                                    Button label{' '}
                                    <span className="text-foreground-muted/70 font-normal">(optional)</span>
                                </label>
                                <input
                                    id="admin-email-actionLabel"
                                    type="text"
                                    value={form.actionLabel}
                                    onChange={(e) => handleChange('actionLabel', e.target.value)}
                                    className="input-field"
                                    placeholder={selectedAction?.defaultLabel || 'Open Waraqah'}
                                    maxLength={40}
                                    disabled={sending}
                                />
                            </div>
                        ) : null}
                    </div>

                    <div className="min-w-0">
                        <p className="label">Preview</p>
                        <div className="rounded-xl border border-border bg-surface-muted/40 overflow-hidden min-h-[280px]">
                            {previewMeta ? (
                                <div className="px-3 py-2 border-b border-border/60 text-[11px] text-foreground-muted space-y-0.5">
                                    <p className="truncate">From {previewMeta.from}</p>
                                    {previewMeta.replyTo ? (
                                        <p className="truncate">Reply-to {previewMeta.replyTo}</p>
                                    ) : null}
                                </div>
                            ) : null}
                            {previewLoading && !previewHtml ? (
                                <div className="flex justify-center py-16">
                                    <Spinner />
                                </div>
                            ) : previewError && !previewHtml ? (
                                <p className="p-4 text-sm text-red-600">{previewError}</p>
                            ) : previewHtml ? (
                                <iframe
                                    title="Email preview"
                                    sandbox=""
                                    srcDoc={previewHtml}
                                    className="w-full h-[420px] bg-white [color-scheme:light]"
                                />
                            ) : (
                                <p className="p-4 text-sm text-foreground-muted">
                                    Add a subject and message to see the Waraqah email template.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {submitError ? (
                    <p className="mt-4 text-sm text-red-600" role="alert">
                        {submitError}
                    </p>
                ) : null}

                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-5">
                    <button type="button" onClick={onClose} disabled={sending} className="btn-secondary flex-1">
                        Cancel
                    </button>
                    <button type="submit" disabled={sending || !user?.email} className="btn-primary flex-1">
                        {sending ? (
                            <>
                                <Spinner size="sm" inline />
                                Sending…
                            </>
                        ) : (
                            'Send email'
                        )}
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}
