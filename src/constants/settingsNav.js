import { Building2, Bell, Crown, FileText, Info, Landmark, Palette, Shield } from 'lucide-react';

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
        title: 'Plan and Billing',
        to: '/settings/plan-billing',
        icon: Crown,
        description: 'Subscription, document limits, and billing history',
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
        description: 'Business name, contact details, and address',
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
        description: 'Brand color, logo, and PDF appearance',
    },
];
