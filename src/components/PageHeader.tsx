'use client';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="-mx-5 -mt-6 mb-2 sticky top-0 z-30 gpu-layer px-6 pt-6 pb-4" style={{ background: 'var(--background)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border-subtle)' }}>
      <h1 className="text-title text-2xl anim-fade-in">
        {title}
      </h1>
      {subtitle && (
        <p
          className="mt-1 text-subtitle anim-fade-in"
          style={{ '--fade-delay': '50ms' } as React.CSSProperties}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
