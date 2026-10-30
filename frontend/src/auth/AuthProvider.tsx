import React, { useEffect, useState, useMemo, useRef } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { getMe, updateProfile, type UserProfileResponse } from '../lib/api';
import { AuthContext } from './AuthContext';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfileResponse['profile'] | null>(() => {
    try {
      const cached = localStorage.getItem('measure_me_cached_profile');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const currentUserIdRef = useRef<string | null>(null);

  const saveProfile = (newProfile: UserProfileResponse['profile'] | null) => {
    setProfile(newProfile);
    try {
      if (newProfile) {
        localStorage.setItem('measure_me_cached_profile', JSON.stringify(newProfile));
      } else {
        localStorage.removeItem('measure_me_cached_profile');
      }
    } catch {
      // ignore
    }
  };

  // Fetch backend profile data when user session exists
  const loadProfile = async (silent: boolean = false) => {
    if (!silent) {
      setProfileLoading(true);
    }
    setProfileError(null);
    try {
      const data = await getMe();
      saveProfile(data.profile);
      setProfileError(null);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') {
        saveProfile(null);
        setSession(null);
        setUser(null);
        currentUserIdRef.current = null;
        setProfileError(null);
      } else {
        if (!silent || !profile) {
          const msg = err instanceof Error ? err.message : 'Unable to connect to server. Please try again.';
          setProfileError(msg);
        }
      }
    } finally {
      if (!silent) {
        setProfileLoading(false);
      }
    }
  };

  const completeOnboarding = async () => {
    const data = await updateProfile({ onboarding_completed: true });
    saveProfile(data.profile);
  };

  useEffect(() => {
    let isMounted = true;

    // 1. Initial session check
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!isMounted) return;
      setSession(initialSession);
      const initialUser = initialSession?.user ?? null;
      setUser(initialUser);
      currentUserIdRef.current = initialUser?.id ?? null;
      setLoading(false);

      if (initialUser) {
        const hasCached = !!profile;
        loadProfile(hasCached);
      }
    });

    // 2. Auth state subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!isMounted) return;

      const newUserId = currentSession?.user?.id ?? null;
      const prevUserId = currentUserIdRef.current;
      const isSameUser = prevUserId !== null && prevUserId === newUserId;

      if (isSameUser) {
        // Quiet auth event (e.g. TOKEN_REFRESHED, window refocus)
        // Keep session token up to date silently without triggering full-screen loaders
        setSession(currentSession);
        return;
      }

      // Genuine user change, initial sign-in, or sign-out
      currentUserIdRef.current = newUserId;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        loadProfile(false);
      } else {
        saveProfile(null);
        setProfileLoading(false);
        setProfileError(null);
      }
      setLoading(false);
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
    currentUserIdRef.current = null;
    const { error } = await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    saveProfile(null);
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
