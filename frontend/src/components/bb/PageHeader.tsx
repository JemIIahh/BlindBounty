interface PageHeaderProps {
  title: string;
  description?: string;
  right?: React.ReactNode;
}

export function PageHeader({ title, description, right }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-[40px] font-mono font-bold text-ink leading-none tracking-tightest">
          {title}
        </h1>
        {description && (
          <p className="text-sm font-mono text-ink-2 mt-2 max-w-lg">{description}</p>
        )}
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}
