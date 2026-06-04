import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lock, Mail, User } from 'lucide-react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { signUp, signInWithProvider, type SocialAuthProvider } from '@/api/auth';
import { ScreenWithWallpaper } from '@/components/ScreenWithWallpaper';
import { AuthLegalNotice } from '@/components/AuthLegalNotice';
import { colors } from '@/theme';
import { useAuthStore } from '@/store/authStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { signUpSchema } from '@/utils/validation';
import { captureHandledError } from '@/lib/sentry';
import { track } from '@/lib/posthog';

const INPUT_MUTED = colors.textMuted;
const INPUT_BORDER = colors.border;

type RuntimePlatform = 'ios' | 'android' | 'web';
type SocialButtonVariant = 'apple-native' | 'google';
type SocialProviderConfig = {
  provider: SocialAuthProvider;
  label: string;
  visibleOn: RuntimePlatform[];
  buttonVariant: SocialButtonVariant;
};

const SOCIAL_PROVIDER_CONFIGS: SocialProviderConfig[] = [
  {
    provider: 'apple',
    label: 'Apple',
    visibleOn: ['ios'],
    buttonVariant: 'apple-native',
  },
  {
    provider: 'google',
    label: 'Google',
    visibleOn: ['ios', 'android'],
    buttonVariant: 'google',
  },
];

export function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  const buttonWrapperRef = useRef<View>(null);
  const scrollYRef = useRef(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<SocialAuthProvider | null>(null);
  const [error, setError] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardTopY, setKeyboardTopY] = useState<number | null>(null);

  const scrollButtonAboveKeyboard = useCallback((animated = true) => {
    if (keyboardTopY == null) return;
    buttonWrapperRef.current?.measureInWindow((_x, y, _width, height) => {
      const marginAboveKeyboard = 12;
      const buttonBottomOnScreen = y + height;
      const overlap = buttonBottomOnScreen + marginAboveKeyboard - keyboardTopY;
      // Ignore tiny corrections to prevent visual jitter between fields.
      if (Math.abs(overlap) < 6) return;
      if (overlap > 0) {
        scrollViewRef.current?.scrollTo({
          y: Math.max(0, scrollYRef.current + overlap),
          animated,
        });
      }
    });
  }, [keyboardTopY]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, e => {
      setKeyboardHeight(e.endCoordinates.height);
      setKeyboardTopY(e.endCoordinates.screenY);
      requestAnimationFrame(() => {
        scrollButtonAboveKeyboard(Platform.OS !== 'ios');
      });
      setTimeout(() => {
        scrollButtonAboveKeyboard(false);
      }, 50);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
      setKeyboardTopY(null);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [scrollButtonAboveKeyboard]);

  useEffect(() => {
    if (keyboardTopY != null) {
      scrollButtonAboveKeyboard(false);
    }
  }, [keyboardTopY, scrollButtonAboveKeyboard]);

  const handleInputFocus = () => {
    requestAnimationFrame(() => {
      // Keyboard is already open during field-to-field taps; avoid tiny animation bounces.
      scrollButtonAboveKeyboard(false);
    });
  };

  const handleSignUp = async () => {
    setError('');
    const parsed = signUpSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid input');
      return;
    }
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setLoading(true);
    // Flag must be set before the API call so that when Supabase fires
    // onAuthStateChange internally (before the promise resolves), the root
    // navigator already sees needsOnboarding: true and skips Main entirely.
    useOnboardingStore.getState().setNeedsOnboarding(true);
    try {
      const authData = await signUp(email, password, name.trim());
      track('sign_up_completed', { method: 'email' });
      if (!authData.session) {
        // Leave needsOnboarding: true — it is persisted and will route the
        // user through onboarding once they confirm their email and a session
        // is established via the deep link.
        setError('');
        (navigation as any).navigate('SignIn', {
          message: 'Check your email to confirm your account.',
        });
      }
    } catch (err: unknown) {
      useOnboardingStore.getState().setNeedsOnboarding(false);
      captureHandledError(err, {
        area: 'auth.sign-up',
        tags: { auth_flow: 'password' },
      });
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const visibleSocialProviders = SOCIAL_PROVIDER_CONFIGS.filter((config) =>
    config.visibleOn.includes(Platform.OS as RuntimePlatform),
  );

  const handleSocialSignIn = async (provider: SocialAuthProvider, label: string) => {
    setError('');
    setSocialLoading(provider);
    try {
      const data = await signInWithProvider(provider);
      if (data.isNewUser) {
        useOnboardingStore.getState().setNeedsOnboarding(true);
      }
      useAuthStore.getState().setSession(data.session);
    } catch (err: unknown) {
      captureHandledError(err, {
        area: 'auth.sign-up',
        tags: { auth_flow: provider },
      });
      setError(err instanceof Error ? err.message : `${label} sign up failed`);
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <ScreenWithWallpaper>
      <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 12 },
          keyboardHeight > 0 ? { paddingBottom: keyboardHeight + 12 } : null,
        ]}
        onScroll={e => {
          scrollYRef.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Image
          source={require('../../assets/dog-linear-black.png')}
          style={styles.linearDogSilhouette}
          resizeMode="contain"
        />
        <Image
          source={require('../../assets/nuzzle-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

      <View style={styles.formContentShiftUp}>
        <View style={styles.inputRow}>
          <User size={20} color={INPUT_MUTED} strokeWidth={2} />
          <TextInput
            style={styles.inputField}
            placeholder="Name"
            placeholderTextColor={INPUT_MUTED}
            value={name}
            onChangeText={setName}
            onFocus={handleInputFocus}
            autoCapitalize="words"
          />
        </View>
        <View style={styles.inputRow}>
          <Mail size={20} color={INPUT_MUTED} strokeWidth={2} />
          <TextInput
            style={styles.inputField}
            placeholder="Email"
            placeholderTextColor={INPUT_MUTED}
            value={email}
            onChangeText={setEmail}
            onFocus={handleInputFocus}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
        </View>
        <View style={styles.inputRow}>
          <Lock size={20} color={INPUT_MUTED} strokeWidth={2} />
          <TextInput
            style={styles.inputField}
            placeholder="Password (min 6 characters)"
            placeholderTextColor={INPUT_MUTED}
            value={password}
            onChangeText={setPassword}
            onFocus={handleInputFocus}
            secureTextEntry
            autoComplete="password-new"
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View ref={buttonWrapperRef}>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.buttonText}>Sign Up</Text>
            )}
          </TouchableOpacity>
        </View>

        {visibleSocialProviders.map((config) => (
          <View
            key={config.provider}
            style={[
              styles.socialButton,
              socialLoading === config.provider || loading
                ? styles.socialButtonDisabled
                : null,
            ]}
            pointerEvents={
              socialLoading === config.provider || loading ? 'none' : 'auto'
            }
          >
            {config.buttonVariant === 'apple-native' ? (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={
                  AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP
                }
                buttonStyle={
                  AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                }
                cornerRadius={12}
                style={styles.appleButton}
                onPress={() => handleSocialSignIn(config.provider, config.label)}
              />
            ) : null}
            {config.buttonVariant === 'google' ? (
              <TouchableOpacity
                style={styles.googleButton}
                onPress={() => handleSocialSignIn(config.provider, config.label)}
                activeOpacity={0.85}
              >
                <Image
                  source={require('../../assets/google-icon.png')}
                  style={styles.googleIconImage}
                />
                <Text style={styles.googleButtonText}>Sign up with Google</Text>
              </TouchableOpacity>
            ) : null}
            {socialLoading === config.provider ? (
              <ActivityIndicator
                style={styles.appleLoading}
                color={colors.primary}
              />
            ) : null}
          </View>
        ))}

        <TouchableOpacity style={styles.link} onPress={() => (navigation as any).navigate('SignIn')}>
          <Text style={styles.linkText}>Already have an account? Sign in</Text>
        </TouchableOpacity>
        <AuthLegalNotice />
      </View>
    </ScrollView>
    </View>
    </ScreenWithWallpaper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formContentShiftUp: {
    transform: [{ translateY: -20 }],
  },
  linearDogSilhouette: {
    width: 68.4,
    height: 68.4,
    alignSelf: 'center',
    position: 'relative',
    display: 'flex',
    top: -2,
    right: -6,
    marginTop: 33,
  },
  logo: {
    width: 273.6,
    height: 64.98,
    alignSelf: 'center',
    transform: [{ translateY: -35 }],
  },
  scrollView: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  title: {
    fontSize: 25,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 15,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    borderRadius: 8,
    paddingLeft: 12,
    paddingRight: 16,
    paddingVertical: 16,
    marginBottom: 16,
    backgroundColor: colors.surface,
    gap: 10,
  },
  inputField: {
    flex: 1,
    fontSize: 16,
    padding: 0,
    margin: 0,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    marginBottom: 16,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 16,
    alignItems: "center",
    marginTop: 3,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: colors.primary,
    fontSize: 15,
  },
  socialButton: {
    marginTop: 12,
    position: 'relative',
  },
  socialButtonDisabled: {
    opacity: 0.7,
  },
  appleButton: {
    width: '100%',
    height: 40,
  },
  appleLoading: {
    position: 'absolute',
    right: 14,
    top: 9,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 12,
    height: 40,
    width: '100%',
    gap: 10,
  },
  googleIconImage: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
    position: 'relative',
    right: -12,
    marginLeft: -14,
  },
  googleButtonText: {
    color: '#3c4043',
    fontSize: 15.5,
    fontWeight: '600',
  },
});
