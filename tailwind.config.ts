import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/agents/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background:   'var(--color-background)',
        card:         'var(--color-card)',
        border:       'var(--color-border)',
        foreground:   'var(--color-foreground)',
        secondary:    'var(--color-foreground-secondary)',
        muted: {
          DEFAULT:    'var(--color-muted)',
          foreground: 'var(--color-muted-foreground)',
        },
        placeholder:  'var(--color-placeholder)',
        primary: {
          DEFAULT:    'var(--color-primary)',
          foreground: 'var(--color-primary-foreground)',
          muted:      'var(--color-primary-muted)',
        },
        sidebar: {
          DEFAULT:    'var(--color-sidebar)',
          active:     'var(--color-sidebar-active)',
          foreground: 'var(--color-sidebar-foreground)',
          muted:      'var(--color-sidebar-muted)',
        },
        success: {
          DEFAULT:    'var(--color-success)',
          muted:      'var(--color-success-muted)',
        },
        warning: {
          DEFAULT:    'var(--color-warning)',
          muted:      'var(--color-warning-muted)',
        },
        destructive: {
          DEFAULT:    'var(--color-destructive)',
          muted:      'var(--color-destructive-muted)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      fontSize: {
        xs:    ['11px', { lineHeight: '1.4' }],
        sm:    ['12px', { lineHeight: '1.4' }],
        base:  ['13px', { lineHeight: '1.5' }],
        md:    ['14px', { lineHeight: '1.5' }],
        lg:    ['16px', { lineHeight: '1.5' }],
        xl:    ['22px', { lineHeight: '1.3' }],
        '2xl': ['24px', { lineHeight: '1.3' }],
      },
      borderRadius: {
        sm:   '4px',
        md:   '6px',
        lg:   '8px',
        full: '9999px',
      },
      spacing: {
        sidebar: 'var(--sidebar-width)',
        header:  'var(--header-height)',
      },
    },
  },
  plugins: [],
}

export default config
