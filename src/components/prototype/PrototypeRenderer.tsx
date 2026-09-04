import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Mail,
  MapPin,
  Menu,
  Phone,
  Send,
  Star,
  X,
} from 'lucide-react';
import type {
  PrototypeDesign,
  PrototypeItem,
  PrototypePage,
  PrototypeSection,
  PrototypeSnapshot,
} from '../../types';
import { cn } from '../../lib/utils';

export type ViewportMode = 'desktop' | 'tablet' | 'mobile';

export const VIEWPORT_WIDTHS: Record<ViewportMode, number> = {
  desktop: 1280,
  tablet: 768,
  mobile: 390,
};

/* ------------------------------------------------------------------ */
/* Theme style engine                                                  */
/* ------------------------------------------------------------------ */

type Special = 'minimal' | 'bento' | 'dark' | 'glass' | 'brutal' | 'editorial';

interface DesignTokens {
  design: PrototypeDesign;
  special: Special;
  isDark: boolean;
  isMobile: boolean;
  headingFont: string;
  bodyFont: string;
  padY: number;
  padX: number;
  gap: number;
  viewportHeading: number;
  text: string;
  muted: string;
  onPrimary: string;
  cols: (n: number) => number;
  heading: (size: number) => CSSProperties;
  button: (variant?: 'primary' | 'outline' | 'ghost') => CSSProperties;
  card: () => CSSProperties;
  image: (seed: string, i?: number) => CSSProperties;
  chip: () => CSSProperties;
}

function luminance(hex: string): number {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return 0.5;
  return (0.299 * parseInt(m[1], 16) + 0.587 * parseInt(m[2], 16) + 0.114 * parseInt(m[3], 16)) / 255;
}

function specialOf(theme: string): Special {
  if (theme === 'bento-saas') return 'bento';
  if (theme === 'dark-premium') return 'dark';
  if (theme === 'aurora-glass') return 'glass';
  if (theme === 'neo-brutalist') return 'brutal';
  if (theme === 'editorial') return 'editorial';
  return 'minimal';
}

export function useDesignTokens(design: PrototypeDesign, viewport: ViewportMode): DesignTokens {
  const { colors, radius, font, buttons, spacing, theme } = design;
  const special = specialOf(theme);
  const isDark = luminance(colors.bg) < 0.5;

  const headingFont =
    font === 'serif'
      ? `Georgia, 'Times New Roman', serif`
      : `'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif`;
  const bodyFont =
    font === 'serif'
      ? `Georgia, 'Times New Roman', serif`
      : `'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif`;

  const padY = spacing === 'compact' ? 48 : spacing === 'comfortable' ? 72 : 96;
  const padX = viewport === 'desktop' ? 64 : viewport === 'tablet' ? 40 : 20;
  const gap = viewport === 'desktop' ? 28 : viewport === 'tablet' ? 22 : 16;
  const isMobile = viewport === 'mobile';

  const text = colors.text;
  const muted = colors.muted;
  const onPrimary = luminance(colors.primary) > 0.55 ? '#111111' : '#FFFFFF';
  const viewportHeading = viewport === 'mobile' ? 32 : viewport === 'tablet' ? 40 : 46;

  const cols = (n: number): number => {
    if (viewport === 'mobile') return 1;
    if (viewport === 'tablet') return n > 2 ? 2 : n;
    return n;
  };

  const heading = (size: number): CSSProperties => {
    const base: CSSProperties = {
      fontFamily: headingFont,
      fontSize: size,
      lineHeight: 1.08,
      letterSpacing: '-0.025em',
      fontWeight: 700,
      color: text,
      margin: 0,
    };
    if (special === 'brutal') {
      return { ...base, textTransform: 'uppercase', letterSpacing: '-0.01em', fontWeight: 900 };
    }
    if (special === 'dark') {
      return { ...base, letterSpacing: '-0.02em', fontWeight: 800 };
    }
    if (special === 'editorial') {
      return { ...base, fontWeight: 600, letterSpacing: '-0.01em' };
    }
    if (special === 'bento') {
      return { ...base, fontWeight: 800 };
    }
    return { ...base, fontWeight: 700 };
  };

  const button = (variant: 'primary' | 'outline' | 'ghost' = 'primary'): CSSProperties => {
    const rad = buttons === 'pill' ? 999 : radius;
    const base: CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: '14px 28px',
      fontWeight: 600,
      fontSize: 15,
      cursor: 'pointer',
      border: 'none',
      fontFamily: bodyFont,
      transition: 'all 0.15s ease',
      whiteSpace: 'nowrap',
    };
    if (special === 'brutal') {
      return {
        ...base,
        borderRadius: Math.max(radius, 2),
        backgroundColor: variant === 'primary' ? colors.primary : colors.bg,
        color: variant === 'primary' ? '#FFFFFF' : text,
        border: `3px solid ${text}`,
        boxShadow: `6px 6px 0 0 ${text}`,
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.02em',
      };
    }
    if (special === 'bento') {
      if (variant === 'outline') {
        return { ...base, borderRadius: rad, backgroundColor: 'transparent', border: `1.5px solid ${colors.primary}`, color: colors.primary };
      }
      return {
        ...base,
        borderRadius: rad,
        backgroundImage: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
        color: '#FFFFFF',
        boxShadow: `0 10px 24px -10px ${colors.primary}`,
      };
    }
    if (special === 'glass') {
      if (variant === 'outline') {
        return { ...base, borderRadius: rad, backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.35)', color: '#FFFFFF', backdropFilter: 'blur(8px)' };
      }
      return { ...base, borderRadius: rad, backgroundColor: '#FFFFFF', color: '#312E81', boxShadow: '0 16px 40px -16px rgba(0,0,0,0.5)' };
    }
    if (special === 'dark') {
      if (variant === 'outline') {
        return { ...base, borderRadius: rad, backgroundColor: 'transparent', border: `1px solid ${colors.muted}`, color: text };
      }
      return {
        ...base,
        borderRadius: rad,
        backgroundColor: colors.primary,
        color: onPrimary,
        boxShadow: `0 0 28px -6px ${colors.primary}`,
      };
    }
    // minimal + editorial
    if (variant === 'outline') {
      return { ...base, borderRadius: rad, backgroundColor: 'transparent', border: `1.5px solid ${colors.primary}`, color: colors.primary };
    }
    if (variant === 'ghost') {
      return { ...base, borderRadius: rad, backgroundColor: 'transparent', color: text, padding: '14px 20px' };
    }
    return { ...base, borderRadius: rad, backgroundColor: colors.primary, color: onPrimary };
  };

  const card = (): CSSProperties => {
    const rad = special === 'brutal' ? Math.max(radius, 2) : radius;
    if (special === 'brutal') {
      return {
        backgroundColor: colors.surface,
        border: `3px solid ${text}`,
        boxShadow: `6px 6px 0 0 ${text}`,
        borderRadius: rad,
      };
    }
    if (special === 'glass') {
      return {
        backgroundColor: 'rgba(255,255,255,0.12)',
        border: '1px solid rgba(255,255,255,0.22)',
        backdropFilter: 'blur(16px)',
        borderRadius: rad,
      };
    }
    if (special === 'bento') {
      return {
        backgroundColor: colors.surface,
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}`,
        borderRadius: rad,
        boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
      };
    }
    return {
      backgroundColor: colors.surface,
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}`,
      borderRadius: rad,
      boxShadow:
        special === 'editorial' ? 'none' : '0 1px 2px rgba(15,23,42,0.05), 0 1px 3px rgba(15,23,42,0.07)',
    };
  };

  const image = (seed: string, i = 0): CSSProperties => {
    const base: CSSProperties = { borderRadius: radius, overflow: 'hidden' };
    const hues = [colors.primary, colors.secondary, colors.accent, colors.primary, colors.secondary, colors.accent];
    const hue = hues[i % hues.length];
    if (special === 'brutal') {
      return {
        ...base,
        backgroundColor: hue,
        border: `3px solid ${text}`,
        borderRadius: Math.max(radius, 2),
      };
    }
    if (special === 'bento') {
      return { ...base, backgroundImage: `linear-gradient(135deg, ${hue}, ${colors.secondary})`, opacity: 0.9 };
    }
    if (special === 'glass') {
      return { ...base, backgroundImage: `linear-gradient(135deg, ${hue}66, ${colors.secondary}55)` };
    }
    if (special === 'dark') {
      return { ...base, backgroundImage: `linear-gradient(160deg, ${hue}55, ${colors.surface})`, border: `1px solid rgba(255,255,255,0.06)` };
    }
    if (special === 'editorial') {
      return { ...base, backgroundColor: '#E7DED3', border: 'none', borderRadius: 0 };
    }
    return { ...base, backgroundImage: `linear-gradient(150deg, ${hue}22, ${hue}44)` };
  };

  const chip = (): CSSProperties => {
    if (special === 'brutal') {
      return { border: `2px solid ${text}`, backgroundColor: colors.surface, fontWeight: 700, borderRadius: Math.max(radius, 2) };
    }
    if (special === 'glass') {
      return { backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(8px)' };
    }
    return { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : `${colors.primary}14`, border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : `${colors.primary}30`}` };
  };

  return { design, special, isDark, isMobile, headingFont, bodyFont, padY, padX, gap, viewportHeading, text, muted, onPrimary, cols, heading, button, card, image, chip };
}

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

function ImgPlaceholder({ t, label, seed, i, className, style }: { t: DesignTokens; label?: string; seed: string; i?: number; className?: string; style?: CSSProperties }) {
  return (
    <div
      className={cn('flex items-center justify-center', className)}
      style={{ ...t.image(seed, i), ...style }}
    >
      <span
        className="font-semibold uppercase tracking-[0.2em]"
        style={{ color: t.special === 'brutal' || t.special === 'bento' || t.special === 'glass' ? 'rgba(255,255,255,0.9)' : t.muted, fontSize: 12 }}
      >
        {label}
      </span>
    </div>
  );
}

function Monogram({ t, text, size = 44, i = 0 }: { t: DesignTokens; text: string; size?: number; i?: number }) {
  const hues = [t.design.colors.primary, t.design.colors.secondary, t.design.colors.accent];
  return (
    <div
      className="flex items-center justify-center font-bold"
      style={{
        width: size,
        height: size,
        borderRadius: t.special === 'brutal' ? Math.max(t.design.radius, 2) : t.design.radius,
        backgroundColor: hues[i % hues.length],
        color: luminance(hues[i % hues.length]) > 0.55 ? '#111' : '#fff',
        fontSize: size * 0.42,
        fontFamily: t.headingFont,
      }}
    >
      {(text || '•').trim().slice(0, 1).toUpperCase()}
    </div>
  );
}

function Stars({ color }: { color: string }) {
  return (
    <div className="flex gap-1" style={{ color }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={15} fill="currentColor" strokeWidth={0} />
      ))}
    </div>
  );
}

function Heading({ t, size, children, style }: { t: DesignTokens; size: number; children: ReactNode; style?: CSSProperties }) {
  return <h2 style={{ ...t.heading(size), ...style }}>{children}</h2>;
}

function SectionIntro({ t, title, subtitle, center = true }: { t: DesignTokens; title: string; subtitle?: string; center?: boolean }) {
  return (
    <div className={cn('max-w-2xl', center && 'mx-auto text-center')}>
      <Heading t={t} size={t.viewportHeading}>
        {title}
      </Heading>
      {subtitle ? (
        <p className="mt-4 text-base leading-relaxed" style={{ color: t.muted }}>
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section renderers                                                   */
/* ------------------------------------------------------------------ */

interface SectionProps {
  t: DesignTokens;
  section: PrototypeSection;
  ctx: { pageLabel: string; business: string };
}

function HeroSection({ t, section, ctx }: SectionProps) {
  const centered = section.align !== 'left';
  const headingSize = t.design.theme === 'neo-brutalist' ? 72 : t.design.theme === 'dark-premium' ? 68 : 56;
  const subSize = 19;
  const content = (
    <>
      <Heading t={t} size={headingSize}>
        {section.title || 'Welcome'}
      </Heading>
      {section.subtitle ? (
        <p className="mt-5 leading-relaxed" style={{ color: t.muted, fontSize: subSize, maxWidth: 560 }}>
          {section.subtitle}
        </p>
      ) : null}
      <div className="mt-8 flex flex-wrap gap-4" style={{ justifyContent: centered ? 'center' : 'flex-start' }}>
        {section.cta && <button style={t.button('primary')}>{section.cta.label}</button>}
        <button style={t.button('outline')}>{section.cta ? 'Learn more' : 'Explore'}</button>
      </div>
      {!section.image && (
        <div className="mt-6 flex items-center justify-center gap-2" style={{ color: t.muted }}>
          <Check size={15} />
          <span className="text-sm">Replace this placeholder with real copy</span>
        </div>
      )}
    </>
  );

  if (section.image) {
    return (
      <div
        className="grid items-center gap-10"
        style={{ gridTemplateColumns: centered ? '1fr' : t.cols(2) > 1 ? '1.1fr 0.9fr' : '1fr' }}
      >
        {centered ? (
          <>
            <div className="mx-auto max-w-3xl text-center">{content}</div>
            <ImgPlaceholder t={t} label={section.image} seed="hero" i={0} className="h-80 w-full" />
          </>
        ) : (
          <>
            <div>{content}</div>
            <ImgPlaceholder t={t} label={section.image} seed="hero" i={0} className="h-96 w-full" />
          </>
        )}
      </div>
    );
  }
  return <div className="mx-auto max-w-3xl text-center">{content}</div>;
}

function ItemGridSection({ t, section, ctx, kind }: SectionProps & { kind: 'features' | 'services' | 'cards' | 'blog' | 'team' | 'products' | 'gallery' }) {
  const items = section.items;
  const n = items.length || 3;
  const showImage = kind === 'services' || kind === 'products' || kind === 'gallery' || kind === 'blog' || kind === 'cards';
  const isGallery = kind === 'gallery';

  if (kind === 'gallery') {
    return (
      <div className="grid gap-5" style={{ gridTemplateColumns: `repeat(${t.cols(3)}, 1fr)` }}>
        {Array.from({ length: Math.max(items.length, 6) }).map((_, i) => (
          <ImgPlaceholder
            key={i}
            t={t}
            label={items[i]?.image || `Image ${i + 1}`}
            seed="gallery"
            i={i}
            className="h-52 w-full"
          />
        ))}
      </div>
    );
  }

  const card = t.card();
  return (
    <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${t.cols(Math.min(n, 3))}, 1fr)` }}>
      {Array.from({ length: Math.max(items.length, n) }).map((_, i) => {
        const item: PrototypeItem | undefined = items[i];
        const title = item?.title ?? `${kind} ${i + 1}`;
        const desc = item?.description ?? 'Placeholder — replace with real content.';
        return (
          <div key={i} className="flex flex-col" style={card}>
            {showImage && !isGallery && (
              <ImgPlaceholder
                t={t}
                label={item?.image || (kind === 'team' ? 'Portrait' : 'Image')}
                seed={kind}
                i={i}
                className={cn('w-full', kind === 'team' ? 'h-40' : 'h-44')}
                style={{ borderRadius: 0, borderBottom: specialBorder(t) }}
              />
            )}
            <div className="flex flex-1 flex-col p-6">
              {kind === 'team' ? (
                <div className="mb-3">
                  <Monogram t={t} text={title} size={48} i={i} />
                </div>
              ) : null}
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-bold" style={{ fontFamily: t.headingFont, color: t.text }}>
                  {title}
                </h3>
                {kind === 'products' && item?.cta && (
                  <span className="text-sm font-semibold" style={{ color: t.design.colors.primary }}>
                    {item.cta}
                  </span>
                )}
              </div>
              {item?.meta && (
                <div className="mt-1 text-sm font-medium" style={{ color: t.design.colors.primary }}>
                  {item.meta}
                </div>
              )}
              <p className="mt-3 flex-1 text-sm leading-relaxed" style={{ color: t.muted }}>
                {desc}
              </p>
              {kind === 'blog' && (
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: t.design.colors.primary }}>
                  Read more <ArrowRight size={14} />
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function specialBorder(t: DesignTokens): string | undefined {
  if (t.special === 'brutal') return `3px solid ${t.text}`;
  return undefined;
}

function TestimonialsSection({ t, section }: SectionProps) {
  const card = t.card();
  const items = section.items.length ? section.items : [{ title: 'Client name', meta: 'Role', description: '“Add a real testimonial here.”' }];
  return (
    <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${t.cols(3)}, 1fr)` }}>
      {items.map((item, i) => (
        <div key={i} className="flex flex-col p-7" style={card}>
          <Stars color={t.design.colors.accent} />
          <p className="mt-4 flex-1 text-[15px] leading-relaxed" style={{ color: t.text }}>
            {item.description}
          </p>
          <div className="mt-6 flex items-center gap-3 border-t pt-5" style={{ borderColor: specialBorder(t) ?? 'rgba(128,128,128,0.15)' }}>
            <Monogram t={t} text={item.title} size={40} i={i} />
            <div>
              <div className="text-sm font-bold" style={{ fontFamily: t.headingFont, color: t.text }}>
                {item.title}
              </div>
              <div className="text-xs" style={{ color: t.muted }}>
                {item.meta}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CtaSection({ t, section, ctx }: SectionProps) {
  const { colors } = t.design;
  const isDarkBand = luminance(colors.primary) < 0.5;
  const onBand = isDarkBand ? '#FFFFFF' : '#111111';
  const rad = t.special === 'brutal' ? Math.max(t.design.radius, 2) : t.design.radius === 0 ? 4 : t.design.radius * 2;
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-8 px-10 py-14',
        t.isMobile ? 'flex-col text-center' : 'flex-row text-left'
      )}
      style={{
        backgroundColor: colors.primary,
        borderRadius: rad,
        boxShadow: t.special === 'brutal' ? `8px 8px 0 0 ${t.text}` : t.special === 'bento' ? `0 20px 40px -20px ${colors.primary}` : undefined,
        border: t.special === 'brutal' ? `3px solid ${t.text}` : undefined,
      }}
    >
      <div className="max-w-xl">
        <h2 className="text-3xl font-bold leading-tight" style={{ fontFamily: t.headingFont, color: onBand }}>
          {section.title || 'Ready to get started?'}
        </h2>
        {section.subtitle && (
          <p className="mt-3 text-base leading-relaxed" style={{ color: onBand, opacity: 0.85 }}>
            {section.subtitle}
          </p>
        )}
      </div>
      <button
        className="shrink-0"
        style={{
          ...t.button('primary'),
          ...(t.special === 'brutal' || t.special === 'bento'
            ? {}
            : { backgroundColor: '#FFFFFF', color: colors.primary, boxShadow: 'none' }),
        }}
      >
        {section.cta?.label || 'Get in touch'}
      </button>
    </div>
  );
}

function StatsSection({ t, section }: SectionProps) {
  const items = section.items;
  const show = items.length ? items : [{ title: '—', meta: 'Statistic', description: 'Add a real figure' }];
  return (
    <div className="grid gap-6 text-center" style={{ gridTemplateColumns: `repeat(${t.cols(3)}, 1fr)` }}>
      {show.map((item, i) => (
        <div key={i} className="p-6" style={t.card()}>
          <div className="text-5xl font-extrabold tabular-nums" style={{ fontFamily: t.headingFont, color: t.design.colors.primary }}>
            {item.title}
          </div>
          <div className="mt-2 text-sm font-semibold uppercase tracking-wide" style={{ color: t.text }}>
            {item.meta}
          </div>
          <div className="mt-1 text-sm" style={{ color: t.muted }}>
            {item.description}
          </div>
        </div>
      ))}
    </div>
  );
}

function LogosSection({ t, section }: SectionProps) {
  const items = section.items.length ? section.items : Array.from({ length: 5 }).map(() => ({ title: 'LOGO', description: '' }));
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 py-4"
      style={{ opacity: 0.7 }}
    >
      {items.map((item, i) => (
        <span
          key={i}
          className="text-lg font-black uppercase tracking-widest"
          style={{ fontFamily: t.headingFont, color: t.muted }}
        >
          {item.title}
        </span>
      ))}
    </div>
  );
}

function ContactSection({ t, section }: SectionProps) {
  const input: CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: Math.max(t.design.radius, 2),
    border: t.special === 'brutal' ? `2.5px solid ${t.text}` : `1px solid ${t.isDark ? 'rgba(255,255,255,0.15)' : '#CBD5E1'}`,
    backgroundColor: t.special === 'glass' ? 'rgba(255,255,255,0.1)' : t.isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
    color: t.text,
    fontFamily: t.bodyFont,
    fontSize: 14,
    outline: 'none',
  };
  return (
    <div className="grid items-start gap-10" style={{ gridTemplateColumns: t.cols(2) > 1 ? '1fr 1fr' : '1fr' }}>
      <div>
        <Heading t={t} size={t.viewportHeading}>
          {section.title || 'Contact us'}
        </Heading>
        {section.subtitle && (
          <p className="mt-4 leading-relaxed" style={{ color: t.muted }}>
            {section.subtitle}
          </p>
        )}
        <div className="mt-8 space-y-4 text-sm" style={{ color: t.text }}>
          <div className="flex items-center gap-3">
            <Mail size={17} style={{ color: t.design.colors.primary }} /> contact@example.com
          </div>
          <div className="flex items-center gap-3">
            <Phone size={17} style={{ color: t.design.colors.primary }} /> +91 00000 00000
          </div>
          <div className="flex items-center gap-3">
            <MapPin size={17} style={{ color: t.design.colors.primary }} /> Your city
          </div>
        </div>
        <p className="mt-6 text-xs" style={{ color: t.muted }}>
          Replace the placeholder contact details with the client's real information.
        </p>
      </div>
      <div className="flex flex-col gap-4" style={t.card()}>
        <div className="p-6">
          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <input placeholder="Name" style={input} />
            <input placeholder="Email" style={input} />
          </div>
          <textarea placeholder="Your message" rows={5} className="mt-4" style={input} />
          <button className="mt-5" style={{ ...t.button('primary'), width: '100%' }}>
            <Send size={15} /> {section.cta?.label || 'Send message'}
          </button>
        </div>
      </div>
    </div>
  );
}

function FaqSection({ t, section }: SectionProps) {
  const [open, setOpen] = useState<number | null>(0);
  const items = section.items.length ? section.items : [{ title: 'Question', description: 'Answer' }];
  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={i} style={t.card()}>
            <button
              className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left"
              onClick={() => setOpen(isOpen ? null : i)}
            >
              <span className="text-base font-bold" style={{ fontFamily: t.headingFont, color: t.text }}>
                {item.title}
              </span>
              {isOpen ? <X size={18} style={{ color: t.muted }} /> : <ChevronDown size={18} style={{ color: t.muted }} />}
            </button>
            {isOpen && (
              <div className="px-6 pb-5 text-sm leading-relaxed" style={{ color: t.muted }}>
                {item.description}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PricingSection({ t, section }: SectionProps) {
  const items = section.items.length ? section.items : [{ title: 'Plan', meta: 'Contact for pricing', description: 'Describe what is included.' }];
  const featured = Math.min(1, items.length - 1);
  return (
    <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${t.cols(3)}, 1fr)` }}>
      {items.map((item, i) => {
        const isFeatured = i === featured && items.length > 1;
        return (
          <div
            key={i}
            className="relative flex flex-col p-7"
            style={{
              ...t.card(),
              ...(isFeatured
                ? {
                    border: `2px solid ${t.design.colors.primary}`,
                    boxShadow: t.special === 'brutal' ? `6px 6px 0 0 ${t.text}` : `0 16px 32px -16px ${t.design.colors.primary}`,
                  }
                : {}),
            }}
          >
            {isFeatured && (
              <span
                className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide"
                style={{ backgroundColor: t.design.colors.primary, color: '#fff' }}
              >
                Most popular
              </span>
            )}
            <div className="text-sm font-bold uppercase tracking-wide" style={{ color: t.muted }}>
              {item.title}
            </div>
            <div className="mt-3 text-3xl font-extrabold" style={{ fontFamily: t.headingFont, color: t.text }}>
              {item.meta || 'Contact for pricing'}
            </div>
            <p className="mt-4 flex-1 text-sm leading-relaxed" style={{ color: t.muted }}>
              {item.description}
            </p>
            <button className="mt-6 w-full" style={t.button(isFeatured ? 'primary' : 'outline')}>
              {item.cta || 'Enquire'}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function TextSection({ t, section }: SectionProps) {
  const centered = section.align === 'center';
  return (
    <div className={cn('max-w-3xl', centered && 'mx-auto text-center')}>
      <Heading t={t} size={t.viewportHeading}>
        {section.title}
      </Heading>
      {section.subtitle && (
        <p className="mt-6 text-lg leading-relaxed" style={{ color: t.muted }}>
          {section.subtitle}
        </p>
      )}
      {section.cta && (
        <button className="mt-8" style={t.button('primary')}>
          {section.cta.label}
        </button>
      )}
    </div>
  );
}

function CardsSection(props: SectionProps) {
  return <ItemGridSection {...props} kind="cards" />;
}

/* ------------------------------------------------------------------ */
/* Page frame — nav, sections, footer                                  */
/* ------------------------------------------------------------------ */

function PrototypeNav({
  t,
  pages,
  activePageId,
  business,
  onNavigate,
  interactive,
}: {
  t: DesignTokens;
  pages: PrototypePage[];
  activePageId: string;
  business: string;
  onNavigate?: (pageId: string) => void;
  interactive?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { colors } = t.design;
  const logoText = business || 'Your Business';
  const links = pages.slice(0, 6);

  const navStyle: CSSProperties =
    t.special === 'brutal'
      ? { borderBottom: `4px solid ${t.text}`, backgroundColor: colors.bg }
      : t.special === 'glass'
        ? { borderBottom: '1px solid rgba(255,255,255,0.15)', backgroundColor: 'transparent' }
        : t.special === 'dark'
          ? { borderBottom: '1px solid rgba(255,255,255,0.07)', backgroundColor: colors.bg }
          : { borderBottom: `1px solid ${t.isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}`, backgroundColor: t.special === 'bento' ? 'rgba(255,255,255,0.8)' : colors.bg };

  const logoStyle: CSSProperties =
    t.special === 'brutal'
      ? { fontFamily: t.headingFont, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em', color: t.text }
      : t.special === 'dark'
        ? { fontFamily: t.headingFont, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.25em', fontSize: 17, color: t.text }
        : { fontFamily: t.headingFont, fontWeight: 700, letterSpacing: '-0.02em', color: t.text };

  const go = (id: string) => {
    setMenuOpen(false);
    onNavigate?.(id);
  };

  return (
    <header style={{ ...navStyle, position: 'sticky', top: 0, zIndex: 20 }}>
      <div className="flex items-center justify-between px-5 py-4" style={{ paddingLeft: t.padX, paddingRight: t.padX }}>
        <div className="flex items-center gap-3">
          {t.special === 'brutal' ? (
            <div
              className="flex h-10 w-10 items-center justify-center border-[3px] text-sm font-black text-white"
              style={{ borderColor: t.text, backgroundColor: colors.accent }}
            >
              {(logoText || 'C').slice(0, 1).toUpperCase()}
            </div>
          ) : (
            <div
              className="flex h-9 w-9 items-center justify-center text-sm font-bold text-white"
              style={{ backgroundColor: colors.primary, borderRadius: t.special === 'brutal' ? 0 : Math.max(t.design.radius, 2), fontFamily: t.headingFont }}
            >
              {(logoText || 'C').slice(0, 1).toUpperCase()}
            </div>
          )}
          <span style={logoStyle}>{logoText}</span>
        </div>

        {/* Desktop links */}
        {!t.isMobile && (
          <nav className="flex items-center gap-8 text-[14px] font-medium" style={{ color: t.muted }}>
            {links.map((p) => (
              <button
                key={p.id}
                onClick={() => go(p.id)}
                className="cursor-pointer"
                style={{
                  color: p.id === activePageId ? (t.special === 'brutal' ? t.text : colors.primary) : t.muted,
                  fontWeight: p.id === activePageId ? 700 : 500,
                  borderBottom: p.id === activePageId && t.special !== 'brutal' ? `2px solid ${colors.primary}` : '2px solid transparent',
                  paddingBottom: 2,
                  fontFamily: t.special === 'brutal' || t.special === 'dark' ? t.headingFont : t.bodyFont,
                  textTransform: t.special === 'brutal' ? 'uppercase' : 'none',
                  fontWeight: p.id === activePageId && (t.special === 'brutal' || t.special === 'dark') ? 800 : undefined,
                }}
              >
                {p.label}
              </button>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-3">
          {!t.isMobile && (
            <button className="inline-flex" style={t.button('primary')}>
              Get in touch
            </button>
          )}
          {t.isMobile && (
            <button
              aria-label="Toggle menu"
              onClick={() => setMenuOpen((v) => !v)}
              style={{ color: t.text }}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && t.isMobile && (
        <div style={{ borderTop: `1px solid ${t.isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}`, backgroundColor: t.special === 'glass' ? 'rgba(30,27,75,0.9)' : colors.bg, backdropFilter: 'blur(12px)' }}>
          <div className="flex flex-col px-5 py-3" style={{ paddingLeft: t.padX, paddingRight: t.padX }}>
            {pages.map((p) => (
              <button
                key={p.id}
                onClick={() => go(p.id)}
                className="cursor-pointer py-3 text-left text-base font-semibold"
                style={{ color: p.id === activePageId ? colors.primary : t.text }}
              >
                {p.label}
              </button>
            ))}
            {interactive && (
              <button className="my-3 w-full" style={t.button('primary')}>
                Get in touch
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function PrototypeFooter({ t, pages, business }: { t: DesignTokens; pages: PrototypePage[]; business: string }) {
  const year = new Date().getFullYear();
  return (
    <footer
      className="px-5 py-12"
      style={{
        paddingLeft: t.padX,
        paddingRight: t.padX,
        borderTop: t.special === 'brutal' ? `4px solid ${t.text}` : `1px solid ${t.isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}`,
        backgroundColor: t.special === 'dark' ? 'rgba(0,0,0,0.2)' : t.special === 'editorial' ? t.design.colors.surface : undefined,
      }}
    >
      <div className="grid gap-10" style={{ gridTemplateColumns: t.cols(4) > 1 ? '2fr 1fr 1fr' : '1fr' }}>
        <div>
          <div className="text-lg font-bold" style={{ fontFamily: t.headingFont, color: t.text }}>
            {business || 'Your Business'}
          </div>
          <p className="mt-3 max-w-sm text-sm leading-relaxed" style={{ color: t.muted }}>
            Website prototype generated with ClientFlow. Replace the placeholder copy with the client's real content.
          </p>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-widest" style={{ color: t.muted }}>
            Pages
          </div>
          <div className="mt-4 space-y-2.5 text-sm" style={{ color: t.muted }}>
            {pages.map((p) => (
              <div key={p.id}>{p.label}</div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-widest" style={{ color: t.muted }}>
            Get in touch
          </div>
          <div className="mt-4 space-y-2.5 text-sm" style={{ color: t.muted }}>
            <div>contact@example.com</div>
            <div>+91 00000 00000</div>
          </div>
        </div>
      </div>
      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t pt-6 text-xs" style={{ borderColor: t.isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0', color: t.muted }}>
        <span>© {year} {business || 'Your Business'}. All rights reserved.</span>
        <span>Prototype by ClientFlow</span>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* Main renderer                                                       */
/* ------------------------------------------------------------------ */

export interface PrototypeRendererProps {
  snapshot: PrototypeSnapshot;
  activePageId: string;
  viewport: ViewportMode;
  /** Allow in-prototype page navigation (client preview mode). */
  interactive?: boolean;
  onNavigate?: (pageId: string) => void;
  /** Workspace editing affordances. */
  editing?: boolean;
  selectedSectionId?: string | null;
  onSelectSection?: (sectionId: string) => void;
}

export default function PrototypeRenderer({
  snapshot,
  activePageId,
  viewport,
  interactive = false,
  onNavigate,
  editing = false,
  selectedSectionId,
  onSelectSection,
}: PrototypeRendererProps) {
  const { pages, design } = snapshot;
  const t = useDesignTokens(design, viewport);
  const business = snapshot.businessLabel || 'Your Business';
  const page = pages.find((p) => p.id === activePageId) ?? pages[0];
  const [internalPage, setInternalPage] = useState<string | null>(null);
  // When the parent switches the active page (e.g. workspace sidebar or preview
  // page chips), clear any in-prototype navigation so the prop wins.
  useEffect(() => {
    setInternalPage(null);
  }, [activePageId]);
  const currentPageId = internalPage ?? page?.id ?? '';
  const currentPage = pages.find((p) => p.id === currentPageId) ?? page;

  if (!page) return null;

  const width = VIEWPORT_WIDTHS[viewport];
  const glassBg = t.special === 'glass';
  const frameBg: CSSProperties = glassBg
    ? {
        backgroundImage: `linear-gradient(135deg, ${design.colors.bg} 0%, ${design.colors.surface} 45%, ${design.colors.accent}55 100%)`,
      }
    : { backgroundColor: design.colors.bg };

  return (
    <div
      style={{
        width,
        minHeight: '100%',
        color: design.colors.text,
        fontFamily: t.bodyFont,
        ...frameBg,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {glassBg && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 left-1/4 h-96 w-96 rounded-full" style={{ backgroundColor: `${design.colors.secondary}44`, filter: 'blur(90px)' }} />
          <div className="absolute right-10 top-40 h-80 w-80 rounded-full" style={{ backgroundColor: `${design.colors.accent}44`, filter: 'blur(90px)' }} />
          <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full" style={{ backgroundColor: `${design.colors.primary}33`, filter: 'blur(90px)' }} />
        </div>
      )}
      <div className="relative">
        <PrototypeNav
          t={t}
          pages={pages}
          activePageId={currentPage.id}
          business={business}
          onNavigate={(id) => {
            if (interactive) setInternalPage(id);
            onNavigate?.(id);
          }}
          interactive={interactive}
        />

        {currentPage?.sections.map((section) => {
          const selected = editing && selectedSectionId === section.id;
          return (
            <section
              key={section.id}
              className={cn(editing && 'proto-section', editing && selected && 'proto-section-selected')}
              onClick={editing && onSelectSection ? () => onSelectSection(section.id) : undefined}
              style={{ padding: `${t.padY}px ${t.padX}px`, position: 'relative' }}
            >
              {editing && selected && (
                <span
                  className="pointer-events-none absolute left-4 top-3 z-10 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                  style={{ backgroundColor: design.colors.primary }}
                >
                  {section.type}
                </span>
              )}
              <SectionBody t={t} section={section} ctx={{ pageLabel: currentPage?.label ?? '', business }} />
            </section>
          );
        })}

        <PrototypeFooter t={t} pages={pages} business={business} />
      </div>
    </div>
  );
}

function SectionBody({ t, section, ctx }: SectionProps) {
  switch (section.type) {
    case 'hero':
      return <HeroSection t={t} section={section} ctx={ctx} />;
    case 'features':
      return (
        <SectionLayout t={t} section={section}>
          <ItemGridSection t={t} section={section} ctx={ctx} kind="features" />
        </SectionLayout>
      );
    case 'services':
      return (
        <SectionLayout t={t} section={section}>
          <ItemGridSection t={t} section={section} ctx={ctx} kind="services" />
        </SectionLayout>
      );
    case 'products':
      return (
        <SectionLayout t={t} section={section}>
          <ItemGridSection t={t} section={section} ctx={ctx} kind="products" />
        </SectionLayout>
      );
    case 'testimonials':
      return (
        <SectionLayout t={t} section={section}>
          <TestimonialsSection t={t} section={section} ctx={ctx} />
        </SectionLayout>
      );
    case 'cta':
      return (
        <div className="flex justify-center" style={{ paddingTop: t.padY * 0.5, paddingBottom: t.padY * 0.5 }}>
          <div style={{ width: '100%' }}>
            <CtaSection t={t} section={section} ctx={ctx} />
          </div>
        </div>
      );
    case 'stats':
      return (
        <SectionLayout t={t} section={section}>
          <StatsSection t={t} section={section} ctx={ctx} />
        </SectionLayout>
      );
    case 'gallery':
      return (
        <SectionLayout t={t} section={section}>
          <ItemGridSection t={t} section={section} ctx={ctx} kind="gallery" />
        </SectionLayout>
      );
    case 'logos':
      return <LogosSection t={t} section={section} ctx={ctx} />;
    case 'contact':
      return (
        <SectionLayout t={t} section={section}>
          <ContactSection t={t} section={section} ctx={ctx} />
        </SectionLayout>
      );
    case 'faq':
      return (
        <SectionLayout t={t} section={section}>
          <FaqSection t={t} section={section} ctx={ctx} />
        </SectionLayout>
      );
    case 'team':
      return (
        <SectionLayout t={t} section={section}>
          <ItemGridSection t={t} section={section} ctx={ctx} kind="team" />
        </SectionLayout>
      );
    case 'pricing':
      return (
        <SectionLayout t={t} section={section}>
          <PricingSection t={t} section={section} ctx={ctx} />
        </SectionLayout>
      );
    case 'blog':
      return (
        <SectionLayout t={t} section={section}>
          <ItemGridSection t={t} section={section} ctx={ctx} kind="blog" />
        </SectionLayout>
      );
    case 'cards':
      return (
        <SectionLayout t={t} section={section}>
          <CardsSection t={t} section={section} ctx={ctx} />
        </SectionLayout>
      );
    case 'text':
      return (
        <SectionLayout t={t} section={section}>
          <TextSection t={t} section={section} ctx={ctx} />
        </SectionLayout>
      );
  }
}

function SectionLayout({ t, section, children }: { t: DesignTokens; section: PrototypeSection; children: ReactNode }) {
  return (
    <div>
      <SectionIntro t={t} title={section.title} subtitle={section.subtitle} center={section.align !== 'left'} />
      <div className="mt-10">{children}</div>
    </div>
  );
}
