import type { ThemePalette } from '../types';

export const PALETTES: Record<string, ThemePalette> = {
  'modern-minimal': {
    bg: '#FFFFFF',
    surface: '#F8FAFC',
    text: '#0F172A',
    muted: '#64748B',
    primary: '#4F46E5',
    secondary: '#8B5CF6',
    accent: '#F59E0B',
  },
  'bento-saas': {
    bg: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#0F172A',
    muted: '#64748B',
    primary: '#2563EB',
    secondary: '#7C3AED',
    accent: '#06B6D4',
  },
  'dark-premium': {
    bg: '#0C0C10',
    surface: '#16161C',
    text: '#F4F4F5',
    muted: '#A1A1AA',
    primary: '#A78BFA',
    secondary: '#22D3EE',
    accent: '#F472B6',
  },
  'aurora-glass': {
    bg: '#1E1B4B',
    surface: '#312E81',
    text: '#FFFFFF',
    muted: '#C7D2FE',
    primary: '#818CF8',
    secondary: '#C084FC',
    accent: '#F472B6',
  },
  'neo-brutalist': {
    bg: '#FFF8E7',
    surface: '#FFFFFF',
    text: '#111111',
    muted: '#444444',
    primary: '#FF4D00',
    secondary: '#0047FF',
    accent: '#FFDE00',
  },
  editorial: {
    bg: '#FAF7F2',
    surface: '#FFFFFF',
    text: '#1C1917',
    muted: '#78716C',
    primary: '#9A3412',
    secondary: '#B45309',
    accent: '#78716C',
  },
};

export function getPalette(themeId: string): ThemePalette {
  return PALETTES[themeId] ?? PALETTES['modern-minimal'];
}