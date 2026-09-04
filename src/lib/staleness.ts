import type { Client } from '../types';

/* ------------------------------------------------------------------ */
/* Prototype staleness                                                 */
/* ------------------------------------------------------------------ */
/* The prototype is generated from a fixed set of *source* fields. When   */
/* any of those fields change after generation (edits in the wizard), the  */
/* prototype is silently out of date. We fingerprint the source fields at  */
/* generation time and compare against the live client to detect drift.   */
/* Generated fields (prototype, versions, feedback, approval, analysis)   */
/* are deliberately excluded — they describe what was generated, not what */
/* the prototype was built from.                                          */

const SOURCE_FIELDS: Array<keyof Client> = [
  // Business identity — these flow into prototype content.
  'name',
  'company',
  'businessName',
  'industry',
  'description',
  // Project information.
  'projectType',
  'projectGoal',
  'targetAudience',
  'deadline',
  'budget',
  // Requirements.
  'pages',
  'customPages',
  'features',
  'customFeatures',
  'contentProvider',
  'notes',
  // Theme + website-type answers.
  'theme',
  'dynamicAnswers',
];

function stringifyValue(value: unknown): string {
  if (Array.isArray(value)) return `[${(value as unknown[]).join(',')}]`;
  if (value && typeof value === 'object') return JSON.stringify(value);
  return String(value ?? '');
}

/** Deterministic fingerprint of the source information the prototype depends on. */
export function sourceFingerprint(client: Client): string {
  return SOURCE_FIELDS.map((key) => `${key}=${stringifyValue(client[key])}`).join('|');
}

/**
 * True when a prototype exists and the source information has changed since
 * it was generated. Legacy clients (generated before this feature, no stored
 * fingerprint) are treated as not stale so existing data is never falsely
 * flagged.
 */
export function isPrototypeStale(client: Client): boolean {
  if (!client.prototype || !client.prototypeSourceHash) return false;
  return client.prototypeSourceHash !== sourceFingerprint(client);
}