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
  CreatePostModal: { breed?: BreedEnum; initialType?: PostTypeEnum; initialPlaceId?: string; initialPlaceName?: string } | undefined;
  SearchModal: SearchMainParams;
  PostDetail: { postId: string };
  UserProfile: { userId: string };
  AdminDashboard: undefined;
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
  DogSpots: undefined;
  Create: undefined;
  DogFriendly: undefined;
  Profile: undefined;
};

export type DogSpotsStackParamList = {
  DogSpotsFeed: undefined;
  GooglePlacePreview: { googlePlaceId: string; initialName?: string };
  PlaceDetail: { placeId: string };
  PlaceNow: { placeId: string };
  DogProfile: { dogId: string };
  PostDetail: { postId: string };
  CreatePost: { breed?: BreedEnum; initialType?: PostTypeEnum; initialPlaceId?: string; initialPlaceName?: string };
  EditPost: { postId: string };
  UserProfile: { userId: string };
  SearchMain: SearchMainParams;
};

export type DogsStackParamList = {
  DogsFeed: undefined;
  BreedFeed: { breed: BreedEnum };
  SearchMain: SearchMainParams;
  PlaceDetail: { placeId: string };
  PlaceNow: { placeId: string };
  DogProfile: { dogId: string };
  PostDetail: { postId: string };
  CreatePost: { breed?: BreedEnum; initialType?: PostTypeEnum; initialPlaceId?: string; initialPlaceName?: string };
  EditPost: { postId: string };
  UserProfile: { userId: string };
};

export type DogFriendlyPlacesStackParamList = {
  DogFriendlyPlacesList: undefined;
  BreedFeed: { breed: BreedEnum };
  SearchMain: SearchMainParams;
  DogProfile: { dogId: string };
  PostDetail: { postId: string };
  CreatePost: { breed?: BreedEnum; initialType?: PostTypeEnum; initialPlaceId?: string; initialPlaceName?: string };
  EditPost: { postId: string };
  UserProfile: { userId: string };
  PlaceDetail: { placeId: string };
  GooglePlacePreview: { googlePlaceId: string; initialName?: string };
  DogFriendlyPlacePreview: { googlePlaceId: string; initialName?: string };
  PlaceNow: { placeId: string };
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
  Settings: undefined;
  LegalDocument: { documentType: 'terms' | 'communityGuidelines' | 'privacyPolicy' };
  SearchMain: SearchMainParams;
  EditProfile: undefined;
  EditDog: { dogId?: string; fromOnboarding?: boolean };
  DogProfile: { dogId: string };
  PostDetail: { postId: string };
  UserProfile: { userId: string };
};
