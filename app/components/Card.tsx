import InfoTooltip from "./InfoTooltip";

interface CardProps {
    title: string;
    info?: string;
    children: React.ReactNode;
    className?: string;
}

export default function Card({
    title,
    info,
    children,
    className = "",
}: CardProps) {
    return (
        <div
            className={`bg-card-bg border border-card-border rounded-xl p-6 ${className}`}
        >
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-5 flex items-center">
                {title}
                {info && <InfoTooltip text={info} />}
            </h3>
            {children}
        </div>
    );
}
