import React, { useState, useEffect } from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import {
  Image,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
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
import { signIn } from '@/api/auth';
import { ScreenWithWallpaper } from '@/components/ScreenWithWallpaper';
import { colors } from '@/theme';
import { useAuthStore } from '@/store/authStore';
import { signInSchema } from '@/utils/validation';
import type { AuthStackParamList } from '@/navigation/types';
import { Lock, Mail } from 'lucide-react-native';

// Match width to dog-friends.png aspect ratio (2910x720) at 220px height
// to avoid blank columns between repeated tiles.
const MARQUEE_WIDTH = 889;
const MARQUEE_HEIGHT = 220;
const MARQUEE_DURATION_MS = 103818;

const INPUT_MUTED = '#9CA3AF';
const INPUT_BORDER = '#B8C1C8';

export function SignInScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AuthStackParamList, 'SignIn'>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
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

  const marqueeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: marqueeX.value }],
  }));

  const handleSignIn = async () => {
    setError('');
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
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWithWallpaper>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <View style={styles.contentShiftUp}>
        <Image
          source={require('../../assets/dog-linear.png')}
          style={styles.linearDogSilhouette}
          resizeMode="contain"
        />
        <Image
          source={require('../../assets/green-nuzzle.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        {successMessage ? (
          <Text style={styles.successMessage}>{successMessage}</Text>
        ) : null}

        <View style={styles.inputRow}>
          <Mail size={20} color={INPUT_MUTED} strokeWidth={2} />
          <TextInput
            style={styles.inputField}
            placeholder="Email"
            placeholderTextColor={INPUT_MUTED}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
        </View>
        <View style={styles.inputRow}>
          <Lock size={20} color={INPUT_MUTED} strokeWidth={2} />
          <TextInput
            style={styles.inputField}
            placeholder="Password"
            placeholderTextColor={INPUT_MUTED}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.link} onPress={() => (navigation as any).navigate('SignUp')}>
          <Text style={styles.linkText}>Don't have an account? Sign up</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.marqueeViewport}>
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
    </KeyboardAvoidingView>
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
  linearDogSilhouette: {
    width: 80,
    height: 80,
    alignSelf: 'center',
    position: 'relative',
    display: 'flex',
    top: -42,
    right: -6,
    marginTop: -20,
  },
  logo: {
    width: 320,
    height: 76,
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
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
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
    backgroundColor: '#FFF',
    gap: 10,
  },
  inputField: {
    flex: 1,
    fontSize: 16,
    padding: 0,
    margin: 0,
  },
  error: {
    color: '#DC2626',
    fontSize: 14,
    marginBottom: 16,
  },
  successMessage: {
    color: '#059669',
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
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    color: colors.primary,
    fontSize: 15,
  },
});
