interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="-mx-4 -mt-6 mb-1 noise-panel-accent border-b border-[#E8E8ED] px-5 pt-5 pb-4">
      <h1 className="relative z-10 text-2xl font-bold tracking-tight text-[#1D1D1F]">
        {title}
      </h1>
      {subtitle && (
        <p className="relative z-10 mt-0.5 text-sm text-[#86868B]">{subtitle}</p>
      )}
    </div>
  );
}
