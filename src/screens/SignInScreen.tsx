import React, { useState, useEffect } from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import {
  Image,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Keyboard,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import * as AppleAuthentication from 'expo-apple-authentication';
import { signIn, signInWithProvider, type SocialAuthProvider } from '@/api/auth';
import { ScreenWithWallpaper } from '@/components/ScreenWithWallpaper';
import { AuthLegalNotice } from '@/components/AuthLegalNotice';
import { colors } from '@/theme';
import { useAuthStore } from '@/store/authStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { signInSchema } from '@/utils/validation';
import type { AuthStackParamList } from '@/navigation/types';
import { Lock, Mail } from 'lucide-react-native';
import { captureHandledError } from '@/lib/sentry';

// Match width to dog-friends.png aspect ratio (2910x720) at 220px height
// to avoid blank columns between repeated tiles.
const MARQUEE_WIDTH = 889;
const MARQUEE_HEIGHT = 220;
const MARQUEE_DURATION_MS = 103818;

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

export function SignInScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AuthStackParamList, 'SignIn'>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<SocialAuthProvider | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [emailEmpty, setEmailEmpty] = useState(false);
  const [passwordEmpty, setPasswordEmpty] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const marqueeX = useSharedValue(0);

  useEffect(() => {
    const msg = route.params?.message;
    if (msg) setSuccessMessage(msg);
  }, [route.params?.message]);

  useEffect(() => {
    marqueeX.value = 0;
    marqueeX.value = withRepeat(
      withTiming(-MARQUEE_WIDTH, {
        duration: MARQUEE_DURATION_MS,
        easing: Easing.linear,
      }),
      -1,
      false
    );
    return () => {
      cancelAnimation(marqueeX);
    };
  }, [marqueeX]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, e => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const marqueeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: marqueeX.value }],
  }));

  const handleSignIn = async () => {
    setError('');

    const isEmailEmpty = email.trim() === '';
    const isPasswordEmpty = password === '';
    setEmailEmpty(isEmailEmpty);
    setPasswordEmpty(isPasswordEmpty);
    if (isEmailEmpty || isPasswordEmpty) return;

    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid input');
      return;
    }

    setLoading(true);
    try {
      const data = await signIn(parsed.data.email, parsed.data.password);
      useAuthStore.getState().setSession(data.session);
    } catch (err: unknown) {
      captureHandledError(err, {
        area: 'auth.sign-in',
        tags: { auth_flow: 'password' },
      });
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const visibleSocialProviders = SOCIAL_PROVIDER_CONFIGS.filter((config) =>
    config.visibleOn.includes(Platform.OS as RuntimePlatform)
  );

  const handleSocialSignIn = async (provider: SocialAuthProvider, label: string) => {
    setError('');
    setSuccessMessage('');
    setSocialLoading(provider);
    try {
      const data = await signInWithProvider(provider);
      if (data.isNewUser) {
        useOnboardingStore.getState().setNeedsOnboarding(true);
      }
      useAuthStore.getState().setSession(data.session);
    } catch (err: unknown) {
      captureHandledError(err, {
        area: 'auth.sign-in',
        tags: { auth_flow: provider },
      });
      setError(err instanceof Error ? err.message : `${label} sign in failed`);
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <ScreenWithWallpaper>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
      <View style={styles.contentShiftUp}>
        <Image
          source={require('../../assets/dog-linear-black.png')}
          style={styles.linearDogSilhouette}
          resizeMode="contain"
        />
        <Image
          source={require('../../assets/breeds/nuzzle-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.formContentShiftUp}>
        {successMessage ? (
          <Text style={styles.successMessage}>{successMessage}</Text>
        ) : null}

        <View style={[styles.inputRow, emailEmpty && styles.inputRowError]}>
          <Mail size={20} color={emailEmpty ? colors.danger : INPUT_MUTED} strokeWidth={2} />
          <TextInput
            style={styles.inputField}
            placeholder="Email"
            placeholderTextColor={emailEmpty ? colors.danger : INPUT_MUTED}
            value={email}
            onChangeText={(v) => { setEmail(v); if (emailEmpty) setEmailEmpty(false); }}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
        </View>
        <View style={[styles.inputRow, passwordEmpty && styles.inputRowError]}>
          <Lock size={20} color={passwordEmpty ? colors.danger : INPUT_MUTED} strokeWidth={2} />
          <TextInput
            style={styles.inputField}
            placeholder="Password"
            placeholderTextColor={passwordEmpty ? colors.danger : INPUT_MUTED}
            value={password}
            onChangeText={(v) => { setPassword(v); if (passwordEmpty) setPasswordEmpty(false); }}
            secureTextEntry
            autoComplete="password"
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignIn}
          disabled={loading || socialLoading !== null}
        >
          {loading ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        {visibleSocialProviders.map((config) => (
          <View
            key={config.provider}
            style={[
              styles.socialButton,
              (socialLoading === config.provider || loading) ? styles.socialButtonDisabled : null,
            ]}
            pointerEvents={(socialLoading === config.provider || loading) ? 'none' : 'auto'}
          >
            {config.buttonVariant === 'apple-native' ? (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={8}
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
                <View style={styles.googleIconContainer}>
                  <Text style={styles.googleIconText}>G</Text>
                </View>
                <Text style={styles.googleButtonText}>Sign in with Google</Text>
              </TouchableOpacity>
            ) : null}
            {socialLoading === config.provider ? (
              <ActivityIndicator style={styles.appleLoading} color={colors.primary} />
            ) : null}
          </View>
        ))}

        <TouchableOpacity style={styles.link} onPress={() => (navigation as any).navigate('SignUp')}>
          <Text style={styles.linkText}>Don't have an account? Sign up</Text>
        </TouchableOpacity>
        <AuthLegalNotice />
        </View>
      </View>

      <View
        style={[
          styles.marqueeViewport,
          keyboardHeight > 0 ? styles.marqueeHidden : null,
        ]}
      >
        <Animated.View style={[styles.marqueeTrack, marqueeStyle]}>
          <Image
            source={require('../../assets/dog-friends.png')}
            style={styles.marqueeImage}
            resizeMode="contain"
          />
          <Image
            source={require('../../assets/dog-friends.png')}
            style={styles.marqueeImage}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    </View>
    </TouchableWithoutFeedback>
    </ScreenWithWallpaper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  contentShiftUp: {
    transform: [{ translateY: -55 }],
  },
  formContentShiftUp: {
    transform: [{ translateY: -10 }],
  },
  linearDogSilhouette: {
    width: 72,
    height: 72,
    alignSelf: 'center',
    position: 'relative',
    display: 'flex',
    top: -42,
    right: -6,
    marginTop: -20,
  },
  logo: {
    width: 288,
    height: 68.4,
    alignSelf: 'center',
    marginTop: -40,
    transform: [{ translateY: -35 }],
  },
  marqueeViewport: {
    position: 'absolute',
    left: -24,
    right: -24,
    bottom: 45,
    height: 220,
    overflow: 'hidden',
  },
  marqueeHidden: {
    opacity: 0,
  },
  marqueeTrack: {
    flexDirection: 'row',
  },
  marqueeImage: {
    width: MARQUEE_WIDTH,
    height: MARQUEE_HEIGHT,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 32,
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
  inputRowError: {
    borderColor: colors.danger,
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
  successMessage: {
    color: colors.primary,
    fontSize: 14,
    marginBottom: 16,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
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
    marginTop: 24,
    alignItems: 'center',
  },
  socialButton: {
    marginTop: 14,
    position: 'relative',
  },
  socialButtonDisabled: {
    opacity: 0.7,
  },
  appleButton: {
    width: '100%',
    height: 46,
  },
  appleLoading: {
    position: 'absolute',
    right: 14,
    top: 12,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 8,
    height: 46,
    width: '100%',
    gap: 10,
  },
  googleIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 2,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  googleButtonText: {
    color: '#3c4043',
    fontSize: 16,
    fontWeight: '600',
  },
  linkText: {
    color: colors.primary,
    fontSize: 15,
  },
});
