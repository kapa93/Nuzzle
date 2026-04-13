import * as Crypto from 'expo-crypto';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';
import { decode } from 'base64-arraybuffer';
import { captureHandledError } from './sentry';

export type ImagePickResult = {
  uri: string;
  base64?: string;
};

export async function pickImages(maxCount = 5): Promise<ImagePickResult[]> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Permission to access media library denied');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    allowsMultipleSelection: true,
    selectionLimit: maxCount,
    quality: 0.8,
    base64: true,
  });

  if (result.canceled) return [];

  return result.assets.map((asset) => ({
    uri: asset.uri,
    base64: asset.base64 ?? undefined,
  }));
}

export async function uploadProfileImage(userId: string, base64Data: string): Promise<string> {
  const ext = 'jpg';
  const path = `${userId}/avatar.${ext}`;
  try {
    const { data, error } = await supabase.storage
      .from('profile-images')
      .upload(path, decode(base64Data), {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('profile-images')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    captureHandledError(error, {
      area: 'image-upload.profile',
      extra: { bucket: 'profile-images', path },
    });
    throw error;
  }
}

export async function uploadDogImage(
  userId: string,
  dogId: string,
  base64Data: string
): Promise<string> {
  const ext = 'jpg';
  const path = `${userId}/dogs/${dogId}/${Crypto.randomUUID()}.${ext}`;
  try {
    const { data, error } = await supabase.storage
      .from('dog-images')
      .upload(path, decode(base64Data), {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('dog-images')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    captureHandledError(error, {
      area: 'image-upload.dog',
      extra: { bucket: 'dog-images', path, dogId },
    });
    throw error;
  }
}

export async function uploadPostImage(
  userId: string,
  postId: string,
  base64Data: string,
  index: number
): Promise<string> {
  const ext = 'jpg';
  const path = `${userId}/posts/${postId}/${Crypto.randomUUID()}.${ext}`;
  try {
    const { data, error } = await supabase.storage
      .from('post-images')
      .upload(path, decode(base64Data), {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('post-images')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    captureHandledError(error, {
      area: 'image-upload.post',
      extra: { bucket: 'post-images', path, postId, index },
    });
    throw error;
  }
}
