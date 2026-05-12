jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

import { supabase } from '@/lib/supabase';
import { setReaction, getReactionsByPost, getMyReaction } from './reactions';

const mockFrom = supabase.from as jest.Mock;

// ─── helpers ─────────────────────────────────────────────────────────────────

function buildChain(overrides: Record<string, unknown> = {}) {
  const chain: Record<string, unknown> = {
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
  };
  Object.assign(chain, overrides);
  // Make chained methods return `chain` so `.eq().eq()` etc. work.
  (chain.delete as jest.Mock).mockReturnValue(chain);
  (chain.upsert as jest.Mock).mockReturnValue(chain);
  (chain.select as jest.Mock).mockReturnValue(chain);
  (chain.eq as jest.Mock).mockReturnThis();
  return chain;
}

// ─── setReaction ─────────────────────────────────────────────────────────────

describe('setReaction', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deletes the reaction when reaction is null', async () => {
    const chain = buildChain();
    (chain.eq as jest.Mock)
      .mockReturnValueOnce(chain)
      .mockResolvedValueOnce({ error: null });
    mockFrom.mockReturnValue(chain);

    const result = await setReaction('post-1', 'user-1', null);
    expect(mockFrom).toHaveBeenCalledWith('post_reactions');
    expect(chain.delete).toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('throws when delete errors', async () => {
    const chain = buildChain();
    (chain.eq as jest.Mock)
      .mockReturnValueOnce(chain)
      .mockResolvedValueOnce({ error: new Error('delete failed') });
    mockFrom.mockReturnValue(chain);

    await expect(setReaction('post-1', 'user-1', null)).rejects.toThrow('delete failed');
  });

  it('upserts the reaction when reaction is provided', async () => {
    const reactionRecord = { post_id: 'post-1', user_id: 'user-1', reaction_type: 'LIKE' };
    const chain = buildChain();
    (chain.single as jest.Mock).mockResolvedValue({ data: reactionRecord, error: null });
    mockFrom.mockReturnValue(chain);

    const result = await setReaction('post-1', 'user-1', 'LIKE');
    expect(mockFrom).toHaveBeenCalledWith('post_reactions');
    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ post_id: 'post-1', user_id: 'user-1', reaction_type: 'LIKE' }),
      { onConflict: 'post_id,user_id' }
    );
    expect(result).toEqual(reactionRecord);
  });

  it('throws when upsert errors', async () => {
    const chain = buildChain();
    (chain.single as jest.Mock).mockResolvedValue({ data: null, error: new Error('upsert failed') });
    mockFrom.mockReturnValue(chain);

    await expect(setReaction('post-1', 'user-1', 'LOVE')).rejects.toThrow('upsert failed');
  });
});

// ─── getReactionsByPost ───────────────────────────────────────────────────────

describe('getReactionsByPost', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns reactions for a post', async () => {
    const reactions = [
      { post_id: 'post-1', user_id: 'user-1', reaction_type: 'LIKE' },
      { post_id: 'post-1', user_id: 'user-2', reaction_type: 'LOVE' },
    ];
    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: reactions, error: null }),
    };
    mockFrom.mockReturnValue(chain);

    const result = await getReactionsByPost('post-1');
    expect(mockFrom).toHaveBeenCalledWith('post_reactions');
    expect(chain.eq).toHaveBeenCalledWith('post_id', 'post-1');
    expect(result).toEqual(reactions);
  });

  it('returns an empty array when there are no reactions', async () => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
    mockFrom.mockReturnValue(chain);

    const result = await getReactionsByPost('post-1');
    expect(result).toEqual([]);
  });

  it('throws when the query errors', async () => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: null, error: new Error('db error') }),
    };
    mockFrom.mockReturnValue(chain);

    await expect(getReactionsByPost('post-1')).rejects.toThrow('db error');
  });
});

// ─── getMyReaction ────────────────────────────────────────────────────────────

describe('getMyReaction', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the user reaction type when found', async () => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: { reaction_type: 'HAHA' }, error: null }),
    };
    mockFrom.mockReturnValue(chain);

    const result = await getMyReaction('post-1', 'user-1');
    expect(result).toBe('HAHA');
    expect(chain.select).toHaveBeenCalledWith('reaction_type');
  });

  it('returns null when the user has not reacted', async () => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
    mockFrom.mockReturnValue(chain);

    const result = await getMyReaction('post-1', 'user-1');
    expect(result).toBeNull();
  });

  it('throws when the query errors', async () => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: new Error('query failed') }),
    };
    mockFrom.mockReturnValue(chain);

    await expect(getMyReaction('post-1', 'user-1')).rejects.toThrow('query failed');
  });
});
