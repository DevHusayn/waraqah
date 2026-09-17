import { Building2, Bell, Crown, FileText, Info, KeyRound, Landmark, Package, Palette, Shield } from 'lucide-react';

export const SETTINGS_INDEX = [
    {
        title: 'Business Settings',
        to: '/settings/business',
        icon: Building2,
        description: 'Company profile, account details, and branding',
    },
    {
        title: 'Notifications',
        to: '/settings/notifications',
        icon: Bell,
        description: 'Email clients automatically and notification preferences',
    },
    {
        title: 'Inventory',
        to: '/settings/inventory',
        icon: Package,
        description: 'Stock enforcement and overselling preferences',
    },
    {
        title: 'Plan and Billing',
        to: '/settings/plan-billing',
        icon: Crown,
        description: 'Subscription, sales document limits, and billing history',
    },
    {
        title: 'Password',
        to: '/settings/password',
        icon: KeyRound,
        description: 'Change the password you use to sign in',
        hideForGoogle: true,
    },
    {
        title: 'Terms and Conditions',
        to: '/settings/terms',
        icon: FileText,
        description: 'Terms of use for the Waraqah platform',
    },
    {
        title: 'Privacy Policy',
        to: '/settings/privacy',
        icon: Shield,
        description: 'How we collect, use, and protect your data',
    },
    {
        title: 'About',
        to: '/settings/about',
        icon: Info,
        description: 'App version, support, and product information',
    },
];

export const BUSINESS_SETTINGS_INDEX = [
    {
        title: 'Company Profile',
        to: '/settings/business/company-profile',
        icon: Building2,
        description: 'Business name, country, currency, and address',
    },
    {
        title: 'Account Details',
        to: '/settings/business/account-details',
        icon: Landmark,
        description: 'Bank information shown on invoices',
    },
    {
        title: 'Branding',
        to: '/settings/business/branding',
        icon: Palette,
        description: 'Brand color, logo, PDF footer, and appearance',
    },
];
