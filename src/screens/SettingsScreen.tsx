import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { deleteAccount } from '@/api/auth';
import type { ProfileStackParamList, RootStackParamList } from '@/navigation/types';
import { useStackHeaderHeight } from '@/hooks/useStackHeaderHeight';
import { useAuthStore } from '@/store/authStore';
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

function DestructiveRow({
  label,
  onPress,
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        pressed && !disabled && styles.rowPressed,
        disabled && styles.rowDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.danger} />
      ) : (
        <Text style={styles.destructiveRowLabel}>{label}</Text>
      )}
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
  const queryClient = useQueryClient();
  const clearSession = useAuthStore((state) => state.signOut);
  const profile = useAuthStore((state) => state.profile);
  const isGuest = useAuthStore((state) => state.isGuest);

  const deleteAccountMutation = useMutation({
    mutationFn: () => deleteAccount(),
    onSuccess: () => {
      queryClient.clear();
      clearSession();
    },
    onError: (err: Error) => {
      Alert.alert(
        'Could not delete account',
        err.message || 'Please try again in a moment.'
      );
    },
  });

  const handleDeleteAccount = () => {
    if (deleteAccountMutation.isPending) return;
    Alert.alert(
      'Delete account',
      'This permanently deletes your account, your dogs, posts, comments, and photos. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteAccountMutation.mutate(),
        },
      ]
    );
  };

  const handleOpenAdminDashboard = () => {
    navigation
      .getParent<NativeStackNavigationProp<RootStackParamList>>()
      ?.navigate('AdminDashboard');
  };

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

      {profile?.is_admin ? (
        <>
          <Text style={styles.sectionLabel}>Admin</Text>
          <View style={styles.section}>
            <Row label="Admin Dashboard" onPress={handleOpenAdminDashboard} />
          </View>
        </>
      ) : null}

      {!isGuest && (
        <>
          <Text style={styles.sectionLabel}>Account</Text>
          <View style={styles.section}>
            <DestructiveRow
              label="Delete Account"
              onPress={handleDeleteAccount}
              disabled={deleteAccountMutation.isPending}
              loading={deleteAccountMutation.isPending}
            />
          </View>
        </>
      )}
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
  rowDisabled: {
    opacity: 0.6,
  },
  rowLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  destructiveRowLabel: {
    ...typography.body,
    color: colors.danger,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.lg,
  },
});
