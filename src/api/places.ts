import { supabase } from '@/lib/supabase';
import type { ActivePlaceCheckin, BreedEnum, DogLocationCheckin, Place } from '@/types';

export async function getPlaceBySlug(slug: string): Promise<Place> {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) throw error;
  return data as Place;
}

export async function getPlaceById(id: string): Promise<Place> {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Place;
}

export async function listActivePlaces(): Promise<Place[]> {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Place[];
}

export async function getActivePlaceCheckins(placeId: string): Promise<ActivePlaceCheckin[]> {
  const { data: activeRows, error } = await supabase
    .from('dog_location_checkins')
    .select('*')
    .eq('place_id', placeId)
    .is('ended_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;

  const rows = (activeRows ?? []) as DogLocationCheckin[];
  if (rows.length === 0) return [];

  const dogIds = [...new Set(rows.map((row) => row.dog_id))];
  const ownerIds = [...new Set(rows.map((row) => row.user_id))];

  const [dogsRes, ownersRes] = await Promise.all([
    supabase
      .from('dogs')
      .select('id, name, breed, play_style, dog_image_url')
      .in('id', dogIds),
    supabase
      .from('profiles')
      .select('id, name')
      .in('id', ownerIds),
  ]);

  if (dogsRes.error) throw dogsRes.error;
  if (ownersRes.error) throw ownersRes.error;

  const dogMap = new Map(
    (dogsRes.data ?? []).map((dog) => [
      dog.id,
      {
        name: dog.name,
        breed: dog.breed as BreedEnum,
        play_style: dog.play_style,
        dog_image_url: dog.dog_image_url,
      },
    ])
  );
  const ownerMap = new Map((ownersRes.data ?? []).map((owner) => [owner.id, owner.name]));

  return rows
    .map((row) => {
      const dog = dogMap.get(row.dog_id);
      if (!dog) return null;
      return {
        ...row,
        dog_name: dog.name,
        dog_breed: dog.breed,
        dog_play_style: dog.play_style,
        dog_image_url: dog.dog_image_url,
        owner_name: ownerMap.get(row.user_id) ?? null,
      } satisfies ActivePlaceCheckin;
    })
    .filter((checkin): checkin is ActivePlaceCheckin => checkin !== null);
}

export async function getMyActivePlaceCheckin(
  placeId: string,
  userId: string
): Promise<DogLocationCheckin | null> {
  const rows = await getMyActivePlaceCheckins(placeId, userId);
  return rows[0] ?? null;
}

export async function getMyActivePlaceCheckins(
  placeId: string,
  userId: string
): Promise<DogLocationCheckin[]> {
  const { data, error } = await supabase
    .from('dog_location_checkins')
    .select('*')
    .eq('place_id', placeId)
    .eq('user_id', userId)
    .is('ended_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as DogLocationCheckin[];
}

export async function checkIntoPlace(
  placeId: string,
  userId: string,
  dogIds: string[],
  durationMinutes = 60
): Promise<DogLocationCheckin[]> {
  const uniqueDogIds = Array.from(new Set(dogIds));
  if (uniqueDogIds.length === 0) return [];

  // Fetch place to get name for the denormalized location_name field
  const place = await getPlaceById(placeId);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + durationMinutes * 60_000);

  // Clean up any existing open rows for these dogs so partial unique indexes stay satisfied.
  const { error: cleanupError } = await supabase
    .from('dog_location_checkins')
    .update({ ended_at: now.toISOString() })
    .eq('user_id', userId)
    .eq('place_id', placeId)
    .in('dog_id', uniqueDogIds)
    .is('ended_at', null);
  if (cleanupError) throw cleanupError;

  const { data, error } = await supabase
    .from('dog_location_checkins')
    .insert(
      uniqueDogIds.map((dogId) => ({
        user_id: userId,
        dog_id: dogId,
        place_id: placeId,
        location_key: place.slug,
        location_name: place.name,
        expires_at: expiresAt.toISOString(),
      }))
    )
    .select('*');

  if (error) throw error;
  return (data ?? []) as DogLocationCheckin[];
}

export async function endPlaceCheckins(checkinIds: string[], userId: string): Promise<void> {
  if (checkinIds.length === 0) return;

  const { error } = await supabase
    .from('dog_location_checkins')
    .update({ ended_at: new Date().toISOString() })
    .in('id', checkinIds)
    .eq('user_id', userId)
    .is('ended_at', null);
  if (error) throw error;
}

export function getPlaceBreedCounts(
  checkins: ActivePlaceCheckin[]
): Array<{ breed: BreedEnum; count: number }> {
  const counts = new Map<BreedEnum, number>();
  for (const checkin of checkins) {
    counts.set(checkin.dog_breed, (counts.get(checkin.dog_breed) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([breed, count]) => ({ breed, count }))
    .sort((a, b) => b.count - a.count);
}
