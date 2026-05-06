import * as AppleAuthentication from 'expo-apple-authentication';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

const AUTH_CALLBACK_PATH = 'auth/callback';
const FALLBACK_PROFILE_NAME = 'Dog Lover';

export type SocialAuthProvider = 'apple';

export function getAuthCallbackUrl() {
  return Linking.createURL(AUTH_CALLBACK_PATH);
}

export function isAuthCallbackUrl(url: string) {
  return url.startsWith(getAuthCallbackUrl().split('#')[0]);
}

export async function signUp(email: string, password: string, name: string, city?: string) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, city },
      emailRedirectTo: getAuthCallbackUrl(),
    },
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('Sign up failed');

  // Only upsert the profile when we have an active session (i.e. email
  // confirmation is disabled). When confirmation is required there is no
  // session yet, so the RLS policy would reject the write — the database
  // trigger handles profile creation once the user confirms their email.
  if (authData.session) {
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: authData.user.id,
      name: name || authData.user.email?.split('@')[0],
      email: authData.user.email ?? email,
      city: city ?? null,
    });

    if (profileError) throw profileError;
  }

  return authData;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

function normalizeAppleName(credential: AppleAuthentication.AppleAuthenticationCredential) {
  const fullName = credential.fullName;
  const parts = [fullName?.givenName, fullName?.middleName, fullName?.familyName]
    .filter(Boolean)
    .join(' ')
    .trim();
  return parts || null;
}

async function upsertSocialProfile(userId: string, email: string | null, name: string | null) {
  const fallbackEmail = `${userId}@apple.local`;
  const safeEmail = email?.trim() || fallbackEmail;
  const safeName = name?.trim() || safeEmail.split('@')[0] || FALLBACK_PROFILE_NAME;

  const { error } = await supabase.from('profiles').upsert(
    {
      id: userId,
      email: safeEmail,
      name: safeName,
    },
    { onConflict: 'id' }
  );

  if (error) throw error;
}

export async function signInWithApple() {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple sign in is only available on iOS');
  }

  const isAvailable = await AppleAuthentication.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Apple sign in is not available on this device');
  }

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) {
    throw new Error('Apple sign in failed to return an identity token');
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });

  if (error) throw error;
  if (!data.user) throw new Error('Apple sign in failed');

  const metadataName =
    typeof data.user.user_metadata?.name === 'string' ? data.user.user_metadata.name : null;
  const profileName = metadataName || normalizeAppleName(credential);
  const profileEmail = data.user.email ?? credential.email ?? null;

  await upsertSocialProfile(data.user.id, profileEmail, profileName);

  return data;
}

export async function signInWithProvider(provider: SocialAuthProvider) {
  switch (provider) {
    case 'apple':
      return signInWithApple();
    default:
      throw new Error(`Unsupported auth provider: ${provider}`);
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    // If the global sign out fails (e.g. user was deleted in Supabase),
    // fall back to clearing just the local session so the user can always log out.
    await supabase.auth.signOut({ scope: 'local' });
  }
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) return null;
  return data as Profile;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, 'name' | 'city' | 'profile_image_url'>>
) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}
