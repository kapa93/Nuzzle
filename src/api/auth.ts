import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

export async function signUp(email: string, password: string, name: string, city?: string) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, city },
    },
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('Sign up failed');

  // Profile is created via trigger, but we can upsert to ensure
  await supabase.from('profiles').upsert({
    id: authData.user.id,
    name: name || authData.user.email?.split('@')[0],
    email: authData.user.email ?? email,
    city: city ?? null,
  });

  return authData;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) return null;
  return data as Profile;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, 'name' | 'city'>>
) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}
