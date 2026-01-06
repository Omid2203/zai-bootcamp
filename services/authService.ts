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

// Remove OAuth params from URL once we've processed them
const clearOAuthParams = () => {
  if (typeof window === 'undefined') return;
  if (window.location.hash || window.location.search) {
    window.history.replaceState(null, '', window.location.pathname);
  }
};

export const authService = {
  hasOAuthParams,

  // Process OAuth callback from URL (PKCE flow)
  processOAuthCallback: async (): Promise<User | null> => {
    if (!hasOAuthParams()) return null;

    try {
      console.log('Processing OAuth callback from URL...');
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (!code) {
        console.log('No code found in URL');
        clearOAuthParams();
        return null;
      }

      // Exchange code for session (PKCE flow)
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('Error exchanging code for session:', error);
        clearOAuthParams();
        return null;
      }

      clearOAuthParams();

      if (data.session?.user) {
        return authService.getCurrentUser();
      }

      return null;
    } catch (e) {
      console.error('Error processing OAuth callback:', e);
      clearOAuthParams();
      return null;
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
        const user = await authService.getCurrentUser();
        callback(user);
      } else {
        callback(null);
      }
    });
  }
};
