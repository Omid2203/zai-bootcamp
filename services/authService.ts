import { supabase } from './supabase';
import { User } from '../types';

// Helper function to add timeout to promises
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    )
  ]);
};

// Detect OAuth params returned from Supabase/Google (PKCE flow uses code param)
const hasOAuthParams = (): boolean => {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.has('code');
};

// Get the OAuth code from URL
const getOAuthCode = (): string | null => {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('code');
};

export const authService = {
  hasOAuthParams,

  // Explicitly exchange OAuth code for session - call this when code is in URL
  processOAuthCallback: async (): Promise<boolean> => {
    const code = getOAuthCode();
    if (!code) return false;

    try {
      console.log('Processing OAuth callback with code...');
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('Error exchanging code for session:', error);
        return false;
      }

      console.log('Successfully exchanged code for session:', data.user?.email);

      // Clean up URL after successful exchange
      window.history.replaceState(null, '', window.location.pathname);

      return true;
    } catch (error) {
      console.error('Exception in processOAuthCallback:', error);
      return false;
    }
  },

  signInWithGoogle: async (): Promise<void> => {
    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo
      }
    });
    if (error) throw error;
  },

  signOut: async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getCurrentUser: async (): Promise<User | null> => {
    try {
      // Add 10 second timeout for getSession
      const { data: { session } } = await withTimeout(
        supabase.auth.getSession(),
        10000
      );

      if (!session?.user) {
        return null;
      }

      const authUser = session.user;

      // Default user from Google auth data
      const basicUser: User = {
        id: authUser.id,
        email: authUser.email || '',
        name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
        avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || '',
        is_admin: false
      };

      // Try to get user data from users table (name, avatar_url, is_admin)
      // If name is set in DB, use it instead of Google name
      try {
        const { data: userData, error } = await withTimeout(
          supabase
            .from('users')
            .select('name, avatar_url, is_admin')
            .eq('id', authUser.id)
            .maybeSingle(),
          5000
        );

        if (!error && userData) {
          // Use DB name if set, otherwise keep Google name
          if (userData.name) {
            basicUser.name = userData.name;
          }
          // Use DB avatar if set, otherwise keep Google avatar
          if (userData.avatar_url) {
            basicUser.avatar_url = userData.avatar_url;
          }
          if (userData.is_admin) {
            basicUser.is_admin = true;
          }
        }
      } catch (e) {
        // Ignore errors (including timeout), just use basicUser
        console.log('Could not fetch user data from DB, using Google data');
      }

      return basicUser;
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      return null;
    }
  },

  onAuthStateChange: (callback: (user: User | null) => void) => {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);

      if (session?.user) {
        // Extract user directly from session - don't call getSession() again
        const authUser = session.user;
        const basicUser: User = {
          id: authUser.id,
          email: authUser.email || '',
          name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
          avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || '',
          is_admin: false
        };

        // Try to enrich from database (short timeout, non-blocking)
        try {
          const { data: userData } = await withTimeout(
            supabase
              .from('users')
              .select('name, avatar_url, is_admin')
              .eq('id', authUser.id)
              .maybeSingle(),
            3000
          );
          if (userData) {
            if (userData.name) basicUser.name = userData.name;
            if (userData.avatar_url) basicUser.avatar_url = userData.avatar_url;
            if (userData.is_admin) basicUser.is_admin = true;
          }
        } catch (e) {
          // Ignore timeout, use basic user from Google
          console.log('Could not fetch user data from DB, using Google data');
        }

        callback(basicUser);
      } else {
        callback(null);
      }
    });
  }
};
