import InfoTooltip from "./InfoTooltip";

interface StatNumberProps {
    label: string;
    value: string | number;
    sub?: string;
    info?: string;
}

export default function StatNumber({
    label,
    value,
    sub,
    info,
}: StatNumberProps) {
    return (
        <div className="bg-card-bg border border-card-border rounded-xl p-5 flex flex-col items-center justify-center text-center">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1 flex items-center">
                {label}
                {info && <InfoTooltip text={info} />}
            </p>
            <p className="text-3xl font-bold text-accent">{value}</p>
            {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
        </div>
    );
}
