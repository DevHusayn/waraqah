import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Crown, ImagePlus, Trash2, Lock, Stamp, PenLine } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import {
    getCompanyLogoAvatarUrl,
    getCompanyStampUrl,
    getAuthorizedSignatureUrl,
} from '../utils/brandAssets';
import {
    isPremiumUser,
    readBrandImageAsDataUrl,
    prepareBrandLogoUpload,
    BRAND_IMAGE_ACCEPT,
    BRAND_IMAGE_HINT,
    PLANS,
} from '../utils/premium';
import { premiumUpgradeLabel } from '../constants/pricing';

function AssetUploadCard({
    title,
    description,
    value,
    isEditing,
    saving,
    onUpload,
    onRemove,
    icon: Icon,
    parseFile,
    formatHint = BRAND_IMAGE_HINT,
}) {
    const fileRef = useRef(null);

    return (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 flex flex-col h-full">
            <div className="flex items-start gap-2.5 mb-4">
                <div className="p-1.5 rounded-lg bg-zinc-100 shrink-0">
                    <Icon className="h-4 w-4 text-brand" aria-hidden />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900">{title}</p>
                    <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{description}</p>
                </div>
            </div>

            {value ? (
                <div className="flex flex-col items-center gap-3 flex-1">
                    <div className="relative w-full aspect-[4/3] flex items-center justify-center bg-zinc-50 rounded-lg border border-zinc-100 overflow-hidden">
                        <img src={value} alt={title} className="max-w-full max-h-full object-contain p-3" />
                    </div>
                    {isEditing && (
                        <div className="flex flex-wrap gap-2 justify-center w-full">
                            <button
                                type="button"
                                disabled={saving}
                                onClick={() => fileRef.current?.click()}
                                className="btn-secondary text-xs py-2 px-3 flex-1 sm:flex-none"
                            >
                                <ImagePlus size={14} aria-hidden />
                                {saving ? 'Saving…' : 'Replace'}
                            </button>
                            <button
                                type="button"
                                disabled={saving}
                                onClick={onRemove}
                                className="btn-secondary text-xs py-2 px-3 text-red-600 border-red-200 hover:bg-red-50 flex-1 sm:flex-none"
                            >
                                <Trash2 size={14} aria-hidden />
                                Remove
                            </button>
                        </div>
                    )}
                    {!isEditing && (
                        <p className="text-xs text-green-700 font-medium flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden />
                            Uploaded
                        </p>
                    )}
                </div>
            ) : (
                <div className="flex-1 flex flex-col justify-center">
                    <div className="rounded-lg border-2 border-dashed border-zinc-200 p-5 text-center bg-zinc-50/50 min-h-[120px] flex flex-col items-center justify-center">
                        {isEditing ? (
                            <button
                                type="button"
                                disabled={saving}
                                onClick={() => fileRef.current?.click()}
                                className="btn-secondary text-xs py-2"
                            >
                                <ImagePlus size={14} aria-hidden />
                                {saving ? 'Saving…' : 'Upload image'}
                            </button>
                        ) : (
                            <p className="text-xs text-zinc-500">Not uploaded</p>
                        )}
                        <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">{formatHint}</p>
                    </div>
                </div>
            )}

            <input
                ref={fileRef}
                type="file"
                accept={BRAND_IMAGE_ACCEPT}
                className="hidden"
                onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (!file) return;
                    try {
                        const result = parseFile
                            ? await parseFile(file)
                            : await readBrandImageAsDataUrl(file);
                        await onUpload(result);
                    } catch (err) {
                        onUpload(null, err.message || 'Failed to read image');
                    }
                }}
            />
        </div>
    );
}

export default function PremiumLogoSettings({ formData, setFormData, isEditing, embedded = false }) {
    const { businessInfo, saveBusinessAsset, saveCompanyLogo, fetchBusinessAssets } = useSettings();
    const { showToast } = useToast();
    const [savingField, setSavingField] = useState(null);
    const premium = isPremiumUser(businessInfo);

    useEffect(() => {
        if (premium) {
            fetchBusinessAssets();
        }
    }, [premium, fetchBusinessAssets]);

    const logo = (
        formData.companyLogoAvatarUrl ||
        getCompanyLogoAvatarUrl(businessInfo) ||
        ''
    ).trim();
    const stamp = (formData.companyStampUrl || getCompanyStampUrl(businessInfo) || '').trim();
    const signature = (
        formData.authorizedSignatureUrl ||
        getAuthorizedSignatureUrl(businessInfo) ||
        ''
    ).trim();

    const persistAsset = async (field, dataUrl, label) => {
        if (!premium) {
            showToast('Enable Premium before uploading brand assets.', 'error');
            return false;
        }
        setSavingField(field);
        try {
            await saveBusinessAsset(field, dataUrl || '');
            setFormData((prev) => ({ ...prev, [field]: dataUrl || '', plan: PLANS.PREMIUM }));
            showToast(dataUrl ? `${label} saved` : `${label} removed`, 'success');
            return true;
        } catch (err) {
            showToast(err.message || `Failed to save ${label.toLowerCase()}`, 'error');
            return false;
        } finally {
            setSavingField(null);
        }
    };

    const handleLogoUpload = async (result, errorMessage) => {
        if (errorMessage) {
            showToast(errorMessage, 'error');
            return;
        }
        if (!premium) {
            showToast('Enable Premium before uploading brand assets.', 'error');
            return;
        }
        setSavingField('companyLogoUrl');
        try {
            await saveCompanyLogo(result);
            setFormData((prev) => ({
                ...prev,
                companyLogoUrl: result.companyLogoUrl,
                companyLogoAvatarUrl: result.companyLogoAvatarUrl,
                businessLogo: result.companyLogoUrl,
                plan: PLANS.PREMIUM,
            }));
            showToast('Logo saved', 'success');
        } catch (err) {
            showToast(err.message || 'Failed to save logo', 'error');
        } finally {
            setSavingField(null);
        }
    };

    const handleLogoRemove = async () => {
        if (!premium) return;
        setSavingField('companyLogoUrl');
        try {
            await saveCompanyLogo({ companyLogoUrl: '', companyLogoAvatarUrl: '' });
            setFormData((prev) => ({
                ...prev,
                companyLogoUrl: '',
                companyLogoAvatarUrl: '',
                businessLogo: '',
            }));
            showToast('Logo removed', 'success');
        } catch (err) {
            showToast(err.message || 'Failed to remove logo', 'error');
        } finally {
            setSavingField(null);
        }
    };

    const handleUpload = (field, label) => async (dataUrl, errorMessage) => {
        if (errorMessage) {
            showToast(errorMessage, 'error');
            return;
        }
        setFormData((prev) => ({ ...prev, [field]: dataUrl }));
        await persistAsset(field, dataUrl, label);
    };

    const handleRemove = (field, label) => async () => {
        setFormData((prev) => ({ ...prev, [field]: '' }));
        await persistAsset(field, '', label);
    };

    const wrapperClass = embedded
        ? 'mt-8 pt-8 border-t border-zinc-100'
        : 'pt-6 border-t border-zinc-200 scroll-mt-6';

    return (
        <div id="premium" className={wrapperClass}>
            <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                <div>
                    <h3 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                        <Crown className="h-4 w-4 text-amber-500" aria-hidden />
                        Brand assets
                    </h3>
                    <p className="text-sm text-zinc-500 mt-0.5">
                        Logo, stamp, and signature on PDF invoices and receipts
                    </p>
                    <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                        PNG (transparent background recommended), JPG, or SVG · max 2 MB · images are auto-resized
                    </p>
                </div>
                <PlanBadge premium={premium} />
            </div>

            {!premium ? (
                <div className="premium-card p-6 text-center space-y-3">
                    <Lock className="mx-auto h-7 w-7 text-amber-600" aria-hidden />
                    <p className="text-sm text-zinc-700 max-w-sm mx-auto">
                        Upgrade to Premium to upload your logo, company stamp, and authorized signature.
                    </p>
                    <Link to="/upgrade" className="premium-upgrade-btn mx-auto text-sm py-2 px-4">
                        <Crown size={16} className="text-amber-600 shrink-0" aria-hidden />
                        {premiumUpgradeLabel()}
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AssetUploadCard
                        title="Company logo"
                        description="Appears on PDF invoices and receipts · PNG with transparent background recommended"
                        value={logo}
                        isEditing={isEditing}
                        saving={savingField === 'companyLogoUrl'}
                        icon={ImagePlus}
                        parseFile={prepareBrandLogoUpload}
                        onUpload={handleLogoUpload}
                        onRemove={handleLogoRemove}
                    />
                    <AssetUploadCard
                        title="Company stamp"
                        description="Shown near the signature on paid receipt PDFs"
                        value={stamp}
                        isEditing={isEditing}
                        saving={savingField === 'companyStampUrl'}
                        icon={Stamp}
                        onUpload={handleUpload('companyStampUrl', 'Stamp')}
                        onRemove={() => handleRemove('companyStampUrl', 'Stamp')()}
                    />
                    <AssetUploadCard
                        title="Authorized signature"
                        description="Placed under totals on PDF invoices and receipts"
                        value={signature}
                        isEditing={isEditing}
                        saving={savingField === 'authorizedSignatureUrl'}
                        icon={PenLine}
                        onUpload={handleUpload('authorizedSignatureUrl', 'Signature')}
                        onRemove={() => handleRemove('authorizedSignatureUrl', 'Signature')()}
                    />
                </div>
            )}
        </div>
    );
}

function PlanBadge({ premium }) {
    if (premium) {
        return (
            <span className="text-xs font-semibold uppercase tracking-wide bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg shrink-0">
                Premium
            </span>
        );
    }
    return (
        <span className="text-xs font-semibold uppercase tracking-wide bg-zinc-100 text-zinc-600 px-2.5 py-1 rounded-lg shrink-0">
            Premium required
        </span>
    );
}
