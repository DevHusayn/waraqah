/** Inline field validation — simple text below the input. */
export default function FieldValidationMessage({ message, id }) {
    if (!message) return null;

    return (
        <p id={id} role="alert" className="mt-1.5 text-[13px] text-red-600 animate-fade-in">
            {message}
        </p>
    );
}
