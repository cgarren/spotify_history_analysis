interface CardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function Card({ title, children, className = "" }: CardProps) {
  return (
    <div
      className={`bg-card-bg border border-card-border rounded-xl p-5 ${className}`}
    >
      <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-4">
        {title}
      </h3>
      {children}
    </div>
  );
}
