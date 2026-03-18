import { supabase } from '@/lib/supabase';
import type { Dog, DogInteraction, DogInteractionSourceType, DogMetSummary } from '@/types';
import { buildDogsMetSummaries, RAPID_DUPLICATE_WINDOW_MS, toCanonicalDogPair } from '@/api/dogInteractions.helpers';

export async function getRecentlyMetDogIds({
  dogIds,
  targetDogId,
}: {
  dogIds: string[];
  targetDogId: string;
}): Promise<string[]> {
  const uniqueDogIds = Array.from(new Set(dogIds.filter((dogId) => dogId !== targetDogId)));
  if (uniqueDogIds.length === 0) return [];

  const duplicateCutoff = new Date(Date.now() - RAPID_DUPLICATE_WINDOW_MS).toISOString();
  const { data, error } = await supabase
    .from('dog_interactions')
    .select('dog_id_1, dog_id_2')
    .or(`dog_id_1.eq.${targetDogId},dog_id_2.eq.${targetDogId}`)
    .gte('created_at', duplicateCutoff);

  if (error) throw error;

  const recentlyMetDogIds = new Set<string>();
  for (const interaction of data ?? []) {
    const otherDogId = interaction.dog_id_1 === targetDogId ? interaction.dog_id_2 : interaction.dog_id_1;
    if (uniqueDogIds.includes(otherDogId)) {
      recentlyMetDogIds.add(otherDogId);
    }
  }

  return uniqueDogIds.filter((dogId) => recentlyMetDogIds.has(dogId));
}

export async function createDogInteractions({
  dogIds,
  metDogId,
  createdByUserId,
  locationName = null,
  sourceType = 'manual',
}: {
  dogIds: string[];
  metDogId: string;
  createdByUserId: string;
  locationName?: string | null;
  sourceType?: DogInteractionSourceType;
}): Promise<Array<{ interaction: DogInteraction; wasDuplicate: boolean }>> {
  const uniqueDogIds = Array.from(new Set(dogIds.filter((dogId) => dogId !== metDogId)));

  return Promise.all(
    uniqueDogIds.map((dogId) =>
      createDogInteraction({
        dogId,
        metDogId,
        createdByUserId,
        locationName,
        sourceType,
      })
    )
  );
}

export async function createDogInteraction({
  dogId,
  metDogId,
  createdByUserId,
  locationName = null,
  sourceType = 'manual',
}: {
  dogId: string;
  metDogId: string;
  createdByUserId: string;
  locationName?: string | null;
  sourceType?: DogInteractionSourceType;
}): Promise<{ interaction: DogInteraction; wasDuplicate: boolean }> {
  if (dogId === metDogId) {
    throw new Error('A dog cannot meet itself.');
  }

  const pair = toCanonicalDogPair(dogId, metDogId);
  const duplicateCutoff = new Date(Date.now() - RAPID_DUPLICATE_WINDOW_MS).toISOString();

  const { data: existingRecent, error: existingError } = await supabase
    .from('dog_interactions')
    .select('*')
    .eq('dog_id_1', pair.dog_id_1)
    .eq('dog_id_2', pair.dog_id_2)
    .gte('created_at', duplicateCutoff)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existingRecent) {
    return {
      interaction: existingRecent as DogInteraction,
      wasDuplicate: true,
    };
  }

  const { data, error } = await supabase
    .from('dog_interactions')
    .insert({
      ...pair,
      created_by_user_id: createdByUserId,
      location_name: locationName,
      source_type: sourceType,
    })
    .select('*')
    .single();

  if (error) throw error;

  return {
    interaction: data as DogInteraction,
    wasDuplicate: false,
  };
}

export async function getDogsMetByDog(dogId: string): Promise<DogMetSummary[]> {
  const { data, error } = await supabase
    .from('dog_interactions')
    .select('*')
    .or(`dog_id_1.eq.${dogId},dog_id_2.eq.${dogId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const interactions = (data ?? []) as DogInteraction[];
  if (interactions.length === 0) return [];
  const otherDogIds = Array.from(
    new Set(
      interactions.map((interaction) =>
        interaction.dog_id_1 === dogId ? interaction.dog_id_2 : interaction.dog_id_1
      )
    )
  );
  const { data: dogsData, error: dogsError } = await supabase
    .from('dogs')
    .select('*')
    .in('id', otherDogIds);

  if (dogsError) throw dogsError;

  return buildDogsMetSummaries({
    dogId,
    interactions,
    dogs: (dogsData ?? []) as Dog[],
  });
}
