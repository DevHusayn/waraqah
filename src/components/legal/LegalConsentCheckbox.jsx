import { Link } from 'react-router-dom';
import FieldValidationMessage from '../FieldValidationMessage';
import { TERMS_PATH, PRIVACY_PATH } from '../../constants/legalRoutes';

export default function LegalConsentCheckbox({
    id = 'legal-consent',
    checked,
    onChange,
    error,
}) {
    return (
        <div>
            <label htmlFor={id} className="flex items-start gap-3 cursor-pointer">
                <input
                    id={id}
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 accent-brand focus:ring-brand/30"
                    aria-invalid={Boolean(error)}
                />
                <span className="text-[13px] text-zinc-600 leading-relaxed">
                    By registering, you agree to our{' '}
                    <Link
                        to={TERMS_PATH}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-brand hover:underline"
                        onClick={(e) => e.stopPropagation()}
                    >
                        Terms
                    </Link>{' '}
                    and{' '}
                    <Link
                        to={PRIVACY_PATH}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-brand hover:underline"
                        onClick={(e) => e.stopPropagation()}
                    >
                        Privacy Policy
                    </Link>
                    .
                </span>
            </label>
            <FieldValidationMessage message={error} />
        </div>
    );
}
