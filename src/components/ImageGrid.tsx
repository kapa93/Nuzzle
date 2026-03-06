import React from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface ImageGridProps {
  images: string[];
  maxDisplay?: number;
  size?: number;
  onPress?: (index: number) => void;
  compact?: boolean;
}

export function ImageGrid({
  images,
  maxDisplay = 3,
  size = 100,
  onPress,
  compact = false,
}: ImageGridProps) {
  if (images.length === 0) return null;

  const displayImages = images.slice(0, maxDisplay);
  const remaining = images.length - maxDisplay;

  const getGridStyle = () => {
    if (compact) {
      return displayImages.length === 1
        ? { width: size, height: size }
        : displayImages.length === 2
          ? { width: size * 2 + 4, height: size }
          : { width: size * 3 + 8, height: size };
    }
    return {};
  };

  return (
    <View style={[styles.container, getGridStyle()]}>
      {displayImages.map((uri, index) => (
        <TouchableOpacity
          key={uri + index}
          onPress={() => onPress?.(index)}
          activeOpacity={onPress ? 0.8 : 1}
          style={[
            styles.imageWrapper,
            {
              width: compact ? size : undefined,
              height: compact ? size : undefined,
              flex: compact ? 0 : 1,
            },
          ]}
        >
          <Image
            source={{ uri }}
            style={[
              styles.image,
              compact
                ? { width: size, height: size, borderRadius: 8 }
                : { flex: 1, borderRadius: 8 },
            ]}
            resizeMode="cover"
          />
          {!compact && index === maxDisplay - 1 && remaining > 0 && (
            <View style={[styles.overlay, { width: size, height: size, borderRadius: 8 }]}>
              <View style={styles.remainingBadge}>
                <Text style={styles.remainingText}>+{remaining}</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
  },
  imageWrapper: {
    overflow: 'hidden',
  },
  image: {
    backgroundColor: '#E8E8E8',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  remainingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
  },
  remainingText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 14,
  },
});
