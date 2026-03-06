import type { BreedEnum } from '@/types';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Explore: undefined;
  Search: undefined;
  Notifications: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
  HomeFeed: undefined;
  PostDetail: { postId: string };
  CreatePost: { breed: BreedEnum };
};

export type ExploreStackParamList = {
  ExploreList: undefined;
  BreedFeed: { breed: BreedEnum };
  PostDetail: { postId: string };
  CreatePost: { breed: BreedEnum };
};

export type SearchStackParamList = {
  SearchMain: undefined;
  PostDetail: { postId: string };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  EditDog: undefined;
};
