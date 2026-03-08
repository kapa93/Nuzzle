import React, { useEffect } from 'react';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { RootStackParamList, AuthStackParamList, MainTabParamList } from './types';
import { SignInScreen } from '@/screens/SignInScreen';
import { SignUpScreen } from '@/screens/SignUpScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { ExploreScreen } from '@/screens/ExploreScreen';
import { NotificationsScreen } from '@/screens/NotificationsScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { BreedFeedScreen } from '@/screens/BreedFeedScreen';
import { PostDetailScreen } from '@/screens/PostDetailScreen';
import { CreatePostScreen } from '@/screens/CreatePostScreen';
import { EditPostScreen } from '@/screens/EditPostScreen';
import { EditProfileScreen } from '@/screens/EditProfileScreen';
import { EditDogScreen } from '@/screens/EditDogScreen';
import { BreedBuddyTabBar } from './BreedBuddyTabBar';
import { SearchScreen } from '@/screens/SearchScreen';
import { colors } from '@/theme';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
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
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator screenOptions={{ contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="HomeFeed" component={HomeScreen} options={{ title: 'BreedBuddy' }} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ title: 'Post' }} />
      <Stack.Screen name="CreatePost" component={CreatePostScreen} options={{ title: 'Create Post' }} />
      <Stack.Screen name="EditPost" component={EditPostScreen} options={{ title: 'Edit Post' }} />
    </Stack.Navigator>
  );
}

function ExploreTab() {
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator screenOptions={{ contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="ExploreList" component={ExploreScreen} options={{ title: 'Explore' }} />
      <Stack.Screen name="BreedFeed" component={BreedFeedScreen} options={({ route }: { route: { params?: { breed?: string } } }) => ({ title: (route.params?.breed ?? 'Feed').replace(/_/g, ' ') })} />
      <Stack.Screen name="SearchMain" component={SearchScreen} options={{ title: 'Search' }} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ title: 'Post' }} />
      <Stack.Screen name="CreatePost" component={CreatePostScreen} options={{ title: 'Create Post' }} />
      <Stack.Screen name="EditPost" component={EditPostScreen} options={{ title: 'Edit Post' }} />
    </Stack.Navigator>
  );
}

function CreateTab() {
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator screenOptions={{ contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        initialParams={{ breed: 'GOLDEN_RETRIEVER' }}
        options={{ title: 'Pawst' }}
      />
    </Stack.Navigator>
  );
}

function ProfileTab() {
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator screenOptions={{ contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
      <Stack.Screen
        name="EditDog"
        component={EditDogScreen}
        options={({ route }: { route: { params?: { dogId?: string } } }) => ({
          title: route.params?.dogId ? 'Edit Dog' : 'Add Dog',
        })}
      />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <BreedBuddyTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeTab} />
      <Tab.Screen name="Explore" component={ExploreTab} />
      <Tab.Screen name="Create" component={CreateTab} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={ProfileTab} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { session, setSession, user } = useAuthStore();
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
          <RootStack.Screen name="Main" component={MainTabs} />
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
});
