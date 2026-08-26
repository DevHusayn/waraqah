import { useEffect, useState } from 'react';
import { UserRound } from 'lucide-react';
import ModalShell from './ModalShell';
import { inputClass } from '../utils/formFieldValidation';

export const EMPTY_CLIENT_DETAILS = {
    business: '',
    phone: '',
    address: '',
    additionalInfo: '',
};

export default function ClientDetailsModal({ open, onClose, initialData = EMPTY_CLIENT_DETAILS, onSave }) {
    const [formData, setFormData] = useState(EMPTY_CLIENT_DETAILS);

    useEffect(() => {
        if (open) {
            setFormData({
                business: initialData.business || '',
                phone: initialData.phone || '',
                address: initialData.address || '',
                additionalInfo: initialData.additionalInfo || '',
            });
        }
    }, [open, initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            business: formData.business.trim(),
            phone: formData.phone.trim(),
            address: formData.address.trim(),
            additionalInfo: formData.additionalInfo.trim(),
        });
        onClose();
    };

    return (
        <ModalShell
            open={open}
            onClose={onClose}
            size="md"
            showClose
            ariaLabelledby="client-details-modal-title"
            panelClassName="sm:max-h-[85vh]"
        >
            <div className="px-6 pt-6 pb-4 border-b border-border/50">
                <div className="flex items-start gap-3 pr-8">
                    <div className="p-2.5 rounded-xl bg-brand-subtle shrink-0">
                        <UserRound className="h-5 w-5 text-brand" aria-hidden />
                    </div>
                    <div>
                        <h2 id="client-details-modal-title" className="text-lg font-semibold text-foreground">
                            Client details
                        </h2>
                        <p className="text-sm text-foreground-muted mt-0.5">
                            Optional — shown on the PDF when provided.
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
                <div>
                    <label htmlFor="client-details-business" className="label">
                        Business name{' '}
                        <span className="text-foreground-muted/70 font-normal">(optional)</span>
                    </label>
                    <input
                        id="client-details-business"
                        type="text"
                        name="business"
                        value={formData.business}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="Company or trading name"
                    />
                </div>

                <div>
                    <label htmlFor="client-details-phone" className="label">
                        Phone <span className="text-foreground-muted/70 font-normal">(optional)</span>
                    </label>
                    <input
                        id="client-details-phone"
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="+234 800 000 0000"
                    />
                </div>

                <div>
                    <label htmlFor="client-details-address" className="label">
                        Address <span className="text-foreground-muted/70 font-normal">(optional)</span>
                    </label>
                    <textarea
                        id="client-details-address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className={inputClass(false, 'resize-none min-h-[88px]')}
                        rows={3}
                        placeholder="Street, city, state"
                    />
                </div>

                <div>
                    <label htmlFor="client-details-additional" className="label">
                        Additional information{' '}
                        <span className="text-foreground-muted/70 font-normal">(optional)</span>
                    </label>
                    <textarea
                        id="client-details-additional"
                        name="additionalInfo"
                        value={formData.additionalInfo}
                        onChange={handleChange}
                        className={inputClass(false, 'resize-none min-h-[88px]')}
                        rows={3}
                        placeholder="Tax ID, attention line, or other notes for this client"
                    />
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                    <button type="button" onClick={onClose} className="btn-secondary flex-1">
                        Cancel
                    </button>
                    <button type="submit" className="btn-primary flex-1">
                        Save details
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}
