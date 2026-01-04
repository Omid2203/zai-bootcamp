import { supabase } from './supabase';
import { Comment } from '../types';

export const commentService = {
  getComments: async (profileId: string): Promise<Comment[]> => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', error);
      return [];
    }

    return data as Comment[];
  },

  addComment: async (comment: Omit<Comment, 'id' | 'created_at'>): Promise<Comment | null> => {
    const { data, error } = await supabase
      .from('comments')
      .insert(comment)
      .select()
      .single();

    if (error) {
      console.error('Error adding comment:', error);
      throw error;
    }

    return data as Comment;
  }
};
