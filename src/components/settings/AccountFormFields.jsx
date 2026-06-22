import FieldValidationMessage from '../FieldValidationMessage';
import { inputClass } from '../../utils/formFieldValidation';

export default function AccountFormFields({ formData, errors, onChange }) {
    return (
        <div className="space-y-5">
            <p className="text-sm text-zinc-500">
                Bank details appear on invoice PDFs so clients know where to pay you.
            </p>
            <div>
                <label htmlFor="settings-payment-account-name" className="label">
                    Account name
                </label>
                <input
                    id="settings-payment-account-name"
                    type="text"
                    name="paymentAccountName"
                    value={formData.paymentAccountName || ''}
                    onChange={onChange}
                    className={inputClass(Boolean(errors.paymentAccountName))}
                    placeholder="e.g. Waraqah Ltd"
                    aria-invalid={Boolean(errors.paymentAccountName)}
                />
                <FieldValidationMessage message={errors.paymentAccountName} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                    <label htmlFor="settings-payment-bank-name" className="label">
                        Bank name
                    </label>
                    <input
                        id="settings-payment-bank-name"
                        type="text"
                        name="paymentBankName"
                        value={formData.paymentBankName || ''}
                        onChange={onChange}
                        className={inputClass(Boolean(errors.paymentBankName))}
                        placeholder="e.g. GTBank"
                        aria-invalid={Boolean(errors.paymentBankName)}
                    />
                    <FieldValidationMessage message={errors.paymentBankName} />
                </div>
                <div>
                    <label htmlFor="settings-payment-account-number" className="label">
                        Account number
                    </label>
                    <input
                        id="settings-payment-account-number"
                        type="text"
                        name="paymentAccountNumber"
                        value={formData.paymentAccountNumber || ''}
                        onChange={onChange}
                        className={inputClass(Boolean(errors.paymentAccountNumber))}
                        placeholder="0123456789"
                        aria-invalid={Boolean(errors.paymentAccountNumber)}
                    />
                    <FieldValidationMessage message={errors.paymentAccountNumber} />
                </div>
            </div>
            <div>
                <label htmlFor="settings-payment-instructions" className="label">
                    Payment instructions <span className="text-zinc-400 font-normal">(optional)</span>
                </label>
                <textarea
                    id="settings-payment-instructions"
                    name="paymentInstructions"
                    value={formData.paymentInstructions || ''}
                    onChange={onChange}
                    className="input-field resize-none min-h-[72px]"
                    rows={2}
                    placeholder="e.g. Use invoice number as payment reference"
                />
            </div>
        </div>
    );
}
