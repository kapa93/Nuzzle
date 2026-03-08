import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

interface DogAvatarProps {
  imageUrl?: string | null;
  name?: string;
  size?: number;
}

export function DogAvatar({ imageUrl, name, size = 40 }: DogAvatarProps) {
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }]}>
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
    backgroundColor: '#2E8B57',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#FFF',
    fontWeight: '600',
  },
});
