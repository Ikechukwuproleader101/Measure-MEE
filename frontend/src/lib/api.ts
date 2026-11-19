import { supabase } from './supabaseClient';

function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (!envUrl || !envUrl.trim()) {
    if (import.meta.env.PROD) {
      throw new Error('API address is not configured');
    }
    return 'http://localhost:4000';
  }
  return envUrl.trim().replace(/\/+$/, '');
}

export interface UserProfileResponse {
  user: {
    id: string;
    email: string;
    role: string;
  };
  profile: {
    id: string;
    email: string;
    full_name?: string | null;
    avatar_url?: string | null;
    phone?: string | null;
    onboarding_completed: boolean;
    deleted_at?: string | null;
    created_at: string;
    updated_at: string;
  };
  settings: {
    locale: string;
    timezone: string;
    notifications: Record<string, unknown>;
  };
  roles: string[];
}

/**
 * HTTP fetch wrapper that automatically attaches the Supabase Bearer token
 * and handles 401 unauthenticated session revocation.
 */
export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = `${baseUrl}/${endpoint.replace(/^\//, '')}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Attempt session refresh before determining if auth is truly revoked
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error || !data.session) {
        await supabase.auth.signOut();
      }
    } catch {
      await supabase.auth.signOut();
    }
    throw new Error('UNAUTHORIZED');
  }

  if (!response.ok) {
    let errorMessage = `HTTP error ${response.status}`;
    try {
      const errorJson = await response.json();
      if (errorJson?.error?.message) {
        errorMessage = errorJson.error.message;
      }
    } catch {
      // Ignore body parsing failure
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Fetch current user's profile and settings from backend GET /api/users/me
 */
export async function getMe(): Promise<UserProfileResponse> {
  return fetchApi<UserProfileResponse>('/api/users/me');
}

/**
 * Update current user's profile on backend PATCH /api/users/me
 */
export async function updateProfile(
  updates: Partial<{
    full_name: string;
    avatar_url: string;
    phone: string;
    onboarding_completed: boolean;
  }>
): Promise<{ profile: UserProfileResponse['profile'] }> {
  return fetchApi<{ profile: UserProfileResponse['profile'] }>('/api/users/me', {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export interface ProjectItem {
  id: string;
  client_id: string;
  tailor_id: string | null;
  name: string;
  status: 'pending_review' | 'cutting' | 'fitting' | 'done';
  progress: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  measurements?: { count: number }[];
}

export interface ProjectDetail extends ProjectItem {
  measurements: any[];
}

/**
 * Fetch projects for the authenticated user, optionally filtered by archived state
 */
export async function getProjects(archived = false): Promise<ProjectItem[]> {
  return fetchApi<ProjectItem[]>(`/api/projects?archived=${archived}`);
}

/**
 * Create a new project for the authenticated user
 */
export async function createProject(name: string): Promise<ProjectItem> {
  return fetchApi<ProjectItem>('/api/projects', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

/**
 * Update an existing project (name and/or is_archived)
 */
export async function updateProject(
  id: string,
  updates: { name?: string; is_archived?: boolean }
): Promise<ProjectItem> {
  return fetchApi<ProjectItem>(`/api/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

/**
 * Fetch single project with full measurements
 */
export async function getProject(id: string): Promise<ProjectDetail> {
  return fetchApi<ProjectDetail>(`/api/projects/${id}`);
}

