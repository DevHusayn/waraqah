import { Building2, Bell, Crown, FileText, Info, Landmark, Palette } from 'lucide-react';

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
        description: 'Subscription, invoice limits, and billing history',
    },
    {
        title: 'Terms and Conditions',
        to: '/settings/terms',
        icon: FileText,
        description: 'Terms of use for the Waraqah platform',
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

export const SETTINGS_SIDEBAR = [
    { type: 'link', title: 'Overview', to: '/settings' },
    { type: 'group', title: 'Business Settings', to: '/settings/business', icon: Building2 },
    ...BUSINESS_SETTINGS_INDEX.map((item) => ({
        type: 'sublink',
        ...item,
        parent: '/settings/business',
    })),
    ...SETTINGS_INDEX.filter((item) => item.to !== '/settings/business').map((item) => ({
        type: 'link',
        ...item,
    })),
];
