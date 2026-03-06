import { supabase } from '@/lib/supabase';
import type { Dog } from '@/types';

export async function getDogsByOwner(ownerId: string): Promise<Dog[]> {
  const { data, error } = await supabase
    .from('dogs')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Dog[];
}

export async function getDogById(dogId: string): Promise<Dog | null> {
  const { data, error } = await supabase
    .from('dogs')
    .select('*')
    .eq('id', dogId)
    .single();

  if (error) return null;
  return data as Dog;
}

export async function getDogByOwner(ownerId: string): Promise<Dog | null> {
  const dogs = await getDogsByOwner(ownerId);
  return dogs[0] ?? null;
}

export async function createDog(
  ownerId: string,
  dog: {
    name: string;
    breed: Dog['breed'];
    age_group: Dog['age_group'];
    energy_level: Dog['energy_level'];
    dog_image_url?: string | null;
  }
) {
  const { data, error } = await supabase
    .from('dogs')
    .insert({
      owner_id: ownerId,
      ...dog,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Dog;
}

export async function updateDog(
  dogId: string,
  ownerId: string,
  updates: Partial<Pick<Dog, 'name' | 'breed' | 'age_group' | 'energy_level' | 'dog_image_url'>>
) {
  const { data, error } = await supabase
    .from('dogs')
    .update(updates)
    .eq('id', dogId)
    .eq('owner_id', ownerId)
    .select()
    .single();

  if (error) throw error;
  return data as Dog;
}

export async function deleteDog(dogId: string, ownerId: string) {
  const { error } = await supabase
    .from('dogs')
    .delete()
    .eq('id', dogId)
    .eq('owner_id', ownerId);

  if (error) throw error;
}
