/**
 * @csmju2030/design-system — Tailwind CSS v3 preset
 *
 * สำหรับระบบย่อยที่ยังใช้ Tailwind v3:
 *   // tailwind.config.js
 *   import csmjuPreset from "@csmju2030/design-system/tailwind-preset";
 *   export default { presets: [csmjuPreset], content: [...] };
 *
 * ระบบย่อยที่ใช้ Tailwind v4 (Next.js 15/16) ให้ใช้ @import ".../theme.css" แทน
 * ทุกค่าชี้ไปที่ CSS variable --csmju-* เพื่อให้ dark mode (§13) ทำงานอัตโนมัติ
 */
const v = (name) => `var(--csmju-${name})`;

const preset = {
  darkMode: ['variant', '&:where([data-csmju-theme="dark"] *)'],
  theme: {
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        csmju: {
          primary: {
            DEFAULT: v("color-primary"),
            hover: v("color-primary-hover"),
            active: v("color-primary-active"),
            soft: v("color-primary-soft"),
            "soft-hover": v("color-primary-soft-hover"),
          },
          focus: v("color-focus-ring"),
          canvas: v("color-canvas"),
          surface: {
            DEFAULT: v("color-surface"),
            muted: v("color-surface-muted"),
            inverse: v("color-surface-inverse"),
          },
          text: {
            DEFAULT: v("color-text"),
            body: v("color-text-body"),
            muted: v("color-text-muted"),
            inverse: v("color-text-inverse"),
          },
          border: {
            DEFAULT: v("color-border"),
            strong: v("color-border-strong"),
          },
          success: {
            DEFAULT: v("color-success-text"),
            bg: v("color-success-bg"),
            border: v("color-success-border"),
          },
          warning: {
            DEFAULT: v("color-warning-text"),
            bg: v("color-warning-bg"),
            border: v("color-warning-border"),
          },
          danger: {
            DEFAULT: v("color-danger-text"),
            bg: v("color-danger-bg"),
            border: v("color-danger-border"),
          },
          info: {
            DEFAULT: v("color-info-text"),
            bg: v("color-info-bg"),
            border: v("color-info-border"),
          },
          chart: {
            1: v("chart-1"),
            2: v("chart-2"),
            3: v("chart-3"),
            4: v("chart-4"),
            5: v("chart-5"),
            6: v("chart-6"),
          },
        },
      },
      spacing: {
        "csmju-1": v("space-1"),
        "csmju-2": v("space-2"),
        "csmju-3": v("space-3"),
        "csmju-4": v("space-4"),
        "csmju-5": v("space-5"),
        "csmju-6": v("space-6"),
        "csmju-8": v("space-8"),
        "csmju-10": v("space-10"),
        "csmju-12": v("space-12"),
        "csmju-16": v("space-16"),
        "csmju-20": v("space-20"),
      },
      borderRadius: {
        "csmju-sm": v("radius-sm"),
        "csmju-md": v("radius-md"),
        "csmju-lg": v("radius-lg"),
        "csmju-xl": v("radius-xl"),
        "csmju-full": v("radius-full"),
      },
      boxShadow: {
        "csmju-sm": v("shadow-sm"),
        "csmju-md": v("shadow-md"),
        "csmju-lg": v("shadow-lg"),
      },
      fontFamily: {
        "csmju-heading": v("font-heading"),
        "csmju-body": v("font-body"),
        "csmju-mono": v("font-mono"),
      },
      fontSize: {
        "csmju-display": [v("text-display"), { lineHeight: v("text-display-lh"), fontWeight: "700" }],
        "csmju-h1": [v("text-h1"), { lineHeight: v("text-h1-lh"), fontWeight: "700" }],
        "csmju-h2": [v("text-h2"), { lineHeight: v("text-h2-lh"), fontWeight: "600" }],
        "csmju-h3": [v("text-h3"), { lineHeight: v("text-h3-lh"), fontWeight: "600" }],
        "csmju-h4": [v("text-h4"), { lineHeight: v("text-h4-lh"), fontWeight: "600" }],
        "csmju-body-lg": [v("text-body-lg"), { lineHeight: v("text-body-lg-lh") }],
        "csmju-body": [v("text-body"), { lineHeight: v("text-body-lh") }],
        "csmju-body-sm": [v("text-body-sm"), { lineHeight: v("text-body-sm-lh") }],
        "csmju-caption": [v("text-caption"), { lineHeight: v("text-caption-lh"), fontWeight: "500" }],
      },
      maxWidth: {
        "csmju-container": v("container-max"),
        "csmju-prose": "68ch",
      },
      zIndex: {
        "csmju-sticky": "100",
        "csmju-header": "200",
        "csmju-drawer": "300",
        "csmju-modal": "400",
        "csmju-popover": "500",
        "csmju-toast": "600",
      },
      transitionTimingFunction: {
        "csmju-standard": v("ease-standard"),
        "csmju-out": v("ease-out"),
      },
      transitionDuration: {
        "csmju-fast": "150ms",
        "csmju-base": "200ms",
        "csmju-slow": "300ms",
      },
    },
  },
};

module.exports = preset;
