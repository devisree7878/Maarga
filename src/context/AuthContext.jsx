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

  const loadProfile = useCallback(async (userId, force = false) => {
    if (!userId) {
      loadedProfileUserId.current = null;
      setProfile(null);
      setProfileLoading(false);
      setAuthError(null);
      return;
    }

    // Prevent duplicate profile requests for the same user.
    if (!force && loadedProfileUserId.current === userId) {
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
      console.error('ELEVORA profile load error:', error);
      setAuthError(error.message);
      setProfile(null);
    } else if (!data) {
      setAuthError(
        'Your account exists, but your ELEVORA profile has not been created yet.'
      );
      setProfile(null);
    } else {
      setProfile(data);
      setAuthError(null);
    }

    setProfileLoading(false);
  }, []);

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
        console.error('ELEVORA session error:', error);
        setAuthError(error.message);
        setSession(null);
        setProfileLoading(false);
        initialized = true;
        return;
      }

      setSession(currentSession || null);

      if (currentSession?.user?.id) {
        await loadProfile(currentSession.user.id);
      } else {
        setProfile(null);
        setProfileLoading(false);
      }

      initialized = true;
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted.current) return;

      console.log('ELEVORA auth event:', event);

      setSession(newSession || null);

      if (!newSession?.user?.id) {
        loadedProfileUserId.current = null;
        setProfile(null);
        setProfileLoading(false);
        setAuthError(null);
        return;
      }

      /*
       * getSession() already loads the profile during initial startup.
       * Avoid loading it a second time for the initial SIGNED_IN event.
       */
      if (event === 'INITIAL_SESSION' && initialized) {
        return;
      }

      /*
       * When a real login/signup occurs, load the profile.
       * force=true allows the profile to refresh after authentication.
       */
      if (
        event === 'SIGNED_IN' ||
        event === 'USER_UPDATED' ||
        event === 'TOKEN_REFRESHED'
      ) {
        await loadProfile(newSession.user.id, event === 'SIGNED_IN');
      }
    });

    return () => {
      mounted.current = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const refreshProfile = useCallback(() => {
    if (!session?.user?.id) return;
    return loadProfile(session.user.id, true);
  }, [loadProfile, session]);

  const signUpWithPassword = useCallback(
    async ({ fullName, email, password }) => {
      const { data, error } = await supabase.auth.signUp({
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

  const signInWithPassword = useCallback(async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return data;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${window.location.pathname}`,
      },
    });

    if (error) throw error;

    return data;
  }, []);

  const sendPasswordReset = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}${window.location.pathname}#/reset-password`,
    });

    if (error) throw error;
  }, []);
const updatePassword = useCallback(
  async (currentPassword, newPassword) => {
    if (!session?.user?.email) {
      throw new Error('User email is not available.');
    }

    // 1. Verify the current password
    const { error: verifyError } =
      await supabase.auth.signInWithPassword({
        email: session.user.email,
        password: currentPassword,
      });

    if (verifyError) {
      throw new Error('Current password is incorrect.');
    }

    // 2. Update the password
    const { error: updateError } =
      await supabase.auth.updateUser({
        password: newPassword,
      });

    if (updateError) {
      throw updateError;
    }
  },
  [session]
);
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();

    loadedProfileUserId.current = null;
    setSession(null);
    setProfile(null);
    setProfileLoading(false);
    setAuthError(null);
  }, []);

  const value = {
    session,
    user: session?.user || null,
    profile,
    profileLoading,
    authLoading: session === undefined,
    authError,

    isAdmin:
      profile?.role === 'admin' ||
      session?.user?.email?.toLowerCase() === ADMIN_EMAIL,

    refreshProfile,
    signUpWithPassword,
    signInWithPassword,
    signInWithGoogle,
    sendPasswordReset,
    updatePassword,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return ctx;
}