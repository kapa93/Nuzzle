jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

import { supabase } from '@/lib/supabase';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount,
} from './notifications';

const mockFrom = supabase.from as jest.Mock;

// ─── getNotifications ─────────────────────────────────────────────────────────

describe('getNotifications', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns notifications for a user', async () => {
    const notifications = [
      { id: 'n1', user_id: 'user-1', type: 'REACTION', read_at: null },
      { id: 'n2', user_id: 'user-1', type: 'COMMENT', read_at: null },
    ];
    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: notifications, error: null }),
    };
    mockFrom.mockReturnValue(chain);

    const result = await getNotifications('user-1');
    expect(mockFrom).toHaveBeenCalledWith('notifications');
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(result).toEqual(notifications);
  });

  it('returns an empty array when no notifications exist', async () => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
    mockFrom.mockReturnValue(chain);

    const result = await getNotifications('user-1');
    expect(result).toEqual([]);
  });

  it('respects the custom limit parameter', async () => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [], error: null }),
    };
    mockFrom.mockReturnValue(chain);

    await getNotifications('user-1', 10);
    expect(chain.limit).toHaveBeenCalledWith(10);
  });

  it('throws when the query errors', async () => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: null, error: new Error('fetch failed') }),
    };
    mockFrom.mockReturnValue(chain);

    await expect(getNotifications('user-1')).rejects.toThrow('fetch failed');
  });
});

// ─── markNotificationRead ─────────────────────────────────────────────────────

describe('markNotificationRead', () => {
  beforeEach(() => jest.clearAllMocks());

  it('does not throw on success', async () => {
    let callCount = 0;
    const chain = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount >= 2) return Promise.resolve({ error: null });
        return chain;
      }),
    };
    mockFrom.mockReturnValue(chain);

    await expect(markNotificationRead('n1', 'user-1')).resolves.not.toThrow();
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ read_at: expect.any(String) })
    );
  });

  it('throws when the update errors', async () => {
    let callCount = 0;
    const chain = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount >= 2) return Promise.resolve({ error: new Error('update failed') });
        return chain;
      }),
    };
    mockFrom.mockReturnValue(chain);

    await expect(markNotificationRead('n1', 'user-1')).rejects.toThrow('update failed');
  });
});

// ─── markAllNotificationsRead ─────────────────────────────────────────────────

describe('markAllNotificationsRead', () => {
  beforeEach(() => jest.clearAllMocks());

  it('does not throw on success', async () => {
    const chain = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockResolvedValue({ error: null }),
    };
    mockFrom.mockReturnValue(chain);

    await expect(markAllNotificationsRead('user-1')).resolves.not.toThrow();
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(chain.is).toHaveBeenCalledWith('read_at', null);
  });

  it('throws when the update errors', async () => {
    const chain = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockResolvedValue({ error: new Error('update failed') }),
    };
    mockFrom.mockReturnValue(chain);

    await expect(markAllNotificationsRead('user-1')).rejects.toThrow('update failed');
  });
});

// ─── getUnreadCount ───────────────────────────────────────────────────────────

describe('getUnreadCount', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the unread count', async () => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockResolvedValue({ count: 7, error: null }),
    };
    mockFrom.mockReturnValue(chain);

    const result = await getUnreadCount('user-1');
    expect(result).toBe(7);
    expect(chain.select).toHaveBeenCalledWith('*', { count: 'exact', head: true });
    expect(chain.is).toHaveBeenCalledWith('read_at', null);
  });

  it('returns 0 when count is null', async () => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockResolvedValue({ count: null, error: null }),
    };
    mockFrom.mockReturnValue(chain);

    const result = await getUnreadCount('user-1');
    expect(result).toBe(0);
  });

  it('throws when the query errors', async () => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockResolvedValue({ count: null, error: new Error('count failed') }),
    };
    mockFrom.mockReturnValue(chain);

    await expect(getUnreadCount('user-1')).rejects.toThrow('count failed');
  });
});
