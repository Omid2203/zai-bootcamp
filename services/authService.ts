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

export const authService = {
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
    // First, check if there's a hash with access_token and process it
    if (window.location.hash.includes('access_token')) {
      // Extract the hash and let Supabase process it
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          authService.getCurrentUser().then(callback);
        }
      });
    }

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
