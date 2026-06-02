import React from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '@/navigation/types';
import { useStackHeaderHeight } from '@/hooks/useStackHeaderHeight';
import { colors, spacing, typography } from '@/theme';

type SettingsNav = NativeStackNavigationProp<ProfileStackParamList, 'Settings'>;

type RowProps = {
  label: string;
  onPress: () => void;
};

function Row({ label, onPress }: RowProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const LEGAL_ROWS: { label: string; documentType: 'terms' | 'privacyPolicy' | 'communityGuidelines' }[] = [
  { label: 'Terms of Service', documentType: 'terms' },
  { label: 'Privacy Policy', documentType: 'privacyPolicy' },
  { label: 'Community Guidelines', documentType: 'communityGuidelines' },
];

export function SettingsScreen() {
  const navigation = useNavigation<SettingsNav>();
  const headerHeight = useStackHeaderHeight();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: headerHeight + spacing.lg }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.sectionLabel}>Legal</Text>
      <View style={styles.section}>
        {LEGAL_ROWS.map(({ label, documentType }, index) => (
          <View key={documentType}>
            <Row
              label={label}
              onPress={() => navigation.navigate('LegalDocument', { documentType })}
            />
            {index < LEGAL_ROWS.length - 1 && <View style={styles.separator} />}
          </View>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Support</Text>
      <View style={styles.section}>
        <Row
          label="Contact Support"
          onPress={() => Linking.openURL('mailto:support@nuzzle.app')}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.xs,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
    marginLeft: spacing.sm,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 15,
    backgroundColor: colors.surface,
  },
  rowPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  rowLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.lg,
  },
});
