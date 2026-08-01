export default function SummaryRow({ label, value }) {
    return (
        <div className="flex justify-between gap-4 text-sm">
            <dt className="text-zinc-500 shrink-0">{label}</dt>
            <dd className="font-medium text-zinc-900 text-right">{value}</dd>
        </div>
    );
}
