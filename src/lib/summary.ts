import type { Client } from '../types';

/**
 * Generates a concise professional project summary from collected form data.
 * No AI APIs — a structured template built from the client's answers.
 */
export function generateProjectSummary(client: Client): string {
  const business = client.businessName || client.company || client.name;
  const industry = client.industry || 'business';
  const projectType = client.projectType || 'website';
  const goal = client.projectGoal ? ` ${client.projectGoal.trim()}` : '';
  const audience = client.targetAudience
    ? ` The website is designed for ${lowerFirst(client.targetAudience.trim())}.`
    : '';
  const pagesPart =
    client.pages.length > 0
      ? ` The brief covers ${client.pages.length} required page${
          client.pages.length === 1 ? '' : 's'
        } (${client.pages.slice(0, 4).join(', ')}${
          client.pages.length > 4 ? ' and more' : ''
        }).`
      : '';
  const featuresPart =
    client.features.length > 0
      ? ` Key features include ${client.features.slice(0, 4).join(', ')}${
          client.features.length > 4 ? ' and more' : ''
        }.`
      : '';
  const themePart = client.theme
    ? ` The design direction is aligned to a ${themeName(client.theme)} aesthetic.`
    : '';

  return (
    `This project is for ${business}, a ${industry} business. ` +
    `The client requires a ${projectType.toLowerCase()} focused on delivering measurable results.` +
    (goal ? ` ${goal}` : '') +
    audience +
    pagesPart +
    ' ' +
    featuresPart +
    themePart +
    (client.contentProvider && client.contentProvider !== 'Not Decided'
      ? ` Website content will be provided by the ${client.contentProvider.toLowerCase()}.`
      : '') +
    (client.notes
      ? ` Additional considerations: ${lowerFirst(client.notes.trim())}.`
      : '') +
    ' The project is being managed end-to-end through ClientFlow, from requirement collection to delivery.'
  );
}

function lowerFirst(s: string): string {
  if (!s) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function themeName(id: string): string {
  const map: Record<string, string> = {
    'modern-minimal': 'Modern Minimal',
    'bento-saas': 'Bento SaaS',
    'dark-premium': 'Dark Premium',
    'aurora-glass': 'Aurora Glass',
    'neo-brutalist': 'Neo Brutalist',
    editorial: 'Editorial',
  };
  return map[id] ?? 'clean, modern';
}