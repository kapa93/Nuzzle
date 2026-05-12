import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenWithWallpaper } from '@/components/ScreenWithWallpaper';
import { useOnboardingStore } from '@/store/onboardingStore';
import { colors } from '@/theme';
import type { OnboardingStackParamList } from '@/navigation/types';
import { track } from '@/lib/posthog';

type OnboardingNav = NativeStackNavigationProp<OnboardingStackParamList, 'OnboardingWelcome'>;

export function OnboardingScreen() {
  const navigation = useNavigation<OnboardingNav>();

  React.useEffect(() => {
    track('onboarding_started', {});
  }, []);

  const handleSkip = () => {
    track('onboarding_skipped', {});
    track('onboarding_completed', { added_dog: false });
    useOnboardingStore.getState().setNeedsOnboarding(false);
  };

  const handleAddDog = () => {
    navigation.navigate('EditDog', { fromOnboarding: true });
  };

  return (
    <ScreenWithWallpaper>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.paw}>🐾</Text>
          <Text style={styles.title}>Welcome to Nuzzle!</Text>
          <Text style={styles.subtitle}>
            Connect with dogs of the same breed in your area. Start by adding your dog's profile so
            others can find and meet your pup.
          </Text>

          <TouchableOpacity style={styles.primaryButton} onPress={handleAddDog}>
            <Text style={styles.primaryButtonText}>Add Dog Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWithWallpaper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  paw: {
    fontSize: 52,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: colors.surface,
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
