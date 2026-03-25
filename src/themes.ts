// ─── Theme & Color Scheme Definitions ─────────────────────────────────
// Each color scheme is a flat map of CSS custom-property → value.
// ThemeContext applies these on :root at runtime.

export type ThemeId = 'default' | 'neo-brutalism';

export interface ColorScheme {
  id: string;
  label: string;
  preview: string; // primary swatch colour shown in the picker
  vars: Record<string, string>;
}

export interface ThemeDefinition {
  id: ThemeId;
  label: string;
  description: string;
  icon: string; // emoji
  colorSchemes: ColorScheme[];
  supportsDarkMode: boolean;
}

// ──────────────────────────────────────────────────────────────
//  DEFAULT THEME  –  Modern / Glassmorphism
// ──────────────────────────────────────────────────────────────

const defaultLightBase: Record<string, string> = {
  '--c-bg-main': '#f8fafc',
  '--c-bg-card': '#ffffff',
  '--c-bg-nav': 'rgba(255,255,255,0.8)',
  '--c-text-primary': '#111827',
  '--c-text-secondary': '#6b7280',
  '--c-text-muted': '#9ca3af',
  '--c-border': '#e5e7eb',
  '--c-border-light': 'rgba(229,231,235,0.5)',
};

const defaultDarkBase: Record<string, string> = {
  '--c-bg-main': '#030712',
  '--c-bg-card': '#111827',
  '--c-bg-nav': 'rgba(3,7,18,0.9)',
  '--c-text-primary': '#f9fafb',
  '--c-text-secondary': '#9ca3af',
  '--c-text-muted': '#6b7280',
  '--c-border': '#1f2937',
  '--c-border-light': 'rgba(31,41,55,0.5)',
};

// ── Emerald (current) ──
const emeraldColors: Record<string, string> = {
  '--color-primary-50': '#ecfdf5',
  '--color-primary-100': '#d1fae5',
  '--color-primary-200': '#a7f3d0',
  '--color-primary-300': '#6ee7b7',
  '--color-primary-400': '#34d399',
  '--color-primary-500': '#10b981',
  '--color-primary-600': '#059669',
  '--color-primary-700': '#047857',
  '--color-primary-800': '#065f46',
  '--color-primary-900': '#064e3b',
  '--color-primary-950': '#022c22',
  '--color-accent-50': '#eff6ff',
  '--color-accent-100': '#dbeafe',
  '--color-accent-200': '#bfdbfe',
  '--color-accent-300': '#93c5fd',
  '--color-accent-400': '#60a5fa',
  '--color-accent-500': '#3b82f6',
  '--color-accent-600': '#2563eb',
  '--color-accent-700': '#1d4ed8',
  '--color-accent-800': '#1e40af',
  '--color-accent-900': '#1e3a8a',
};

// ── Ocean (Blue-Teal) ──
const oceanColors: Record<string, string> = {
  '--color-primary-50': '#ecfeff',
  '--color-primary-100': '#cffafe',
  '--color-primary-200': '#a5f3fc',
  '--color-primary-300': '#67e8f9',
  '--color-primary-400': '#22d3ee',
  '--color-primary-500': '#06b6d4',
  '--color-primary-600': '#0891b2',
  '--color-primary-700': '#0e7490',
  '--color-primary-800': '#155e75',
  '--color-primary-900': '#164e63',
  '--color-primary-950': '#083344',
  '--color-accent-50': '#f0fdfa',
  '--color-accent-100': '#ccfbf1',
  '--color-accent-200': '#99f6e4',
  '--color-accent-300': '#5eead4',
  '--color-accent-400': '#2dd4bf',
  '--color-accent-500': '#14b8a6',
  '--color-accent-600': '#0d9488',
  '--color-accent-700': '#0f766e',
  '--color-accent-800': '#115e59',
  '--color-accent-900': '#134e4a',
};

// ── Violet (Purple) ──
const violetColors: Record<string, string> = {
  '--color-primary-50': '#f5f3ff',
  '--color-primary-100': '#ede9fe',
  '--color-primary-200': '#ddd6fe',
  '--color-primary-300': '#c4b5fd',
  '--color-primary-400': '#a78bfa',
  '--color-primary-500': '#8b5cf6',
  '--color-primary-600': '#7c3aed',
  '--color-primary-700': '#6d28d9',
  '--color-primary-800': '#5b21b6',
  '--color-primary-900': '#4c1d95',
  '--color-primary-950': '#2e1065',
  '--color-accent-50': '#fdf2f8',
  '--color-accent-100': '#fce7f3',
  '--color-accent-200': '#fbcfe8',
  '--color-accent-300': '#f9a8d4',
  '--color-accent-400': '#f472b6',
  '--color-accent-500': '#ec4899',
  '--color-accent-600': '#db2777',
  '--color-accent-700': '#be185d',
  '--color-accent-800': '#9d174d',
  '--color-accent-900': '#831843',
};

export const defaultTheme: ThemeDefinition = {
  id: 'default',
  label: 'Modern',
  description: 'Clean, modern glassmorphism style',
  icon: '✨',
  supportsDarkMode: true,
  colorSchemes: [
    {
      id: 'emerald',
      label: 'Emerald',
      preview: '#10b981',
      vars: { ...defaultLightBase, ...emeraldColors },
    },
    {
      id: 'ocean',
      label: 'Ocean',
      preview: '#06b6d4',
      vars: { ...defaultLightBase, ...oceanColors },
    },
    {
      id: 'violet',
      label: 'Violet',
      preview: '#8b5cf6',
      vars: { ...defaultLightBase, ...violetColors },
    },
  ],
};

// ──────────────────────────────────────────────────────────────
//  NEO BRUTALISM THEME
// ──────────────────────────────────────────────────────────────

const brutalistBase: Record<string, string> = {
  '--c-bg-main': '#f0e6d3',
  '--c-bg-card': '#ffffff',
  '--c-bg-nav': '#ffffff',
  '--c-text-primary': '#1a1a1a',
  '--c-text-secondary': '#333333',
  '--c-text-muted': '#555555',
  '--c-border': '#1a1a1a',
  '--c-border-light': '#1a1a1a',
};

// ── Punk Red ──
const punkRedColors: Record<string, string> = {
  '--color-primary-50': '#fff1f2',
  '--color-primary-100': '#ffe4e6',
  '--color-primary-200': '#fecdd3',
  '--color-primary-300': '#fda4af',
  '--color-primary-400': '#fb7185',
  '--color-primary-500': '#ff3b3b',
  '--color-primary-600': '#e11d48',
  '--color-primary-700': '#be123c',
  '--color-primary-800': '#9f1239',
  '--color-primary-900': '#881337',
  '--color-primary-950': '#4c0519',
  '--color-accent-50': '#fefce8',
  '--color-accent-100': '#fef9c3',
  '--color-accent-200': '#fef08a',
  '--color-accent-300': '#fde047',
  '--color-accent-400': '#facc15',
  '--color-accent-500': '#eab308',
  '--color-accent-600': '#ca8a04',
  '--color-accent-700': '#a16207',
  '--color-accent-800': '#854d0e',
  '--color-accent-900': '#713f12',
};

// ── Electric Yellow ──
const electricYellowColors: Record<string, string> = {
  '--color-primary-50': '#fefce8',
  '--color-primary-100': '#fef9c3',
  '--color-primary-200': '#fef08a',
  '--color-primary-300': '#fde047',
  '--color-primary-400': '#facc15',
  '--color-primary-500': '#eab308',
  '--color-primary-600': '#ca8a04',
  '--color-primary-700': '#a16207',
  '--color-primary-800': '#854d0e',
  '--color-primary-900': '#713f12',
  '--color-primary-950': '#422006',
  '--color-accent-50': '#fff1f2',
  '--color-accent-100': '#ffe4e6',
  '--color-accent-200': '#fecdd3',
  '--color-accent-300': '#fda4af',
  '--color-accent-400': '#fb7185',
  '--color-accent-500': '#f43f5e',
  '--color-accent-600': '#e11d48',
  '--color-accent-700': '#be123c',
  '--color-accent-800': '#9f1239',
  '--color-accent-900': '#881337',
};

// ── Bold Blue ──
const boldBlueColors: Record<string, string> = {
  '--color-primary-50': '#eff6ff',
  '--color-primary-100': '#dbeafe',
  '--color-primary-200': '#bfdbfe',
  '--color-primary-300': '#93c5fd',
  '--color-primary-400': '#60a5fa',
  '--color-primary-500': '#3b82f6',
  '--color-primary-600': '#2563eb',
  '--color-primary-700': '#1d4ed8',
  '--color-primary-800': '#1e40af',
  '--color-primary-900': '#1e3a8a',
  '--color-primary-950': '#172554',
  '--color-accent-50': '#faf5ff',
  '--color-accent-100': '#f3e8ff',
  '--color-accent-200': '#e9d5ff',
  '--color-accent-300': '#d8b4fe',
  '--color-accent-400': '#c084fc',
  '--color-accent-500': '#a855f7',
  '--color-accent-600': '#9333ea',
  '--color-accent-700': '#7e22ce',
  '--color-accent-800': '#6b21a8',
  '--color-accent-900': '#581c87',
};

// ── Neon Green ──
const neonGreenColors: Record<string, string> = {
  '--color-primary-50': '#f0fdf4',
  '--color-primary-100': '#dcfce7',
  '--color-primary-200': '#bbf7d0',
  '--color-primary-300': '#86efac',
  '--color-primary-400': '#4ade80',
  '--color-primary-500': '#22c55e',
  '--color-primary-600': '#16a34a',
  '--color-primary-700': '#15803d',
  '--color-primary-800': '#166534',
  '--color-primary-900': '#14532d',
  '--color-primary-950': '#052e16',
  '--color-accent-50': '#ecfeff',
  '--color-accent-100': '#cffafe',
  '--color-accent-200': '#a5f3fc',
  '--color-accent-300': '#67e8f9',
  '--color-accent-400': '#22d3ee',
  '--color-accent-500': '#06b6d4',
  '--color-accent-600': '#0891b2',
  '--color-accent-700': '#0e7490',
  '--color-accent-800': '#155e75',
  '--color-accent-900': '#164e63',
};

export const neoBrutalismTheme: ThemeDefinition = {
  id: 'neo-brutalism',
  label: 'Neo Brutalism',
  description: 'Bold, contrasty, thick borders',
  icon: '🔥',
  supportsDarkMode: false,
  colorSchemes: [
    {
      id: 'punk-red',
      label: 'Punk Red',
      preview: '#ff3b3b',
      vars: { ...brutalistBase, ...punkRedColors },
    },
    {
      id: 'electric-yellow',
      label: 'Electric Yellow',
      preview: '#eab308',
      vars: { ...brutalistBase, ...electricYellowColors, '--c-bg-main': '#fef9c3' },
    },
    {
      id: 'bold-blue',
      label: 'Bold Blue',
      preview: '#3b82f6',
      vars: { ...brutalistBase, ...boldBlueColors, '--c-bg-main': '#dbeafe' },
    },
    {
      id: 'neon-green',
      label: 'Neon Green',
      preview: '#22c55e',
      vars: { ...brutalistBase, ...neonGreenColors, '--c-bg-main': '#dcfce7' },
    },
  ],
};

// ─── All themes registry ──────────────────────────────────────
export const THEMES: ThemeDefinition[] = [defaultTheme, neoBrutalismTheme];

export function getTheme(id: ThemeId): ThemeDefinition {
  return THEMES.find((t) => t.id === id) || defaultTheme;
}

export function getColorScheme(theme: ThemeDefinition, schemeId: string): ColorScheme {
  return theme.colorSchemes.find((s) => s.id === schemeId) || theme.colorSchemes[0];
}

// Dark mode overrides for default theme
export const darkModeOverrides: Record<string, string> = {
  ...defaultDarkBase,
};
