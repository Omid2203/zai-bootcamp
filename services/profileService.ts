import { supabase } from './supabase';
import { Profile } from '../types';

export const profileService = {
  getProfiles: async (): Promise<Profile[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching profiles:', error);
      return [];
    }

    return data as Profile[];
  },

  getProfile: async (id: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data as Profile;
  },

  createProfile: async (profile: Omit<Profile, 'id' | 'created_at' | 'updated_at'>): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profile)
      .select()
      .single();

    if (error) {
      console.error('Error creating profile:', error);
      alert('خطا در ایجاد پروفایل: ' + error.message);
      throw error;
    }

    return data as Profile;
  },

  updateProfile: async (id: string, profile: Partial<Profile>): Promise<Profile | null> => {
    // Only send fields that exist in the database
    const { id: _id, created_at, updated_at, ...updateData } = profile as any;

    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      alert('خطا در ذخیره: ' + error.message);
      throw error;
    }

    return data as Profile;
  },

  deleteProfile: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting profile:', error);
      throw error;
    }
  },

  toggleProfileStatus: async (id: string, isActive: boolean): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error toggling profile status:', error);
      alert('خطا در تغییر وضعیت');
      return null;
    }

    return data as Profile;
  }
};
