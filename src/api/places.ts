import { supabase, supabaseUrl } from '@/lib/supabase';
import type {
  ActivePlaceCheckin,
  BreedEnum,
  DogLocationCheckin,
  GooglePlaceCandidate,
  GooglePlacePreview,
  Place,
} from '@/types';

function normalizeGooglePlaceText(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function googlePlaceSignature(place: GooglePlaceCandidate): string {
  return [
    normalizeGooglePlaceText(place.name),
    normalizeGooglePlaceText(place.formattedAddress),
    normalizeGooglePlaceText(place.neighborhood),
    normalizeGooglePlaceText(place.city),
  ].join('|');
}

function dedupeGooglePlaceCandidates(places: GooglePlaceCandidate[]): GooglePlaceCandidate[] {
  const seenIds = new Set<string>();
  const seenSignatures = new Set<string>();

  return places.filter((place) => {
    const normalizedId = normalizeGooglePlaceText(place.googlePlaceId);
    const signature = googlePlaceSignature(place);

    if (normalizedId && seenIds.has(normalizedId)) return false;
    if (seenSignatures.has(signature)) return false;

    if (normalizedId) seenIds.add(normalizedId);
    seenSignatures.add(signature);
    return true;
  });
}

async function throwFunctionError(error: unknown): Promise<never> {
  const context = (error as { context?: unknown }).context;
  if (context instanceof Response) {
    try {
      const body = await context.json();
      const message =
        typeof body?.error === 'string'
          ? body.error
          : `Edge Function failed with status ${context.status}`;
      throw new Error(message);
    } catch (parseError) {
      if (parseError instanceof Error && parseError.message !== 'Unexpected end of JSON input') {
        throw parseError;
      }
    }
  }

  if (error instanceof Error) throw error;
  throw new Error('Edge Function failed');
}

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

export async function searchGooglePlaces(query: string): Promise<GooglePlaceCandidate[]> {
  return searchGooglePlacesWithOptions({ query });
}

export async function searchGooglePlacesWithOptions({
  query,
  latitude,
  longitude,
}: {
  query: string;
  latitude?: number | null;
  longitude?: number | null;
}): Promise<GooglePlaceCandidate[]> {
  const { data, error } = await supabase.functions.invoke<{ places: GooglePlaceCandidate[] }>(
    'google-places',
    {
      body: { action: 'search', query, latitude: latitude ?? null, longitude: longitude ?? null },
    }
  );

  if (error) await throwFunctionError(error);
  return dedupeGooglePlaceCandidates(data?.places ?? []);
}

export async function getGooglePlacePreview(googlePlaceId: string): Promise<GooglePlacePreview> {
  const { data, error } = await supabase.functions.invoke<{ place: GooglePlacePreview }>(
    'google-places',
    {
      body: { action: 'details', googlePlaceId },
    }
  );

  if (error) await throwFunctionError(error);
  if (!data?.place) throw new Error('Google place details did not return a place');
  return data.place;
}

export function getGooglePlacePhotoUrl(photoName: string, accessToken: string): string {
  const params = new URLSearchParams({
    action: 'photo',
    name: photoName,
    access_token: accessToken,
  });
  return `${supabaseUrl}/functions/v1/google-places?${params.toString()}`;
}

export async function importGooglePlace(googlePlaceId: string, bannerPhotoName?: string | null): Promise<Place> {
  const { data, error } = await supabase.functions.invoke<{ place: Place }>('google-places', {
    body: { action: 'import', googlePlaceId, bannerPhotoName: bannerPhotoName ?? null },
  });

  if (error) await throwFunctionError(error);
  if (!data?.place) throw new Error('Google place import did not return a place');
  return data.place;
}

export async function getNearbyGooglePlaces({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}): Promise<GooglePlaceCandidate[]> {
  const { data, error } = await supabase.functions.invoke<{ places: GooglePlaceCandidate[] }>(
    'google-places',
    {
      body: { action: 'nearby', latitude, longitude },
    }
  );

  if (error) await throwFunctionError(error);
  return dedupeGooglePlaceCandidates(data?.places ?? []);
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

/**
 * Returns a map of placeId → number of currently active dog check-ins.
 * "Active" means ended_at IS NULL and expires_at > now().
 * Each row represents one dog check-in, so the count = number of dogs.
 * Places with zero active check-ins are omitted (default to 0 at call-site).
 */
export async function getActivePlaceCheckinCounts(
  placeIds: string[]
): Promise<Record<string, number>> {
  if (placeIds.length === 0) return {};

  const { data, error } = await supabase
    .from('dog_location_checkins')
    .select('place_id')
    .in('place_id', placeIds)
    .is('ended_at', null)
    .gt('expires_at', new Date().toISOString());

  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as Array<{ place_id: string | null }>) {
    if (row.place_id) {
      counts[row.place_id] = (counts[row.place_id] ?? 0) + 1;
    }
  }
  return counts;
}

export async function getPlacePopularitySignals(
  placeIds: string[]
): Promise<Record<string, { savedCount: number; checkinCount: number }>> {
  if (placeIds.length === 0) return {};

  const [savesRes, checkinsRes] = await Promise.all([
    supabase.from('user_place_saves').select('place_id').in('place_id', placeIds),
    supabase.from('dog_location_checkins').select('place_id').in('place_id', placeIds),
  ]);

  if (savesRes.error) throw savesRes.error;
  if (checkinsRes.error) throw checkinsRes.error;

  const popularity: Record<string, { savedCount: number; checkinCount: number }> = {};
  for (const placeId of placeIds) {
    popularity[placeId] = { savedCount: 0, checkinCount: 0 };
  }

  for (const row of (savesRes.data ?? []) as Array<{ place_id: string | null }>) {
    if (!row.place_id || !popularity[row.place_id]) continue;
    popularity[row.place_id].savedCount += 1;
  }

  for (const row of (checkinsRes.data ?? []) as Array<{ place_id: string | null }>) {
    if (!row.place_id || !popularity[row.place_id]) continue;
    popularity[row.place_id].checkinCount += 1;
  }

  return popularity;
}
