import { VerificationResult, DashboardStats } from '../types/verification';

const envApiBase = (import.meta as any).env?.VITE_API_BASE_URL;
const API_BASE = envApiBase
  ? (envApiBase.endsWith('/api') ? envApiBase : `${envApiBase.replace(/\/+$/, '')}/api`)
  : '/api';

export const api = {
  async verifyClaim(data: { claim: string; date: string; time?: string; language?: string }): Promise<VerificationResult> {
    const res = await fetch(`${API_BASE}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Verification request failed.' }));
      throw new Error(err.detail || 'Verification failed.');
    }
    return res.json();
  },

  async verifyUrl(formData: FormData): Promise<VerificationResult> {
    const res = await fetch(`${API_BASE}/verify/url`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'URL Verification failed.' }));
      throw new Error(err.detail || 'URL Verification failed.');
    }
    return res.json();
  },

  async verifyImage(formData: FormData): Promise<VerificationResult> {
    const res = await fetch(`${API_BASE}/verify/image`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Image Verification failed.' }));
      throw new Error(err.detail || 'Image Verification failed.');
    }
    return res.json();
  },

  async getVerification(id: string): Promise<VerificationResult> {
    const res = await fetch(`${API_BASE}/verification/${id}`);
    if (!res.ok) {
      throw new Error('Verification record not found.');
    }
    return res.json();
  },

  async deleteVerification(id: string): Promise<{ deleted: boolean }> {
    try {
      const res = await fetch(`${API_BASE}/verification/${id}`, { method: 'DELETE' });
      return res.json();
    } catch {
      return { deleted: false };
    }
  },

  async getHistory(): Promise<{ count: number; verifications: VerificationResult[] }> {
    const res = await fetch(`${API_BASE}/history`);
    if (!res.ok) throw new Error('Failed to load history');
    return res.json();
  },

  async clearHistory(): Promise<{ deleted_count: number; message: string }> {
    const res = await fetch(`${API_BASE}/history`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to clear history');
    return res.json();
  },

  async getDashboard(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/dashboard`);
    if (!res.ok) throw new Error('Failed to load dashboard metrics');
    return res.json();
  },

  async getUsage() {
    const res = await fetch(`${API_BASE}/usage`);
    if (!res.ok) throw new Error('Failed to load API usage quota');
    return res.json();
  },

  async downloadPdf(id: string): Promise<Blob> {
    const res = await fetch(`${API_BASE}/report/${id}/pdf`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to generate PDF report');
    return res.blob();
  },

  async runEvaluation() {
    const res = await fetch(`${API_BASE}/eval/run`, { method: 'POST' });
    if (!res.ok) throw new Error('Evaluation run failed');
    return res.json();
  }
};
