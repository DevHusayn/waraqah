import { useEffect, useMemo, useState } from 'react';
import { formatAdminWhatsAppMessage, toWhatsAppUrl } from '@waraqah/shared';
import ModalShell from '../ModalShell';
import CustomSelect from '../CustomSelect';
import { apiFetch } from '../../utils/api';
import { FALLBACK_TEMPLATES } from './adminMessageTemplates';

const DEFAULT_TEMPLATE_ID = 'onboarding';

function fillTemplateBody(template, greetingName) {
    const name = String(greetingName || '').trim().split(/\s+/)[0] || 'there';
    return String(template?.body || '').replace(/\{\{\s*firstName\s*\}\}/g, name);
}

function pickTemplate(templates, templateId) {
    return templates.find((item) => item.id === templateId)
        || templates.find((item) => item.id === DEFAULT_TEMPLATE_ID)
        || templates[0];
}

export default function AdminWhatsAppModal({
    open,
    onClose,
    phone,
    country,
    businessName,
    displayName,
}) {
    const [templates, setTemplates] = useState(FALLBACK_TEMPLATES);
    const [templateId, setTemplateId] = useState(DEFAULT_TEMPLATE_ID);
    const [body, setBody] = useState('');

    const greetingName = String(businessName || displayName || '').trim();

    useEffect(() => {
        if (!open) return undefined;
        const initial = pickTemplate(FALLBACK_TEMPLATES, DEFAULT_TEMPLATE_ID);
        setTemplates(FALLBACK_TEMPLATES);
        setTemplateId(initial?.id || DEFAULT_TEMPLATE_ID);
        setBody(fillTemplateBody(initial, greetingName));

        let cancelled = false;
        apiFetch('/auth/admin/email-options')
            .then((data) => {
                if (cancelled || !Array.isArray(data?.templates) || !data.templates.length) return;
                setTemplates(data.templates);
                const selected = pickTemplate(data.templates, DEFAULT_TEMPLATE_ID);
                setTemplateId(selected?.id || DEFAULT_TEMPLATE_ID);
                setBody(fillTemplateBody(selected, greetingName));
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [open, greetingName]);

    const templateOptions = useMemo(
        () =>
            templates
                .filter((template) => template.id !== 'blank')
                .map((template) => ({
                    value: template.id,
                    label: template.label,
                })),
        [templates]
    );

    const message = formatAdminWhatsAppMessage(greetingName, body);
    const url = toWhatsAppUrl(phone, country, message);

    const handleTemplateChange = (nextId) => {
        const template = pickTemplate(templates, nextId);
        setTemplateId(template?.id || nextId);
        setBody(fillTemplateBody(template, greetingName));
    };

    return (
        <ModalShell
            open={open}
            onClose={onClose}
            size="md"
            showClose
            ariaLabelledby="admin-whatsapp-title"
        >
            <div className="px-6 pt-6 pb-4 border-b border-border/50">
                <h2 id="admin-whatsapp-title" className="text-lg font-semibold text-foreground">
                    WhatsApp message
                </h2>
                <p className="mt-1 text-sm text-foreground-muted">
                    Same drafts as email. WhatsApp adds the greeting and Team Waraqah sign-off.
                </p>
            </div>

            <div className="p-6 space-y-4">
                <div>
                    <label htmlFor="admin-whatsapp-template" className="label">
                        Message
                    </label>
                    <CustomSelect
                        id="admin-whatsapp-template"
                        value={templateId}
                        onChange={handleTemplateChange}
                        options={templateOptions}
                        aria-label="Message"
                    />
                </div>

                <div>
                    <label htmlFor="admin-whatsapp-body" className="label">
                        Message body
                    </label>
                    <textarea
                        id="admin-whatsapp-body"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        className="input-field resize-y min-h-[180px]"
                        placeholder="Write the WhatsApp message."
                        maxLength={8000}
                    />
                    <p className="mt-1.5 text-xs text-foreground-muted">
                        Opens as “Hi {greetingName || 'there'},” plus this text.
                    </p>
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
                    <button type="button" onClick={onClose} className="btn-secondary flex-1">
                        Cancel
                    </button>
                    <a
                        href={url || undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`btn-primary flex-1 text-center ${!url ? 'pointer-events-none opacity-50' : ''}`}
                        aria-disabled={!url}
                        onClick={() => {
                            if (!url) return;
                            onClose?.();
                        }}
                    >
                        Open WhatsApp
                    </a>
                </div>
            </div>
        </ModalShell>
    );
}
