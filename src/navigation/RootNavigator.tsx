import React, { useEffect } from 'react';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { RootStackParamList, AuthStackParamList, MainTabParamList, OnboardingStackParamList } from './types';
import { SignInScreen } from '@/screens/SignInScreen';
import { SignUpScreen } from '@/screens/SignUpScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { DogBeachNowScreen } from '@/screens/DogBeachNowScreen';
import { ExploreScreen } from '@/screens/ExploreScreen';
import { NotificationsScreen } from '@/screens/NotificationsScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { BreedFeedScreen } from '@/screens/BreedFeedScreen';
import { PostDetailScreen } from '@/screens/PostDetailScreen';
import { CreatePostScreen } from '@/screens/CreatePostScreen';
import { EditPostScreen } from '@/screens/EditPostScreen';
import { EditProfileScreen } from '@/screens/EditProfileScreen';
import { EditDogScreen } from '@/screens/EditDogScreen';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { DogProfileScreen } from '@/screens/DogProfileScreen';
import { UserProfileScreen } from '@/screens/UserProfileScreen';
import { NuzzleTabBar } from './NuzzleTabBar';
import { SearchScreen } from '@/screens/SearchScreen';
import { AnimatedStackHeader } from '@/components/AnimatedStackHeader';
import { useScrollDirection } from '@/context/ScrollDirectionContext';
import { colors } from '@/theme';
import {
  CREATE_POST_SHEET_MODAL_HEADER_HEIGHT,
  CREATE_POST_STACK_HEADER_BAR,
} from '@/hooks/useStackHeaderHeight';
import type {
  ExploreStackParamList,
  HomeStackParamList,
  NotificationsStackParamList,
  ProfileStackParamList,
} from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <AuthStack.Screen name="SignIn" component={SignInScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
    </AuthStack.Navigator>
  );
}

function HomeTab() {
  const Stack = createNativeStackNavigator<HomeStackParamList>();
  return (
    <Stack.Navigator
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerTransparent: true,
        header: (props) => <AnimatedStackHeader {...props} animateOnScroll />,
      }}
    >
      <Stack.Screen name="HomeFeed" component={HomeScreen} options={{ title: 'Nuzzle' }} />
      <Stack.Screen name="SearchMain" component={SearchScreen} options={{ title: 'Search' }} />
      <Stack.Screen name="DogBeachNow" component={DogBeachNowScreen} options={{ title: 'Dog Beach Now' }} />
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
              bottomSeparator
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

function ExploreTab() {
  const Stack = createNativeStackNavigator<ExploreStackParamList>();
  return (
    <Stack.Navigator
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerTransparent: true,
        header: (props) => <AnimatedStackHeader {...props} animateOnScroll />,
      }}
    >
      <Stack.Screen name="ExploreList" component={ExploreScreen} options={{ title: 'Explore' }} />
      <Stack.Screen name="BreedFeed" component={BreedFeedScreen} options={({ route }: { route: { params?: { breed?: string } } }) => ({ title: (route.params?.breed ?? 'Feed').replace(/_/g, ' ') })} />
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
              bottomSeparator
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

function EmptyCreateTab() {
  return <View style={{ flex: 1, backgroundColor: colors.background }} />;
}

function NotificationsTab() {
  const Stack = createNativeStackNavigator<NotificationsStackParamList>();
  return (
    <Stack.Navigator
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerTransparent: true,
        header: (props) => <AnimatedStackHeader {...props} animateOnScroll />,
      }}
    >
      <Stack.Screen
        name="NotificationsMain"
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
      <Stack.Screen name="SearchMain" component={SearchScreen} options={{ title: 'Search' }} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ title: 'Post' }} />
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
      <Tab.Screen name="Home" component={HomeTab} />
      <Tab.Screen name="Explore" component={ExploreTab} />
      <Tab.Screen name="Create" component={EmptyCreateTab} />
      <Tab.Screen name="Notifications" component={NotificationsTab} />
      <Tab.Screen name="Profile" component={ProfileTab} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { session, setSession, user, needsOnboarding, onboardingDog } = useAuthStore();
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [setSession]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const theme = {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, background: colors.background },
  };

  return (
    <NavigationContainer theme={theme}>
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {session && user ? (
          needsOnboarding ? (
            <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
          ) : (
            <>
              <RootStack.Screen
                name="Main"
                component={MainTabs}
                options={{ animation: onboardingDog ? 'none' : 'default' }}
              />
              <RootStack.Screen
                name="CreatePostModal"
                component={CreatePostScreen}
                options={{
                  title: 'Pawst',
                  headerShown: true,
                  headerTransparent: true,
                  contentStyle: {
                    backgroundColor: colors.surface,
                    borderTopLeftRadius: 28,
                    borderTopRightRadius: 28,
                    overflow: 'hidden',
                  },
                  header: (props) => (
                    <AnimatedStackHeader
                      {...props}
                      options={{
                        ...props.options,
                        headerTitleAlign: 'center',
                        headerTitle: () => (
                          <View style={styles.modalHeaderTitleBlock}>
                            <View
                              style={styles.modalSheetGrabber}
                              accessibilityLabel="Sheet"
                              accessibilityHint="Swipe down to close"
                            />
                            <Text style={styles.modalHeaderTitle}>New post</Text>
                          </View>
                        ),
                        headerLeft: () => null,
                        headerRight: () => null,
                      }}
                      animateOnScroll={false}
                      includeTopInset={false}
                      baseHeaderHeight={CREATE_POST_SHEET_MODAL_HEADER_HEIGHT}
                      titleImageMarginTop={3}
                      bottomSeparator
                    />
                  ),
                  presentation: 'modal',
                  animation: 'slide_from_bottom',
                }}
              />
              <RootStack.Screen
                name="SearchModal"
                component={SearchScreen}
                options={{
                  title: 'Search',
                  headerShown: true,
                  headerTransparent: true,
                  contentStyle: {
                    backgroundColor: colors.surface,
                    borderTopLeftRadius: 28,
                    borderTopRightRadius: 28,
                    overflow: 'hidden',
                  },
                  header: (props) => (
                    <AnimatedStackHeader
                      {...props}
                      options={{
                        ...props.options,
                        headerTitleAlign: 'center',
                        headerTitle: () => (
                          <View style={styles.modalHeaderTitleBlock}>
                            <View
                              style={styles.modalSheetGrabber}
                              accessibilityLabel="Sheet"
                              accessibilityHint="Swipe down to close"
                            />
                            <Text style={styles.modalHeaderTitle}>Search</Text>
                          </View>
                        ),
                        headerLeft: () => null,
                        headerRight: () => null,
                      }}
                      animateOnScroll={false}
                      includeTopInset={false}
                      baseHeaderHeight={CREATE_POST_SHEET_MODAL_HEADER_HEIGHT}
                      titleImageMarginTop={3}
                      bottomSeparator
                    />
                  ),
                  presentation: 'modal',
                  animation: 'slide_from_bottom',
                }}
              />
              <RootStack.Screen name="PostDetail" component={PostDetailScreen} options={{ title: 'Post' }} />
              <RootStack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: 'Profile' }} />
            </>
          )
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#5B6A61',
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
});
