import type { CSSProperties } from 'react';
import {
  ArrowRight,
  Globe,
  Layers,
  Play,
  Quote,
  Rocket,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { PALETTES } from '../../themes/palettes';

/* ------------------------------------------------------------------ */
/* Shared little building blocks (all sized for a 1280px design width) */
/* ------------------------------------------------------------------ */

function Img({ label, className = '', style }: { label: string; className?: string; style?: CSSProperties }) {
  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-2xl ${className}`}
      style={style}
    >
      <span className="text-sm font-semibold uppercase tracking-[0.2em] opacity-50">{label}</span>
    </div>
  );
}

function Stars() {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={16} fill="currentColor" strokeWidth={0} />
      ))}
    </div>
  );
}

function Avatar({ name, color }: { name: string; color: string }) {
  return (
    <div
      className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
      style={{ backgroundColor: color }}
    >
      {name.slice(0, 1)}
    </div>
  );
}

const NAV_LINKS = ['Work', 'Services', 'About', 'Contact'];

/* ------------------------------------------------------------------ */
/* 1. Modern Minimal — Nova Studio                                     */
/* ------------------------------------------------------------------ */

export function ModernMinimalSite() {
  const p = PALETTES['modern-minimal'];
  return (
    <div style={{ backgroundColor: p.bg, color: p.text, width: 1280 }}>
      {/* Nav */}
      <div className="flex items-center justify-between border-b border-slate-100 px-16 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ backgroundColor: p.primary }}>
            N
          </div>
          <span className="text-xl font-semibold tracking-tight">
            Nova<span className="text-slate-400"> Studio</span>
          </span>
        </div>
        <div className="flex items-center gap-10 text-[15px] font-medium text-slate-500">
          {NAV_LINKS.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
        <button className="rounded-full px-6 py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: p.primary }}>
          Get started
        </button>
      </div>

      {/* Hero */}
      <div className="px-16 pt-24 pb-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-sm font-medium text-slate-600">
            <Sparkles size={14} style={{ color: p.primary }} /> Design that sells
          </span>
          <h1 className="mt-6 text-[68px] font-semibold leading-[1.05] tracking-tight">
            We build websites that grow your business
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-xl leading-relaxed text-slate-500">
            Strategy, design and development under one roof — crafted for companies that take their
            brand seriously.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <button className="rounded-full px-8 py-4 text-base font-semibold text-white" style={{ backgroundColor: p.primary }}>
              Start a project
            </button>
            <button className="rounded-full border border-slate-200 bg-white px-8 py-4 text-base font-semibold text-slate-700">
              See our work
            </button>
          </div>
        </div>

        {/* Hero mock */}
        <div className="mx-auto mt-16 max-w-5xl rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-slate-200" />
            <span className="h-3 w-3 rounded-full bg-slate-200" />
            <span className="h-3 w-3 rounded-full bg-slate-200" />
            <span className="ml-4 h-6 w-64 rounded-md bg-white" />
          </div>
          <div className="grid grid-cols-3 gap-4 p-6">
            <div className="col-span-2 h-56 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500" />
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6">
              <span className="text-sm font-semibold text-slate-400">REVENUE</span>
              <div>
                <div className="text-4xl font-bold">+48%</div>
                <div className="mt-4 flex h-16 items-end gap-2">
                  <div className="w-5 rounded-sm bg-indigo-200" style={{ height: '30%' }} />
                  <div className="w-5 rounded-sm bg-indigo-300" style={{ height: '55%' }} />
                  <div className="w-5 rounded-sm bg-indigo-400" style={{ height: '40%' }} />
                  <div className="w-5 rounded-sm" style={{ height: '75%', backgroundColor: p.primary }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logo strip */}
      <div className="border-y border-slate-100 px-16 py-8">
        <div className="flex items-center justify-between text-lg font-semibold tracking-wide text-slate-300">
          <span>NORTHWIND</span>
          <span>Atlas&nbsp;Co</span>
          <span>BLUEPRINT</span>
          <span>harbor&nbsp;+</span>
          <span>LUMEN</span>
        </div>
      </div>

      {/* Features */}
      <div className="px-16 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-5xl font-semibold tracking-tight">Everything you need to launch</h2>
          <p className="mt-4 text-lg text-slate-500">
            A complete digital presence — designed around your goals, built to perform.
          </p>
        </div>
        <div className="mt-16 grid grid-cols-3 gap-8">
          {[
            { icon: <Rocket size={24} />, t: 'Conversion-first design', d: 'Every screen is engineered to move visitors toward a decision — enquiry, purchase or sign-up.' },
            { icon: <Zap size={24} />, t: 'Blazing performance', d: 'Sub-second loads with modern tooling, image optimisation and clean, lightweight code.' },
            { icon: <Shield size={24} />, t: 'Built to scale', d: 'Accessible, maintainable and secure foundations that grow as your business grows.' },
          ].map((f) => (
            <div key={f.t} className="rounded-3xl border border-slate-100 bg-slate-50 p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: p.primary }}>
                {f.icon}
              </div>
              <h3 className="mt-6 text-2xl font-semibold tracking-tight">{f.t}</h3>
              <p className="mt-3 text-base leading-relaxed text-slate-500">{f.d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Services / products */}
      <div className="bg-slate-50 px-16 py-24">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-sm font-semibold uppercase tracking-widest text-slate-400">What we do</span>
            <h2 className="mt-3 text-5xl font-semibold tracking-tight">Services</h2>
          </div>
          <span className="flex items-center gap-2 text-base font-semibold" style={{ color: p.primary }}>
            View all services <ArrowRight size={18} />
          </span>
        </div>
        <div className="mt-14 grid grid-cols-3 gap-8">
          {[
            { t: 'Brand & identity', d: 'Strategy, naming, visual identity and guidelines.' },
            { t: 'Web design & build', d: 'Marketing sites and web apps, designed and shipped.' },
            { t: 'Growth & SEO', d: 'Content, analytics and campaigns that compound.' },
          ].map((s) => (
            <div key={s.t} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <Img label="Case study" className="h-44 rounded-none bg-gradient-to-br from-slate-200 to-slate-300" />
              <div className="p-7">
                <h3 className="text-2xl font-semibold tracking-tight">{s.t}</h3>
                <p className="mt-2 text-base text-slate-500">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="px-16 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-5xl font-semibold tracking-tight">Loved by founders</h2>
        </div>
        <div className="mt-14 grid grid-cols-3 gap-8">
          {[
            { n: 'Sara Malik', r: 'Founder, Atlas Co', c: '#8B5CF6', q: 'Our enquiries tripled in two months. The team treated our business like their own.' },
            { n: 'Dev Patel', r: 'CEO, Northwind', c: '#0EA5E9', q: 'The most professional launch we have ever been part of. Flawless from kickoff to go-live.' },
            { n: 'Elena Cruz', r: 'CMO, Lumen', c: '#F59E0B', q: 'Beautiful, fast and measurable. Our conversion rate jumped 64% within a quarter.' },
          ].map((t) => (
            <div key={t.n} className="rounded-3xl border border-slate-100 p-8">
              <div style={{ color: p.accent }}>
                <Stars />
              </div>
              <p className="mt-5 text-lg leading-relaxed text-slate-600">“{t.q}”</p>
              <div className="mt-6 flex items-center gap-3">
                <Avatar name={t.n} color={t.c} />
                <div>
                  <div className="text-sm font-semibold">{t.n}</div>
                  <div className="text-sm text-slate-400">{t.r}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-16 pb-24">
        <div className="flex items-center justify-between rounded-[2.5rem] px-16 py-14 text-white" style={{ backgroundColor: p.primary }}>
          <div>
            <h2 className="text-4xl font-semibold tracking-tight">Ready to build something great?</h2>
            <p className="mt-2 text-lg text-indigo-100">Book a free strategy call with our team.</p>
          </div>
          <button className="rounded-full bg-white px-8 py-4 text-base font-semibold text-slate-900">
            Book a call
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 px-16 py-14">
        <div className="grid grid-cols-4 gap-10">
          <div className="col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ backgroundColor: p.primary }}>
                N
              </div>
              <span className="text-lg font-semibold">Nova Studio</span>
            </div>
            <p className="mt-4 max-w-sm text-base text-slate-500">
              A design and development studio helping ambitious brands launch and grow online.
            </p>
          </div>
          {[
            ['Company', ['About', 'Careers', 'Contact']],
            ['Services', ['Design', 'Development', 'SEO']],
            ['Resources', ['Blog', 'Case studies', 'Playbook']],
          ].map(([head, items]) => (
            <div key={head as string}>
              <div className="text-sm font-semibold text-slate-900">{head}</div>
              <div className="mt-4 space-y-3 text-base text-slate-500">
                {(items as string[]).map((i) => (
                  <div key={i}>{i}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 flex items-center justify-between border-t border-slate-100 pt-6 text-sm text-slate-400">
          <span>© 2026 Nova Studio. All rights reserved.</span>
          <div className="flex gap-6">
            <span>Twitter</span>
            <span>LinkedIn</span>
            <span>Instagram</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Bento SaaS — Flowbase                                            */
/* ------------------------------------------------------------------ */

export function BentoSaasSite() {
  const p = PALETTES['bento-saas'];
  return (
    <div style={{ backgroundColor: p.bg, color: p.text, width: 1280 }}>
      {/* Nav */}
      <div className="flex items-center justify-between bg-white/80 px-16 py-5 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 text-sm font-bold text-white">
            F
          </div>
          <span className="text-xl font-bold tracking-tight">Flowbase</span>
        </div>
        <div className="flex items-center gap-8 text-[15px] font-medium text-slate-600">
          {['Product', 'Pricing', 'Customers', 'Docs'].map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[15px] font-semibold text-slate-600">Sign in</span>
          <button className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25">
            Start free
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="px-16 pt-20 pb-16">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-700">
            <Zap size={14} /> New: AI-powered automations
          </span>
          <h1 className="mt-6 text-[64px] font-bold leading-[1.05] tracking-tight">
            The workspace your team <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">actually enjoys</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-xl text-slate-500">
            Plan, build and ship together with a platform that turns chaos into clear, trackable
            workflows.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <button className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-600/25">
              Get started free
            </button>
            <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-8 py-4 text-base font-semibold text-slate-700">
              <Play size={16} fill="currentColor" /> Watch demo
            </button>
          </div>
          <p className="mt-5 text-sm text-slate-400">Free forever plan · No credit card required</p>
        </div>

        {/* Bento mock */}
        <div className="mx-auto mt-16 grid max-w-6xl grid-cols-3 gap-4">
          <div className="col-span-2 row-span-2 flex flex-col justify-between rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-8 text-white shadow-xl shadow-blue-600/20">
            <div className="flex items-center justify-between text-sm font-medium text-blue-100">
              <span>Monthly revenue</span>
              <span className="rounded-full bg-white/20 px-3 py-1">+38.2%</span>
            </div>
            <div className="text-5xl font-bold">₹4.2L</div>
            <div className="flex h-24 items-end gap-3">
              {[35, 55, 42, 70, 52, 88, 64, 100].map((h, i) => (
                <div key={i} className="flex-1 rounded-t-lg bg-white/30" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex -space-x-2">
              <Avatar name="A" color="#6366F1" />
              <Avatar name="B" color="#0EA5E9" />
              <Avatar name="C" color="#F59E0B" />
              <Avatar name="D" color="#10B981" />
            </div>
            <div className="mt-4 text-3xl font-bold">1,248</div>
            <div className="text-sm text-slate-400">active members</div>
            <div className="mt-4 h-2 w-full rounded-full bg-slate-100">
              <div className="h-2 w-3/4 rounded-full bg-gradient-to-r from-blue-500 to-violet-500" />
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-400">Tasks completed</div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-bold">96%</span>
              <TrendingUp size={18} className="text-emerald-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Logo strip */}
      <div className="border-y border-slate-200 bg-white px-16 py-8">
        <div className="flex items-center justify-between text-base font-bold tracking-wide text-slate-300">
          <span>acme</span>
          <span>VERTEX</span>
          <span>polar</span>
          <span>NIMBUS</span>
          <span>beacon</span>
        </div>
      </div>

      {/* Features — bento grid */}
      <div className="px-16 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-widest text-blue-600">Features</span>
          <h2 className="mt-3 text-5xl font-bold tracking-tight">One platform, every workflow</h2>
        </div>
        <div className="mt-14 grid grid-cols-2 gap-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Layers size={24} />
            </div>
            <h3 className="mt-6 text-2xl font-bold tracking-tight">Flexible boards & views</h3>
            <p className="mt-3 text-lg text-slate-500">
              Kanban, list, calendar or timeline — switch views without losing context, with
              automations that keep everything in sync.
            </p>
          </div>
          <div className="rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-600 p-10 text-white shadow-xl shadow-violet-600/20">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
              <Shield size={24} />
            </div>
            <h3 className="mt-6 text-2xl font-bold tracking-tight">Enterprise-grade security</h3>
            <p className="mt-3 text-lg text-violet-100">
              SSO, granular permissions, audit logs and SOC 2 compliance baked into every plan.
            </p>
          </div>
          <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-500 p-10 text-white shadow-xl shadow-blue-600/20">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
              <Globe size={24} />
            </div>
            <h3 className="mt-6 text-2xl font-bold tracking-tight">Built for global teams</h3>
            <p className="mt-3 text-lg text-blue-100">
              Realtime collaboration across 12 languages with offline support and instant sync.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
              <Rocket size={24} />
            </div>
            <h3 className="mt-6 text-2xl font-bold tracking-tight">Automate the busywork</h3>
            <p className="mt-3 text-lg text-slate-500">
              Trigger-based workflows for approvals, reminders and reporting — no code required.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="border-y border-slate-200 bg-white px-16 py-14">
        <div className="grid grid-cols-4 gap-8 text-center">
          {[
            ['12,000+', 'teams onboard'],
            ['4.9/5', 'average rating'],
            ['99.99%', 'uptime SLA'],
            ['150+', 'integrations'],
          ].map(([n, l]) => (
            <div key={l}>
              <div className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-5xl font-bold text-transparent">
                {n}
              </div>
              <div className="mt-2 text-base text-slate-400">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="px-16 py-24">
        <div className="grid grid-cols-2 gap-6">
          {[
            { n: 'Ritika Jain', r: 'VP Product, Vertex', q: 'We replaced four tools with Flowbase. Our release cycle went from two weeks to four days.', c: '#6366F1' },
            { n: 'Tom Becker', r: 'COO, Nimbus', q: 'The automations alone save my team about 18 hours a week. It paid for itself in a month.', c: '#0EA5E9' },
          ].map((t) => (
            <div key={t.n} className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
              <Quote size={28} className="text-blue-500" fill="currentColor" strokeWidth={0} />
              <p className="mt-5 text-2xl font-medium leading-snug text-slate-800">“{t.q}”</p>
              <div className="mt-6 flex items-center gap-3">
                <Avatar name={t.n} color={t.c} />
                <div>
                  <div className="text-base font-bold">{t.n}</div>
                  <div className="text-sm text-slate-400">{t.r}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-16 pb-24">
        <div className="rounded-[2.5rem] bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-16 py-16 text-center text-white shadow-xl shadow-blue-600/20">
          <h2 className="text-5xl font-bold tracking-tight">Start shipping faster today</h2>
          <p className="mx-auto mt-4 max-w-lg text-xl text-blue-100">
            Join 12,000+ teams running their work on Flowbase. Free forever for small teams.
          </p>
          <button className="mt-10 rounded-xl bg-white px-10 py-4 text-base font-bold text-blue-700 shadow-lg">
            Create free account
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-950 px-16 py-14 text-slate-300">
        <div className="grid grid-cols-4 gap-10">
          <div className="col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 text-sm font-bold text-white">
                F
              </div>
              <span className="text-lg font-bold text-white">Flowbase</span>
            </div>
            <p className="mt-4 max-w-sm text-base text-slate-400">
              The workspace your team actually enjoys. Plan, build and launch together.
            </p>
          </div>
          {[
            ['Product', ['Features', 'Pricing', 'Integrations', 'Changelog']],
            ['Company', ['About', 'Careers', 'Blog', 'Press']],
          ].map(([head, items]) => (
            <div key={head as string}>
              <div className="text-sm font-semibold text-white">{head}</div>
              <div className="mt-4 space-y-3 text-base text-slate-400">
                {(items as string[]).map((i) => (
                  <div key={i}>{i}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-slate-800 pt-6 text-sm text-slate-500">
          © 2026 Flowbase, Inc.
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Dark Premium — Vantage                                           */
/* ------------------------------------------------------------------ */

export function DarkPremiumSite() {
  const p = PALETTES['dark-premium'];
  return (
    <div style={{ backgroundColor: p.bg, color: p.text, width: 1280 }}>
      {/* Nav */}
      <div className="flex items-center justify-between px-16 py-7">
        <div className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.primary, boxShadow: `0 0 16px 2px ${p.primary}` }} />
          <span className="text-xl font-bold uppercase tracking-[0.3em]">Vantage</span>
        </div>
        <div className="flex items-center gap-10 text-[15px] font-medium text-zinc-400">
          {['Product', 'Solutions', 'Company', 'Docs'].map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
        <button
          className="rounded-full border px-6 py-2.5 text-sm font-semibold transition-colors"
          style={{ borderColor: 'rgba(167,139,250,0.4)', color: p.primary }}
        >
          Get early access
        </button>
      </div>

      {/* Hero */}
      <div className="px-16 pt-20 pb-24">
        <div className="mx-auto max-w-4xl text-center">
          <span className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500">
            Product intelligence for modern teams
          </span>
          <h1 className="mt-8 text-[84px] font-extrabold leading-[0.95] tracking-tight">
            Decisions made{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(90deg, ${p.primary}, ${p.secondary})` }}
            >
              brilliantly
            </span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-xl leading-relaxed text-zinc-400">
            Vantage unifies product, engineering and go-to-market data into one command center —
            so your team decides with confidence, not guesswork.
          </p>
          <div className="mt-12 flex items-center justify-center gap-4">
            <button className="rounded-full bg-white px-9 py-4 text-base font-bold text-black">
              Start free trial
            </button>
            <button className="rounded-full border border-zinc-700 px-9 py-4 text-base font-semibold text-zinc-200">
              Talk to sales
            </button>
          </div>
        </div>

        {/* Product mock */}
        <div className="relative mx-auto mt-20 max-w-5xl overflow-hidden rounded-2xl border border-zinc-800" style={{ backgroundColor: p.surface }}>
          <div className="flex items-center gap-2 border-b border-zinc-800 px-5 py-4">
            <span className="h-3 w-3 rounded-full bg-red-500/70" />
            <span className="h-3 w-3 rounded-full bg-amber-500/70" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/70" />
            <span className="ml-4 text-sm text-zinc-500">app.vantage.io/dashboard</span>
          </div>
          <div className="grid grid-cols-5 gap-px" style={{ backgroundColor: '#1F1F27' }}>
            <div className="col-span-1 p-6">
              {['Overview', 'Analytics', 'Revenue', 'Team', 'Settings'].map((m, i) => (
                <div
                  key={m}
                  className="mb-3 rounded-lg px-4 py-2.5 text-sm font-medium"
                  style={{
                    backgroundColor: i === 0 ? 'rgba(167,139,250,0.12)' : 'transparent',
                    color: i === 0 ? p.primary : '#71717A',
                  }}
                >
                  {m}
                </div>
              ))}
            </div>
            <div className="col-span-4 p-8" style={{ backgroundColor: p.surface }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl font-bold">₹8.6L</div>
                  <div className="mt-1 text-sm text-zinc-500">Net revenue · this quarter</div>
                </div>
                <div className="flex gap-2">
                  <span className="rounded-full bg-emerald-500/10 px-4 py-1.5 text-sm font-semibold text-emerald-400">+22.4%</span>
                </div>
              </div>
              <div className="mt-8 flex h-44 items-end gap-3">
                {[40, 55, 48, 72, 60, 85, 78, 95, 70, 88, 100, 92].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-md"
                    style={{
                      background: `linear-gradient(180deg, ${p.primary}, ${p.secondary})`,
                      height: `${h}%`,
                      opacity: 0.45 + (i / 12) * 0.55,
                      boxShadow: i === 10 ? `0 0 24px 2px ${p.primary}` : 'none',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="border-t border-zinc-800/70 px-16 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-5xl font-bold tracking-tight">Built for clarity</h2>
          <p className="mt-4 text-lg text-zinc-400">
            Three pillars power every decision inside Vantage.
          </p>
        </div>
        <div className="mt-16 grid grid-cols-3 gap-6">
          {[
            { icon: <Zap size={26} />, t: 'Realtime signals', d: 'Live dashboards stream every metric that matters — no stale exports, ever.' },
            { icon: <Layers size={26} />, t: 'Unified context', d: 'Product, revenue and support data joined into one searchable timeline.' },
            { icon: <Shield size={26} />, t: 'Trusted by default', d: 'SOC 2 Type II, SSO and role-based access on every seat, out of the box.' },
          ].map((f) => (
            <div
              key={f.t}
              className="group rounded-2xl border border-zinc-800 p-9 transition-all hover:-translate-y-1"
              style={{ backgroundColor: p.surface }}
            >
              <div
                className="flex h-14 w-14 items-center justify-center rounded-xl"
                style={{ backgroundColor: 'rgba(167,139,250,0.12)', color: p.primary }}
              >
                {f.icon}
              </div>
              <h3 className="mt-7 text-2xl font-bold">{f.t}</h3>
              <p className="mt-3 text-base leading-relaxed text-zinc-400">{f.d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="border-y border-zinc-800/70 px-16 py-16">
        <div className="grid grid-cols-4 gap-8">
          {[
            ['98%', 'faster reporting'],
            ['3.2x', 'ROI in year one'],
            ['40k+', 'metrics tracked daily'],
            ['24/7', 'global monitoring'],
          ].map(([n, l]) => (
            <div key={l} className="text-center">
              <div
                className="text-6xl font-extrabold tracking-tight"
                style={{ backgroundImage: `linear-gradient(90deg, ${p.primary}, ${p.secondary})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
              >
                {n}
              </div>
              <div className="mt-2 text-base text-zinc-500">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="px-16 py-24">
        <div className="grid grid-cols-2 gap-8">
          {[
            { n: 'Maya Chen', r: 'VP Engineering, Polar', q: 'Vantage replaced a stack of dashboards and a weekly reporting ritual. It is the first tool my team actually enjoys opening.', c: '#22D3EE' },
            { n: 'Omar Farouk', r: 'CEO, Beacon', q: 'We closed our last round faster because every investor call started from a single, always-current source of truth.', c: '#F472B6' },
          ].map((t) => (
            <div key={t.n} className="rounded-2xl border border-zinc-800 p-10" style={{ backgroundColor: p.surface }}>
              <Quote size={30} style={{ color: p.primary }} fill="currentColor" strokeWidth={0} />
              <p className="mt-6 text-2xl font-medium leading-snug">“{t.q}”</p>
              <div className="mt-8 flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-black" style={{ backgroundColor: t.c }}>
                  {t.n.slice(0, 1)}
                </div>
                <div>
                  <div className="text-base font-semibold">{t.n}</div>
                  <div className="text-sm text-zinc-500">{t.r}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-16 pb-24">
        <div className="rounded-3xl border border-zinc-800 px-16 py-20 text-center" style={{ backgroundColor: p.surface }}>
          <h2 className="mx-auto max-w-2xl text-5xl font-extrabold tracking-tight">
            See what clarity looks like
          </h2>
          <p className="mx-auto mt-4 max-w-md text-lg text-zinc-400">
            Join the waitlist for early access — the first 500 teams ship free for a year.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3">
            <input
              readOnly
              placeholder="you@company.com"
              className="w-80 rounded-full border border-zinc-700 bg-transparent px-6 py-4 text-base text-zinc-200 outline-none placeholder:text-zinc-600"
            />
            <button
              className="rounded-full px-8 py-4 text-base font-bold text-black"
              style={{ backgroundColor: p.primary }}
            >
              Join waitlist
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-800/70 px-16 py-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.primary }} />
            <span className="text-base font-bold uppercase tracking-[0.3em]">Vantage</span>
          </div>
          <div className="flex items-center gap-10 text-sm text-zinc-500">
            <span>Privacy</span>
            <span>Security</span>
            <span>Terms</span>
            <span>Status</span>
          </div>
        </div>
        <div className="mt-8 text-sm text-zinc-600">© 2026 Vantage Labs, Inc.</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Aurora Glass — Lumina                                            */
/* ------------------------------------------------------------------ */

export function AuroraGlassSite() {
  return (
    <div
      style={{
        width: 1280,
        position: 'relative',
        color: '#FFFFFF',
        backgroundImage: 'linear-gradient(135deg, #312E81 0%, #6D28D9 45%, #BE185D 100%)',
      }}
    >
      {/* Blurred aurora blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-pink-400/40 blur-3xl" />
        <div className="absolute top-40 right-10 h-80 w-80 rounded-full bg-blue-400/40 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-violet-400/30 blur-3xl" />
      </div>

      <div className="relative">
        {/* Nav */}
        <div className="flex items-center justify-between px-16 py-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/30 bg-white/15 text-lg backdrop-blur-md">
              ✦
            </div>
            <span className="text-xl font-semibold tracking-tight">Lumina</span>
          </div>
          <div className="flex items-center gap-8 text-[15px] font-medium text-white/80">
            {['Features', 'Pricing', 'About', 'Contact'].map((l) => (
              <span key={l}>{l}</span>
            ))}
          </div>
          <button className="rounded-full border border-white/30 bg-white/15 px-6 py-2.5 text-sm font-semibold backdrop-blur-md transition-colors hover:bg-white/25">
            Get Lumina
          </button>
        </div>

        {/* Hero */}
        <div className="px-16 pt-24 pb-20 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-2 text-sm font-medium backdrop-blur-md">
            <Sparkles size={15} className="text-pink-200" /> The future of creative work
          </span>
          <h1 className="mx-auto mt-8 max-w-4xl text-[72px] font-bold leading-[1.03] tracking-tight">
            Create without <span className="bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">limits</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-xl leading-relaxed text-white/75">
            A luminous creative platform where ideas flow freely — design, collaborate and publish
            from one beautiful canvas.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <button className="rounded-full bg-white px-9 py-4 text-base font-bold text-indigo-900 shadow-xl shadow-indigo-900/30">
              Start creating free
            </button>
            <button className="flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-9 py-4 text-base font-semibold backdrop-blur-md">
              <Play size={16} fill="currentColor" /> Watch film
            </button>
          </div>
        </div>

        {/* Hero mock — glass app window */}
        <div className="mx-auto max-w-5xl px-4 pb-24">
          <div className="rounded-3xl border border-white/25 bg-white/10 p-4 shadow-2xl shadow-indigo-950/50 backdrop-blur-xl">
            <div className="flex items-center gap-2 border-b border-white/15 px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-white/30" />
              <span className="h-3 w-3 rounded-full bg-white/30" />
              <span className="h-3 w-3 rounded-full bg-white/30" />
            </div>
            <div className="grid grid-cols-3 gap-4 p-6">
              <div className="col-span-2 h-60 rounded-2xl bg-gradient-to-br from-blue-400/60 to-purple-400/50" />
              <div className="flex flex-col gap-4">
                <div className="flex-1 rounded-2xl border border-white/20 bg-white/10 p-5">
                  <div className="text-sm font-medium text-white/70">Projects</div>
                  <div className="mt-2 text-4xl font-bold">128</div>
                </div>
                <div className="flex-1 rounded-2xl border border-white/20 bg-white/10 p-5">
                  <div className="text-sm font-medium text-white/70">Team</div>
                  <div className="mt-2 text-4xl font-bold">32</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="px-16 pb-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-5xl font-bold tracking-tight">Beautifully simple, impossibly powerful</h2>
            <p className="mt-4 text-lg text-white/70">
              Every tool your studio needs, wrapped in a serene, distraction-free surface.
            </p>
          </div>
          <div className="mt-14 grid grid-cols-3 gap-6">
            {[
              { icon: <Zap size={24} />, t: 'Realtime canvas', d: 'Multiplayer editing with instant sync across every device.' },
              { icon: <Globe size={24} />, t: 'Publish anywhere', d: 'One click to a live site, a share link or an embedded widget.' },
              { icon: <Sparkles size={24} />, t: 'AI assistance', d: 'Ideation, copy and layout suggestions that feel like magic.' },
            ].map((f) => (
              <div key={f.t} className="rounded-3xl border border-white/20 bg-white/10 p-9 backdrop-blur-xl transition-colors hover:bg-white/15">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white">
                  {f.icon}
                </div>
                <h3 className="mt-6 text-2xl font-semibold">{f.t}</h3>
                <p className="mt-3 text-base leading-relaxed text-white/70">{f.d}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Products */}
        <div className="px-16 pb-24">
          <div className="grid grid-cols-3 gap-6">
            {[
              { t: 'Brand kit', d: 'Logos, type and colour systems that stay consistent.' },
              { t: 'Motion studio', d: 'Animations that bring interfaces to life.' },
              { t: 'Site builder', d: 'Launch marketing sites straight from your canvas.' },
            ].map((s) => (
              <div key={s.t} className="overflow-hidden rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl">
                <div className="h-44 bg-gradient-to-br from-blue-400/50 to-pink-400/40" />
                <div className="p-7">
                  <h3 className="text-2xl font-semibold">{s.t}</h3>
                  <p className="mt-2 text-base text-white/70">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="px-16 pb-24">
          <div className="grid grid-cols-2 gap-6">
            {[
              { n: 'Zara Khan', r: 'Creative Director, Prism', q: 'Lumina feels like the first tool built for how creatives actually think. Our team shipped 3x faster.', c: '#F472B6' },
              { n: 'Leo Martins', r: 'Founder, Atlas', q: 'The glass UI is gorgeous, but the real magic is how frictionless the whole flow feels.', c: '#22D3EE' },
            ].map((t) => (
              <div key={t.n} className="rounded-3xl border border-white/20 bg-white/10 p-10 backdrop-blur-xl">
                <Quote size={28} className="text-white/70" fill="currentColor" strokeWidth={0} />
                <p className="mt-5 text-xl font-medium leading-snug">“{t.q}”</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-indigo-900" style={{ backgroundColor: t.c }}>
                    {t.n.slice(0, 1)}
                  </div>
                  <div>
                    <div className="text-base font-semibold">{t.n}</div>
                    <div className="text-sm text-white/60">{t.r}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="px-16 pb-24">
          <div className="rounded-[2.5rem] border border-white/25 bg-white/10 px-16 py-16 text-center backdrop-blur-xl">
            <h2 className="text-5xl font-bold tracking-tight">Ready to glow?</h2>
            <p className="mx-auto mt-4 max-w-md text-lg text-white/70">
              Join 40,000+ creators making beautiful work with Lumina.
            </p>
            <button className="mt-10 rounded-full bg-white px-10 py-4 text-base font-bold text-indigo-900 shadow-xl shadow-indigo-950/40">
              Get started — it’s free
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/15 px-16 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/30 bg-white/15 text-sm backdrop-blur-md">
                ✦
              </div>
              <span className="text-base font-semibold">Lumina</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-white/60">
              <span>Privacy</span>
              <span>Terms</span>
              <span>Twitter</span>
              <span>Instagram</span>
            </div>
          </div>
          <div className="mt-8 text-sm text-white/40">© 2026 Lumina Creative, Inc.</div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5. Neo Brutalist — RAW Creative                                     */
/* ------------------------------------------------------------------ */

export function NeoBrutalistSite() {
  const p = PALETTES['neo-brutalist'];
  return (
    <div style={{ backgroundColor: p.bg, color: p.text, width: 1280 }}>
      {/* Nav */}
      <div className="flex items-center justify-between border-b-4 border-black px-16 py-6">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center border-[3px] border-black bg-yellow-300 text-lg font-black">
            RAW
          </div>
          <span className="text-2xl font-black uppercase tracking-tight">Raw Creative®</span>
        </div>
        <div className="flex items-center gap-8 text-base font-bold uppercase">
          {['Work', 'Services', 'About', 'Contact'].map((l) => (
            <span key={l} className="border-b-2 border-transparent hover:border-black">
              {l}
            </span>
          ))}
        </div>
        <button className="border-[3px] border-black bg-yellow-300 px-6 py-3 text-base font-black uppercase shadow-[5px_5px_0_0_#000] transition-transform hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-[3px_3px_0_0_#000]">
          Start a project
        </button>
      </div>

      {/* Marquee */}
      <div className="overflow-hidden border-b-4 border-black bg-black py-3">
        <div className="flex gap-10 whitespace-nowrap text-lg font-black uppercase tracking-widest text-white">
          <span>Branding</span><span>✦</span><span>Web Design</span><span>✦</span><span>Motion</span>
          <span>✦</span><span>Strategy</span><span>✦</span><span>Illustration</span><span>✦</span>
          <span>Branding</span><span>✦</span><span>Web Design</span><span>✦</span><span>Motion</span>
        </div>
      </div>

      {/* Hero */}
      <div className="relative px-16 pt-20 pb-24">
        <div className="max-w-5xl">
          <h1 className="text-[92px] font-black uppercase leading-[0.92] tracking-tight">
            Loud ideas.
            <br />
            <span className="text-white" style={{ WebkitTextStroke: '3px #000' }}>Bold work.</span>
          </h1>
          <p className="mt-8 max-w-xl text-xl font-medium leading-relaxed">
            We are a creative studio for brands that refuse to be ignored. Strategy, design and
            code with zero boring.
          </p>
        </div>
        <div className="mt-10 flex items-center gap-6">
          <button className="border-[3px] border-black px-9 py-4 text-lg font-black uppercase shadow-[6px_6px_0_0_#000] transition-transform hover:translate-x-1 hover:translate-y-1 hover:shadow-none" style={{ backgroundColor: p.primary, color: '#fff' }}>
            See the work
          </button>
          <button className="border-[3px] border-black bg-white px-9 py-4 text-lg font-black uppercase shadow-[6px_6px_0_0_#000] transition-transform hover:translate-x-1 hover:translate-y-1 hover:shadow-none">
            Get in touch
          </button>
        </div>
        <div className="absolute right-16 top-16 rotate-6 border-[3px] border-black bg-yellow-300 px-5 py-3 text-lg font-black uppercase shadow-[6px_6px_0_0_#000]">
          Est. 2016
        </div>
      </div>

      {/* Work grid */}
      <div className="px-16 pb-24">
        <div className="grid grid-cols-3 gap-8">
          {[
            { n: '01', t: 'Fuego Pizza', c: '#FF4D00' },
            { n: '02', t: 'Bolt Fitness', c: '#0047FF' },
            { n: '03', t: 'Retro Vinyl', c: '#D4FF3F' },
          ].map((w) => (
            <div key={w.n} className="border-4 border-black bg-white shadow-[8px_8px_0_0_#000]">
              <div className="flex items-center justify-between border-b-4 border-black px-5 py-3" style={{ backgroundColor: w.c }}>
                <span className="text-lg font-black text-white">{w.n}</span>
                <span className="text-sm font-black uppercase text-white">Case study ↗</span>
              </div>
              <div className="flex h-52 items-center justify-center" style={{ backgroundColor: w.c }}>
                <span className="text-6xl font-black text-white/40">{w.t.slice(0, 1)}</span>
              </div>
              <div className="p-6">
                <div className="text-2xl font-black uppercase">{w.t}</div>
                <div className="mt-1 text-sm font-bold uppercase text-neutral-500">Branding + Web</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Services */}
      <div className="border-y-4 border-black bg-white px-16 py-20">
        <div className="flex items-center justify-between">
          <h2 className="text-6xl font-black uppercase">Services</h2>
          <span className="text-lg font-black uppercase">All services ↗</span>
        </div>
        <div className="mt-12 grid grid-cols-3 gap-8">
          {[
            { t: 'Brand identity', d: 'Names, logos, voice and full identity systems that stick.' },
            { t: 'Web & product', d: 'Fast, expressive sites and products built to convert.' },
            { t: 'Motion & 3D', d: 'Animation, CGI and interactive pieces that stop the scroll.' },
          ].map((s) => (
            <div key={s.t} className="border-[3px] border-black p-7 shadow-[6px_6px_0_0_#000]">
              <div className="h-3 w-16" style={{ backgroundColor: p.primary }} />
              <h3 className="mt-5 text-3xl font-black uppercase">{s.t}</h3>
              <p className="mt-3 text-base font-medium">{s.d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="px-16 py-24">
        <div className="border-4 border-black bg-black p-12 text-white shadow-[10px_10px_0_0_#FFDE00]">
          <div className="text-7xl font-black leading-none" style={{ color: p.primary }}>
            “
          </div>
          <p className="mt-2 max-w-4xl text-4xl font-black uppercase leading-tight">
            They made us the loudest brand in our category. Sales went up 210%. Period.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-300 text-lg font-black text-black">
              K
            </div>
            <div>
              <div className="text-lg font-black uppercase">Kara Wells</div>
              <div className="text-sm font-bold uppercase text-zinc-400">Founder, Fuego Pizza</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-16 pb-24">
        <div className="border-4 border-black bg-yellow-300 px-16 py-20 text-center shadow-[10px_10px_0_0_#000]">
          <h2 className="text-7xl font-black uppercase leading-none">
            Got a project
            <br />
            that’s too loud for others?
          </h2>
          <button className="mt-12 border-[3px] border-black px-12 py-5 text-xl font-black uppercase text-white shadow-[6px_6px_0_0_#000] transition-transform hover:translate-x-1 hover:translate-y-1 hover:shadow-none" style={{ backgroundColor: p.primary }}>
            Talk to us →
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-4 border-black bg-black px-16 py-14 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center border-2 border-white bg-yellow-300 text-sm font-black text-black">
              RAW
            </div>
            <span className="text-lg font-black uppercase">Raw Creative®</span>
          </div>
          <div className="flex items-center gap-8 text-sm font-bold uppercase">
            <span>Instagram</span>
            <span>Behance</span>
            <span>LinkedIn</span>
          </div>
        </div>
        <div className="mt-10 border-t-2 border-zinc-700 pt-6 text-sm font-bold uppercase text-zinc-500">
          © 2026 Raw Creative Studio — Made loud, on purpose.
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 6. Editorial — Marlowe                                              */
/* ------------------------------------------------------------------ */

export function EditorialSite() {
  const p = PALETTES['editorial'];
  return (
    <div style={{ backgroundColor: p.bg, color: p.text, width: 1280, fontFamily: `Georgia, 'Times New Roman', serif` }}>
      {/* Nav */}
      <div className="flex items-center justify-between border-b border-stone-300 px-16 py-7">
        <div className="text-2xl font-semibold tracking-wide">
          Marlowe<span style={{ color: p.primary }}>.</span>
        </div>
        <div className="flex items-center gap-10 text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">
          {['Collections', 'Journal', 'Ateliers', 'Contact'].map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
        <button className="text-xs font-bold uppercase tracking-[0.25em] underline decoration-2 underline-offset-4" style={{ textDecorationColor: p.primary }}>
          Book an appointment
        </button>
      </div>

      {/* Hero — split editorial layout */}
      <div className="grid grid-cols-2 px-16 pt-16 pb-20">
        <div className="pr-14">
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">
            The Autumn Collection — Nº 12
          </div>
          <h1 className="mt-6 text-[76px] font-medium leading-[1.02] tracking-tight">
            Objects for a <em style={{ color: p.primary }}>considered</em> life
          </h1>
          <p className="mt-8 max-w-md text-xl leading-relaxed text-stone-500">
            Hand-finished furniture and home goods, designed in our Florence atelier and crafted
            by master makers.
          </p>
          <div className="mt-10 flex items-center gap-8">
            <button className="border border-stone-900 px-10 py-4 text-sm font-bold uppercase tracking-[0.2em] transition-colors hover:bg-stone-900 hover:text-white">
              Explore the collection
            </button>
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
              Film → Nº 04
            </span>
          </div>
          <div className="mt-14 flex items-center gap-8 border-t border-stone-300 pt-6 text-sm text-stone-500">
            <span>Free worldwide delivery</span>
            <span>·</span>
            <span>Lifetime restoration</span>
          </div>
        </div>
        <div className="relative">
          <div className="h-[560px] w-full bg-gradient-to-br from-stone-300 via-stone-200 to-amber-100" />
          <div className="absolute bottom-6 left-6 border border-stone-200 bg-white/90 px-5 py-3 text-sm">
            <div className="font-semibold">The Marlowe Chair</div>
            <div className="text-stone-400">Oak &amp; bouclé — ₹48,000</div>
          </div>
        </div>
      </div>

      {/* Editorial numbered features */}
      <div className="border-y border-stone-300 bg-white px-16 py-20">
        <div className="grid grid-cols-3 gap-14">
          {[
            { n: '01', t: 'Material stories', d: 'Every piece begins with a single material — oak, marble, brass — documented from quarry to showroom.' },
            { n: '02', t: 'Made by makers', d: 'We work with 24 ateliers across Europe, paying fairly for work that lasts generations.' },
            { n: '03', t: 'The long view', d: 'Designs are never discontinued — we repair, restore and reupholster for life.' },
          ].map((f) => (
            <div key={f.n} className="border-t border-stone-300 pt-6">
              <div className="text-4xl font-light" style={{ color: p.primary }}>
                {f.n}
              </div>
              <h3 className="mt-4 text-2xl font-medium">{f.t}</h3>
              <p className="mt-3 text-base leading-relaxed text-stone-500">{f.d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Products */}
      <div className="px-16 py-24">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">From the atelier</div>
            <h2 className="mt-4 text-5xl font-medium tracking-tight">Selected pieces</h2>
          </div>
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
            View all objects →
          </span>
        </div>
        <div className="mt-14 grid grid-cols-3 gap-10">
          {[
            { t: 'Sienna Sideboard', d: 'Walnut & travertine', i: 'from-amber-100 to-stone-300' },
            { t: 'Largo Table', d: 'Solid oak, 220cm', i: 'from-stone-200 to-stone-300' },
            { t: 'Aria Lamp', d: 'Brass & linen', i: 'from-yellow-100 to-amber-200' },
          ].map((s) => (
            <div key={s.t}>
              <div className={`h-72 bg-gradient-to-br ${s.i}`} />
              <div className="mt-5 flex items-baseline justify-between border-b border-stone-300 pb-3">
                <span className="text-xl font-medium">{s.t}</span>
                <span className="text-sm text-stone-400">from ₹32,000</span>
              </div>
              <div className="mt-3 text-sm text-stone-500">{s.d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pull quote */}
      <div className="border-y border-stone-300 px-16 py-24 text-center">
        <Quote size={40} style={{ color: p.primary }} fill="currentColor" strokeWidth={0} className="mx-auto" />
        <p className="mx-auto mt-8 max-w-3xl text-5xl font-medium leading-tight">
          “We don’t follow trends. We make the furniture that{' '}
          <em style={{ color: p.primary }}>outlives them</em>.”
        </p>
        <div className="mt-8 text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">
          Elena Marlowe — Founder
        </div>
      </div>

      {/* Testimonial */}
      <div className="px-16 py-24">
        <div className="grid grid-cols-2 gap-16">
          {[
            { q: 'Our clients remark on the Marlowe pieces in every staging. They photograph like architecture.', n: 'Isabelle Fournier', r: 'Interior Architect, Paris' },
            { q: 'The quality is extraordinary — this is the only furniture I have bought that I know my grandchildren will inherit.', n: 'James Whitfield', r: 'Collector, London' },
          ].map((t) => (
            <div key={t.n}>
              <p className="text-2xl font-medium leading-relaxed">“{t.q}”</p>
              <div className="mt-6 text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">
                {t.n} — {t.r}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="border-t border-stone-300 px-16 py-24 text-center">
        <h2 className="text-6xl font-medium tracking-tight">
          Begin your <em style={{ color: p.primary }}>collection</em>
        </h2>
        <p className="mx-auto mt-6 max-w-lg text-lg text-stone-500">
          Visit our showrooms in Florence, Paris or Mumbai — or book a private viewing.
        </p>
        <button className="mt-10 border border-stone-900 px-12 py-5 text-sm font-bold uppercase tracking-[0.25em] transition-colors hover:bg-stone-900 hover:text-white">
          Book a private viewing
        </button>
      </div>

      {/* Footer */}
      <div className="border-t border-stone-300 bg-white px-16 py-14">
        <div className="grid grid-cols-4 gap-10">
          <div className="col-span-2">
            <div className="text-xl font-semibold">
              Marlowe<span style={{ color: p.primary }}>.</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-stone-500">
              Furniture and objects for a considered life — designed in Florence, crafted by hand.
            </p>
          </div>
          {[
            ['Visit', ['Florence', 'Paris', 'Mumbai']],
            ['Care', ['Restoration', 'Care guides', 'Contact']],
          ].map(([head, items]) => (
            <div key={head as string}>
              <div className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">{head}</div>
              <div className="mt-4 space-y-2.5 text-sm text-stone-500">
                {(items as string[]).map((i) => (
                  <div key={i}>{i}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 flex items-center justify-between border-t border-stone-300 pt-6 text-xs uppercase tracking-[0.2em] text-stone-400">
          <span>© 2026 Marlowe Atelier</span>
          <div className="flex gap-8">
            <span>Instagram</span>
            <span>Pinterest</span>
            <span>Journal</span>
          </div>
        </div>
      </div>
    </div>
  );
}