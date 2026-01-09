import { SupabaseClient } from '@supabase/supabase-js';

export async function checkUserStaffStatus(supabase: SupabaseClient) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 'user';

    // 🚀 CRITICAL CHANGE: Query the VIEW, not the table
    const { data, error } = await supabase
      .from('staff_public_lookup') 
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error("🔍 View Query Error:", error.message);
      return 'user';
    }

    return data?.role || 'user';
  } catch (err) {
    return 'user';
  }
}