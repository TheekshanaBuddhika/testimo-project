/**
 * lib/api.ts
 * ----------
 * Typed fetch wrapper for all backend API calls.
 *
 * - Automatically prefixes /api calls.
 * - Sends credentials (cookies) on every request so NextAuth sessions work.
 * - Throws ApiError with status code on non-2xx responses.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
// In dev, Vite proxy forwards /api → localhost:3001 so BASE_URL stays ''
// In prod, set VITE_API_BASE_URL=https://your-backend.vercel.app in frontend Vercel env

export class ApiError extends Error {
  status: number;

  constructor(
    status: number,
    message: string
  ) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string> ?? {}),
  };
  // Only set Content-Type for requests that have a body
  if (options?.body) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, data.error ?? 'Request failed');
  }

  // Handle 204 No Content or empty responses
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return {} as T;
  }

  return res.json() as Promise<T>;
}

export const api = {
  // ── Auth ──────────────────────────────────────────────
  getCsrfToken: () => request<{ csrfToken: string }>('/api/auth/csrf'),
  getSession: () => request<{ user?: { id: string; name: string; email: string; image: string } }>('/api/auth/session'),
  getMe:      () => request<{ user: { id: string; email: string; name: string; avatar_url: string } }>('/api/me'),

  // ── Workspaces ────────────────────────────────────────
  getWorkspaces: () =>
    request<{ workspaces: Workspace[] }>('/api/workspaces'),

  createWorkspace: (data: { name: string; slug: string }) =>
    request<{ workspace: Workspace }>('/api/workspaces', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getWorkspace: (id: string) =>
    request<{ workspace: Workspace }>(`/api/workspaces/${id}`),

  updateWorkspace: (id: string, data: Partial<{ name: string; logo_url: string | null }>) =>
    request<{ success: boolean }>(`/api/workspaces/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteWorkspace: (id: string) =>
    request<{ success: boolean }>(`/api/workspaces/${id}`, { method: 'DELETE' }),

  // ── Testimonials ──────────────────────────────────────
  getTestimonials: (workspaceId: string, params?: TestimonialFilters) => {
    const qs = new URLSearchParams();
    if (params?.status)   qs.set('status',   params.status);
    if (params?.featured) qs.set('featured', 'true');
    if (params?.page)     qs.set('page',     String(params.page));
    if (params?.limit)    qs.set('limit',    String(params.limit));
    return request<{ testimonials: Testimonial[]; total: number; page: number; limit: number }>(
      `/api/workspaces/${workspaceId}/testimonials?${qs}`
    );
  },

  createTestimonial: (workspaceId: string, data: CreateTestimonialInput) =>
    request<{ testimonial: Testimonial }>(`/api/workspaces/${workspaceId}/testimonials`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateTestimonial: (
    workspaceId: string,
    tid: string,
    data: Partial<{ status: 'pending' | 'approved' | 'rejected'; is_featured: boolean; tags: string[] }>
  ) =>
    request<{ success: boolean }>(`/api/workspaces/${workspaceId}/testimonials/${tid}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteTestimonial: (workspaceId: string, tid: string) =>
    request<{ success: boolean }>(`/api/workspaces/${workspaceId}/testimonials/${tid}`, {
      method: 'DELETE',
    }),

  importTestimonials: (workspaceId: string, testimonials: CreateTestimonialInput[]) =>
    request<{ success: boolean; count: number; message: string }>(`/api/workspaces/${workspaceId}/import`, {
      method: 'POST',
      body: JSON.stringify({ testimonials }),
    }),

  // ── Collection Forms ──────────────────────────────────
  getForms: (workspaceId: string) =>
    request<{ forms: CollectionForm[] }>(`/api/workspaces/${workspaceId}/forms`),

  createForm: (workspaceId: string, data: { title: string; description?: string; questions: FormQuestion[] }) =>
    request<{ form: CollectionForm }>(`/api/workspaces/${workspaceId}/forms`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // ── Public Collect ────────────────────────────────────
  getPublicForm: (formId: string) =>
    request<{ form: PublicForm }>(`/api/collect/${formId}`),

  submitTestimonial: (formId: string, data: SubmitTestimonialInput) =>
    request<{ message: string }>(`/api/collect/${formId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // ── Integrations ────────────────────────────────────────
  getIntegrations: (workspaceId: string) =>
    request<{ integrations: any[] }>(`/api/workspaces/${workspaceId}/integrations`),

  deleteIntegration: (workspaceId: string, id: string) =>
    request<{ success: boolean }>(`/api/workspaces/${workspaceId}/integrations/${id}`, {
      method: 'DELETE',
    }),

  syncIntegration: (workspaceId: string, platform: string) =>
    request<{ success: boolean; imported: number }>(`/api/workspaces/${workspaceId}/integrations/${platform}/sync`, {
      method: 'POST',
    }),

  // ── Widgets ──────────────────────────────────────────────
  getWidgets: (workspaceId: string) =>
    request<{ widgets: any[] }>(`/api/workspaces/${workspaceId}/widgets`),

  createWidget: (workspaceId: string, data: { name: string; config: any }) =>
    request<{ widget: any }>(`/api/workspaces/${workspaceId}/widgets`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateWidget: (workspaceId: string, id: string, data: { name?: string; config?: any }) =>
    request<{ success: boolean }>(`/api/workspaces/${workspaceId}/widgets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteWidget: (workspaceId: string, id: string) =>
    request<{ success: boolean }>(`/api/workspaces/${workspaceId}/widgets/${id}`, {
      method: 'DELETE',
    }),

  // ── Billing ──────────────────────────────────────────────
  createCheckoutSession: (workspaceId: string, priceId?: string) =>
    request<{ url: string }>('/api/billing/checkout', {
      method: 'POST',
      body: JSON.stringify({ workspaceId, priceId }),
    }),
};

// ── Shared Types ─────────────────────────────────────────
export interface Workspace {
  id:                string;
  name:              string;
  slug:              string;
  logo_url:          string | null;
  created_at:        string;
  testimonial_count?: number;
}

export interface Testimonial {
  id:                string;
  submitter_name:    string;
  submitter_email:   string | null;
  submitter_title:   string | null;
  submitter_company: string | null;
  submitter_avatar:  string | null;
  content:           string;
  rating:            number | null;
  source:            'form' | 'csv_import' | 'manual' | 'api';
  status:            'pending' | 'approved' | 'rejected';
  is_featured:       boolean;
  tags:              string[] | null;
  submitted_at:      string;
  approved_at:       string | null;
}

export interface FormQuestion {
  id:       string;
  label:    string;
  type:     'text' | 'rating';
  required: boolean;
}

export interface CollectionForm {
  id:               string;
  title:            string;
  description:      string | null;
  questions:        FormQuestion[];
  is_active:        boolean;
  created_at:       string;
  submission_count?: number;
}

export interface PublicForm {
  id:              string;
  title:           string;
  description:     string | null;
  questions:       FormQuestion[];
  workspace_name:  string;
  workspace_logo:  string | null;
}

export interface TestimonialFilters {
  status?:   'pending' | 'approved' | 'rejected';
  featured?: boolean;
  page?:     number;
  limit?:    number;
}

export interface CreateTestimonialInput {
  submitter_name:    string;
  submitter_email?:  string;
  submitter_title?:  string;
  submitter_company?: string;
  submitter_avatar?: string;
  content:           string;
  rating?:           number;
  source?:           'manual' | 'csv_import' | 'api';
  tags?:             string[];
}

export interface SubmitTestimonialInput {
  submitter_name:    string;
  submitter_email?:  string;
  submitter_title?:  string;
  submitter_company?: string;
  content:           string;
  rating?:           number;
}
