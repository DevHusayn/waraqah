import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, ImagePlus, Trash2, Lock, Sparkles } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import SubscriptionBilling from './SubscriptionBilling';
import DevPlanToggle from './DevPlanToggle';
import {
    isPremiumUser,
    readLogoFileAsDataUrl,
    LOGO_ACCEPT,
    PLANS,
} from '../utils/premium';

export default function PremiumLogoSettings({ formData, setFormData, isEditing }) {
    const { businessInfo, refreshBusinessInfo, saveBusinessLogo } = useSettings();
    const { showToast } = useToast();
    const [logoSaving, setLogoSaving] = useState(false);
    const fileRef = useRef(null);
    const premium = isPremiumUser(businessInfo);
    const logo = (formData.businessLogo || businessInfo.businessLogo || '').trim();

    const persistLogo = async (dataUrl) => {
        if (!premium) {
            showToast('Enable Premium on your account before uploading a logo.', 'error');
            return false;
        }
        setLogoSaving(true);
        try {
            await saveBusinessLogo(dataUrl, formData);
            setFormData((prev) => ({ ...prev, businessLogo: dataUrl, plan: PLANS.PREMIUM }));
            showToast('Logo saved', 'success');
            return true;
        } catch (err) {
            showToast(err.message || 'Failed to save logo', 'error');
            return false;
        } finally {
            setLogoSaving(false);
        }
    };

    const handleFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const dataUrl = await readLogoFileAsDataUrl(file);
            setFormData((prev) => ({ ...prev, businessLogo: dataUrl }));
            await persistLogo(dataUrl);
        } catch (err) {
            showToast(err.message, 'error');
        }
        e.target.value = '';
    };

    const removeLogo = async () => {
        setFormData((prev) => ({ ...prev, businessLogo: '' }));
        if (fileRef.current) fileRef.current.value = '';
        if (!premium) return;
        setLogoSaving(true);
        try {
            await saveBusinessLogo('', formData);
            showToast('Logo removed', 'success');
        } catch (err) {
            showToast(err.message || 'Failed to remove logo', 'error');
        } finally {
            setLogoSaving(false);
        }
    };

    return (
        <div id="premium" className="pt-6 border-t border-slate-200 scroll-mt-6">
            <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-amber-500" />
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">Premium — Business logo</h3>
                        <p className="text-sm text-slate-500">
                            Appears on PDF invoices and your sidebar avatar
                        </p>
                    </div>
                </div>
                {premium ? (
                    <span className="text-xs font-semibold uppercase tracking-wide bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg shrink-0">
                        Premium active
                    </span>
                ) : (
                    <span className="text-xs font-semibold uppercase tracking-wide bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg flex items-center gap-1 shrink-0">
                        <Lock size={12} />
                        Free plan
                    </span>
                )}
            </div>

            <DevPlanToggle formData={formData} setFormData={setFormData} className="mb-4" />

            <SubscriptionBilling />

            {!premium ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center space-y-4">
                    <Lock className="mx-auto h-8 w-8 text-slate-400" />
                    <p className="text-sm text-slate-600 font-medium">
                        Upgrade to Premium to upload your logo for PDFs and your sidebar avatar.
                    </p>
                    <Link to="/upgrade" className="btn-primary mx-auto gap-2 inline-flex">
                        <Sparkles size={18} />
                        Upgrade — ₦5,000/month
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {logo ? (
                        <div className="flex flex-col items-center gap-4 p-6 bg-slate-50 rounded-xl border border-slate-200">
                            <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center bg-white rounded-xl border border-slate-200 overflow-hidden">
                                <img
                                    src={logo}
                                    alt="Business logo"
                                    className="max-w-full max-h-full object-contain"
                                />
                            </div>
                            {isEditing && (
                                <div className="flex flex-wrap gap-2 justify-center">
                                        <button
                                            type="button"
                                            disabled={logoSaving}
                                            onClick={() => fileRef.current?.click()}
                                            className="btn-secondary text-sm py-2"
                                        >
                                            <ImagePlus size={16} />
                                            {logoSaving ? 'Saving…' : 'Replace'}
                                        </button>
                                        <button
                                            type="button"
                                            disabled={logoSaving}
                                            onClick={removeLogo}
                                            className="btn-secondary text-sm py-2 text-red-600 border-red-200 hover:bg-red-50"
                                        >
                                            <Trash2 size={16} />
                                            Remove
                                        </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="rounded-xl border-2 border-dashed border-slate-300 p-8 text-center bg-slate-50">
                            <ImagePlus className="mx-auto h-10 w-10 text-slate-400 mb-3" />
                            <p className="text-sm text-slate-600 mb-4">Upload PNG, JPG, or WebP (max 1.5 MB)</p>
                            {isEditing ? (
                                <button
                                    type="button"
                                    disabled={logoSaving}
                                    onClick={() => fileRef.current?.click()}
                                    className="btn-primary mx-auto"
                                >
                                    <ImagePlus size={18} />
                                    {logoSaving ? 'Saving…' : 'Upload logo'}
                                </button>
                            ) : (
                                <p className="text-sm text-slate-500">Click <strong>Edit</strong> above to upload a logo.</p>
                            )}
                        </div>
                    )}

                    <input
                        ref={fileRef}
                        type="file"
                        accept={LOGO_ACCEPT}
                        className="hidden"
                        onChange={handleFile}
                    />
                </div>
            )}
        </div>
    );
}

