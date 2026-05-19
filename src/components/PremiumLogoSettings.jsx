import { useRef } from 'react';
import { Crown, ImagePlus, Trash2, Lock } from 'lucide-react';
import {
    isPremiumUser,
    isDevPremiumEnabled,
    setDevPremiumEnabled,
    readLogoFileAsDataUrl,
    LOGO_ACCEPT,
} from '../utils/premium';

export default function PremiumLogoSettings({ formData, setFormData, isEditing }) {
    const fileRef = useRef(null);
    const premium = isPremiumUser(formData);
    const logo = formData.businessLogo || '';

    const handleFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const dataUrl = await readLogoFileAsDataUrl(file);
            setFormData((prev) => ({ ...prev, businessLogo: dataUrl }));
        } catch (err) {
            alert(err.message);
        }
        e.target.value = '';
    };

    const removeLogo = () => {
        setFormData((prev) => ({ ...prev, businessLogo: '' }));
        if (fileRef.current) fileRef.current.value = '';
    };

    return (
        <div id="premium" className="pt-6 border-t border-slate-200 scroll-mt-6">
            <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-amber-500" />
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">Premium — Business logo</h3>
                        <p className="text-sm text-slate-500">
                            Appears centered on PDF invoices with subtle transparency
                        </p>
                    </div>
                </div>
                {premium ? (
                    <span className="text-xs font-semibold uppercase tracking-wide bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg">
                        Premium active
                    </span>
                ) : (
                    <span className="text-xs font-semibold uppercase tracking-wide bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <Lock size={12} />
                        Premium only
                    </span>
                )}
            </div>

            {!premium ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                    <Lock className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                    <p className="text-sm text-slate-600 font-medium">Upgrade to Premium to add your logo to PDFs</p>
                    <p className="text-xs text-slate-500 mt-1">Your logo will display large and centered with reduced opacity</p>
                    {import.meta.env.DEV && (
                        <button
                            type="button"
                            onClick={() => {
                                const enable = !isDevPremiumEnabled();
                                setDevPremiumEnabled(enable);
                                localStorage.setItem('waraqah_plan', enable ? 'premium' : 'free');
                                window.location.reload();
                            }}
                            className="mt-4 text-xs text-brand underline"
                        >
                            Dev: toggle premium preview
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {logo ? (
                        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <div className="relative w-40 h-40 flex items-center justify-center bg-white rounded-xl border border-slate-200 overflow-hidden">
                                <img
                                    src={logo}
                                    alt="Business logo preview"
                                    className="max-w-full max-h-full object-contain opacity-40"
                                />
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                                <p className="text-sm text-slate-600 mb-3">
                                    Preview shows approximate PDF opacity (~12%)
                                </p>
                                {isEditing && (
                                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                                        <button
                                            type="button"
                                            onClick={() => fileRef.current?.click()}
                                            className="btn-secondary text-sm py-2"
                                        >
                                            <ImagePlus size={16} />
                                            Replace logo
                                        </button>
                                        <button
                                            type="button"
                                            onClick={removeLogo}
                                            className="btn-secondary text-sm py-2 text-red-600 border-red-200 hover:bg-red-50"
                                        >
                                            <Trash2 size={16} />
                                            Remove
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-xl border-2 border-dashed border-slate-300 p-8 text-center bg-slate-50">
                            <ImagePlus className="mx-auto h-10 w-10 text-slate-400 mb-3" />
                            <p className="text-sm text-slate-600 mb-4">Upload PNG, JPG, or WebP (max 1.5 MB)</p>
                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={() => fileRef.current?.click()}
                                    className="btn-primary mx-auto"
                                >
                                    <ImagePlus size={18} />
                                    Upload logo
                                </button>
                            )}
                        </div>
                    )}

                    {!isEditing && !logo && (
                        <p className="text-sm text-slate-500 text-center">No logo uploaded yet. Click Edit to add one.</p>
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
