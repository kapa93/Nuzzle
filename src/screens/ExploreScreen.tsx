import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { BREEDS, BREED_LABELS } from '@/utils/breed';
import type { BreedEnum } from '@/types';

const BREED_EMOJI: Record<BreedEnum, string> = {
  AUSTRALIAN_SHEPHERD: '🐕',
  HUSKY: '🐺',
  GOLDEN_RETRIEVER: '🦮',
  FRENCH_BULLDOG: '🐶',
  PIT_BULL: '🐕',
  LABRADOR_RETRIEVER: '🦮',
};

export function ExploreScreen({ navigation }: { navigation: { navigate: (s: string, p: object) => void } }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Breed Communities</Text>
      <Text style={styles.subtitle}>Choose a community to explore</Text>
      {BREEDS.map((breed) => (
        <TouchableOpacity
          key={breed}
          style={styles.card}
          onPress={() => navigation.navigate('BreedFeed', { breed })}
          activeOpacity={0.8}
        >
          <Text style={styles.emoji}>{BREED_EMOJI[breed]}</Text>
          <Text style={styles.breedName}>{BREED_LABELS[breed]}</Text>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 24 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  emoji: { fontSize: 36, marginRight: 16 },
  breedName: { flex: 1, fontSize: 18, fontWeight: '600', color: '#1a1a1a' },
  arrow: { fontSize: 18, color: '#9ca3af' },
});
