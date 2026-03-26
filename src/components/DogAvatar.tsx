import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme';

interface DogAvatarProps {
  imageUrl?: string | null;
  name?: string;
  size?: number;
  roundedSquare?: boolean;
}

export function DogAvatar({ imageUrl, name, size = 40, roundedSquare }: DogAvatarProps) {
  const borderRadius = roundedSquare ? 16 : size / 2;
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius }]}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={[styles.image, { width: size, height: size, borderRadius }]}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.placeholder, { width: size, height: size, borderRadius }]}>
          <Text style={[styles.placeholderText, { fontSize: size * 0.4 }]}>
            {name ? name[0].toUpperCase() : '🐕'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#F2EFE8',
  },
  image: {
    backgroundColor: '#F2EFE8',
  },
  placeholder: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#FFF',
    fontWeight: '600',
  },
});
