export const colors = {
  background: {
    light: '#F9FAFB',
    dark:  '#0F172A',
  },
  card: {
    light: '#FFFFFF',
    dark:  '#1E293B',
  },
  border: {
    light: '#E5E7EB',
    dark:  '#334155',
  },
  foreground: {
    light: '#111827',
    dark:  '#F8FAFC',
  },
  foregroundSecondary: {
    light: '#374151',
    dark:  '#CBD5E1',
  },
  mutedForeground: {
    light: '#6B7280',
    dark:  '#94A3B8',
  },
  muted: {
    light: '#F3F4F6',
    dark:  '#1E293B',
  },
  placeholder: {
    light: '#9CA3AF',
    dark:  '#475569',
  },

  primary:            '#0EA5E9',
  primaryForeground:  '#FFFFFF',
  primaryMuted:       '#E0F2FE',

  sidebar:            '#111827',
  sidebarActive:      '#1F2937',
  sidebarForeground:  '#F9FAFB',
  sidebarMuted:       '#9CA3AF',

  success:            '#059669',
  successMuted:       '#ECFDF5',
  warning:            '#D97706',
  warningMuted:       '#FFFBEB',
  destructive:        '#DC2626',
  destructiveMuted:   '#FEF2F2',
} as const

export const typography = {
  fontSans: 'Inter, sans-serif',
  fontSize: {
    xs:   '11px',
    sm:   '12px',
    base: '13px',
    md:   '14px',
    lg:   '16px',
    xl:   '22px',
    '2xl': '24px',
  },
  fontWeight: {
    normal:   '400',
    medium:   '500',
    semibold: '600',
    bold:     '700',
  },
  lineHeight: {
    tight:   '1.2',
    snug:    '1.4',
    normal:  '1.5',
    relaxed: '1.6',
  },
} as const

export const spacing = {
  1:  '4px',
  2:  '8px',
  3:  '12px',
  4:  '16px',
  5:  '20px',
  6:  '24px',
  8:  '32px',
  10: '40px',
} as const

export const radius = {
  sm:   '4px',
  md:   '6px',
  lg:   '8px',
  full: '9999px',
} as const

export const layout = {
  sidebarWidth: '260px',
  headerHeight: '64px',
} as const

export type ColorKey = keyof typeof colors
