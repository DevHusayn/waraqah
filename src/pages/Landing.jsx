import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FileText,
    Users,
    Clock,
    Shield,
    Crown,
    Check,
    ChevronDown,
    ArrowRight,
    Sparkles,
    TrendingUp,
    Smartphone,
} from 'lucide-react';
import LandingNav from '../components/LandingNav';
import LandingInvoicePreview from '../components/LandingInvoicePreview';
import WaraqahLogo from '../components/WaraqahLogo';
import { APP_NAME, APP_TAGLINE } from '../constants/brand';
import { AUTH_LOGIN_PATH, AUTH_REGISTER_PATH } from '../constants/authRoutes';
import { FREE_MONTHLY_INVOICE_LIMIT } from '../utils/invoiceLimits';
import { FREE_PLAN_FEATURES, PREMIUM_PLAN_FEATURES } from '../constants/planFeatures';
import { PREMIUM_PRICE_NGN, formatPremiumPrice } from '../constants/pricing';
import PremiumPrice from '../components/PremiumPrice';
import { useRevealOnScroll, revealClass } from '../hooks/useRevealOnScroll';

const PREMIUM_PRICE = PREMIUM_PRICE_NGN;

function formatPrice(amount) {
    return Number(amount).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

const WHY_ITEMS = [
    {
        icon: Clock,
        title: 'Stop rebuilding invoices from scratch',
        text: 'Save clients and products once, reuse their details, and send polished PDFs in seconds — not hours.',
    },
    {
        icon: TrendingUp,
        title: 'Look professional, get paid faster',
        text: 'Clear totals, due dates, and branded PDFs help you look established. Mark invoices paid to issue receipts instantly.',
    },
    {
        icon: Smartphone,
        title: 'Work from anywhere',
        text: 'Create invoices, track payments, and download PDFs on your phone or laptop. Your workspace travels with you.',
    },
    {
        icon: Shield,
        title: 'Stay organised as you grow',
        text: 'Dashboard overview, client records, and pending, overdue, and paid status keep every invoice easy to find.',
    },
];

const STEPS = [
    { step: '01', title: 'Add your business', text: 'Set your profile, bank account details, and brand color. Premium adds your logo, stamp, and signature on PDFs.' },
    { step: '02', title: 'Save clients & products', text: 'Store contacts and catalog items once, then pick them on every new invoice.' },
    { step: '03', title: 'Send and track', text: 'Download a polished PDF invoice with your bank details, share it, and mark it paid when you receive payment.' },
];

const FAQ_ITEMS = [
    {
        q: 'Who is Waraqah for?',
        a: 'Freelancers and businesses in Nigeria who want polished PDF invoices, client records, payment tracking, and a simple dashboard — without spreadsheets.',
    },
    {
        q: 'What happens on the Free plan?',
        a: `You can create up to ${FREE_MONTHLY_INVOICE_LIMIT} invoices per calendar month, manage clients and products, add bank details to invoices, mark invoices paid, and download PDF receipts. Deleting an invoice does not reset your monthly allowance.`,
    },
    {
        q: 'What does Premium include?',
        a: 'Unlimited invoices, your logo on PDF invoices, a company stamp on paid receipts, an authorized signature, and monthly billing statements you can print or export.',
    },
    {
        q: 'How does Premium billing work?',
        a: `Premium is ₦${formatPremiumPrice(PREMIUM_PRICE)}/month (launch price) through Paystack. You can cancel auto-renewal and keep access until the period ends.`,
    },
    {
        q: 'Can I use Waraqah on my phone?',
        a: 'Yes. Waraqah works in your mobile browser. Create invoices, manage clients, mark payments, and download PDFs on the go.',
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
        <Link to={AUTH_REGISTER_PATH} className={`btn-primary shadow-lg shadow-brand/25 hover:shadow-xl hover:shadow-brand/30 ${className}`}>
            {children}
            <ArrowRight className="h-4 w-4" />
        </Link>
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
            <section className="relative pt-28 pb-20 sm:pt-32 sm:pb-28 landing-hero-gradient border-b border-zinc-200/80 overflow-hidden">
                <div className="landing-blob landing-blob-1" aria-hidden />
                <div className="landing-blob landing-blob-2" aria-hidden />
                <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
                    <div
                        ref={heroRef}
                        className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center ${revealClass(heroVisible)}`}
                    >
                        <div>
                            <p className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-brand/20 px-4 py-1.5 text-sm font-medium text-brand shadow-sm landing-float-badge">
                                <Sparkles className="h-4 w-4" />
                                {APP_TAGLINE}
                            </p>
                            <h1 className="mt-6 text-3xl sm:text-4xl lg:text-[3.25rem] font-bold tracking-tight text-zinc-950 leading-[1.1]">
                                Create a professional invoice in{' '}
                                <span className="landing-text-shimmer">seconds</span>
                            </h1>
                            <p className="mt-6 text-lg text-zinc-600 max-w-xl leading-relaxed">
                                {APP_NAME} helps freelancers and businesses send polished invoices,
                                manage clients, and track payments without spreadsheets or design stress.
                            </p>
                            <div className="mt-8 flex flex-col sm:flex-row gap-3">
                                <CtaButton className="py-3.5 px-8 text-base shadow-lg shadow-brand/25 hover:shadow-xl hover:shadow-brand/30" />
                                <a href="#pricing" className="btn-secondary py-3.5 px-8 text-base border-zinc-200/80 bg-white/70">
                                    Compare plans
                                </a>
                            </div>
                            <p className="mt-4 text-sm text-zinc-500">
                                Free to start · No card required · {FREE_MONTHLY_INVOICE_LIMIT} invoices/month
                            </p>
                        </div>

                        <div className="relative">
                            <div className="rounded-xl border border-zinc-200/80 bg-white shadow-card-md p-4 sm:p-5 landing-float-card">
                                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3 text-center sm:text-left">
                                    Sample invoice
                                </p>
                                <LandingInvoicePreview />
                                <div className="mt-4 flex gap-2 items-center px-1">
                                    <div className="flex-1 h-2 rounded-full bg-brand-light overflow-hidden">
                                        <div className="h-full w-4/5 bg-brand rounded-full landing-progress-bar" />
                                    </div>
                                    <span className="text-xs text-zinc-400 font-medium">~seconds</span>
                                </div>
                            </div>
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
                            Invoicing should not slow down your work. Here is what changes when billing lives in one place.
                        </p>
                    </SectionReveal>
                    <div className="mt-14 grid sm:grid-cols-2 gap-6 lg:gap-8">
                        {WHY_ITEMS.map((item, i) => {
                            const Icon = item.icon;
                            return (
                                <SectionReveal key={item.title} delay={i + 1}>
                                    <div className="rounded-lg border border-zinc-200/80 bg-zinc-50/50 p-6 h-full">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-zinc-100 text-zinc-600">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <h3 className="mt-4 text-base font-semibold text-zinc-950">{item.title}</h3>
                                        <p className="mt-2 text-sm text-zinc-500 leading-relaxed">{item.text}</p>
                                    </div>
                                </SectionReveal>
                            );
                        })}
                    </div>
                    <SectionReveal className="mt-12 text-center">
                        <CtaButton className="inline-flex" />
                    </SectionReveal>
                </div>
            </section>

            {/* How it works */}
            <section className="py-20 sm:py-24 landing-section-muted">
                <div className="mx-auto max-w-6xl px-4 sm:px-6">
                    <SectionReveal className="text-center max-w-2xl mx-auto">
                        <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight">
                            Three steps to your first invoice
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
                            Try {APP_NAME} at no cost, then upgrade for unlimited invoices, your logo on PDFs, and monthly billing statements.
                        </p>
                    </SectionReveal>
                    <div className="mt-14 grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        <SectionReveal delay={1}>
                            <div className="rounded-lg border border-zinc-200 bg-white p-6 h-full flex flex-col">
                                <h3 className="text-lg font-semibold text-zinc-900">Free</h3>
                                <p className="mt-2 text-4xl font-bold text-zinc-900">
                                    {formatPrice(0)}
                                    <span className="text-base font-normal text-zinc-500">/month</span>
                                </p>
                                <ul className="mt-8 space-y-3 flex-1">
                                    {FREE_PLAN_FEATURES.map((f) => (
                                        <li key={f} className="flex items-start gap-3 text-zinc-600 text-sm">
                                            <Check className="h-5 w-5 text-emerald-500 flex-shrink-0" />
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
                            <div className="premium-card p-8 h-full flex flex-col relative overflow-hidden landing-premium-glow">
                                <div className="absolute top-4 right-4 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 uppercase tracking-wide">
                                    Popular
                                </div>
                                <div className="flex items-center gap-2">
                                    <Crown className="h-5 w-5 text-amber-600" />
                                    <h3 className="text-lg font-semibold text-zinc-900">Premium</h3>
                                </div>
                                <PremiumPrice className="mt-2" />
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
                        </SectionReveal>
                    </div>
                </div>
            </section>

            {/* Features strip */}
            <section className="py-16 border-y border-zinc-200/80 bg-zinc-900 text-white">
                <div className="mx-auto max-w-6xl px-4 sm:px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { icon: FileText, label: 'Invoices & receipts' },
                            { icon: Users, label: 'Clients & products' },
                            { icon: TrendingUp, label: 'Payment tracking' },
                            { icon: Crown, label: 'Premium branding' },
                        ].map(({ icon: Icon, label }) => (
                            <div key={label} className="flex flex-col items-center gap-3">
                                <Icon className="h-8 w-8 text-sky-400" />
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
            <section className="py-20 sm:py-28 landing-cta-gradient">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
                    <SectionReveal>
                        <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                            Ready to invoice like a pro?
                        </h2>
                        <p className="mt-4 text-lg text-sky-100">
                            Join {APP_NAME} today and send your next invoice in seconds.
                        </p>
                        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to={AUTH_REGISTER_PATH}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-brand font-semibold py-3.5 px-8 shadow-xl hover:bg-sky-50 transition-colors"
                            >
                                Get started
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link
                                to={AUTH_LOGIN_PATH}
                                className="inline-flex items-center justify-center rounded-xl border border-white/40 text-white font-medium py-3.5 px-8 hover:bg-white/10 transition-colors"
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
                    <p>© {new Date().getFullYear()} {APP_NAME}. Professional invoicing, simplified.</p>
                </div>
            </footer>
        </div>
    );
}
