import React, { useEffect } from 'react';
import { DefaultTheme, NavigationContainer, type LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator, StyleSheet, Platform, Pressable } from 'react-native';
import { GuestSignupPrompt } from '@/components/GuestSignupPrompt';
import { LocationOnboardingModal } from '@/components/LocationOnboardingModal';
import { NotificationPrePrompt } from '@/components/NotificationPrePrompt';
import { ToastBanner } from '@/components/ToastBanner';
import { NotificationsSheet } from '@/components/NotificationsSheet';
import { X, ChevronLeft } from 'lucide-react-native';
import * as Sentry from '@sentry/react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { getProfile } from '@/api/auth';
import type { RootStackParamList, AuthStackParamList, MainTabParamList, OnboardingStackParamList } from './types';
import { SignInScreen } from '@/screens/SignInScreen';
import { SignUpScreen } from '@/screens/SignUpScreen';
import { DogsScreen } from '@/screens/DogsScreen';
import { PlaceCheckinScreen } from '@/screens/PlaceCheckinScreen';
import { PlaceDetailScreen } from '@/screens/PlaceDetailScreen';
import { DogFriendlyPlacesScreen } from '@/screens/DogFriendlyPlacesScreen';
import { GooglePlacePreviewScreen } from '@/screens/GooglePlacePreviewScreen';
import { DogFriendlyPlacePreviewScreen } from '@/screens/DogFriendlyPlacePreviewScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { DogSpotsScreen } from '@/screens/DogSpotsScreen';
import { BreedFeedScreen } from '@/screens/BreedFeedScreen';
import { PostDetailScreen } from '@/screens/PostDetailScreen';
import { CreatePostScreen } from '@/screens/CreatePostScreen';
import { EditPostScreen } from '@/screens/EditPostScreen';
import { EditProfileScreen } from '@/screens/EditProfileScreen';
import { EditDogScreen } from '@/screens/EditDogScreen';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { DogProfileScreen } from '@/screens/DogProfileScreen';
import { UserProfileScreen } from '@/screens/UserProfileScreen';
import { AdminDashboardScreen } from '@/screens/admin/AdminDashboardScreen';
import { LegalDocumentScreen } from '@/screens/LegalDocumentScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { NuzzleTabBar } from './NuzzleTabBar';
import { SearchScreen } from '@/screens/SearchScreen';
import { AnimatedStackHeader } from '@/components/AnimatedStackHeader';
import { useScrollDirection } from '@/context/ScrollDirectionContext';
import { colors } from '@/theme';
import { registerSentryNavigationContainer } from '@/lib/sentry';
import { posthog } from '@/lib/posthog';
import {
  CREATE_POST_SHEET_MODAL_HEADER_HEIGHT,
  CREATE_POST_STACK_HEADER_BAR,
} from '@/hooks/useStackHeaderHeight';
import type {
  DogFriendlyPlacesStackParamList,
  DogsStackParamList,
  ProfileStackParamList,
  DogSpotsStackParamList,
} from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function AuthNavigator() {
  const pendingSignUp = useAuthStore((s) => s.pendingSignUp);
  const setPendingSignUp = useAuthStore((s) => s.setPendingSignUp);

  useEffect(() => {
    if (pendingSignUp) setPendingSignUp(false);
  }, []);

  return (
    <AuthStack.Navigator
      initialRouteName={pendingSignUp ? 'SignUp' : 'SignIn'}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <AuthStack.Screen name="SignIn" component={SignInScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack.Screen
        name="LegalDocument"
        component={LegalDocumentScreen}
        options={{
          headerShown: true,
          title: 'Legal',
          headerTransparent: true,
          header: (props) => <AnimatedStackHeader {...props} animateOnScroll={false} />,
        }}
      />
    </AuthStack.Navigator>
  );
}

function TabErrorFallback() {
  return (
    <View style={styles.tabErrorFallback}>
      <Text style={styles.tabErrorText}>Something went wrong in this tab.</Text>
    </View>
  );
}

function DogsTabWithBoundary() {
  return <Sentry.ErrorBoundary fallback={<TabErrorFallback />}><DogsTab /></Sentry.ErrorBoundary>;
}
function DogFriendlyPlacesTabWithBoundary() {
  return <Sentry.ErrorBoundary fallback={<TabErrorFallback />}><DogFriendlyPlacesTab /></Sentry.ErrorBoundary>;
}
function DogSpotsTabWithBoundary() {
  return <Sentry.ErrorBoundary fallback={<TabErrorFallback />}><DogSpotsTab /></Sentry.ErrorBoundary>;
}
function ProfileTabWithBoundary() {
  return <Sentry.ErrorBoundary fallback={<TabErrorFallback />}><ProfileTab /></Sentry.ErrorBoundary>;
}

function DogsTab() {
  const Stack = createNativeStackNavigator<DogsStackParamList>();
  return (
    <Stack.Navigator
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerTransparent: true,
        header: (props) => <AnimatedStackHeader {...props} animateOnScroll />,
      }}
    >
      <Stack.Screen name="DogsFeed" component={DogsScreen} options={{ title: 'Nuzzle' }} />
      <Stack.Screen name="BreedFeed" component={BreedFeedScreen} options={{ title: '' }} />
      <Stack.Screen name="SearchMain" component={SearchScreen} options={{ title: 'Search' }} />
      <Stack.Screen name="PlaceDetail" component={PlaceDetailScreen} options={{ title: 'Place' }} />
      <Stack.Screen name="PlaceNow" component={PlaceCheckinScreen} options={{ title: 'Dogs Here Now' }} />
      <Stack.Screen name="DogProfile" component={DogProfileScreen} options={{ title: 'Dog' }} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ title: 'Post' }} />
      <Stack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{
          title: 'Create Post',
          header: (props) => (
            <AnimatedStackHeader
              {...props}
              animateOnScroll
              baseHeaderHeight={CREATE_POST_STACK_HEADER_BAR}
            />
          ),
        }}
      />
      <Stack.Screen name="EditPost" component={EditPostScreen} options={{ title: 'Edit Post' }} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: 'Profile' }} />
    </Stack.Navigator>
  );
}

function DogFriendlyPlacesTab() {
  const Stack = createNativeStackNavigator<DogFriendlyPlacesStackParamList>();
  return (
    <Stack.Navigator
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerTransparent: true,
        header: (props) => <AnimatedStackHeader {...props} animateOnScroll />,
      }}
    >
      <Stack.Screen
        name="DogFriendlyPlacesList"
        component={DogFriendlyPlacesScreen}
        options={{
          title: 'Dog Friendly Places',
          header: (props) => (
            <AnimatedStackHeader {...props} animateOnScroll={false} />
          ),
        }}
      />
      <Stack.Screen
        name="BreedFeed"
        component={BreedFeedScreen}
        options={({ route }: { route: { params?: { breed?: string } } }) => ({
          title: (route.params?.breed ?? 'Feed').replace(/_/g, ' '),
          contentStyle: { backgroundColor: colors.surface },
        })}
      />
      <Stack.Screen name="SearchMain" component={SearchScreen} options={{ title: 'Search' }} />
      <Stack.Screen name="DogProfile" component={DogProfileScreen} options={{ title: 'Dog' }} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ title: 'Post' }} />
      <Stack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{
          title: 'Create Post',
          header: (props) => (
            <AnimatedStackHeader
              {...props}
              animateOnScroll
              baseHeaderHeight={CREATE_POST_STACK_HEADER_BAR}
            />
          ),
        }}
      />
      <Stack.Screen name="EditPost" component={EditPostScreen} options={{ title: 'Edit Post' }} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="PlaceDetail" component={PlaceDetailScreen} options={{ title: 'Place' }} />
      <Stack.Screen
        name="GooglePlacePreview"
        component={GooglePlacePreviewScreen}
        options={{ title: 'Place Preview' }}
      />
      <Stack.Screen
        name="DogFriendlyPlacePreview"
        component={DogFriendlyPlacePreviewScreen}
        options={{ title: 'Dog Friendly Place Preview' }}
      />
      <Stack.Screen name="PlaceNow" component={PlaceCheckinScreen} options={{ title: 'Dogs Here Now' }} />
    </Stack.Navigator>
  );
}

function EmptyCreateTab() {
  return <View style={{ flex: 1, backgroundColor: colors.background }} />;
}

function DogSpotsTab() {
  const Stack = createNativeStackNavigator<DogSpotsStackParamList>();
  return (
    <Stack.Navigator
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerTransparent: true,
        header: (props) => <AnimatedStackHeader {...props} animateOnScroll={false} />,
      }}
    >
      <Stack.Screen
        name="DogSpotsFeed"
        component={DogSpotsScreen}
        options={{
          title: 'Dog Spots',
          header: (props) => <AnimatedStackHeader {...props} animateOnScroll />,
        }}
      />
      <Stack.Screen name="PlaceDetail" component={PlaceDetailScreen} options={{ title: 'Place' }} />
      <Stack.Screen name="GooglePlacePreview" component={GooglePlacePreviewScreen} options={{ title: '' }} />
      <Stack.Screen name="PlaceNow" component={PlaceCheckinScreen} options={{ title: 'Dogs Here Now' }} />
      <Stack.Screen name="DogProfile" component={DogProfileScreen} options={{ title: 'Dog' }} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ title: 'Post' }} />
      <Stack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{
          title: 'Create Post',
          header: (props) => (
            <AnimatedStackHeader
              {...props}
              animateOnScroll
              baseHeaderHeight={CREATE_POST_STACK_HEADER_BAR}
            />
          ),
        }}
      />
      <Stack.Screen name="EditPost" component={EditPostScreen} options={{ title: 'Edit Post' }} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="SearchMain" component={SearchScreen} options={{ title: 'Search' }} />
    </Stack.Navigator>
  );
}

function ProfileTab() {
  const Stack = createNativeStackNavigator<ProfileStackParamList>();
  return (
    <Stack.Navigator
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerTransparent: true,
        header: (props) => <AnimatedStackHeader {...props} animateOnScroll />,
      }}
    >
      <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="SearchMain" component={SearchScreen} options={{ title: 'Search' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
      <Stack.Screen
        name="EditDog"
        component={EditDogScreen}
        options={({ route }: { route: { params?: { dogId?: string } } }) => ({
          title: route.params?.dogId ? 'Edit Dog' : 'Add Dog',
        })}
      />
      <Stack.Screen name="DogProfile" component={DogProfileScreen} options={{ title: 'Dog' }} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ title: 'Post' }} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen
        name="LegalDocument"
        component={LegalDocumentScreen}
        options={{
          headerShown: true,
          title: 'Legal',
          headerTransparent: true,
          header: (props) => <AnimatedStackHeader {...props} animateOnScroll={false} />,
        }}
      />
    </Stack.Navigator>
  );
}

function OnboardingNavigator() {
  return (
    <OnboardingStack.Navigator
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerTransparent: true,
        header: (props) => <AnimatedStackHeader {...props} animateOnScroll={false} />,
      }}
    >
      <OnboardingStack.Screen
        name="OnboardingWelcome"
        component={OnboardingScreen}
        options={{ headerShown: false }}
      />
      <OnboardingStack.Screen
        name="EditDog"
        component={EditDogScreen}
        options={{ title: 'Add Dog' }}
      />
    </OnboardingStack.Navigator>
  );
}

function MainTabs() {
  const { scrollDirection } = useScrollDirection();
  const tabBarStyle = React.useMemo(
    () => ({
      position: "absolute" as const,
      bottom: 0,
      left: 0,
      right: 0,
      borderTopWidth: 0,
      elevation: 0,
    }),
    []
  );
  return (
    <Tab.Navigator
      tabBar={(props) => <NuzzleTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle,
      }}
    >
      <Tab.Screen name="Home" component={DogsTabWithBoundary} />
      <Tab.Screen name="DogSpots" component={DogSpotsTabWithBoundary} />
      <Tab.Screen name="Create" component={EmptyCreateTab} />
      <Tab.Screen name="DogFriendly" component={DogFriendlyPlacesTabWithBoundary} />
      <Tab.Screen name="Profile" component={ProfileTabWithBoundary} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { session, setSession, user, profile, setProfile, isGuest, setIsGuest } = useAuthStore();
  const { hasHydrated, needsOnboarding, onboardingDog } = useOnboardingStore();
  const [loading, setLoading] = React.useState(true);
  const navRef = React.useRef<any>(null);

  useEffect(() => {
    if (user) {
      posthog.identify(user.id, {
        ...(user.email ? { email: user.email } : {}),
        ...(user.app_metadata?.provider ? { auth_provider: String(user.app_metadata.provider) } : {}),
      });
    } else {
      posthog.reset();
    }
  }, [user]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        getProfile(session.user.id).then((profile) => {
          setProfile(profile);
          setLoading(false);
        });
      } else {
        // No active session — drop straight into guest mode so the app opens
        // on the All Breeds tab rather than the login screen.
        setIsGuest(true);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        getProfile(session.user.id).then(setProfile);
      } else {
        setProfile(null);
        // After sign-out, return to guest browsing instead of showing the login screen.
        setIsGuest(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [setSession, setProfile]);

  if (loading || !hasHydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const theme = {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, background: colors.background },
  };

  const linking: LinkingOptions<RootStackParamList> = {
    prefixes: [
      'nuzzle://',
      'exp+nuzzle://',
      'https://www.nuzzleapp.io',
      'https://nuzzleapp.io',
    ],
    config: {
      screens: {
        PostDetail: 'post/:postId',
        UserProfile: 'user/:userId',
      },
    },
  };

  return (
    <>
    <NavigationContainer
      theme={theme}
      linking={linking}
      ref={(ref) => {
        navRef.current = ref;
        if (ref) registerSentryNavigationContainer(ref);
      }}
      onStateChange={() => {
        const route = navRef.current?.getCurrentRoute();
        if (route?.name) posthog.screen(route.name);
      }}
    >
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {(session && user) || isGuest ? (
          needsOnboarding && !isGuest ? (
            <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
          ) : (
            <>
              <RootStack.Screen
                name="Main"
                component={MainTabs}
                options={{ animation: onboardingDog ? 'none' : 'default' }}
              />
              {session && user && (
              <RootStack.Screen
                name="CreatePostModal"
                component={CreatePostScreen}
                options={{
                  title: 'Pawst',
                  headerShown: true,
                  headerTransparent: true,
                  contentStyle: {
                    backgroundColor: colors.surface,
                    // Rounded top corners only on iOS where the sheet sits above the
                    // previous screen. On Android it's full-screen so no rounding needed.
                    ...(Platform.OS !== 'android' && {
                      borderTopLeftRadius: 28,
                      borderTopRightRadius: 28,
                      overflow: 'hidden',
                    }),
                  },
                  header: (props) => (
                    <AnimatedStackHeader
                      {...props}
                      options={{
                        ...props.options,
                        headerTitleAlign: 'center',
                        headerTitle: () => (
                          <View style={styles.modalHeaderTitleBlock}>
                            {Platform.OS !== 'android' && (
                              <View
                                style={styles.modalSheetGrabber}
                                accessibilityLabel="Sheet"
                                accessibilityHint="Swipe down to close"
                              />
                            )}
                            <Text style={styles.modalHeaderTitle}>New post</Text>
                          </View>
                        ),
                        headerLeft: () => null,
                        headerRight: Platform.OS === 'android'
                          ? ({ tintColor }: { tintColor?: string }) => (
                              <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Close"
                                hitSlop={12}
                                onPress={() => props.navigation.goBack()}
                                style={({ pressed }) => [styles.modalCloseButton, pressed && styles.modalCloseButtonPressed]}
                              >
                                <X size={22} color={tintColor ?? '#111827'} strokeWidth={2.25} />
                              </Pressable>
                            )
                          : () => null,
                      }}
                      animateOnScroll={false}
                      includeTopInset={Platform.OS === 'android'}
                      baseHeaderHeight={CREATE_POST_SHEET_MODAL_HEADER_HEIGHT}
                      titleImageMarginTop={3}
                    />
                  ),
                  // iOS: slide-up sheet. Android: full-screen modal dismissed via back button.
                  presentation: Platform.OS === 'android' ? 'fullScreenModal' : 'modal',
                  animation: 'slide_from_bottom',
                }}
              />
              )}
              <RootStack.Screen
                name="SearchModal"
                component={SearchScreen}
                options={{
                  title: 'Search',
                  headerShown: true,
                  headerTransparent: true,
                  contentStyle: {
                    backgroundColor: colors.surface,
                    ...(Platform.OS !== 'android' && {
                      borderTopLeftRadius: 28,
                      borderTopRightRadius: 28,
                      overflow: 'hidden',
                    }),
                  },
                  header: (props) => (
                    <AnimatedStackHeader
                      {...props}
                      options={{
                        ...props.options,
                        headerTitleAlign: 'center',
                        headerTitle: () => (
                          <View style={styles.modalHeaderTitleBlock}>
                            {Platform.OS !== 'android' && (
                              <View
                                style={styles.modalSheetGrabber}
                                accessibilityLabel="Sheet"
                                accessibilityHint="Swipe down to close"
                              />
                            )}
                            <Text style={styles.modalHeaderTitle}>Search</Text>
                          </View>
                        ),
                        headerLeft: () => null,
                        headerRight: Platform.OS === 'android'
                          ? ({ tintColor }: { tintColor?: string }) => (
                              <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Close"
                                hitSlop={12}
                                onPress={() => props.navigation.goBack()}
                                style={({ pressed }) => [styles.modalCloseButton, pressed && styles.modalCloseButtonPressed]}
                              >
                                <X size={22} color={tintColor ?? '#111827'} strokeWidth={2.25} />
                              </Pressable>
                            )
                          : () => null,
                      }}
                      animateOnScroll={false}
                      includeTopInset={Platform.OS === 'android'}
                      baseHeaderHeight={CREATE_POST_SHEET_MODAL_HEADER_HEIGHT}
                      titleImageMarginTop={3}
                    />
                  ),
                  presentation: Platform.OS === 'android' ? 'fullScreenModal' : 'modal',
                  animation: 'slide_from_bottom',
                }}
              />
              <RootStack.Screen name="PostDetail" component={PostDetailScreen} options={{ title: 'Post' }} />
              <RootStack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: 'Profile' }} />
              {profile?.is_admin && (
                <RootStack.Screen
                  name="AdminDashboard"
                  component={AdminDashboardScreen}
                  options={({ navigation }) => ({
                    title: 'Admin Dashboard',
                    headerShown: true,
                    headerBackVisible: false,
                    headerLeft: () => (
                      <Pressable
                        onPress={() => navigation.goBack()}
                        hitSlop={12}
                        style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, marginLeft: 4 })}
                        accessibilityRole="button"
                        accessibilityLabel="Back"
                      >
                        <ChevronLeft size={26} color="#111827" strokeWidth={2} />
                      </Pressable>
                    ),
                  })}
                />
              )}
            </>
          )
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
    <ToastBanner />
    <GuestSignupPrompt />
    <LocationOnboardingModal />
    {session && user && !needsOnboarding && (
      <>
        <NotificationPrePrompt />
        <NotificationsSheet
          onPostPress={(postId) => navRef.current?.navigate('PostDetail', { postId })}
        />
      </>
    )}
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  tabErrorFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  tabErrorText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalHeaderTitleBlock: {
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 2,
  },
  modalSheetGrabber: {
    width: 37,
    height: 2,
    borderRadius: 2,
    backgroundColor: 'rgba(60, 60, 67, 0.75)',
    marginBottom: 11,
  },
  modalHeaderTitle: {
    ...(Platform.OS === 'web'
      ? { fontFamily: "'Inter', sans-serif", fontWeight: '700' as const }
      : { fontFamily: 'Inter_700Bold' as const }),
    fontSize: 19,
    color: '#111827',
  },
  modalCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    marginTop: 4,
  },
  modalCloseButtonPressed: {
    opacity: 0.6,
  },
});
