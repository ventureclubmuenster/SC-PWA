interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="noise-panel-accent rounded-2xl px-5 py-5 border border-[#E8E8ED] shadow-sm">
      <h1 className="relative z-10 text-2xl font-bold tracking-tight text-[#1D1D1F]">
        {title}
      </h1>
      {subtitle && (
        <p className="relative z-10 mt-1 text-sm text-[#86868B]">{subtitle}</p>
      )}
    </div>
  );
}
