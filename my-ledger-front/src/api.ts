import { LedgerItem, LedgerSummary, Categories, CategoryConfig } from './types';
import { authFetch } from './auth';

export const api = {
  getLedgers: async (params?: { start_date?: string, end_date?: string }): Promise<LedgerItem[]> => {
    let url = '/api/ledger/';
    if (params) {
      const qs = new URLSearchParams();
      if (params.start_date) qs.append('start_date', params.start_date);
      if (params.end_date) qs.append('end_date', params.end_date);
      url += `?${qs.toString()}`;
    }
    const res = await authFetch(url);
    if (!res.ok) throw new Error('Failed to fetch ledgers');
    return res.json();
  },
  getLedger: async (id: number): Promise<LedgerItem> => {
    const res = await authFetch(`/api/ledger/${id}`);
    if (!res.ok) throw new Error('账目不存在');
    return res.json();
  },
  getSummary: async (params?: { start_date?: string, end_date?: string }): Promise<LedgerSummary> => {
    let url = '/api/ledger/summary/';
    if (params) {
      const qs = new URLSearchParams();
      if (params.start_date) qs.append('start_date', params.start_date);
      if (params.end_date) qs.append('end_date', params.end_date);
      url += `?${qs.toString()}`;
    }
    const res = await authFetch(url);
    if (!res.ok) throw new Error('Failed to fetch summary');
    return res.json();
  },
  getCategories: async (type?: string): Promise<Categories> => {
    let url = '/api/ledger/categories/';
    if (type) url += `?type=${type}`;
    const res = await authFetch(url);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },
  addLedger: async (data: Partial<LedgerItem>): Promise<LedgerItem> => {
    const res = await authFetch('/api/ledger/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to add ledger');
    return res.json();
  },
  updateLedger: async (id: number, data: Partial<LedgerItem>): Promise<LedgerItem> => {
    const res = await authFetch(`/api/ledger/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update ledger');
    return res.json();
  },
  deleteLedger: async (id: number): Promise<void> => {
    const res = await authFetch(`/api/ledger/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete ledger');
  },
  getCategoryConfig: async (): Promise<CategoryConfig> => {
    const res = await authFetch('/api/categories/');
    if (!res.ok) throw new Error('Failed to fetch category config');
    return res.json();
  },
  updateCategoryConfig: async (data: CategoryConfig): Promise<CategoryConfig> => {
    const res = await authFetch('/api/categories/', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update category config');
    return res.json();
  },
  resetCategoryConfig: async (): Promise<CategoryConfig> => {
    const res = await authFetch('/api/categories/reset', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset category config');
    return res.json();
  }
};
