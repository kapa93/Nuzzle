import type { BreedEnum } from '@/types';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
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
  PostDetail: { postId: string };
  CreatePost: { breed: BreedEnum };
  EditPost: { postId: string };
};

export type ExploreStackParamList = {
  ExploreList: undefined;
  BreedFeed: { breed: BreedEnum };
  SearchMain: undefined;
  PostDetail: { postId: string };
  CreatePost: { breed: BreedEnum };
  EditPost: { postId: string };
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
  EditDog: { dogId?: string };
};
