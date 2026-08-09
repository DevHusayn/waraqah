import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FileText,
    ClipboardList,
    Clock,
    Crown,
    Check,
    ChevronDown,
    ArrowRight,
    TrendingUp,
    Smartphone,
    Instagram,
    Facebook,
    Linkedin,
    Users,
    Package,
    FileBarChart,
} from 'lucide-react';
import LandingNav from '../components/LandingNav';
import LandingInvoicePreview from '../components/LandingInvoicePreview';
import FeatureCarousel from '../components/FeatureCarousel';
import WaraqahLogo from '../components/WaraqahLogo';
import { APP_NAME, APP_SOCIAL_LINKS, APP_TAGLINE } from '../constants/brand';
import { AUTH_LOGIN_PATH, AUTH_REGISTER_PATH } from '../constants/authRoutes';
import { TERMS_PATH, PRIVACY_PATH } from '../constants/legalRoutes';
import { FREE_MONTHLY_INVOICE_LIMIT } from '../utils/invoiceLimits';
import { FREE_PLAN_FEATURES, PREMIUM_PLAN_FEATURES } from '../constants/planFeatures';
import {
    PREMIUM_PRICE_NGN,
    PREMIUM_PRICE_YEARLY_NGN,
    PREMIUM_YEARLY_SAVINGS_NGN,
    formatPremiumPrice,
    premiumIntervalSuffix,
} from '../constants/pricing';
import PremiumPrice from '../components/PremiumPrice';
import { useRevealOnScroll, revealClass } from '../hooks/useRevealOnScroll';

function XIcon({ className }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            fill="currentColor"
            aria-hidden
        >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.227-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
        </svg>
    );
}

const SOCIAL_ICONS = {
    instagram: Instagram,
    facebook: Facebook,
    linkedin: Linkedin,
    x: XIcon,
};

function formatPrice(amount) {
    return Number(amount).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

const WHY_ITEMS = [
    {
        icon: ClipboardList,
        title: 'Win work with clear quotations',
        text: 'Send professional estimates with valid-until dates and terms, then convert accepted quotations into invoices in one click.',
        stamp: 'Signed',
    },
    {
        icon: Clock,
        title: 'Stop rebuilding documents from scratch',
        text: 'Save clients and products once, reuse their details, and send polished quotation, invoice, and receipt PDFs in seconds, not hours.',
        stamp: 'Reused',
    },
    {
        icon: TrendingUp,
        title: 'Proof of payment, even on deposits',
        text: 'Issue receipts for full or partial payments, ideal when customers pay in instalments. Branded PDFs and client emails keep every transaction on record.',
        stamp: 'Paid',
    },
    {
        icon: Smartphone,
        title: 'Work from anywhere',
        text: 'Create quotations, invoices, and receipts, track payments, and download PDFs on your phone or laptop. Your business records travel with you.',
        stamp: 'Synced',
    },
];

const MANAGE_TODAY_ITEMS = [
    {
        icon: ClipboardList,
        title: 'Sales',
        text: 'Quotations, invoices, and receipts, from first quote to proof of payment, including partial payments and client emails.',
    },
    {
        icon: Users,
        title: 'Clients',
        text: 'Save contact details once and reuse them on every document. Export your client list to CSV anytime.',
    },
    {
        icon: Package,
        title: 'Products',
        text: 'Build a product catalog for quick line items, with optional inventory tracking and low-stock alerts.',
    },
    {
        icon: FileBarChart,
        title: 'Reports & exports',
        text: 'Dashboard analytics, overdue tracking, monthly billing statements (Premium), and CSV exports for invoices, quotations, receipts, and clients.',
    },
];

const STEPS = [
    { step: '01', title: 'Add your business', text: 'Set your profile, bank account details, and brand color. Premium adds your logo, stamp, and signature on PDFs.' },
    { step: '02', title: 'Quote, invoice, or receipt', text: 'Build a quotation for new work, bill with an invoice, or issue a receipt when payment arrives, without an invoice. Reuse clients and products either way.' },
    { step: '03', title: 'Send, track, and get paid', text: 'Email documents to clients, convert accepted quotations to invoices, record partial payments on receipts, and keep every payment on record.' },
];

const FAQ_ITEMS = [
    {
        q: 'Who is Waraqah for?',
        a: 'Businesses and solo operators who want one place for quotations, invoices, receipts, clients, products, and payment tracking, without spreadsheets or scattered paperwork. Paystack billing and NGN are supported today.',
    },
    {
        q: 'What is the difference between a quotation and an invoice?',
        a: 'A quotation is an estimate you send before work is agreed. It is not a demand for payment. Once accepted, you can convert it into an invoice. Payment and receipts happen on the invoice.',
    },
    {
        q: 'Can I issue a receipt without an invoice?',
        a: 'Yes. Create a standalone receipt when you receive payment and do not need an invoice. For example, a deposit or walk-in sale. You can record partial payments and follow-up instalments on the same receipt.',
    },
    {
        q: 'What happens on the Free plan?',
        a: `You can create up to ${FREE_MONTHLY_INVOICE_LIMIT} invoices, quotations, and receipts combined per calendar month, manage clients and products, add bank details to invoices, mark invoices paid, and download PDFs. Deleting a document does not reset your monthly allowance.`,
    },
    {
        q: 'What does Premium include?',
        a: 'Unlimited invoices, quotations, and receipts, your logo on PDFs, a company stamp on paid receipts, an authorized signature, and monthly billing statements you can print or export.',
    },
    {
        q: 'How does Premium billing work?',
        a: `Premium is ₦${formatPremiumPrice(PREMIUM_PRICE_NGN)}/month or ₦${formatPremiumPrice(PREMIUM_PRICE_YEARLY_NGN)}/year (2 months free) through Paystack. You can cancel auto-renewal and keep access until the period ends.`,
    },
    {
        q: 'Can I export my data?',
        a: 'Yes. Export filtered lists of invoices, quotations, receipts, and clients to CSV from each list page. Handy for spreadsheets, accounting, or backup.',
    },
    {
        q: 'Can Waraqah email my clients?',
        a: 'Yes. Email finalized quotations and invoices from the share dialog, send payment reminders for outstanding balances, and deliver receipt emails for paid invoices and standalone receipts. You can enable automatic delivery in Settings → Notifications.',
    },
    {
        q: 'Can I use Waraqah on my phone?',
        a: 'Yes. Waraqah works in your mobile browser and native app. Create quotations, invoices, and receipts, manage clients, record payments, and download PDFs on the go.',
    },
];

function FaqItem({ item, open, onToggle }) {
    return (
        <div className="border-b border-zinc-200/80 last:border-0">
            <button
                type="button"
                onClick={onToggle}
                className="flex w-full items-center justify-between gap-4 py-4 text-left"
            >
                <span className="font-medium text-zinc-950">{item.q}</span>
                <ChevronDown
                    className={`h-4 w-4 flex-shrink-0 text-zinc-400 transition-transform duration-200 ${
                        open ? 'rotate-180' : ''
                    }`}
                />
            </button>
            <div
                className={`overflow-hidden transition-all duration-200 ${
                    open ? 'max-h-64 pb-4 opacity-100' : 'max-h-0 opacity-0'
                }`}
            >
                <p className="text-zinc-500 text-sm leading-relaxed pr-8">{item.a}</p>
            </div>
        </div>
    );
}

function CtaButton({ className = '', children = 'Get started' }) {
    return (
        <Link to={AUTH_REGISTER_PATH} className={`btn-primary shadow-soft shadow-brand/20 hover:shadow-card hover:shadow-brand/25 ${className}`}>
            {children}
            <ArrowRight className="h-4 w-4" />
        </Link>
    );
}

function PlanAudienceLine({ children, variant = 'free' }) {
    const styles =
        variant === 'premium'
            ? 'border-amber-300/80 bg-amber-50/60 text-amber-950/80'
            : 'border-zinc-300 bg-zinc-50 text-zinc-600';

    return (
        <p
            className={`mt-3 rounded-md border-l-[3px] px-3 py-2 text-[13px] font-medium italic leading-snug ${styles}`}
        >
            {children}
        </p>
    );
}

function LandingPremiumCard() {
    const [billingInterval, setBillingInterval] = useState('monthly');
    const isYearly = billingInterval === 'yearly';
    const amount = isYearly ? PREMIUM_PRICE_YEARLY_NGN : PREMIUM_PRICE_NGN;

    return (
        <div className="premium-card p-8 h-full flex flex-col relative overflow-hidden landing-premium-glow">
            <div className="absolute top-4 right-4 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 uppercase tracking-wide">
                Popular
            </div>
            <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-600" />
                <h3 className="text-lg font-semibold text-zinc-900">Premium</h3>
            </div>

            <div className="grid grid-cols-2 gap-1 rounded-lg bg-zinc-100 p-1 mt-4 mb-3">
                <button
                    type="button"
                    onClick={() => setBillingInterval('monthly')}
                    className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                        billingInterval === 'monthly'
                            ? 'bg-white text-zinc-900 shadow-sm'
                            : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                >
                    Monthly
                </button>
                <button
                    type="button"
                    onClick={() => setBillingInterval('yearly')}
                    className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                        billingInterval === 'yearly'
                            ? 'bg-white text-zinc-900 shadow-sm'
                            : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                >
                    Yearly
                    <span className="ml-1 text-[10px] font-bold uppercase text-green-700">
                        Save ₦{PREMIUM_YEARLY_SAVINGS_NGN.toLocaleString('en-NG')}
                    </span>
                </button>
            </div>

            <PremiumPrice
                amount={amount}
                suffix={premiumIntervalSuffix(billingInterval)}
                savingsLabel={isYearly ? '2 months free' : ''}
            />
            <PlanAudienceLine variant="premium">
                For growing businesses that care about branding and clean books.
            </PlanAudienceLine>
            <ul className="mt-8 space-y-3 flex-1">
                <li className="flex items-start gap-3 text-sm font-semibold text-zinc-900 pb-3 mb-1 border-b border-amber-200/70">
                    <Check className="h-5 w-5 text-amber-600 flex-shrink-0" />
                    Everything in Free, plus:
                </li>
                {PREMIUM_PLAN_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-zinc-700 text-sm">
                        <Check className="h-5 w-5 text-amber-600 flex-shrink-0" />
                        {f}
                    </li>
                ))}
            </ul>
            <CtaButton className="w-full mt-8 py-3 justify-center" />
        </div>
    );
}

function SectionReveal({ children, className = '', delay = 0 }) {
    const [ref, visible] = useRevealOnScroll();
    return (
        <div ref={ref} className={`${revealClass(visible, delay)} ${className}`}>
            {children}
        </div>
    );
}

export default function Landing() {
    const [openFaq, setOpenFaq] = useState(0);
    const [heroRef, heroVisible] = useRevealOnScroll({ threshold: 0.2 });

    return (
        <div className="landing-page min-h-screen bg-white text-zinc-950 overflow-x-hidden">
            <LandingNav />

            {/* Hero */}
            <section className="relative pt-28 pb-20 sm:pt-32 sm:pb-28 bg-white border-b border-zinc-200/80">
                <div className="mx-auto max-w-6xl px-4 sm:px-6">
                    <div
                        ref={heroRef}
                        className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center ${revealClass(heroVisible)}`}
                    >
                        <div>
                            <p className="text-sm font-bold uppercase tracking-[0.14em] text-zinc-500">
                                {APP_TAGLINE}
                            </p>
                            <h1 className="mt-6 text-3xl sm:text-4xl lg:text-4xl font-bold tracking-tight text-zinc-950 leading-[1.1]">
                                Every sale.{' '}
                                <span className="whitespace-nowrap">Every client.</span>{' '}
                                <span className="landing-text-shimmer">One record.</span>
                            </h1>
                            <p className="mt-6 text-lg text-zinc-600 max-w-xl leading-relaxed">
                                Run sales from quote to receipt. Manage clients and products, email documents,
                                export PDFs and CSV reports, and track what&apos;s paid, all in one workspace,
                                without spreadsheets.
                            </p>
                            <div className="mt-8 flex flex-col sm:flex-row gap-3">
                                <CtaButton className="py-3.5 px-8 text-base shadow-soft shadow-brand/20 hover:shadow-card hover:shadow-brand/25" />
                                <a href="#pricing" className="btn-secondary py-3.5 px-8 text-base border-zinc-200/80 bg-white/70">
                                    Compare plans
                                </a>
                            </div>
                            <p className="mt-4 text-sm text-zinc-500">
                                Free to start · No card required · {FREE_MONTHLY_INVOICE_LIMIT} documents/month
                            </p>
                        </div>

                        <div className="relative">
                            <div className="landing-paper-stack">
                                <div className="landing-paper landing-paper--back" aria-hidden />
                                <div className="landing-paper landing-paper--front">
                                    <LandingInvoicePreview />
                                </div>
                            </div>
                            <p className="mt-4 text-right text-xs text-zinc-400 pr-1">
                                Sample PDF layout
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why */}
            <section className="py-20 sm:py-24 bg-white">
                <div className="mx-auto max-w-6xl px-4 sm:px-6">
                    <SectionReveal className="text-center max-w-2xl mx-auto">
                        <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight">
                            Why you need {APP_NAME}
                        </h2>
                        <p className="mt-4 text-zinc-600 text-lg">
                            Quotes, bills, and receipts shouldn&apos;t slow down your business. Here is what changes when your records live in one place.
                        </p>
                    </SectionReveal>
                    <SectionReveal className="mt-14">
                        <FeatureCarousel items={WHY_ITEMS} />
                    </SectionReveal>
                    <SectionReveal className="mt-12 text-center">
                        <CtaButton className="inline-flex" />
                    </SectionReveal>
                </div>
            </section>

            {/* What you can manage today */}
            <section className="py-20 sm:py-24 bg-zinc-50/80 border-y border-zinc-200/80">
                <div className="mx-auto max-w-6xl px-4 sm:px-6">
                    <SectionReveal className="text-center max-w-2xl mx-auto">
                        <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight">
                            What you can manage today
                        </h2>
                        <p className="mt-4 text-zinc-600 text-lg">
                            Everything your business needs to sell, record, and report, in one workspace.
                        </p>
                    </SectionReveal>
                    <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {MANAGE_TODAY_ITEMS.map((item, i) => {
                            const Icon = item.icon;
                            return (
                                <SectionReveal key={item.title} delay={i + 1}>
                                    <article className="h-full rounded-xl border border-zinc-200/80 bg-white p-6 shadow-sm">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
                                            <Icon className="h-5 w-5" aria-hidden />
                                        </div>
                                        <h3 className="mt-4 text-lg font-semibold text-zinc-900">{item.title}</h3>
                                        <p className="mt-2 text-sm text-zinc-600 leading-relaxed">{item.text}</p>
                                    </article>
                                </SectionReveal>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="py-20 sm:py-24 bg-white">
                <div className="mx-auto max-w-6xl px-4 sm:px-6">
                    <SectionReveal className="text-center max-w-2xl mx-auto">
                        <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight">
                            Three steps from quote to receipt
                        </h2>
                    </SectionReveal>
                    <div className="mt-14 grid md:grid-cols-3 gap-8">
                        {STEPS.map((s, i) => (
                            <SectionReveal key={s.step} delay={i + 1} className="relative">
                                <div className="text-center md:text-left">
                                    <span className="text-5xl font-black text-brand/15">{s.step}</span>
                                    <h3 className="mt-2 text-xl font-semibold text-zinc-900">{s.title}</h3>
                                    <p className="mt-2 text-zinc-600">{s.text}</p>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className="hidden md:block absolute top-8 -right-4 text-brand/30" aria-hidden>
                                        <ArrowRight className="h-6 w-6" />
                                    </div>
                                )}
                            </SectionReveal>
                        ))}
                    </div>
                    <SectionReveal className="mt-12 flex justify-center">
                        <CtaButton />
                    </SectionReveal>
                </div>
            </section>

            {/* Pricing */}
            <section id="pricing" className="py-20 sm:py-24 bg-white scroll-mt-20">
                <div className="mx-auto max-w-6xl px-4 sm:px-6">
                    <SectionReveal className="text-center max-w-2xl mx-auto">
                        <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight">
                            Free to start. Premium when you scale.
                        </h2>
                        <p className="mt-4 text-zinc-600 text-lg">
                            Try {APP_NAME} at no cost, then upgrade for unlimited documents, your logo on PDFs, and monthly billing statements.
                        </p>
                    </SectionReveal>
                    <div className="mt-14 grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        <SectionReveal delay={1}>
                            <div className="rounded-lg border border-zinc-200 bg-white p-6 h-full flex flex-col">
                                <h3 className="text-lg font-semibold text-zinc-900">Free</h3>
                                <p className="mt-2 text-4xl font-bold text-zinc-900">
                                    ₦{formatPrice(0)}
                                    <span className="text-base font-normal text-zinc-500">/month</span>
                                </p>
                                <PlanAudienceLine>
                                    For freelancers and solo operators getting started.
                                </PlanAudienceLine>
                                <ul className="mt-8 space-y-3 flex-1">
                                    {FREE_PLAN_FEATURES.map((f) => (
                                        <li key={f} className="flex items-start gap-3 text-zinc-600 text-sm">
                                            <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <Link to={AUTH_REGISTER_PATH} className="btn-secondary w-full mt-8 py-3">
                                    Get started free
                                </Link>
                            </div>
                        </SectionReveal>
                        <SectionReveal delay={2}>
                            <LandingPremiumCard />
                        </SectionReveal>
                    </div>
                </div>
            </section>

            {/* Features strip */}
            <section className="py-16 border-y border-zinc-200/80 bg-zinc-900 text-white">
                <div className="mx-auto max-w-6xl px-4 sm:px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { icon: ClipboardList, label: 'Quotations' },
                            { icon: FileText, label: 'Invoices & receipts' },
                            { icon: Users, label: 'Clients & products' },
                            { icon: FileBarChart, label: 'Dashboard & CSV' },
                        ].map(({ icon: Icon, label }) => (
                            <div key={label} className="flex flex-col items-center gap-3">
                                <Icon className="h-8 w-8 text-green-400" />
                                <span className="text-sm font-medium text-zinc-300">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="py-20 sm:py-24 bg-white scroll-mt-20">
                <div className="mx-auto max-w-3xl px-4 sm:px-6">
                    <SectionReveal className="text-center">
                        <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight">
                            Frequently asked questions
                        </h2>
                    </SectionReveal>
                    <SectionReveal className="mt-10 rounded-2xl border border-zinc-200 bg-zinc-50/50 px-6 sm:px-8">
                        {FAQ_ITEMS.map((item, i) => (
                            <FaqItem
                                key={item.q}
                                item={item}
                                open={openFaq === i}
                                onToggle={() => setOpenFaq(openFaq === i ? -1 : i)}
                            />
                        ))}
                    </SectionReveal>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-20 sm:py-28 bg-white border-t border-zinc-200/80">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
                    <SectionReveal>
                        <h2 className="text-3xl sm:text-4xl font-bold text-zinc-950 tracking-tight">
                            Ready to keep records and get paid?
                        </h2>
                        <p className="mt-4 text-lg text-zinc-600">
                            Join {APP_NAME} today. Send your next quotation, invoice, or receipt in seconds.
                        </p>
                        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to={AUTH_REGISTER_PATH}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand text-white font-semibold py-3.5 px-8 shadow-soft shadow-brand/20 hover:bg-brand-hover transition-colors"
                            >
                                Get started
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link
                                to={AUTH_LOGIN_PATH}
                                className="inline-flex items-center justify-center rounded-xl border border-zinc-200 text-zinc-700 font-medium py-3.5 px-8 hover:bg-zinc-50 transition-colors"
                            >
                                Log in
                            </Link>
                        </div>
                    </SectionReveal>
                </div>
            </section>

            <footer className="py-10 border-t border-zinc-200 bg-white">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
                    <WaraqahLogo size="sm" iconStyle="solid" />
                    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
                        <nav className="flex items-center gap-4" aria-label="Social">
                            {APP_SOCIAL_LINKS.map(({ id, label, url }) => {
                                const Icon = SOCIAL_ICONS[id];
                                return (
                                    <a
                                        key={id}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={label}
                                        className="inline-flex items-center hover:text-zinc-800 transition-colors"
                                    >
                                        {Icon ? <Icon className="h-5 w-5" aria-hidden /> : null}
                                    </a>
                                );
                            })}
                        </nav>
                        <nav className="flex items-center gap-4" aria-label="Legal">
                            <Link to={TERMS_PATH} className="hover:text-zinc-800 transition-colors">
                                Terms
                            </Link>
                            <Link to={PRIVACY_PATH} className="hover:text-zinc-800 transition-colors">
                                Privacy
                            </Link>
                        </nav>
                        <p>© {new Date().getFullYear()} {APP_NAME}. {APP_TAGLINE}</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
