import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Client, Settings } from '../types';
import { getTheme, type ThemeWithPreview } from '../themes';
import { formatDate, sanitizeFileName } from './utils';
import { generateProjectSummary } from './summary';

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 56;
const CONTENT_W = PAGE_W - MARGIN * 2;
const CENTER = PAGE_W / 2;
const BREAK_Y = PAGE_H - 96;

const BRAND: [number, number, number] = [79, 70, 229];
const INK: [number, number, number] = [15, 23, 42];
const MUTED: [number, number, number] = [100, 116, 139];
const FAINT: [number, number, number] = [148, 163, 184];
const BORDER: [number, number, number] = [226, 232, 240];
const BG: [number, number, number] = [248, 250, 252];
const WHITE_TXT: [number, number, number] = [255, 255, 255];

/** Standard PDF fonts are WinAnsi — swap glyphs they cannot render. */
function pdfSafe(text: string): string {
  return text.replace(/₹/g, 'INR ');
}

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return BRAND;
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

function luminance(rgb: [number, number, number]): number {
  return (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
}

export function generateClientPdf(client: Client, settings: Settings): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const theme = client.theme ? getTheme(client.theme) : undefined;
  let y = 0;

  /* ---------- page scaffolding ---------- */

  const drawHeaderLeft = () => {
    doc.setFillColor(...BRAND);
    doc.rect(0, 0, PAGE_W, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...BRAND);
    doc.text('ClientFlow', MARGIN, 38);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MUTED);
    doc.text('Requirement & Prototype Brief', MARGIN + 60, 38);
    const who = client.company ? `${client.name} — ${client.company}` : client.name;
    doc.text(pdfSafe(who), PAGE_W - MARGIN, 38, { align: 'right' });
  };

  const drawFooterBase = () => {
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(1);
    doc.line(MARGIN, PAGE_H - 52, PAGE_W - MARGIN, PAGE_H - 52);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...FAINT);
    doc.text('Generated with ClientFlow', MARGIN, PAGE_H - 34);
  };

  const ensure = (needed: number) => {
    if (y + needed > BREAK_Y) {
      doc.addPage();
      y = 66;
      drawHeaderLeft();
      drawFooterBase();
    }
  };

  const kv = (label: string, value: string) => {
    const safe = pdfSafe(value);
    if (!safe.trim()) return;
    ensure(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(label.toUpperCase(), MARGIN, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(...INK);
    const lines = doc.splitTextToSize(safe, CONTENT_W - 190) as string[];
    doc.text(lines, MARGIN + 190, y + 2.2);
    y += Math.max(lines.length, 1) * 13.5 + 5;
  };

  const section = (num: string, title: string) => {
    ensure(96);
    y += 16;
    doc.setFillColor(...BRAND);
    doc.roundedRect(MARGIN, y - 15, 26, 26, 8, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...WHITE_TXT);
    doc.text(num, MARGIN + 13, y + 2, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...INK);
    doc.text(title, MARGIN + 42, y + 2);
    y += 10;
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(1);
    doc.line(MARGIN, y, MARGIN + CONTENT_W, y);
    y += 24;
  };

  const paragraph = (text: string, opts: { size?: number; color?: [number, number, number]; italic?: boolean; leading?: number } = {}) => {
    const size = opts.size ?? 10.5;
    const leading = opts.leading ?? size * 1.45;
    const lines = doc.splitTextToSize(pdfSafe(text), CONTENT_W) as string[];
    ensure(lines.length * leading + 8);
    doc.setFont('helvetica', opts.italic ? 'italic' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...(opts.color ?? INK));
    doc.text(lines, MARGIN, y);
    y += lines.length * leading + 8;
  };

  const subheading = (title: string) => {
    ensure(44);
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.setTextColor(...INK);
    doc.text(title, MARGIN, y);
    doc.setFillColor(...BRAND);
    doc.roundedRect(MARGIN, y + 6, 30, 2.5, 1.25, 1.25, 'F');
    y += 20;
  };

  const pageBreak = () => {
    doc.addPage();
    y = 66;
    drawHeaderLeft();
    drawFooterBase();
  };

  /* ---------- cover ---------- */

  doc.setFillColor(...BRAND);
  doc.rect(0, 0, PAGE_W, 10, 'F');

  // ClientFlow logo lockup
  const hasLogo = settings.logo && /^data:image\/(png|jpe?g)/.test(settings.logo);
  if (hasLogo) {
    try {
      doc.addImage(
        settings.logo,
        settings.logo.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG',
        MARGIN,
        56,
        34,
        34
      );
    } catch {
      /* fall through to text logo */
    }
  } else {
    doc.setFillColor(...BRAND);
    doc.roundedRect(MARGIN, 56, 34, 34, 9, 9, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(...WHITE_TXT);
    doc.text('C', MARGIN + 17, 78, { align: 'center' });
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(...INK);
  doc.text('ClientFlow', MARGIN + 46, 79);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text('Collect. Organize. Create.', MARGIN + 46, 92);

  // Title block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text('PROFESSIONAL PROJECT BRIEF', CENTER, 250, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(...INK);
  const titleLines = doc.splitTextToSize(
    'Client Requirement & Website Prototype Brief',
    CONTENT_W - 120
  ) as string[];
  doc.text(titleLines, CENTER, 286, { align: 'center' });

  doc.setFillColor(...BRAND);
  doc.roundedRect(CENTER - 22, 330, 44, 4, 2, 2, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(...MUTED);
  const nameLine = client.company ? `${client.name} · ${client.company}` : client.name;
  doc.text(pdfSafe(nameLine), CENTER, 368, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor(...FAINT);
  doc.text(formatDate(client.createdAt || Date.now()), CENTER, 386, { align: 'center' });

  // Info card
  const cardY = 408;
  const cardRows: Array<[string, string]> = [
    ['Client', client.name],
    ['Company', client.company],
    ['Website type', client.projectType],
    ['Date', formatDate(Date.now())],
    ['Prepared by', settings.agencyName || 'ClientFlow'],
  ];
  const cardH = 46 + cardRows.length * 26;
  doc.setFillColor(...BG);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(1);
  doc.roundedRect(MARGIN, cardY, CONTENT_W, cardH, 12, 12, 'FD');
  let ry = cardY + 30;
  cardRows.forEach(([label, value], idx) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(label.toUpperCase(), MARGIN + 26, ry);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(...INK);
    doc.text(pdfSafe(value), MARGIN + 130, ry);
    if (idx < cardRows.length - 1) {
      doc.setDrawColor(...BORDER);
      doc.setLineWidth(0.7);
      doc.line(MARGIN + 26, ry + 10, MARGIN + CONTENT_W - 26, ry + 10);
    }
    ry += 26;
  });

  // Cover footer
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(1);
  doc.line(MARGIN, PAGE_H - 66, PAGE_W - MARGIN, PAGE_H - 66);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...FAINT);
  if (settings.pdfFooter) {
    doc.text(pdfSafe(settings.pdfFooter), CENTER, PAGE_H - 48, { align: 'center' });
  }
  doc.setTextColor(...BRAND);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Generated with ClientFlow', CENTER, PAGE_H - 34, { align: 'center' });

  /* ---------- executive summary ---------- */

  pageBreak();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.setTextColor(...INK);
  doc.text('Executive Summary', MARGIN, y);
  doc.setFillColor(...BRAND);
  doc.roundedRect(MARGIN, y + 10, 44, 3.5, 1.75, 1.75, 'F');
  y += 34;
  const summary = generateProjectSummary(client);
  paragraph(summary, { size: 10.5, color: INK, leading: 16 });

  /* ---------- 01 — client information ---------- */

  pageBreak();
  section('01', 'Client Information');
  kv('Name', client.name);
  kv('Company', client.company);
  kv('Email', client.email);
  kv('Phone', client.phone);
  kv('WhatsApp', client.whatsapp);
  const location = [client.address, client.city, client.country].filter(Boolean).join(', ');
  kv('Location', location);
  kv('Preferred contact', client.preferredContact);
  kv('Client type', client.clientType);

  /* ---------- 02 — business information ---------- */

  pageBreak();
  section('02', 'Business Information');
  kv('Business', client.businessName);
  kv('Industry', client.industry);
  kv('Description', client.description);
  kv('Years in business', client.yearsInBusiness);
  kv('Existing website', client.existingWebsite);
  const socials = [client.instagram, client.facebook, client.linkedin, client.otherSocial]
    .filter(Boolean)
    .join('   ·   ');
  kv('Social links', socials);

  /* ---------- 03 — project overview ---------- */

  pageBreak();
  section('03', 'Project Overview');
  kv('Website type', client.projectType);
  kv('Project goal', client.projectGoal);
  kv('Target audience', client.targetAudience);
  kv('Budget', client.budget);
  kv('Deadline', client.deadline ? formatDate(new Date(client.deadline).getTime()) : '');
  kv('Content source', client.contentProvider);

  /* ---------- 04 — website requirements (pages) ---------- */

  pageBreak();
  section('04', 'Website Requirements');
  const allPages = [...client.pages, ...client.customPages];
  autoTable(doc, {
    startY: y,
    head: [['Required Pages']],
    body: allPages.map((p) => [pdfSafe(p)]),
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 10, cellPadding: 7, textColor: INK, lineColor: BORDER, lineWidth: 0.7 },
    headStyles: { fillColor: BRAND, textColor: WHITE_TXT, fontStyle: 'bold', fontSize: 10.5 },
    alternateRowStyles: { fillColor: BG },
    margin: { top: 70, bottom: 70, left: MARGIN, right: MARGIN },
    didDrawPage: () => {
      drawHeaderLeft();
      drawFooterBase();
    },
  });
  y =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 26;

  /* ---------- 05 — features ---------- */

  const allFeatures = [...client.features, ...client.customFeatures];
  autoTable(doc, {
    startY: y,
    head: [['Required Features']],
    body: allFeatures.map((f) => [pdfSafe(f)]),
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 10, cellPadding: 7, textColor: INK, lineColor: BORDER, lineWidth: 0.7 },
    headStyles: { fillColor: BRAND, textColor: WHITE_TXT, fontStyle: 'bold', fontSize: 10.5 },
    alternateRowStyles: { fillColor: BG },
    margin: { top: 70, bottom: 70, left: MARGIN, right: MARGIN },
    didDrawPage: () => {
      drawHeaderLeft();
      drawFooterBase();
    },
  });
  y =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 40;

  /* ---------- 06 — design direction ---------- */

  ensure(60);
  section('06', 'Design Direction');
  if (theme) {
    const [pr, pg, pb] = hexToRgb(theme.palette.primary);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(pr, pg, pb);
    doc.text(theme.name, MARGIN, y);
    y += 18;
    paragraph(theme.description, { color: MUTED, size: 10, leading: 14 });
    y += 6;

    // Palette swatches
    const swatches = [
      ['Background', theme.palette.bg],
      ['Primary', theme.palette.primary],
      ['Secondary', theme.palette.secondary],
      ['Accent', theme.palette.accent],
      ['Text', theme.palette.text],
    ] as const;
    const sw = 34;
    const gap = 14;
    const startX = MARGIN;
    swatches.forEach(([label, color], i) => {
      const x = startX + i * (sw + gap + 96);
      doc.setFillColor(...hexToRgb(color));
      doc.setDrawColor(...BORDER);
      doc.setLineWidth(0.7);
      doc.roundedRect(x, y, sw, sw, 7, 7, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...MUTED);
      doc.text(label.toUpperCase(), x + sw + 8, y + 12);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...INK);
      doc.text(color, x + sw + 8, y + 23);
    });
    y += sw + 26;

    y = drawThemeSchematic(doc, theme, MARGIN, y, CONTENT_W);
    y += 26;
  } else {
    paragraph('No theme has been selected for this client yet.', { color: MUTED, italic: true });
  }

  /* ---------- 07 — additional requirements ---------- */

  pageBreak();
  section('07', 'Additional Requirements');
  if (client.notes.trim()) {
    paragraph(client.notes, { leading: 16 });
  } else {
    paragraph('No additional requirements were noted by the client.', { color: MUTED, italic: true });
  }

  /* ---------- 08 — website prototype ---------- */

  pageBreak();
  section('08', 'Website Prototype');
  if (client.prototype && client.sitemap && client.sitemap.length > 0) {
    const versions = client.prototypeVersions ?? [];
    const totalSections = client.prototype.pages.reduce((acc, p) => acc + p.sections.length, 0);
    const statusLine = client.approval?.approved
      ? `Approved${client.approval.date ? ` on ${formatDate(client.approval.date)}` : ''}.`
      : client.feedback && client.feedback.length > 0
        ? `Changes requested by the client (${client.feedback.length} feedback item${client.feedback.length === 1 ? '' : 's'}).`
        : 'Not yet approved — awaiting client review.';
    paragraph(
      `An interactive website prototype has been generated from the client's requirements. It contains ${client.prototype.pages.length} page${client.prototype.pages.length === 1 ? '' : 's'} with ${totalSections} section${totalSections === 1 ? '' : 's'} in total, following the ${theme ? theme.name : 'selected'} design system. ${statusLine}`,
      { leading: 16 }
    );
    if (versions.length > 0) {
      paragraph(`Prototype versions saved: ${versions.map((v) => `v${v.number}`).join(', ')}.`, {
        size: 9.5,
        color: MUTED,
        leading: 13,
      });
    }

    subheading('Sitemap');
    y = drawSitemapTree(doc, client.sitemap, MARGIN, y, CONTENT_W);
    y += 4;

    subheading('Pages & Sections');
    autoTable(doc, {
      startY: y,
      head: [['Page', 'Sections', 'Blueprint sections']],
      body: client.prototype.pages.map((p) => {
        const bp = client.pageBlueprints?.find((b) => b.pageId === p.id);
        return [
          pdfSafe(p.label),
          String(p.sections.length),
          bp ? bp.sections.map((s) => s.name).join(', ') : '',
        ];
      }),
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 6, textColor: INK, lineColor: BORDER, lineWidth: 0.7 },
      headStyles: { fillColor: BRAND, textColor: WHITE_TXT, fontStyle: 'bold', fontSize: 9.5 },
      alternateRowStyles: { fillColor: BG },
      margin: { top: 70, bottom: 70, left: MARGIN, right: MARGIN },
      didDrawPage: () => {
        drawHeaderLeft();
        drawFooterBase();
      },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 22;

    if (client.pageBlueprints && client.pageBlueprints.length > 0) {
      subheading('Page Blueprints');
      const rows: Array<[string, string, string, string]> = [];
      client.pageBlueprints.forEach((bp) => {
        bp.sections.forEach((s) => {
          rows.push([pdfSafe(bp.pageName), pdfSafe(s.name), pdfSafe(s.purpose), pdfSafe(s.cta || '—')]);
        });
      });
      autoTable(doc, {
        startY: y,
        head: [['Page', 'Section', 'Purpose', 'CTA']],
        body: rows,
        theme: 'grid',
        styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 5, textColor: INK, lineColor: BORDER, lineWidth: 0.7 },
        headStyles: { fillColor: BRAND, textColor: WHITE_TXT, fontStyle: 'bold', fontSize: 9 },
        alternateRowStyles: { fillColor: BG },
        columnStyles: {
          0: { cellWidth: 72 },
          1: { cellWidth: 84 },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 68 },
        },
        margin: { top: 70, bottom: 70, left: MARGIN, right: MARGIN },
        didDrawPage: () => {
          drawHeaderLeft();
          drawFooterBase();
        },
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 22;
    }

    if (theme) {
      subheading('Design System & Preview');
      paragraph(`${theme.name} — ${theme.description}`, { color: MUTED, size: 9.5, leading: 13 });
      y += 6;
      y = drawThemeSchematic(doc, theme, MARGIN, y, CONTENT_W);
      y += 10;
    }
  } else {
    paragraph(
      'No website prototype has been generated yet. Use “Generate Website Prototype” on the client profile to create one.',
      { color: MUTED, italic: true }
    );
  }

  /* ---------- sign-off ---------- */

  ensure(120);
  y += 20;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(1);
  doc.line(MARGIN, y, MARGIN + CONTENT_W, y);
  y += 24;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text('Reviewed and confirmed by the client. This brief summarises the requirements collected', MARGIN, y);
  doc.text('for this project and will guide the design and development phase.', MARGIN, y + 14);
  y += 40;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  doc.text(client.name || '—', MARGIN + CONTENT_W - 150, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...FAINT);
  doc.text('Client signature', MARGIN + CONTENT_W - 150, y + 12);

  /* ---------- page numbers (final pass, cover unnumbered) ---------- */

  const total = doc.getNumberOfPages();
  for (let i = 2; i <= total; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...FAINT);
    doc.text(`Page ${i - 1} of ${total - 1}`, PAGE_W - MARGIN, PAGE_H - 34, { align: 'right' });
  }

  const who = client.company || client.name || 'Client';
  doc.save(`ClientFlow-Brief-${sanitizeFileName(who)}.pdf`);
}

/* ------------------------------------------------------------------ */
/* Sitemap tree drawn with vector shapes                               */
/* ------------------------------------------------------------------ */

function drawSitemapTree(
  doc: jsPDF,
  sitemap: Array<{ id: string; label: string }>,
  x0: number,
  startY: number,
  width: number
): number {
  let y = startY + 12;
  const rootX = x0 + width / 2;
  const childLeft = x0 + 24;

  // Root node
  doc.setFillColor(...BRAND);
  doc.roundedRect(rootX - 60, y - 12, 120, 24, 6, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...WHITE_TXT);
  doc.text('Website', rootX, y + 1, { align: 'center' });
  y += 30;

  sitemap.forEach((page, i) => {
    const rowY = y - 11;
    const rowW = Math.min(190, width * 0.45);
    // connector: from root down to this row
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.8);
    doc.line(rootX, rowY, rootX, rowY + 11);
    doc.line(rootX, rowY + 11, childLeft, rowY + 11);
    doc.line(childLeft, rowY, childLeft, rowY + 11);
    // row box
    doc.setFillColor(...BG);
    doc.setDrawColor(...BORDER);
    doc.roundedRect(childLeft, rowY, rowW, 22, 5, 5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...INK);
    doc.text(`${i + 1}. ${pdfSafe(page.label)}`, childLeft + 10, y + 1);
    y += 28;
  });

  return y;
}

/* ------------------------------------------------------------------ */
/* Schematic website preview drawn with vector shapes                  */
/* ------------------------------------------------------------------ */

function drawThemeSchematic(
  doc: jsPDF,
  theme: ThemeWithPreview,
  x0: number,
  startY: number,
  width: number
): number {
  const rgb = hexToRgb(theme.palette.primary);
  const frameH = 250;
  let y = startY + 6;

  // Browser frame
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(1);
  doc.roundedRect(x0, y, width, frameH, 10, 10, 'S');
  doc.setFillColor(...BG);
  doc.rect(x0 + 1, y + 1, width - 2, 24, 'F');

  // Traffic lights + address bar
  doc.setFillColor(248, 113, 113);
  doc.circle(x0 + 20, y + 13, 4, 'F');
  doc.setFillColor(251, 191, 36);
  doc.circle(x0 + 34, y + 13, 4, 'F');
  doc.setFillColor(52, 211, 153);
  doc.circle(x0 + 48, y + 13, 4, 'F');
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...BORDER);
  doc.roundedRect(x0 + 70, y + 7, width - 130, 16, 8, 8, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...FAINT);
  doc.text(theme.name.toLowerCase().replace(/\s+/g, '-') + '.demo', x0 + 80, y + 17);

  // Fake navbar
  const navY = y + 40;
  doc.setFillColor(...rgb);
  doc.roundedRect(x0 + 24, navY, 13, 13, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  doc.text(theme.name, x0 + 46, navY + 10.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...FAINT);
  ['Home', 'About', 'Services', 'Contact'].forEach((l, i) => {
    doc.text(l, x0 + width - 250 + i * 56, navY + 10.5);
  });
  doc.setFillColor(...rgb);
  doc.roundedRect(x0 + width - 104, navY - 5, 76, 23, 12, 12, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Get Started', x0 + width - 66, navY + 6.5, { align: 'center' });

  // Fake hero
  const heroY = navY + 30;
  const heroH = 78;
  doc.setFillColor(...rgb);
  doc.roundedRect(x0 + 24, heroY, width - 48, heroH, 12, 12, 'F');
  const inkOnPrimary = luminance(rgb) > 0.62 ? INK : WHITE_TXT;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...inkOnPrimary);
  doc.text('Your website, beautifully designed', x0 + 48, heroY + 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('A clear, professional message that invites visitors to take the next step.', x0 + 48, heroY + 46);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x0 + 48, heroY + 56, 92, 16, 8, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...rgb);
  doc.text('Start your project', x0 + 94, heroY + 67.5, { align: 'center' });

  // Fake feature cards
  const cardsTop = heroY + heroH + 18;
  const cardW = (width - 48 - 24 * 2) / 3;
  const cardH = 62;
  const palette = [
    theme.palette.primary,
    theme.palette.secondary,
    theme.palette.accent,
  ];
  palette.forEach((color, i) => {
    const cx = x0 + 24 + i * (cardW + 24);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.8);
    doc.roundedRect(cx, cardsTop, cardW, cardH, 9, 9, 'FD');
    doc.setFillColor(...hexToRgb(color));
    doc.roundedRect(cx + 12, cardsTop + 12, 20, 20, 6, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...INK);
    doc.text(['Feature', 'Card', 'Block'][i], cx + 14, cardsTop + 48);
  });

  // Fake CTA strip
  const ctaY = cardsTop + cardH + 14;
  doc.setFillColor(...BG);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.8);
  doc.roundedRect(x0 + 24, ctaY, width - 48, 34, 10, 10, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text('Conversion-focused sections — features, services, testimonials and footer follow the same consistent design.', x0 + 48, ctaY + 21);

  return startY + frameH + 12;
}