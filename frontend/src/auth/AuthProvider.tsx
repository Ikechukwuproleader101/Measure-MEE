import React, { useEffect, useState, useMemo } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { getMe, updateProfile, type UserProfileResponse } from '../lib/api';
import { AuthContext } from './AuthContext';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfileResponse['profile'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Fetch backend profile data when user session exists
  const loadProfile = async () => {
    setProfileLoading(true);
    setProfileError(null);
    try {
      const data = await getMe();
      setProfile(data.profile);
      setProfileError(null);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') {
        setProfile(null);
        setSession(null);
        setUser(null);
        setProfileError(null);
      } else {
        const msg = err instanceof Error ? err.message : 'Unable to connect to server. Please try again.';
        setProfileError(msg);
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const completeOnboarding = async () => {
    const data = await updateProfile({ onboarding_completed: true });
    setProfile(data.profile);
  };

  useEffect(() => {
    let isMounted = true;

    // 1. Initial session check
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!isMounted) return;
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.user) {
        loadProfile().finally(() => {
          if (isMounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // 2. Auth state subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!isMounted) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        loadProfile();
      } else {
        setProfile(null);
        setProfileLoading(false);
        setProfileError(null);
      }
      setLoading(false);

      // Clean OAuth hash/query fragments from URL if present
      if (window.location.hash.includes('access_token') || window.location.search.includes('code=')) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async ({ email, password, fullName }: { email: string; password: string; fullName?: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: fullName ? { full_name: fullName, name: fullName } : {},
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      throw error;
    }

    return { session: data.session, user: data.user };
  };

  const signIn = async ({ email, password }: { email: string; password: string }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return { session: data.session, user: data.user };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    if (error) {
      throw error;
    }
  };

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      loading,
      profileLoading,
      profileError,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
      refreshProfile: loadProfile,
      retryLoadProfile: loadProfile,
      completeOnboarding,
    }),
    [session, user, profile, loading, profileLoading, profileError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
