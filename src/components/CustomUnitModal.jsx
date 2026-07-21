import { useEffect, useRef, useState } from 'react';
import ModalShell from './ModalShell';

export default function CustomUnitModal({ open, onClose, onSave }) {
    const [unitName, setUnitName] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        setUnitName('');
        const timer = setTimeout(() => inputRef.current?.focus(), 50);
        return () => clearTimeout(timer);
    }, [open]);

    const trimmed = unitName.trim();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!trimmed) return;
        onSave(trimmed);
    };

    return (
        <ModalShell
            open={open}
            onClose={onClose}
            size="sm"
            ariaLabelledby="custom-unit-modal-title"
        >
            <form onSubmit={handleSubmit} className="p-5 sm:p-6">
                <h2
                    id="custom-unit-modal-title"
                    className="text-base font-semibold text-zinc-950"
                >
                    Enter Unit Name
                </h2>
                <label htmlFor="custom-unit-name" className="sr-only">
                    Unit name
                </label>
                <input
                    ref={inputRef}
                    id="custom-unit-name"
                    type="text"
                    value={unitName}
                    onChange={(e) => setUnitName(e.target.value)}
                    maxLength={40}
                    placeholder="e.g. Lesson"
                    className="input-field mt-4 w-full"
                    autoComplete="off"
                />
                <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                    <button type="button" className="btn-secondary w-full sm:w-auto" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn-primary w-full sm:w-auto"
                        disabled={!trimmed}
                    >
                        Save
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}
