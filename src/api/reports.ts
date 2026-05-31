import { supabase } from '@/lib/supabase';
import type { Report } from '@/types';

export async function createReport(params: {
  reporter_id: string;
  reportable_type: Report['reportable_type'];
  reportable_id: string;
  reason?: string | null;
}): Promise<void> {
  const { error } = await supabase.from('reports').insert(params);

  // 23505 = unique_violation — user already reported this content, ignore silently
  if (error && error.code !== '23505') throw error;
}
