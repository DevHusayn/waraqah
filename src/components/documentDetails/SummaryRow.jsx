export default function SummaryRow({ label, value }) {
    return (
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 items-baseline text-sm">
            <dt className="text-foreground-muted min-w-0">{label}</dt>
            <dd className="font-medium text-foreground text-right whitespace-nowrap tabular-nums shrink-0">{value}</dd>
        </div>
    );
}
