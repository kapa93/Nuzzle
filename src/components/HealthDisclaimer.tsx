import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function HealthDisclaimer() {
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>
        ⚠️ Not medical advice. Consult a veterinarian for urgent concerns.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  text: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '500',
  },
});
