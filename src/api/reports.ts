import { supabase } from '@/lib/supabase';
import type { Report } from '@/types';

export async function createReport(params: {
  reporter_id: string;
  reportable_type: Report['reportable_type'];
  reportable_id: string;
  reason?: string | null;
}) {
  const { data, error } = await supabase
    .from('reports')
    .insert(params)
    .select()
    .single();

  if (error) throw error;
  return data;
}
