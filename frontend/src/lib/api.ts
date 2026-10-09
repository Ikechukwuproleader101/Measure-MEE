import { supabase } from './supabaseClient';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

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
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = `${apiBaseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Session is invalid or revoked on the backend
    await supabase.auth.signOut();
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

