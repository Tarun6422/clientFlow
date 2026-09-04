import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Client, ClientStatus, Settings, ToastItem, ToastType } from '../types';
import {
  loadClients,
  loadMode,
  loadSettings,
  saveClients,
  saveMode,
  saveSettings,
} from '../lib/storage';
import { uid } from '../lib/utils';

interface AppContextValue {
  clients: Client[];
  settings: Settings;
  mode: 'light' | 'dark';
  toasts: ToastItem[];
  addClient: (client: Client) => void;
  updateClient: (id: string, patch: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  duplicateClient: (id: string) => Client | undefined;
  updateSettings: (patch: Partial<Settings>) => void;
  toggleMode: () => void;
  toast: (message: string, type?: ToastType) => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>(() => loadClients());
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [mode, setMode] = useState<'light' | 'dark'>(() => loadMode());
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, number>>({});

  useEffect(() => {
    saveClients(clients);
  }, [clients]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', mode === 'dark');
    saveMode(mode);
  }, [mode]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = 'success') => {
      const id = uid();
      setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
      timers.current[id] = window.setTimeout(() => dismissToast(id), 3600);
    },
    [dismissToast]
  );

  useEffect(() => {
    const current = timers.current;
    return () => {
      Object.values(current).forEach((t) => window.clearTimeout(t));
    };
  }, []);

  const addClient = useCallback((client: Client) => {
    setClients((prev) => [client, ...prev]);
  }, []);

  const updateClient = useCallback((id: string, patch: Partial<Client>) => {
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c))
    );
  }, []);

  const deleteClient = useCallback((id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const duplicateClient = useCallback(
    (id: string): Client | undefined => {
      const source = clients.find((c) => c.id === id);
      if (!source) return undefined;
      const copy: Client = {
        ...source,
        id: uid(),
        name: `${source.name} (Copy)`,
        company: source.company ? `${source.company} (Copy)` : '',
        status: 'Draft',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        /* The copy is a fresh project: it keeps the collected source answers
           (client/business/project/requirements/theme + dynamic answers) but
           must NOT inherit any AI-generated content, prototype, versions,
           feedback or approval state from the original. */
        aiAnalysis: null,
        sitemap: null,
        pageBlueprints: null,
        prototype: null,
        prototypeVersions: undefined,
        feedback: undefined,
        approval: undefined,
        prototypeSourceHash: null,
        dynamicAnswers: source.dynamicAnswers ? { ...source.dynamicAnswers } : undefined,
      };
      setClients((prev) => [copy, ...prev]);
      return copy;
    },
    [clients]
  );

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      clients,
      settings,
      mode,
      toasts,
      addClient,
      updateClient,
      deleteClient,
      duplicateClient,
      updateSettings,
      toggleMode,
      toast,
      dismissToast,
    }),
    [
      clients,
      settings,
      mode,
      toasts,
      addClient,
      updateClient,
      deleteClient,
      duplicateClient,
      updateSettings,
      toggleMode,
      toast,
      dismissToast,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}