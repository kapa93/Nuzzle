jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

import { supabase } from '@/lib/supabase';
import { getDogsByOwner, getDogById, getDogByOwner, createDog, updateDog, deleteDog } from './dogs';

const mockFrom = supabase.from as jest.Mock;

// ─── helpers ─────────────────────────────────────────────────────────────────

function buildChain(finalResult: object) {
  const chain = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue(finalResult),
    single: jest.fn().mockResolvedValue(finalResult),
  };
  return chain;
}

const DOG_FIXTURE = {
  id: 'dog-1',
  owner_id: 'user-1',
  name: 'Buddy',
  breed: 'GOLDEN_RETRIEVER' as const,
  age_group: 'ADULT' as const,
  energy_level: 'HIGH' as const,
  created_at: '2024-01-01T00:00:00Z',
};

// ─── getDogsByOwner ───────────────────────────────────────────────────────────

describe('getDogsByOwner', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns dogs for an owner', async () => {
    const chain = buildChain({ data: [DOG_FIXTURE], error: null });
    mockFrom.mockReturnValue(chain);

    const result = await getDogsByOwner('user-1');
    expect(mockFrom).toHaveBeenCalledWith('dogs');
    expect(chain.eq).toHaveBeenCalledWith('owner_id', 'user-1');
    expect(result).toEqual([DOG_FIXTURE]);
  });

  it('returns an empty array when the owner has no dogs', async () => {
    const chain = buildChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const result = await getDogsByOwner('user-1');
    expect(result).toEqual([]);
  });

  it('throws when the query errors', async () => {
    const chain = buildChain({ data: null, error: new Error('fetch failed') });
    mockFrom.mockReturnValue(chain);

    await expect(getDogsByOwner('user-1')).rejects.toThrow('fetch failed');
  });
});

// ─── getDogById ───────────────────────────────────────────────────────────────

describe('getDogById', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the dog when found', async () => {
    const chain = buildChain(null);
    chain.single.mockResolvedValue({ data: DOG_FIXTURE, error: null });
    mockFrom.mockReturnValue(chain);

    const result = await getDogById('dog-1');
    expect(mockFrom).toHaveBeenCalledWith('dogs');
    expect(chain.eq).toHaveBeenCalledWith('id', 'dog-1');
    expect(result).toEqual(DOG_FIXTURE);
  });

  it('returns null when the query errors (dog not found)', async () => {
    const chain = buildChain(null);
    chain.single.mockResolvedValue({ data: null, error: new Error('not found') });
    mockFrom.mockReturnValue(chain);

    const result = await getDogById('dog-999');
    expect(result).toBeNull();
  });
});

// ─── getDogByOwner ────────────────────────────────────────────────────────────

describe('getDogByOwner', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the first dog when the owner has dogs', async () => {
    const chain = buildChain({ data: [DOG_FIXTURE], error: null });
    mockFrom.mockReturnValue(chain);

    const result = await getDogByOwner('user-1');
    expect(result).toEqual(DOG_FIXTURE);
  });

  it('returns null when the owner has no dogs', async () => {
    const chain = buildChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    const result = await getDogByOwner('user-1');
    expect(result).toBeNull();
  });
});

// ─── createDog ────────────────────────────────────────────────────────────────

describe('createDog', () => {
  beforeEach(() => jest.clearAllMocks());

  const newDogInput = {
    name: 'Buddy',
    breed: 'GOLDEN_RETRIEVER' as const,
    age_group: 'ADULT' as const,
    energy_level: 'HIGH' as const,
  };

  it('returns the created dog on success', async () => {
    const chain = buildChain(null);
    chain.single.mockResolvedValue({ data: DOG_FIXTURE, error: null });
    mockFrom.mockReturnValue(chain);

    const result = await createDog('user-1', newDogInput);
    expect(mockFrom).toHaveBeenCalledWith('dogs');
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ owner_id: 'user-1', name: 'Buddy' })
    );
    expect(result).toEqual(DOG_FIXTURE);
  });

  it('throws when the insert errors', async () => {
    const chain = buildChain(null);
    chain.single.mockResolvedValue({ data: null, error: new Error('insert failed') });
    mockFrom.mockReturnValue(chain);

    await expect(createDog('user-1', newDogInput)).rejects.toThrow('insert failed');
  });
});

// ─── updateDog ────────────────────────────────────────────────────────────────

describe('updateDog', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the updated dog on success', async () => {
    const updated = { ...DOG_FIXTURE, name: 'Max' };
    const chain = buildChain(null);
    chain.single.mockResolvedValue({ data: updated, error: null });
    mockFrom.mockReturnValue(chain);

    const result = await updateDog('dog-1', 'user-1', { name: 'Max' });
    expect(mockFrom).toHaveBeenCalledWith('dogs');
    expect(chain.update).toHaveBeenCalledWith({ name: 'Max' });
    expect(chain.eq).toHaveBeenCalledWith('id', 'dog-1');
    expect(chain.eq).toHaveBeenCalledWith('owner_id', 'user-1');
    expect(result).toEqual(updated);
  });

  it('throws when the update errors', async () => {
    const chain = buildChain(null);
    chain.single.mockResolvedValue({ data: null, error: new Error('update failed') });
    mockFrom.mockReturnValue(chain);

    await expect(updateDog('dog-1', 'user-1', { name: 'Max' })).rejects.toThrow('update failed');
  });
});

// ─── deleteDog ────────────────────────────────────────────────────────────────

describe('deleteDog', () => {
  beforeEach(() => jest.clearAllMocks());

  it('does not throw on successful delete', async () => {
    let callCount = 0;
    const chain = {
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount >= 2) return Promise.resolve({ error: null });
        return chain;
      }),
    };
    mockFrom.mockReturnValue(chain);

    await expect(deleteDog('dog-1', 'user-1')).resolves.not.toThrow();
  });

  it('throws when the delete errors', async () => {
    let callCount = 0;
    const chain = {
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount >= 2) return Promise.resolve({ error: new Error('delete failed') });
        return chain;
      }),
    };
    mockFrom.mockReturnValue(chain);

    await expect(deleteDog('dog-1', 'user-1')).rejects.toThrow('delete failed');
  });
});
