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

// Parse hash params from URL
const parseHashParams = (): Record<string, string> => {
  const hash = window.location.hash.substring(1);
  const params: Record<string, string> = {};
  hash.split('&').forEach(part => {
    const [key, value] = part.split('=');
    if (key && value) {
      params[key] = decodeURIComponent(value);
    }
  });
  return params;
};

export const authService = {
  // Process OAuth callback from URL hash
  processOAuthCallback: async (): Promise<User | null> => {
    const params = parseHashParams();

    if (!params.access_token) {
      return null;
    }

    console.log('Processing OAuth callback with token');

    try {
      // Set the session manually using the tokens from URL
      const { data, error } = await supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token || '',
      });

      if (error) {
        console.error('Error setting session:', error);
        return null;
      }

      if (data.user) {
        // Clear hash from URL
        window.history.replaceState(null, '', window.location.pathname);
        return authService.getCurrentUser();
      }

      return null;
    } catch (e) {
      console.error('Error processing OAuth callback:', e);
      return null;
    }
  },

  signInWithGoogle: async (): Promise<void> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
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

      // First, return basic user from auth data
      const basicUser: User = {
        id: authUser.id,
        email: authUser.email || '',
        name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
        avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || '',
        is_admin: false
      };

      // Try to get is_admin from users table (with 5 second timeout)
      try {
        const { data: userData, error } = await withTimeout(
          supabase
            .from('users')
            .select('is_admin')
            .eq('id', authUser.id)
            .maybeSingle(),
          5000
        );

        if (!error && userData?.is_admin) {
          basicUser.is_admin = true;
        }
      } catch (e) {
        // Ignore errors (including timeout), just use basicUser
        console.log('Could not fetch is_admin, using default');
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
