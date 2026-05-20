import React from 'react';

export default function AlertModal({
    open,
    onClose,
    message,
    title,
    type = 'error',
    buttonLabel = 'OK',
}) {
    if (!open) return null;
    const isSuccess = type === 'success';
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity duration-200 animate-fade-in p-4">
            <div
                className={`bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-sm border animate-modal-scale ${
                    isSuccess ? 'border-green-200' : 'border-red-200'
                }`}
                role="alertdialog"
                aria-labelledby={title ? 'alert-modal-title' : undefined}
                aria-describedby="alert-modal-message"
            >
                <div className="flex flex-col items-center mb-6">
                    {isSuccess ? (
                        <svg className="h-10 w-10 text-green-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="#e6f9ed" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12l2 2l4-4" />
                        </svg>
                    ) : (
                        <svg className="h-10 w-10 text-red-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="#fee2e2" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 9l-6 6m0-6l6 6" />
                        </svg>
                    )}
                    {title ? (
                        <h2
                            id="alert-modal-title"
                            className={`text-center text-base font-semibold mb-2 ${
                                isSuccess ? 'text-green-800' : 'text-slate-900'
                            }`}
                        >
                            {title}
                        </h2>
                    ) : null}
                    <p
                        id="alert-modal-message"
                        className={`text-center text-sm leading-relaxed whitespace-pre-line ${
                            isSuccess ? 'text-green-700' : 'text-slate-600'
                        }`}
                    >
                        {message || (isSuccess ? 'Success!' : 'Something went wrong.')}
                    </p>
                </div>
                <div className="flex justify-center">
                    <button
                        type="button"
                        className={`font-medium px-6 py-2.5 rounded-xl shadow-sm transition-colors duration-150 focus:ring-2 ${
                            isSuccess
                                ? 'bg-green-600 hover:bg-green-700 focus:ring-green-400 text-white'
                                : 'bg-brand hover:bg-brand-hover focus:ring-[rgb(var(--brand-ring)/0.3)] text-white'
                        }`}
                        onClick={onClose}
                    >
                        {buttonLabel}
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.2s ease; }
                @keyframes modal-scale { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
                .animate-modal-scale { animation: modal-scale 0.22s cubic-bezier(0.4,0,0.2,1); }
            `}</style>
        </div>
    );
}
