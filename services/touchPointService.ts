import { supabase } from './supabase';
import { TouchPoint } from '../types';

export const touchPointService = {
  getTouchPoints: async (profileId: string): Promise<TouchPoint[]> => {
    const { data, error } = await supabase
      .from('touch_points')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching touch points:', error);
      return [];
    }

    return data || [];
  },

  getLatestTouchPoint: async (profileId: string): Promise<TouchPoint | null> => {
    const { data, error } = await supabase
      .from('touch_points')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching latest touch point:', error);
      return null;
    }

    return data;
  },

  getLatestTouchPointsForProfiles: async (profileIds: string[]): Promise<Map<string, TouchPoint>> => {
    const result = new Map<string, TouchPoint>();

    if (profileIds.length === 0) return result;

    // Get all touch points for these profiles
    const { data, error } = await supabase
      .from('touch_points')
      .select('*')
      .in('profile_id', profileIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching touch points:', error);
      return result;
    }

    // Keep only the latest for each profile
    for (const tp of data || []) {
      if (!result.has(tp.profile_id)) {
        result.set(tp.profile_id, tp);
      }
    }

    return result;
  },

  addTouchPoint: async (touchPoint: Omit<TouchPoint, 'id' | 'created_at'>): Promise<TouchPoint | null> => {
    const { data, error } = await supabase
      .from('touch_points')
      .insert(touchPoint)
      .select()
      .single();

    if (error) {
      console.error('Error adding touch point:', error);
      alert('خطا در ثبت وضعیت');
      return null;
    }

    return data;
  }
};
