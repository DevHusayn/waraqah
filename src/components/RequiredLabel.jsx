/** Label with red asterisk for required fields */
export default function RequiredLabel({ htmlFor, children }) {
    return (
        <label htmlFor={htmlFor} className="label">
            {children}
            <span className="text-red-500 ml-0.5" aria-hidden="true">
                *
            </span>
        </label>
    );
}
