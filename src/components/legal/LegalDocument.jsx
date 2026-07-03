export default function LegalDocument({ sections, lastUpdated }) {
    return (
        <div className="space-y-8">
            {lastUpdated ? (
                <p className="text-sm text-zinc-500">Last updated: {lastUpdated}</p>
            ) : null}
            {sections.map((section) => (
                <section key={section.title}>
                    <h2 className="text-base font-semibold text-zinc-900">{section.title}</h2>
                    <p className="mt-2 text-sm text-zinc-600 leading-relaxed">{section.body}</p>
                </section>
            ))}
        </div>
    );
}
