import { Mail } from 'lucide-react';
import { APP_NAME } from '../constants/brand';

const EMAIL_SAMPLES = [
    {
        type: 'Invoice',
        subject: 'Invoice INV-240519 from Your Business',
        preview: 'Amount due: ₦165,000.00 · Due 15 May 2026 · View invoice',
        accent: 'bg-brand/10 text-brand border-brand/20',
    },
    {
        type: 'Reminder',
        subject: 'Payment reminder — Invoice INV-240519',
        preview: 'A friendly reminder that ₦165,000.00 is outstanding. Pay now',
        accent: 'bg-amber-50 text-amber-800 border-amber-200/80',
    },
    {
        type: 'Receipt',
        subject: 'Receipt RCP-00042 from Your Business',
        preview: 'Amount paid: ₦165,000.00 · Payment date: 3 Jul 2026',
        accent: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    },
];

export default function LandingEmailPreview() {
    return (
        <div className="rounded-xl border border-zinc-200/80 bg-white shadow-card-md overflow-hidden text-left">
            <div className="flex items-center gap-3 border-b border-zinc-100 bg-zinc-50/80 px-4 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white">
                    <Mail className="h-4 w-4" aria-hidden />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900">Client inbox</p>
                    <p className="text-xs text-zinc-500">Delivered by {APP_NAME}</p>
                </div>
            </div>

            <div className="p-3 sm:p-4 space-y-2.5">
                {EMAIL_SAMPLES.map((email, index) => (
                    <div
                        key={email.type}
                        className={`rounded-lg border px-3 py-2.5 transition-shadow ${
                            index === 0
                                ? 'border-brand/25 bg-brand/[0.03] shadow-sm'
                                : 'border-zinc-100 bg-white'
                        }`}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <span
                                className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${email.accent}`}
                            >
                                {email.type}
                            </span>
                            <span className="text-[10px] text-zinc-400 shrink-0">Just now</span>
                        </div>
                        <p className="mt-2 text-xs font-semibold text-zinc-900 leading-snug">{email.subject}</p>
                        <p className="mt-1 text-[11px] text-zinc-500 leading-relaxed">{email.preview}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
