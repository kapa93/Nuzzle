import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, shadow } from '@/theme';

type Props = {
  onCreateMeetup: () => void;
  onExploreMeetups: () => void;
};

export function MeetupPromptCard({ onCreateMeetup, onExploreMeetups }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>🐾 Meet dogs nearby</Text>
      <Text style={styles.body}>
        Set up a meetup or join one in your area
      </Text>

      <TouchableOpacity style={styles.primaryButton} onPress={onCreateMeetup}>
        <Text style={styles.primaryButtonText}>Create a meetup</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.dismissButton} onPress={onExploreMeetups}>
        <Text style={styles.dismissText}>Explore meetups</Text>
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
