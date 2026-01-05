import { supabase } from './supabase';
import { User } from '../types';

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
      const { data: { session } } = await supabase.auth.getSession();

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

      // Try to get is_admin from users table
      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select('is_admin')
          .eq('id', authUser.id)
          .maybeSingle();

        if (!error && userData?.is_admin) {
          basicUser.is_admin = true;
        }
      } catch (e) {
        // Ignore errors, just use basicUser
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
      if (session?.user) {
        const user = await authService.getCurrentUser();
        callback(user);
      } else {
        callback(null);
      }
    });
  }
};
