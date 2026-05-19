import { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { Building2, Save, DollarSign, Edit, X } from 'lucide-react';
import { CURRENCY_INFO } from '../utils/currency';
import { buildBusinessInfoPayload } from '../utils/businessPayload';
import PremiumLogoSettings from '../components/PremiumLogoSettings';

const Settings = () => {
    const { businessInfo, updateBusinessInfo } = useSettings();
    const [formData, setFormData] = useState(businessInfo);
    const [isEditing, setIsEditing] = useState(false);
    const [saved, setSaved] = useState(false);
    const [errors, setErrors] = useState({});

    // Sync form from context when not editing (avoid wiping in-progress logo upload)
    useEffect(() => {
        if (!isEditing) {
            setFormData(businessInfo);
        }
    }, [businessInfo, isEditing]);

    useEffect(() => {
        if (!businessInfo.name?.trim() && !businessInfo.email?.trim()) {
            setIsEditing(true);
        }
    }, [businessInfo.name, businessInfo.email]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setSaved(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Validate required fields and collect errors
        const newErrors = {};
        if (!formData.name) newErrors.name = 'Business name is required.';
        if (!formData.address) newErrors.address = 'Address is required.';
        if (!formData.email) newErrors.email = 'Email is required.';
        if (!formData.phone) newErrors.phone = 'Phone is required.';
        if (!formData.brandColor) newErrors.brandColor = 'Brand color is required.';
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;
        const payload = buildBusinessInfoPayload(formData, businessInfo);
        updateBusinessInfo(payload)
            .then(() => {
                setIsEditing(false);
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            })
            .catch((err) => {
                setErrors({ submit: err.message });
            });
    };

    const handleEdit = () => {
        setFormData(businessInfo); // Always use latest businessInfo when editing starts
        setIsEditing(true);
    };

    const handleCancel = () => {
        setFormData(businessInfo);
        setIsEditing(false);
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="page-title">Business settings</h1>
                    <p className="page-subtitle">Configure your business information for invoices</p>
                </div>
                {!isEditing && (
                    <button onClick={handleEdit} className="btn-secondary">
                        <Edit size={18} />
                        Edit
                    </button>
                )}
            </div>

            {saved && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                    <span className="text-green-600 font-medium">
                        ✓ Settings saved successfully!
                    </span>
                </div>
            )}

            <div className="card">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-primary-100 p-3 rounded-lg">
                        <Building2 className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Your Business Info</h2>
                        <p className="text-sm text-gray-600">This appears on all your PDF invoices</p>
                    </div>
                </div>

                {!isEditing ? (
                    // View Mode - Display saved information
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Business Name</p>
                                <p className="text-lg font-bold text-primary-700">{businessInfo.name}</p>
                                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Email</p>
                                <p className="text-lg font-medium text-gray-900">{businessInfo.email}</p>
                                {errors.address && <p className="text-xs text-red-600 mt-1">{errors.address}</p>}
                            </div>
                        </div>

                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Address</p>
                            <p className="text-base font-medium text-gray-900">{businessInfo.address}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Phone</p>
                                <p className="text-base font-medium text-gray-900">{businessInfo.phone}</p>
                            </div>
                            {businessInfo.website && (
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Website</p>
                                    <p className="text-base font-medium text-primary-600 underline">{businessInfo.website}</p>
                                    {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                                </div>
                            )}
                        </div>

                        <div className="pt-8 border-t border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Currency</p>
                                    <p className="text-base font-medium text-gray-900">
                                        {CURRENCY_INFO.symbol} {CURRENCY_INFO.name} ({CURRENCY_INFO.code})
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Brand Color</p>
                                    <div
                                        className="w-12 h-12 rounded-xl border-2 border-gray-200 shadow"
                                        style={{ backgroundColor: businessInfo.brandColor || '#0ea5e9' }}
                                    />
                                </div>
                            </div>
                        </div>

                        <PremiumLogoSettings
                            formData={businessInfo}
                            setFormData={setFormData}
                            isEditing={false}
                        />
                    </div>
                ) : (
                    // Edit Mode - Show form
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name || ''}
                                    onChange={handleChange}
                                    className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-base shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition placeholder-gray-400 bg-gray-50"
                                    placeholder="e.g., Acme Corporation"
                                    required
                                />
                                {errors.brandColor && <p className="text-xs text-red-600 mt-1">{errors.brandColor}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address <span className="text-red-500">*</span></label>
                                <textarea
                                    name="address"
                                    value={formData.address || ''}
                                    onChange={handleChange}
                                    className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-base shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition placeholder-gray-400 bg-gray-50 resize-none"
                                    rows="2"
                                    placeholder="123 Business St, Suite 100, City, State 12345"
                                    style={{ resize: 'none' }}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email || ''}
                                        onChange={handleChange}
                                        className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-base shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition placeholder-gray-400 bg-gray-50"
                                        placeholder="contact@business.com"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone || ''}
                                        onChange={handleChange}
                                        className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-base shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition placeholder-gray-400 bg-gray-50"
                                        placeholder="+1 (555) 123-4567"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Website (Optional)</label>
                                <input
                                    type="url"
                                    name="website"
                                    value={formData.website || ''}
                                    onChange={handleChange}
                                    className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-base shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition placeholder-gray-400 bg-gray-50"
                                    placeholder="https://www.yourbusiness.com"
                                />
                            </div>
<div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Brand Color <span className="text-red-500">*</span></label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        name="brandColor"
                                        value={formData.brandColor || '#0ea5e9'}
                                        onChange={handleChange}
                                        className="h-12 w-20 rounded-xl border border-gray-300 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        name="brandColor"
                                        value={formData.brandColor || '#0ea5e9'}
                                        onChange={handleChange}
                                        className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-base shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition placeholder-gray-400 bg-gray-50"
                                        pattern="^#[0-9A-Fa-f]{6}$"
                                        placeholder="#0ea5e9"
                                        required
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-2 mb-2">This color will be used in your PDF invoice headers</p>

                                {/* Preset Colors */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs text-gray-600 font-medium">Quick picks:</span>
                                    {[
                                        { color: '#0ea5e9', name: 'Blue' },
                                        { color: '#8b5cf6', name: 'Purple' },
                                        { color: '#10b981', name: 'Green' },
                                        { color: '#f59e0b', name: 'Orange' },
                                        { color: '#ef4444', name: 'Red' },
                                        { color: '#ec4899', name: 'Pink' },
                                        { color: '#06b6d4', name: 'Cyan' },
                                        { color: '#6366f1', name: 'Indigo' },
                                    ].map(preset => (
                                        <button
                                            key={preset.color}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, brandColor: preset.color })}
                                            className="w-8 h-8 rounded-xl border-2 border-gray-300 hover:border-gray-400 transition-all hover:scale-110"
                                            style={{ backgroundColor: preset.color }}
                                            title={preset.name}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <PremiumLogoSettings
                            formData={formData}
                            setFormData={setFormData}
                            isEditing
                        />

                        {errors.submit && (
                            <p className="mt-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{errors.submit}</p>
                        )}
                        <div className="mt-8 flex items-center gap-4">
                            <button type="submit" className="btn-primary">
                                <Save size={18} />
                                Save Changes
                            </button>
                            <button type="button" onClick={handleCancel} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold flex items-center gap-2 px-6 py-3 rounded-xl shadow-md transition">
                                <X size={18} />
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                
            </div>
        </div>
    );
};

export default Settings;
