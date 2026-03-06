import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Pressable } from 'react-native';
import { REACTIONS, REACTION_EMOJI } from '../utils/breed';
import type { ReactionEnum } from '../types';

interface ReactionPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (reaction: ReactionEnum) => void;
  currentReaction?: ReactionEnum | null;
}

export function ReactionPicker({
  visible,
  onClose,
  onSelect,
  currentReaction,
}: ReactionPickerProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.content}>
          <Text style={styles.title}>Choose reaction</Text>
          <View style={styles.reactions}>
            {REACTIONS.map(({ type, emoji }) => (
              <TouchableOpacity
                key={type}
                onPress={() => {
                  onSelect(type);
                  onClose();
                }}
                style={[styles.reactionBtn, currentReaction === type && styles.selected]}
              >
                <Text style={styles.emoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  reactions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  reactionBtn: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
  },
  selected: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  emoji: {
    fontSize: 28,
  },
});
