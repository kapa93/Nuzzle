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
  SavedPlaces: undefined;
  Create: undefined;
  Explore: undefined;
  Profile: undefined;
};

export type SavedPlacesStackParamList = {
  SavedPlacesFeed: undefined;
  PlaceDetail: { placeId: string };
  PlaceNow: { placeId: string };
  DogProfile: { dogId: string };
  PostDetail: { postId: string };
  CreatePost: { breed?: BreedEnum; initialType?: PostTypeEnum; initialPlaceId?: string; initialPlaceName?: string };
  EditPost: { postId: string };
  UserProfile: { userId: string };
  SearchMain: SearchMainParams;
};

export type HomeStackParamList = {
  HomeFeed: undefined;
  SearchMain: SearchMainParams;
  PlaceDetail: { placeId: string };
  PlaceNow: { placeId: string };
  DogProfile: { dogId: string };
  PostDetail: { postId: string };
  CreatePost: { breed?: BreedEnum; initialType?: PostTypeEnum; initialPlaceId?: string; initialPlaceName?: string };
  EditPost: { postId: string };
  UserProfile: { userId: string };
};

export type ExploreStackParamList = {
  ExploreList: { initialTab?: 'breeds' | 'places' } | undefined;
  BreedFeed: { breed: BreedEnum };
  SearchMain: SearchMainParams;
  DogProfile: { dogId: string };
  PostDetail: { postId: string };
  CreatePost: { breed?: BreedEnum; initialType?: PostTypeEnum; initialPlaceId?: string; initialPlaceName?: string };
  EditPost: { postId: string };
  UserProfile: { userId: string };
  PlacesList: undefined;
  PlaceDetail: { placeId: string };
  GooglePlacePreview: { googlePlaceId: string; initialName?: string };
  DogSpotPreview: { googlePlaceId: string; initialName?: string };
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
  SearchMain: SearchMainParams;
  EditProfile: undefined;
  EditDog: { dogId?: string; fromOnboarding?: boolean };
  DogProfile: { dogId: string };
  PostDetail: { postId: string };
  UserProfile: { userId: string };
};
