import { AlertCircle } from 'lucide-react';

/** Branded inline validation (replaces the browser’s default bubble). */
export default function FieldValidationMessage({ message, id }) {
    if (!message) return null;

    return (
        <div
            id={id}
            role="alert"
            className="relative mt-2 animate-fade-in"
        >
            <div
                className="absolute -top-1 left-5 h-2 w-2 rotate-45 border-l border-t border-red-200/90 bg-red-50"
                aria-hidden
            />
            <div className="flex items-start gap-2 rounded-lg border border-red-200/90 bg-red-50 px-3 py-2.5 text-sm text-red-800 shadow-sm">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" strokeWidth={2.25} />
                <span className="leading-snug">{message}</span>
            </div>
        </div>
    );
}
