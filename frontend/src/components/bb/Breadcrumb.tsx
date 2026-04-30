interface BreadcrumbProps {
  items: string[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <div className="text-[11px] font-mono font-semibold uppercase tracking-widest text-ink-3 mb-2">
      {items.join(' / ')}
    </div>
  );
}
