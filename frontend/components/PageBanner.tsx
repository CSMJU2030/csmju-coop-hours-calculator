import type { ReactNode } from 'react';

type PageBannerProps = {
  title: string;
  subtitle?: string;
  /** ป้ายเล็กเหนือหัวเรื่อง */
  eyebrow?: string;
  /** ปุ่ม/ลิงก์ด้านขวา */
  actions?: ReactNode;
  /** แถบสถิติแบบกระจกด้านล่างแบนเนอร์ */
  footer?: ReactNode;
  /** แบนเนอร์เตี้ย สำหรับหน้ารอง */
  compact?: boolean;
};

/**
 * แบนเนอร์หัวหน้า — งานออกแบบล้วน ไม่มี logic
 * ใช้สีจาก design token (--csmju-*) เท่านั้น
 */
export function PageBanner({ title, subtitle, eyebrow, actions, footer, compact }: PageBannerProps) {
  return (
    <section
      className={`no-print relative isolate overflow-hidden rounded-[28px] text-white shadow-csmju-lg ${
        compact ? 'px-6 py-7 md:px-9 md:py-8' : 'px-6 py-9 md:px-11 md:py-12'
      }`}
      style={{
        background:
          'radial-gradient(120% 140% at 100% 0%, color-mix(in srgb, var(--csmju-color-focus-ring) 38%, transparent) 0%, transparent 55%), linear-gradient(135deg, var(--csmju-color-primary-active) 0%, var(--csmju-color-primary) 70%, var(--csmju-color-primary-hover) 100%)',
      }}
    >
      {/* ลวดลายวงแหวน — อ้างอิงโลโก้ภาควิชา */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-24 -z-10 text-white h-[420px] w-[420px] opacity-[0.18] md:-right-10"
        viewBox="0 0 400 400"
        fill="none"
      >
        <circle cx="200" cy="200" r="190" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="200" cy="200" r="150" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="200" cy="200" r="110" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="200" cy="200" r="70" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="200" cy="200" r="30" fill="currentColor" fillOpacity="0.35" />
      </svg>

      {/* จุดตาราง */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 text-white opacity-[0.12]"
        style={{
          backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          maskImage: 'linear-gradient(90deg, transparent 0%, black 70%)',
          WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, black 70%)',
        }}
      />

      {/* แสงขอบล่าง */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 left-1/4 -z-10 h-48 w-96 rounded-full bg-sky-300/20 blur-3xl"
      />

      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 space-y-3">
          {eyebrow && (
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-sky-100 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-300" />
              {eyebrow}
            </span>
          )}
          <h1
            className={`font-heading font-extrabold leading-tight tracking-tight !text-white ${
              compact ? 'text-2xl md:text-[28px]' : 'text-3xl md:text-4xl'
            }`}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="max-w-2xl text-sm leading-relaxed text-sky-100/85 md:text-[15px]">
              {subtitle}
            </p>
          )}
        </div>

        {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
      </div>

      {footer && <div className="mt-8">{footer}</div>}
    </section>
  );
}

/** ปุ่มขาวบนพื้นแบนเนอร์ */
export const bannerButtonClass =
  'inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-lg shadow-blue-950/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-xl active:scale-95';
