import { createContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { UserProfileResponse } from '../lib/api';

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfileResponse['profile'] | null;
  loading: boolean;
  profileLoading: boolean;
  profileError: string | null;
  signUp: (params: { email: string; password: string; fullName?: string }) => Promise<{ session: Session | null; user: User | null }>;
  signIn: (params: { email: string; password: string }) => Promise<{ session: Session | null; user: User | null }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  retryLoadProfile: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
