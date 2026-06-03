jest.mock('@/lib/supabase', () => ({
  supabaseUrl: 'https://example.supabase.co',
  supabase: {
    from: jest.fn(),
    functions: { invoke: jest.fn() },
  },
}));

import { supabase } from '@/lib/supabase';
import {
  getActivePlaceCheckinCounts,
  getGooglePlacePhotoUrl,
  getGooglePlacePreview,
  importGooglePlace,
  searchGooglePlaces,
} from '../places';

const mockFrom = supabase.from as jest.Mock;
const mockInvoke = supabase.functions.invoke as jest.Mock;

function buildCountChain(rows: Array<{ place_id: string | null }> | null, error: Error | null = null) {
  return {
    select: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    gt: jest.fn().mockResolvedValue({ data: rows, error }),
  };
}

describe('getActivePlaceCheckinCounts', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns an empty object when placeIds is empty (no DB call)', async () => {
    const result = await getActivePlaceCheckinCounts([]);
    expect(result).toEqual({});
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('returns an empty object when no active check-ins exist for the given places', async () => {
    mockFrom.mockReturnValue(buildCountChain([]));
    const result = await getActivePlaceCheckinCounts(['place-1', 'place-2']);
    expect(result).toEqual({});
  });

  it('counts active check-in rows per place correctly', async () => {
    const rows = [
      { place_id: 'place-1' },
      { place_id: 'place-1' },
      { place_id: 'place-2' },
    ];
    mockFrom.mockReturnValue(buildCountChain(rows));
    const result = await getActivePlaceCheckinCounts(['place-1', 'place-2']);
    expect(result).toEqual({ 'place-1': 2, 'place-2': 1 });
  });

  it('skips rows with a null place_id', async () => {
    const rows = [
      { place_id: 'place-1' },
      { place_id: null },
    ];
    mockFrom.mockReturnValue(buildCountChain(rows));
    const result = await getActivePlaceCheckinCounts(['place-1']);
    expect(result).toEqual({ 'place-1': 1 });
  });

  it('throws when the query errors', async () => {
    mockFrom.mockReturnValue(buildCountChain(null, new Error('db error')));
    await expect(getActivePlaceCheckinCounts(['place-1'])).rejects.toThrow('db error');
  });
});

describe('Google Places wrappers', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns Google place candidates from the Edge Function', async () => {
    const places = [
      {
        googlePlaceId: 'google-1',
        name: 'Balboa Park',
        formattedAddress: 'San Diego, CA',
        latitude: 32.7341,
        longitude: -117.1446,
        city: 'San Diego',
        neighborhood: null,
        placeType: 'park',
        types: ['park'],
      },
    ];
    mockInvoke.mockResolvedValue({ data: { places }, error: null });

    const result = await searchGooglePlaces('balboa');

    expect(result).toEqual(places);
    expect(mockInvoke).toHaveBeenCalledWith('google-places', {
      body: { action: 'search', query: 'balboa', latitude: null, longitude: null },
    });
  });

  it('returns an empty array when Google search returns no payload', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: null });

    await expect(searchGooglePlaces('missing')).resolves.toEqual([]);
  });

  it('dedupes Google place candidates by id and normalized place identity', async () => {
    const places = [
      {
        googlePlaceId: 'google-1',
        name: 'Dusty Rhodes Park',
        formattedAddress: 'Point Loma, San Diego, CA',
        latitude: 32.7001,
        longitude: -117.2444,
        city: 'San Diego',
        neighborhood: 'Point Loma',
        placeType: 'park',
        types: ['park'],
      },
      {
        googlePlaceId: 'google-1',
        name: 'Dusty Rhodes Park',
        formattedAddress: 'Point Loma, San Diego, CA',
        latitude: 32.7001,
        longitude: -117.2444,
        city: 'San Diego',
        neighborhood: 'Point Loma',
        placeType: 'park',
        types: ['park'],
      },
      {
        googlePlaceId: 'google-2',
        name: '  dusty rhodes park ',
        formattedAddress: 'point loma, san diego, ca',
        latitude: 32.7002,
        longitude: -117.2443,
        city: 'san diego',
        neighborhood: 'point loma',
        placeType: 'park',
        types: ['park'],
      },
    ];
    mockInvoke.mockResolvedValue({ data: { places }, error: null });

    const result = await searchGooglePlaces('dusty rhodes park');

    expect(result).toEqual([places[0]]);
  });

  it('returns the imported place from the Edge Function', async () => {
    const place = {
      id: 'place-1',
      name: 'Balboa Park',
      slug: 'balboa-park-google1',
      google_place_id: 'google-1',
      place_type: 'park',
      city: 'San Diego',
      neighborhood: null,
      latitude: 32.7341,
      longitude: -117.1446,
      check_in_radius_meters: 400,
      check_in_duration_minutes: 60,
      description: 'San Diego, CA',
      is_active: true,
      status: 'active' as const,
      supports_check_in: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };
    mockInvoke.mockResolvedValue({ data: { place }, error: null });

    const result = await importGooglePlace('google-1');

    expect(result).toEqual(place);
    expect(mockInvoke).toHaveBeenCalledWith('google-places', {
      body: { action: 'import', googlePlaceId: 'google-1', bannerPhotoName: null },
    });
  });

  it('returns Google place preview details from the Edge Function', async () => {
    const place = {
      googlePlaceId: 'google-1',
      name: 'Balboa Park',
      displayName: 'Balboa Park',
      formattedAddress: 'San Diego, CA',
      shortFormattedAddress: 'San Diego, CA',
      currentOpeningHours: { weekdayDescriptions: ['Monday: 8:00 AM - 5:00 PM'] },
      attributions: [{ displayName: 'Google' }],
      photos: [{ name: 'places/google-1/photos/photo-1', widthPx: 100, heightPx: 100, authorAttributions: [] }],
      rating: 4.8,
      ratingCount: 102,
      openNow: true,
      latitude: 32.7341,
      longitude: -117.1446,
      city: 'San Diego',
      neighborhood: null,
      placeType: 'park',
      types: ['park'],
    };
    mockInvoke.mockResolvedValue({ data: { place }, error: null });

    const result = await getGooglePlacePreview('google-1');

    expect(result).toEqual(place);
    expect(mockInvoke).toHaveBeenCalledWith('google-places', {
      body: { action: 'details', googlePlaceId: 'google-1' },
    });
  });

  it('builds Google place photo proxy URLs', () => {
    expect(getGooglePlacePhotoUrl('places/google-1/photos/photo-1', 'access-token')).toBe(
      'https://example.supabase.co/functions/v1/google-places?action=photo&name=places%2Fgoogle-1%2Fphotos%2Fphoto-1'
    );
  });

  it('throws when import does not return a place', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: null });

    await expect(importGooglePlace('google-1')).rejects.toThrow(
      'Google place import did not return a place'
    );
  });

  it('throws Edge Function errors', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: new Error('function failed') });

    await expect(searchGooglePlaces('balboa')).rejects.toThrow('function failed');
  });

  it('passes location options to Google search invocation', async () => {
    mockInvoke.mockResolvedValue({ data: { places: [] }, error: null });

    await searchGooglePlaces('balboa');

    expect(mockInvoke).toHaveBeenCalledWith('google-places', {
      body: { action: 'search', query: 'balboa', latitude: null, longitude: null },
    });
  });
});
