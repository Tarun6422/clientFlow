import type { Client, ClientStatus } from '../types';

export type ClientSort = 'newest' | 'oldest' | 'name-asc' | 'name-desc';

export interface ClientFilters {
  query: string;
  status: ClientStatus | 'All';
  projectType: string;
  theme: string;
  sort: ClientSort;
}

export const DEFAULT_FILTERS: ClientFilters = {
  query: '',
  status: 'All',
  projectType: 'All',
  theme: 'All',
  sort: 'newest',
};

export function filterClients(clients: Client[], filters: ClientFilters): Client[] {
  const q = filters.query.trim().toLowerCase();
  const filtered = clients.filter((c) => {
    if (q) {
      const haystack = [c.name, c.company, c.email, c.city, c.country, c.businessName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (filters.status !== 'All' && c.status !== filters.status) return false;
    if (filters.projectType !== 'All' && c.projectType !== filters.projectType) return false;
    if (filters.theme !== 'All' && c.theme !== filters.theme) return false;
    return true;
  });

  const sorted = [...filtered];
  switch (filters.sort) {
    case 'newest':
      sorted.sort((a, b) => b.createdAt - a.createdAt);
      break;
    case 'oldest':
      sorted.sort((a, b) => a.createdAt - b.createdAt);
      break;
    case 'name-asc':
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'name-desc':
      sorted.sort((a, b) => b.name.localeCompare(a.name));
      break;
  }
  return sorted;
}