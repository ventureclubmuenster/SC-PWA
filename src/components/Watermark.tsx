'use client';

export default function Watermark() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      <div className="absolute -inset-x-1/2 inset-y-0 flex flex-col justify-start pt-8 gap-0 watermark-layer">
        {Array.from({ length: 10 }).map((_, i) => (
          <p
            key={i}
            className="whitespace-nowrap leading-[1.15] tracking-[0.02em]"
            style={{
              fontSize: 'clamp(80px, 22vw, 160px)',
              fontWeight: 900,
              color: 'var(--foreground)',
            }}
          >
            STARTUP CONTACTS&emsp;STARTUP CONTACTS&emsp;STARTUP CONTACTS
          </p>
        ))}
      </div>
    </div>
  );
}
