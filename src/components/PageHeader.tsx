'use client';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="-mx-4 -mt-6 mb-1 sticky top-0 z-30 gpu-layer px-5 pt-5 pb-4" style={{ background: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
      <h1 className="text-2xl font-bold tracking-tight anim-fade-in">
        {title}
      </h1>
      {subtitle && (
        <p
          className="mt-0.5 text-sm anim-fade-in text-muted"
          style={{ '--fade-delay': '50ms' } as React.CSSProperties}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
