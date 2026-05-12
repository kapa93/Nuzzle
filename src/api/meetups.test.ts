jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

import { supabase } from '@/lib/supabase';
import { rsvpMeetup, unrsvpMeetup } from './meetups';

const mockFrom = supabase.from as jest.Mock;

// ─── rsvpMeetup ───────────────────────────────────────────────────────────────

describe('rsvpMeetup', () => {
  beforeEach(() => jest.clearAllMocks());

  it('inserts an RSVP record on success', async () => {
    const chain = {
      insert: jest.fn().mockResolvedValue({ error: null }),
    };
    mockFrom.mockReturnValue(chain);

    await expect(rsvpMeetup('meetup-1', 'user-1')).resolves.not.toThrow();
    expect(mockFrom).toHaveBeenCalledWith('meetup_rsvps');
    expect(chain.insert).toHaveBeenCalledWith({
      meetup_post_id: 'meetup-1',
      user_id: 'user-1',
    });
  });

  it('silently ignores duplicate key errors (user already RSVP\'d)', async () => {
    const duplicateError = Object.assign(new Error('duplicate'), { code: '23505' });
    const chain = {
      insert: jest.fn().mockResolvedValue({ error: duplicateError }),
    };
    mockFrom.mockReturnValue(chain);

    await expect(rsvpMeetup('meetup-1', 'user-1')).resolves.not.toThrow();
  });

  it('throws on non-duplicate errors', async () => {
    const chain = {
      insert: jest.fn().mockResolvedValue({ error: new Error('network error') }),
    };
    mockFrom.mockReturnValue(chain);

    await expect(rsvpMeetup('meetup-1', 'user-1')).rejects.toThrow('network error');
  });
});

// ─── unrsvpMeetup ─────────────────────────────────────────────────────────────

describe('unrsvpMeetup', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deletes the RSVP record on success', async () => {
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

    await expect(unrsvpMeetup('meetup-1', 'user-1')).resolves.not.toThrow();
    expect(mockFrom).toHaveBeenCalledWith('meetup_rsvps');
    expect(chain.eq).toHaveBeenCalledWith('meetup_post_id', 'meetup-1');
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1');
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

    await expect(unrsvpMeetup('meetup-1', 'user-1')).rejects.toThrow('delete failed');
  });
});
