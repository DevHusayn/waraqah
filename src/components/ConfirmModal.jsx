import React from 'react';

export default function ConfirmModal({ open, onConfirm, onCancel, message }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 pointer-events-auto transition-opacity duration-200 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm min-h-[160px] min-w-[260px] text-gray-900 border border-gray-200 animate-modal-scale">
                <div className="mb-6 text-gray-900 text-center text-xl font-bold tracking-tight">{message || 'Are you sure?'}</div>
                <div className="flex justify-center gap-4 mt-4">
                    <button
                        className="bg-brand hover:bg-brand-hover focus:ring-2 focus:ring-[rgb(var(--brand-ring)/0.3)] text-white font-medium px-6 py-2 rounded-xl shadow-sm transition-colors duration-150"
                        onClick={onConfirm}
                    >
                        Yes
                    </button>
                    <button
                        className="bg-gray-100 hover:bg-gray-200 focus:ring-2 focus:ring-primary-200 text-gray-700 font-semibold px-6 py-2 rounded-lg border border-gray-300 shadow transition-colors duration-150"
                        onClick={onCancel}
                    >
                        Cancel
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
