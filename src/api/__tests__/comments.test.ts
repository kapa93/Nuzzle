jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

import { supabase } from '@/lib/supabase';
import { getCommentsByPost, createComment } from '../comments';

const mockFrom = supabase.from as jest.Mock;

// ─── getCommentsByPost ────────────────────────────────────────────────────────

describe('getCommentsByPost', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws when the comments query errors', async () => {
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: null, error: new Error('db error') }),
    });

    await expect(getCommentsByPost('post-1')).rejects.toThrow('db error');
  });

  it('returns empty array when there are no comments', async () => {
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    });

    const result = await getCommentsByPost('post-1');
    expect(result).toEqual([]);
  });

  it('maps comments to CommentWithAuthor shape', async () => {
    const rawComments = [
      {
        id: 'c1',
        post_id: 'post-1',
        author_id: 'u1',
        content_text: 'Nice post',
        created_at: '2026-01-01T00:00:00Z',
        profiles: { id: 'u1', name: 'Alice' },
      },
    ];

    mockFrom.mockImplementation((table: string) => {
      if (table === 'comments') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: rawComments, error: null }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
    });

    const result = await getCommentsByPost('post-1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('c1');
    expect(result[0].author_name).toBe('Alice');
    expect(result[0].author_dog_name).toBeNull();
    expect(result[0].author_dog_image_url).toBeNull();
  });

  it('maps dog info when available', async () => {
    const rawComments = [
      {
        id: 'c1',
        post_id: 'post-1',
        author_id: 'u1',
        content_text: 'Woof',
        created_at: '2026-01-01T00:00:00Z',
        profiles: { id: 'u1', name: 'Chris' },
      },
    ];
    const rawDogs = [
      { owner_id: 'u1', name: 'Koda', dog_image_url: 'https://example.com/koda.jpg' },
    ];

    mockFrom.mockImplementation((table: string) => {
      if (table === 'comments') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: rawComments, error: null }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: rawDogs, error: null }),
      };
    });

    const result = await getCommentsByPost('post-1');
    expect(result[0].author_dog_name).toBe('Koda');
    expect(result[0].author_dog_image_url).toBe('https://example.com/koda.jpg');
  });
});

// ─── createComment ────────────────────────────────────────────────────────────

describe('createComment', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws when the insert errors', async () => {
    mockFrom.mockReturnValue({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: new Error('insert failed') }),
    });

    await expect(createComment('post-1', 'u1', 'Hello')).rejects.toThrow('insert failed');
  });

  it('returns the created comment on success', async () => {
    const created = { id: 'c2', post_id: 'post-1', author_id: 'u1', content_text: 'Hello' };
    mockFrom.mockReturnValue({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: created, error: null }),
    });

    const result = await createComment('post-1', 'u1', 'Hello');
    expect(result).toEqual(created);
  });
});
