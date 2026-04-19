// Re-export DB-generated enums from database.ts as the single source of truth
export type {
  BreedEnum,
  PostTagEnum,
  AgeGroupEnum,
  EnergyLevelEnum,
  PlayStyleEnum,
  CompatibilityAnswerEnum,
  ReactionEnum,
  DogInteractionSourceTypeEnum as DogInteractionSourceType,
  PlaceTypeEnum,
} from './database';

import type {
  BreedEnum,
  PostTagEnum,
  AgeGroupEnum,
  EnergyLevelEnum,
  PlayStyleEnum,
  CompatibilityAnswerEnum,
  ReactionEnum,
  DogInteractionSourceTypeEnum as DogInteractionSourceType,
  PlaceTypeEnum,
} from './database';

// PostTypeEnum extends the DB type with MEETUP (app-level post type)
export type PostTypeEnum = 'QUESTION' | 'UPDATE_STORY' | 'TIP' | 'MEETUP';

export const BREEDS: BreedEnum[] = [
  'AUSTRALIAN_SHEPHERD',
  'DACHSHUND',
  'GERMAN_SHEPHERD',
  'HUSKY',
  'GOLDEN_DOODLE',
  'GOLDEN_RETRIEVER',
  'MIXED_BREED',
  'PUG',
  'FRENCH_BULLDOG',
  'PIT_BULL',
  'LABRADOR_RETRIEVER',
  'LABRADOODLE',
];

export const POST_TYPES: PostTypeEnum[] = ['QUESTION', 'UPDATE_STORY', 'TIP', 'MEETUP'];

export const POST_TAGS: PostTagEnum[] = [
  'TRAINING',
  'BEHAVIOR',
  'HEALTH',
  'GROOMING',
  'FOOD',
  'GEAR',
  'PUPPY',
  'ADOLESCENT',
  'ADULT',
  'SENIOR',
  'PLAYDATE',
];

export const AGE_GROUPS: AgeGroupEnum[] = [
  'PUPPY',
  'ADOLESCENT',
  'ADULT',
  'SENIOR',
];

export const ENERGY_LEVELS: EnergyLevelEnum[] = ['LOW', 'MED', 'HIGH'];

export const PLAY_STYLES: PlayStyleEnum[] = ['gentle', 'chase', 'wrestle', 'independent', 'mixed'];

export const COMPATIBILITY_ANSWERS: CompatibilityAnswerEnum[] = ['yes', 'no', 'unsure'];

export const REACTIONS: { type: ReactionEnum; emoji: string }[] = [
  { type: 'LIKE', emoji: '👍' },
  { type: 'LOVE', emoji: '❤️' },
  { type: 'HAHA', emoji: '😂' },
  { type: 'WOW', emoji: '😮' },
  { type: 'SAD', emoji: '😢' },
  { type: 'ANGRY', emoji: '😡' },
];

// Database types
export interface Profile {
  id: string;
  name: string;
  email: string;
  city: string | null;
  profile_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Dog {
  id: string;
  owner_id: string;
  name: string;
  breed: BreedEnum;
  age_group: AgeGroupEnum;
  energy_level: EnergyLevelEnum;
  dog_friendliness: number | null;
  play_style: PlayStyleEnum | null;
  good_with_puppies: CompatibilityAnswerEnum | null;
  good_with_large_dogs: CompatibilityAnswerEnum | null;
  good_with_small_dogs: CompatibilityAnswerEnum | null;
  temperament_notes: string | null;
  dog_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DogLocationCheckin {
  id: string;
  user_id: string;
  dog_id: string;
  place_id: string | null;
  location_key: string;
  location_name: string;
  created_at: string;
  expires_at: string;
  ended_at: string | null;
}

export interface ActivePlaceCheckin extends DogLocationCheckin {
  dog_name: string;
  dog_breed: BreedEnum;
  dog_play_style: PlayStyleEnum | null;
  dog_image_url: string | null;
  owner_name: string | null;
}

/** @deprecated Use ActivePlaceCheckin */
export type ActiveDogBeachCheckin = ActivePlaceCheckin;

export interface Place {
  id: string;
  name: string;
  slug: string;
  place_type: PlaceTypeEnum;
  city: string | null;
  neighborhood: string | null;
  latitude: number | null;
  longitude: number | null;
  check_in_radius_meters: number;
  check_in_duration_minutes: number;
  description: string | null;
  is_active: boolean;
  supports_check_in: boolean;
  created_at: string;
  updated_at: string;
}

export interface DogInteraction {
  id: string;
  dog_id_1: string;
  dog_id_2: string;
  created_by_user_id: string;
  location_name: string | null;
  source_type: DogInteractionSourceType | null;
  created_at: string;
}

export interface DogMetSummary extends Dog {
  latest_interaction_at: string;
  interaction_count: number;
}

export interface Post {
  id: string;
  author_id: string;
  breed: BreedEnum;
  type: PostTypeEnum;
  tag: PostTagEnum;
  title: string | null;
  content_text: string;
  created_at: string;
  updated_at: string;
  author?: Profile;
  dog?: Dog;
  post_images?: PostImage[];
  reaction_counts?: Record<ReactionEnum, number>;
  user_reaction?: ReactionEnum;
  comment_count?: number;
  meetup_details?: MeetupDetails;
  attendee_count?: number;
  user_rsvped?: boolean;
}

export type MeetupKind = 'playdate' | 'walk' | 'beach' | 'training' | 'other';

export const MEETUP_KINDS: MeetupKind[] = ['playdate', 'walk', 'beach', 'training', 'other'];

export const MEETUP_KIND_LABELS: Record<MeetupKind, string> = {
  playdate: 'Playdate',
  walk: 'Walk',
  beach: 'Beach',
  training: 'Training',
  other: 'Other',
};

export interface MeetupDetails {
  post_id: string;
  location_name: string;
  start_time: string;
  end_time: string | null;
  meetup_kind: MeetupKind | null;
  spots_available: number | null;
  host_notes: string | null;
  is_recurring_seeded: boolean;
  created_at: string;
  updated_at: string;
}

export interface MeetupRsvp {
  id: string;
  meetup_post_id: string;
  user_id: string;
  created_at: string;
}

export interface PostImage {
  id: string;
  post_id: string;
  image_url: string;
  sort_order: number;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content_text: string;
  created_at: string;
  author?: Profile;
  dog?: Dog;
}

export interface PostReaction {
  post_id: string;
  user_id: string;
  reaction_type: ReactionEnum;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  type: 'COMMENT' | 'REACTION' | 'MEETUP_RSVP' | 'DOG_INTERACTION';
  post_id: string | null;
  comment_id: string | null;
  dog_interaction_id?: string | null;
  created_at: string;
  read_at: string | null;
  actor?: Profile;
  post?: Post;
}

export interface Report {
  id: string;
  reporter_id: string;
  reportable_type: 'POST' | 'COMMENT';
  reportable_id: string;
  reason: string | null;
  created_at: string;
}

// Alias for API usage
export type ReactionType = ReactionEnum;

// Post with joined author, dog, images, reactions - used in feed/detail
export interface PostWithDetails extends Omit<Post, 'reaction_counts' | 'user_reaction' | 'comment_count' | 'attendee_count' | 'user_rsvped'> {
  author_name: string;
  author_dog_image_url: string | null;
  author_dog_name: string | null;
  images: string[];
  reaction_counts: Partial<Record<ReactionEnum, number>>;
  user_reaction: ReactionEnum | null;
  comment_count: number;
  meetup_details?: MeetupDetails;
  attendee_count?: number;
  user_rsvped?: boolean;
}

// Comment with author + dog for display
export interface CommentWithAuthor extends Comment {
  author_name: string;
  author_dog_image_url: string | null;
  author_dog_name: string | null;
}

// Display helpers
export const BREED_LABELS: Record<BreedEnum, string> = {
  AUSTRALIAN_SHEPHERD: 'Australian Shepherd',
  DACHSHUND: 'Dachshund',
  GERMAN_SHEPHERD: 'German Shepherd',
  HUSKY: 'Husky',
  GOLDEN_DOODLE: 'Golden Doodle',
  GOLDEN_RETRIEVER: 'Golden Retriever',
  MIXED_BREED: 'Mixed Breed',
  PUG: 'Pug',
  FRENCH_BULLDOG: 'French Bulldog',
  PIT_BULL: 'Pit Bull',
  LABRADOR_RETRIEVER: 'Labrador Retriever',
  LABRADOODLE: 'Labradoodle',
};

export const POST_TYPE_LABELS: Record<PostTypeEnum, string> = {
  QUESTION: 'Question',
  UPDATE_STORY: 'Update/Story',
  TIP: 'Tip',
  MEETUP: 'Meetup',
};

export const POST_TAG_LABELS: Record<PostTagEnum, string> = {
  TRAINING: 'Training',
  BEHAVIOR: 'Behavior',
  HEALTH: 'Health',
  GROOMING: 'Grooming',
  FOOD: 'Food',
  GEAR: 'Gear',
  PUPPY: 'Puppy',
  ADOLESCENT: 'Adolescent',
  ADULT: 'Adult',
  SENIOR: 'Senior',
  PLAYDATE: 'Playdate',
};

export const PLAY_STYLE_LABELS: Record<PlayStyleEnum, string> = {
  gentle: 'Gentle',
  chase: 'Chase',
  wrestle: 'Wrestle',
  independent: 'Independent',
  mixed: 'Mixed',
};

export const COMPATIBILITY_ANSWER_LABELS: Record<CompatibilityAnswerEnum, string> = {
  yes: 'Yes',
  no: 'No',
  unsure: 'Unsure',
};
