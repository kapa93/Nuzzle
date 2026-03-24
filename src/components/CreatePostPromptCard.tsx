import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, shadow } from '@/theme';

const PACK_NAMES: Record<string, string> = {
  AUSTRALIAN_SHEPHERD: 'Aussie',
  HUSKY: 'Husky',
  GOLDEN_RETRIEVER: 'Golden',
  FRENCH_BULLDOG: 'Frenchie',
  PIT_BULL: 'Pit Bull',
  LABRADOR_RETRIEVER: 'Lab',
};

type Props = {
  breed: string;
  onCreatePost: () => void;
  onDismiss: () => void;
};

export function CreatePostPromptCard({ breed, onCreatePost, onDismiss }: Props) {
  const packName = PACK_NAMES[breed] ?? breed;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>🐶 Welcome to the {packName} Pack</Text>
      <Text style={styles.body}>
        Ask a question or share a tip to get started
      </Text>

      <TouchableOpacity style={styles.primaryButton} onPress={onCreatePost}>
        <Text style={styles.primaryButtonText}>Create your first post</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
        <Text style={styles.dismissText}>Not now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 16,
    marginTop: 0,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  body: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  dismissButton: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  dismissText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
