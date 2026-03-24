import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { colors } from '@/theme';

const PACK_NAMES: Record<string, string> = {
  AUSTRALIAN_SHEPHERD: 'Aussie',
  HUSKY: 'Husky',
  GOLDEN_RETRIEVER: 'Golden',
  FRENCH_BULLDOG: 'Frenchie',
  PIT_BULL: 'Pit Bull',
  LABRADOR_RETRIEVER: 'Lab',
};

type Props = {
  visible: boolean;
  dogName: string;
  breed: string;
  onGoToFeed: () => void;
  onExplore: () => void;
};

export function OnboardingCompleteCard({ visible, dogName, breed, onGoToFeed, onExplore }: Props) {
  const packName = PACK_NAMES[breed] ?? breed;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onGoToFeed}>
        <Pressable style={styles.card}>
          <Text style={styles.paw}>🐾</Text>

          <Text style={styles.title}>
            {dogName} has joined the {packName} pack
          </Text>

          <Text style={styles.subtitle}>You can now:</Text>
          <View style={styles.bullets}>
            <Text style={styles.bullet}>• Ask questions</Text>
            <Text style={styles.bullet}>• Share updates</Text>
            <Text style={styles.bullet}>• Meet other {packName}s nearby</Text>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={onGoToFeed}>
            <Text style={styles.primaryButtonText}>Go to Feed</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={onExplore}>
            <Text style={styles.skipText}>Explore other breeds</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 32,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  paw: {
    fontSize: 52,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  bullets: {
    alignSelf: 'stretch',
    marginBottom: 28,
  },
  bullet: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 26,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 8,
  },
  skipText: {
    color: colors.textMuted,
    fontSize: 15,
  },
});
