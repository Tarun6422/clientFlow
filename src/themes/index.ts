import type { ComponentType } from 'react';
import type { ThemeDef } from '../types';
import { PALETTES } from './palettes';
import {
  ModernMinimalSite,
  BentoSaasSite,
  DarkPremiumSite,
  AuroraGlassSite,
  NeoBrutalistSite,
  EditorialSite,
} from '../components/theme-previews/sites';

export interface ThemeWithPreview extends ThemeDef {
  preview: ComponentType;
}

export const THEMES: ThemeWithPreview[] = [
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    description:
      'Clean white layout. Premium typography. Large whitespace. Elegant cards. A professional business feel that lets your content breathe.',
    tags: ['Clean', 'Minimal', 'Business', 'Professional'],
    palette: PALETTES['modern-minimal'],
    preview: ModernMinimalSite,
  },
  {
    id: 'bento-saas',
    name: 'Bento SaaS',
    description:
      'Bento grid layout with modern cards and blue/purple gradients. The classic technology and SaaS aesthetic for product-led companies.',
    tags: ['Bento Grid', 'Gradient', 'SaaS', 'Tech'],
    palette: PALETTES['bento-saas'],
    preview: BentoSaasSite,
  },
  {
    id: 'dark-premium',
    name: 'Dark Premium',
    description:
      'Dark charcoal background, large typography and bright accent colours. A premium visual style that feels bold, modern and expensive.',
    tags: ['Dark', 'Premium', 'Bold', 'Modern'],
    palette: PALETTES['dark-premium'],
    preview: DarkPremiumSite,
  },
  {
    id: 'aurora-glass',
    name: 'Aurora Glass',
    description:
      'Glassmorphism with blurred gradient backgrounds and a blue/purple/pink aurora. A dreamy, modern startup aesthetic with luminous depth.',
    tags: ['Glassmorphism', 'Gradient', 'Startup', 'Luminous'],
    palette: PALETTES['aurora-glass'],
    preview: AuroraGlassSite,
  },
  {
    id: 'neo-brutalist',
    name: 'Neo Brutalist',
    description:
      'Bold typography, strong borders and high-contrast bright colours. A striking creative-agency style that demands attention.',
    tags: ['Bold', 'High Contrast', 'Creative', 'Edgy'],
    palette: PALETTES['neo-brutalist'],
    preview: NeoBrutalistSite,
  },
  {
    id: 'editorial',
    name: 'Editorial',
    description:
      'Large typography and magazine-inspired layouts with sophisticated spacing. An image-focused, luxury brand feeling.',
    tags: ['Magazine', 'Typography', 'Luxury', 'Image-led'],
    palette: PALETTES['editorial'],
    preview: EditorialSite,
  },
];

export function getTheme(themeId: string): ThemeWithPreview | undefined {
  return THEMES.find((t) => t.id === themeId);
}