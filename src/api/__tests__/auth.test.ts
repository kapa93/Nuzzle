jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(),
  },
}));

jest.mock('expo-linking', () => ({ createURL: () => 'nuzzle://auth/callback' }));
jest.mock('expo-apple-authentication', () => ({}));
jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));

import { supabase } from '@/lib/supabase';
import { signUp, signIn, signOut, getProfile, updateProfile } from '../auth';

const mockAuth = supabase.auth as jest.Mocked<typeof supabase.auth>;
const mockFrom = supabase.from as jest.Mock;

// ─── helpers ─────────────────────────────────────────────────────────────────

function buildChain(finalResult: object) {
  const chain = {
    upsert: jest.fn().mockResolvedValue(finalResult),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(finalResult),
  };
  mockFrom.mockReturnValue(chain);
  return chain;
}

// ─── signUp ──────────────────────────────────────────────────────────────────

describe('signUp', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws when Supabase auth returns an error', async () => {
    mockAuth.signUp.mockResolvedValue({ data: {} as never, error: new Error('Auth failed') as never });
    await expect(signUp('a@b.com', 'pass123', 'Alice')).rejects.toThrow('Auth failed');
  });

  it('throws when no user is returned', async () => {
    mockAuth.signUp.mockResolvedValue({ data: { user: null } as never, error: null });
    await expect(signUp('a@b.com', 'pass123', 'Alice')).rejects.toThrow('Sign up failed');
  });

  it('throws when the profiles upsert fails', async () => {
    const fakeUser = { id: 'u1', email: 'a@b.com' };
    const fakeSession = { access_token: 'tok' };
    mockAuth.signUp.mockResolvedValue({ data: { user: fakeUser, session: fakeSession } as never, error: null });
    buildChain({ error: new Error('DB error') });

    await expect(signUp('a@b.com', 'pass123', 'Alice')).rejects.toThrow('DB error');
  });

  it('returns authData on success', async () => {
    const fakeUser = { id: 'u1', email: 'a@b.com' };
    mockAuth.signUp.mockResolvedValue({ data: { user: fakeUser } as never, error: null });
    buildChain({ error: null });

    const result = await signUp('a@b.com', 'pass123', 'Alice');
    expect((result as never as { user: object }).user).toEqual(fakeUser);
  });
});

// ─── signIn ──────────────────────────────────────────────────────────────────

describe('signIn', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws when Supabase returns an error', async () => {
    mockAuth.signInWithPassword.mockResolvedValue({ data: {} as never, error: new Error('Invalid credentials') as never });
    await expect(signIn('a@b.com', 'wrong')).rejects.toThrow('Invalid credentials');
  });

  it('returns session data on success', async () => {
    const fakeData = { user: { id: 'u1' }, session: { token: 'tok' } };
    mockAuth.signInWithPassword.mockResolvedValue({ data: fakeData as never, error: null });
    const result = await signIn('a@b.com', 'pass');
    expect(result).toEqual(fakeData);
  });
});

// ─── signOut ─────────────────────────────────────────────────────────────────

describe('signOut', () => {
  beforeEach(() => jest.clearAllMocks());

  it('falls back to local sign-out when global sign-out fails', async () => {
    mockAuth.signOut
      .mockResolvedValueOnce({ error: new Error('network') } as never)
      .mockResolvedValueOnce({ error: null } as never);

    await signOut();
    expect(mockAuth.signOut).toHaveBeenCalledTimes(2);
    expect(mockAuth.signOut).toHaveBeenLastCalledWith({ scope: 'local' });
  });

  it('succeeds without fallback when global sign-out works', async () => {
    mockAuth.signOut.mockResolvedValue({ error: null } as never);
    await signOut();
    expect(mockAuth.signOut).toHaveBeenCalledTimes(1);
  });
});

// ─── getProfile ──────────────────────────────────────────────────────────────

describe('getProfile', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns null when the query errors', async () => {
    const chain = buildChain({ data: null, error: new Error('not found') });
    chain.single.mockResolvedValue({ data: null, error: new Error('not found') });
    const result = await getProfile('u1');
    expect(result).toBeNull();
  });

  it('returns profile data on success', async () => {
    const profile = { id: 'u1', name: 'Alice', email: 'a@b.com', city: null };
    const chain = buildChain({ data: profile, error: null });
    chain.single.mockResolvedValue({ data: profile, error: null });
    const result = await getProfile('u1');
    expect(result).toEqual(profile);
  });
});

// ─── updateProfile ───────────────────────────────────────────────────────────

describe('updateProfile', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws when the update query errors', async () => {
    const chain = buildChain({ data: null, error: new Error('update failed') });
    chain.single.mockResolvedValue({ data: null, error: new Error('update failed') });
    await expect(updateProfile('u1', { name: 'Bob' })).rejects.toThrow('update failed');
  });

  it('returns updated profile on success', async () => {
    const updated = { id: 'u1', name: 'Bob', email: 'a@b.com', city: null };
    const chain = buildChain({ data: updated, error: null });
    chain.single.mockResolvedValue({ data: updated, error: null });
    const result = await updateProfile('u1', { name: 'Bob' });
    expect(result).toEqual(updated);
  });
});
