jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

import { supabase } from '@/lib/supabase';
import { getSavedPlaces, isPlaceSaved, savePlace, unsavePlace } from '@/api/savedPlaces';
import type { Place } from '@/types';

const mockFrom = supabase.from as jest.Mock;

function makeChain(overrides: Record<string, jest.Mock> = {}) {
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    ...overrides,
  };
  return chain;
}

const stubPlace: Place = {
  id: 'place-1',
  name: 'Ocean Beach Dog Beach',
  slug: 'ocean-beach-dog-beach',
  google_place_id: null,
  place_type: 'dog_beach',
  city: 'San Francisco',
  neighborhood: 'Ocean Beach',
  latitude: 37.7597,
  longitude: -122.5108,
  check_in_radius_meters: 400,
  check_in_duration_minutes: 60,
  description: null,
  is_active: true,
  supports_check_in: true,
  photos: [],
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

describe('savedPlaces API', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('savePlace', () => {
    it('calls upsert with user_id and place_id', async () => {
      const chain = makeChain({
        upsert: jest.fn().mockResolvedValue({ error: null }),
      });
      mockFrom.mockReturnValue(chain);

      await savePlace('user-1', 'place-1');

      expect(mockFrom).toHaveBeenCalledWith('user_place_saves');
      expect(chain.upsert).toHaveBeenCalledWith(
        { user_id: 'user-1', place_id: 'place-1' },
        { onConflict: 'user_id,place_id' }
      );
    });

    it('throws when supabase returns an error', async () => {
      const chain = makeChain({
        upsert: jest.fn().mockResolvedValue({ error: new Error('DB error') }),
      });
      mockFrom.mockReturnValue(chain);

      await expect(savePlace('user-1', 'place-1')).rejects.toThrow('DB error');
    });
  });

  describe('unsavePlace', () => {
    it('calls delete with user_id and place_id', async () => {
      const chain = makeChain({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      });
      // Last eq call resolves the chain
      let eqCallCount = 0;
      chain.eq.mockImplementation(() => {
        eqCallCount += 1;
        if (eqCallCount === 2) return Promise.resolve({ error: null });
        return chain;
      });
      mockFrom.mockReturnValue(chain);

      await unsavePlace('user-1', 'place-1');

      expect(mockFrom).toHaveBeenCalledWith('user_place_saves');
      expect(chain.delete).toHaveBeenCalled();
    });
  });

  describe('getSavedPlaces', () => {
    it('returns Place[] from the joined select', async () => {
      const rows = [{ places: stubPlace }];
      const chain = makeChain({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: rows, error: null }),
      });
      mockFrom.mockReturnValue(chain);

      const result = await getSavedPlaces('user-1');

      expect(mockFrom).toHaveBeenCalledWith('user_place_saves');
      expect(chain.select).toHaveBeenCalledWith('place_id, places(*)');
      expect(result).toEqual([stubPlace]);
    });

    it('returns empty array when user has no saves', async () => {
      const chain = makeChain({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      });
      mockFrom.mockReturnValue(chain);

      const result = await getSavedPlaces('user-1');
      expect(result).toEqual([]);
    });
  });

  describe('isPlaceSaved', () => {
    it('returns true when a row exists', async () => {
      const chain = makeChain({
        maybeSingle: jest.fn().mockResolvedValue({ data: { place_id: 'place-1' }, error: null }),
      });
      mockFrom.mockReturnValue(chain);

      const result = await isPlaceSaved('user-1', 'place-1');
      expect(result).toBe(true);
    });

    it('returns false when no row exists', async () => {
      const chain = makeChain({
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      });
      mockFrom.mockReturnValue(chain);

      const result = await isPlaceSaved('user-1', 'place-1');
      expect(result).toBe(false);
    });
  });
});
