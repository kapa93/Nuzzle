/**
 * Compatibility shim — all logic now lives in src/api/places.ts.
 * These re-exports preserve the old function names so existing tests and any
 * remaining call-sites continue to work without changes.
 */
export {
  getActivePlaceCheckins as getActiveDogBeachCheckins,
  getMyActivePlaceCheckin as getMyActiveDogBeachCheckin,
  getMyActivePlaceCheckins as getMyActiveDogBeachCheckins,
  endPlaceCheckins as endDogBeachCheckin,
  endPlaceCheckins as endDogBeachCheckins,
  getPlaceBreedCounts as getDogBeachBreedCounts,
} from '@/api/places';

import {
  checkIntoPlace,
  getPlaceBySlug,
} from '@/api/places';
import { OB_DOG_BEACH_SLUG } from '@/config/places';
import type { DogLocationCheckin } from '@/types';

/**
 * @deprecated Use checkIntoPlace() from @/api/places directly.
 * Kept for backward-compat: checks in to the OB Dog Beach place.
 */
export async function createDogBeachCheckin(
  userId: string,
  dogId: string
): Promise<DogLocationCheckin> {
  const rows = await createDogBeachCheckins(userId, [dogId]);
  return rows[0];
}

/**
 * @deprecated Use checkIntoPlace() from @/api/places directly.
 * Kept for backward-compat: checks in to the OB Dog Beach place.
 */
export async function createDogBeachCheckins(
  userId: string,
  dogIds: string[]
): Promise<DogLocationCheckin[]> {
  const place = await getPlaceBySlug(OB_DOG_BEACH_SLUG);
  return checkIntoPlace(place.id, userId, dogIds, place.check_in_duration_minutes);
}
