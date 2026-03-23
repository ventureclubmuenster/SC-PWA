'use client';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="-mx-5 -mt-8 mb-3 sticky top-0 z-30 gpu-layer px-6 pt-8 pb-5" style={{ background: 'linear-gradient(180deg, var(--background) 60%, transparent 100%)' }}>
      <h1 className="text-title text-[26px] anim-fade-in">
        {title}
      </h1>
      {subtitle && (
        <p
          className="mt-1.5 text-subtitle anim-fade-in"
          style={{ '--fade-delay': '50ms' } as React.CSSProperties}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
