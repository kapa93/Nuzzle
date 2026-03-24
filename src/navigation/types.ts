import type { BreedEnum, PostTypeEnum } from '@/types';

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
};

export type OnboardingStackParamList = {
  OnboardingWelcome: undefined;
  EditDog: { dogId?: string; fromOnboarding?: boolean };
};

export type AuthStackParamList = {
  SignIn: { message?: string };
  SignUp: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Explore: undefined;
  Create: undefined;
  Notifications: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
  HomeFeed: undefined;
  DogBeachNow: undefined;
  DogProfile: { dogId: string };
  PostDetail: { postId: string };
  CreatePost: { breed: BreedEnum; initialType?: PostTypeEnum };
  EditPost: { postId: string };
  UserProfile: { userId: string };
};

export type ExploreStackParamList = {
  ExploreList: undefined;
  BreedFeed: { breed: BreedEnum };
  SearchMain: undefined;
  DogProfile: { dogId: string };
  PostDetail: { postId: string };
  CreatePost: { breed: BreedEnum };
  EditPost: { postId: string };
  UserProfile: { userId: string };
};

export type CreateStackParamList = {
  CreatePost: { breed?: BreedEnum };
};

export type SearchStackParamList = {
  SearchMain: undefined;
  PostDetail: { postId: string };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  EditDog: { dogId?: string; fromOnboarding?: boolean };
  DogProfile: { dogId: string };
  PostDetail: { postId: string };
  UserProfile: { userId: string };
};
