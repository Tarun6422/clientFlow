import type { Client, Settings } from '../types';
import { STORAGE_KEYS } from './constants';
import { buildSampleClients, DEFAULT_SETTINGS } from './sampleData';

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — fail silently in the UI layer.
  }
}

export function loadClients(): Client[] {
  const existing = read<Client[]>(STORAGE_KEYS.clients);
  if (existing && Array.isArray(existing) && existing.length >= 0) {
    return existing;
  }
  const seeded = buildSampleClients();
  write(STORAGE_KEYS.clients, seeded);
  write(STORAGE_KEYS.seeded, true);
  return seeded;
}

export function saveClients(clients: Client[]): void {
  write(STORAGE_KEYS.clients, clients);
}

export function loadSettings(): Settings {
  const stored = read<Partial<Settings>>(STORAGE_KEYS.settings);
  return { ...DEFAULT_SETTINGS, ...stored };
}

export function saveSettings(settings: Settings): void {
  write(STORAGE_KEYS.settings, settings);
}

export function loadMode(): 'light' | 'dark' {
  const stored = read<'light' | 'dark'>(STORAGE_KEYS.mode);
  if (stored === 'light' || stored === 'dark') return stored;
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

export function saveMode(mode: 'light' | 'dark'): void {
  write(STORAGE_KEYS.mode, mode);
}