import { supabase } from '@/lib/supabase';
import type { Place } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Outcome returned by the edge function's `suggest` action. */
export type SuggestionStatus = 'suggested' | 'already_pending' | 'already_active';

/** Outcome returned by markCommunityInterest. */
export type MarkInterestResult = 'added' | 'already_interested';

/** Unified outcome returned to the screen after suggestLocalCommunity. */
export type SuggestOutcome =
  | { kind: 'navigated_to_active'; place: Place }
  | { kind: 'suggested'; place: Place }
  | { kind: 'already_interested'; place: Place };

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function throwFunctionError(error: unknown): Promise<never> {
  const context = (error as { context?: unknown }).context;
  if (context instanceof Response) {
    try {
      const body = await context.json();
      const message =
        typeof body?.error === 'string'
          ? body.error
          : `Edge Function failed with status ${(context as Response).status}`;
      throw new Error(message);
    } catch (parseError) {
      if (
        parseError instanceof Error &&
        parseError.message !== 'Unexpected end of JSON input'
      ) {
        throw parseError;
      }
    }
  }
  if (error instanceof Error) throw error;
  throw new Error('Edge Function failed');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calls the `suggest` edge-function action to get or create a pending community
 * record for the given Google place.  Does NOT touch active communities — if one
 * already exists the edge function returns it unchanged.
 */
export async function getOrCreatePendingCommunity(
  googlePlaceId: string,
  bannerPhotoName?: string | null,
): Promise<{ place: Place; suggestionStatus: SuggestionStatus }> {
  const { data, error } = await supabase.functions.invoke<{
    place: Place;
    suggestionStatus: SuggestionStatus;
  }>('google-places', {
    body: {
      action: 'suggest',
      googlePlaceId,
      bannerPhotoName: bannerPhotoName ?? null,
    },
  });

  if (error) await throwFunctionError(error);
  if (!data?.place) throw new Error('Community suggestion did not return a place');
  return { place: data.place, suggestionStatus: data.suggestionStatus };
}

/** Removes the current user's interest in a pending community. No-op if not interested. */
export async function removeCommunityInterest(
  placeId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from('place_community_interests')
    .delete()
    .eq('place_id', placeId)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Records that `userId` is interested in the pending community for `placeId`.
 * Idempotent — duplicate inserts are detected via the unique constraint and
 * resolve to `'already_interested'` rather than throwing.
 */
export async function markCommunityInterest(
  placeId: string,
  userId: string,
): Promise<MarkInterestResult> {
  const { error } = await supabase
    .from('place_community_interests')
    .insert({ place_id: placeId, user_id: userId });

  if (error) {
    // 23505 = unique_violation — the user already expressed interest.
    if (error.code === '23505') return 'already_interested';
    throw error;
  }
  return 'added';
}

/**
 * High-level orchestrator used by the UI.
 *
 * 1. If an active community already exists for the place → returns
 *    `navigated_to_active` so the screen can open it directly.
 * 2. If the community is pending (or was just created as pending) →
 *    records user interest and returns `suggested` or `already_interested`.
 *
 * Handles unauthenticated callers by throwing before any network call.
 */
export async function suggestLocalCommunity(
  googlePlaceId: string,
  bannerPhotoName: string | null,
  userId: string,
): Promise<SuggestOutcome> {
  const { place, suggestionStatus } = await getOrCreatePendingCommunity(
    googlePlaceId,
    bannerPhotoName,
  );

  if (suggestionStatus === 'already_active') {
    return { kind: 'navigated_to_active', place };
  }

  const interestResult = await markCommunityInterest(place.id, userId);

  if (interestResult === 'already_interested') {
    return { kind: 'already_interested', place };
  }
  return { kind: 'suggested', place };
}
