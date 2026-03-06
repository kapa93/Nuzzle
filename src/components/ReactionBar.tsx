import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { REACTION_EMOJI } from '../utils/breed';
import type { ReactionEnum } from '../types';

interface ReactionBarProps {
  reactions: Partial<Record<ReactionEnum, number>>;
  userReaction?: ReactionEnum | null;
  onPress?: () => void;
}

export function ReactionBar({ reactions, userReaction, onPress }: ReactionBarProps) {
  const entries = (Object.entries(reactions) as [ReactionEnum, number][])
    .filter(([, count]) => count > 0)
    .map(([reaction_type, count]) => ({
      reaction_type,
      count,
      isUserReaction: reaction_type === userReaction,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const total = entries.reduce((sum, r) => sum + r.count, 0);
  if (total === 0) {
    return (
      <TouchableOpacity onPress={onPress} style={styles.container}>
        <Text style={styles.placeholder}>Add reaction</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} style={styles.container} activeOpacity={0.7}>
      {entries.map((r) => (
        <View
          key={r.reaction_type}
          style={[styles.reactionChip, r.isUserReaction && styles.userReaction]}
        >
          <Text style={styles.emoji}>{REACTION_EMOJI[r.reaction_type]}</Text>
          <Text style={styles.count}>{r.count}</Text>
        </View>
      ))}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 4,
  },
  placeholder: {
    color: '#666',
    fontSize: 14,
  },
  reactionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
  },
  userReaction: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  emoji: {
    fontSize: 14,
  },
  count: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
});
