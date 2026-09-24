
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';

import { supabase, ADMIN_EMAIL } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const mounted = useRef(true);
  const loadedProfileUserId = useRef(null);

  const loadProfile = useCallback(
    async (userId, force = false) => {
      if (!userId) {
        loadedProfileUserId.current = null;
        setProfile(null);
        setProfileLoading(false);
        setAuthError(null);
        return;
      }

      if (
        !force &&
        loadedProfileUserId.current === userId
      ) {
        return;
      }

      loadedProfileUserId.current = userId;
      setProfileLoading(true);
      setAuthError(null);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!mounted.current) return;

      if (error) {
        console.error(
          'MAARGA profile load error:',
          error
        );

        setAuthError(error.message);
        setProfile(null);
      } else if (!data) {
        setAuthError(
          'Your account exists, but your MAARGA profile has not been created yet.'
        );

        setProfile(null);
      } else {
        setProfile(data);
        setAuthError(null);
      }

      setProfileLoading(false);
    },
    []
  );

  useEffect(() => {
    mounted.current = true;

    let initialized = false;

    const initializeAuth = async () => {
      const {
        data: { session: currentSession },
        error,
      } = await supabase.auth.getSession();

      if (!mounted.current) return;

      if (error) {
        console.error(
          'MAARGA session error:',
          error
        );

        setAuthError(error.message);
        setSession(null);
        setProfile(null);
        setProfileLoading(false);

        initialized = true;
        return;
      }

      setSession(currentSession || null);

      if (currentSession?.user?.id) {
        await loadProfile(
          currentSession.user.id
        );
      } else {
        setProfile(null);
        setProfileLoading(false);
      }

      initialized = true;
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted.current) return;

        console.log(
          'MAARGA auth event:',
          event
        );

        setSession(newSession || null);

        if (!newSession?.user?.id) {
          loadedProfileUserId.current = null;
          setProfile(null);
          setProfileLoading(false);
          setAuthError(null);
          return;
        }

        if (
          event === 'INITIAL_SESSION' &&
          initialized
        ) {
          return;
        }

        if (
          event === 'SIGNED_IN' ||
          event === 'USER_UPDATED' ||
          event === 'TOKEN_REFRESHED'
        ) {
          await loadProfile(
            newSession.user.id,
            event === 'SIGNED_IN'
          );
        }
      }
    );

    return () => {
      mounted.current = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const refreshProfile = useCallback(() => {
    if (!session?.user?.id) return;

    return loadProfile(
      session.user.id,
      true
    );
  }, [loadProfile, session]);

  // -----------------------------
  // REGISTER
  // -----------------------------

  const signUpWithPassword = useCallback(
    async ({
      fullName,
      email,
      password,
    }) => {
      const {
        data,
        error,
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      return data;
    },
    []
  );

  // -----------------------------
  // LOGIN
  // -----------------------------

  const signInWithPassword = useCallback(
    async ({
      email,
      password,
    }) => {
      const {
        data,
        error,
      } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return data;
    },
    []
  );

  // -----------------------------
  // FORGOT PASSWORD
  // -----------------------------

  const resetPassword = useCallback(
    async (email) => {
      const {
        error,
      } =
        await supabase.auth.resetPasswordForEmail(
          email,
          {
           redirectTo: `${window.location.origin}/#/reset-password`,
          }
        );

      if (error) throw error;
    },
    []
  );

  // -----------------------------
  // UPDATE PASSWORD
  // -----------------------------

  const updatePassword = useCallback(
    async (newPassword) => {
      const {
        error,
      } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
    },
    []
  );

  // -----------------------------
  // LOGOUT
  // -----------------------------

  const signOut = useCallback(
    async () => {
      const { error } =
        await supabase.auth.signOut();

      if (error) {
        console.error(
          'MAARGA sign out error:',
          error
        );
      }

      loadedProfileUserId.current = null;

      setSession(null);
      setProfile(null);
      setProfileLoading(false);
      setAuthError(null);
    },
    []
  );

  // -----------------------------
  // CONTEXT VALUE
  // -----------------------------

  const value = {
    session,

    user: session?.user || null,

    profile,

    profileLoading,

    authLoading:
      session === undefined,

    authError,

    isAdmin:
      profile?.role === 'admin' ||
      session?.user?.email?.toLowerCase() ===
        ADMIN_EMAIL.toLowerCase(),

    refreshProfile,

    signUpWithPassword,

    signInWithPassword,

    resetPassword,

    updatePassword,

    signOut,
  };

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      'useAuth must be used within AuthProvider'
    );
  }

  return ctx;
}
