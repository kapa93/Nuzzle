import type { BreedEnum, PostTypeEnum } from '@/types';

export type SearchMainParams = {
  initialQuery?: string;
  initialBreed?: BreedEnum;
  autoSearch?: boolean;
  launchKey?: number;
} | undefined;

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
  CreatePostModal: { breed?: BreedEnum; initialType?: PostTypeEnum } | undefined;
  SearchModal: SearchMainParams;
  PostDetail: { postId: string };
  UserProfile: { userId: string };
};

export type OnboardingStackParamList = {
  OnboardingWelcome: undefined;
  EditDog: { dogId?: string; fromOnboarding?: boolean };
};

export type AuthStackParamList = {
  SignIn: { message?: string };
  SignUp: undefined;
  LegalDocument: { documentType: 'terms' | 'communityGuidelines' | 'privacyPolicy' };
};

export type MainTabParamList = {
  Home: undefined;
  Explore: undefined;
  Create: undefined;
  Notifications: undefined;
  Profile: undefined;
};

export type NotificationsStackParamList = {
  NotificationsMain: undefined;
  SearchMain: SearchMainParams;
  PostDetail: { postId: string };
};

export type HomeStackParamList = {
  HomeFeed: undefined;
  SearchMain: SearchMainParams;
  PlaceNow: { placeId: string };
  DogProfile: { dogId: string };
  PostDetail: { postId: string };
  CreatePost: { breed: BreedEnum; initialType?: PostTypeEnum };
  EditPost: { postId: string };
  UserProfile: { userId: string };
};

export type ExploreStackParamList = {
  ExploreList: undefined;
  BreedFeed: { breed: BreedEnum };
  SearchMain: SearchMainParams;
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
  SearchMain: SearchMainParams;
  PostDetail: { postId: string };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  SearchMain: SearchMainParams;
  EditProfile: undefined;
  EditDog: { dogId?: string; fromOnboarding?: boolean };
  DogProfile: { dogId: string };
  PostDetail: { postId: string };
  UserProfile: { userId: string };
};
