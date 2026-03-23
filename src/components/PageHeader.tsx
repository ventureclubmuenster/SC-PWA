'use client';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="-mx-4 -mt-6 mb-1 sticky top-0 z-30 bg-[#FAFAFA]/80 backdrop-blur-md gpu-layer border-b border-[rgba(0,0,0,0.06)] px-5 pt-5 pb-4">
      <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F] anim-fade-in">
        {title}
      </h1>
      {subtitle && (
        <p
          className="mt-0.5 text-sm text-[#86868B] anim-fade-in"
          style={{ '--fade-delay': '50ms' } as React.CSSProperties}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
