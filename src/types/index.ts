// Enums matching Supabase schema
export type BreedEnum =
  | 'AUSTRALIAN_SHEPHERD'
  | 'HUSKY'
  | 'GOLDEN_RETRIEVER'
  | 'FRENCH_BULLDOG'
  | 'PIT_BULL'
  | 'LABRADOR_RETRIEVER';

export type PostTypeEnum = 'QUESTION' | 'UPDATE_STORY' | 'TIP';

export type PostTagEnum =
  | 'TRAINING'
  | 'BEHAVIOR'
  | 'HEALTH'
  | 'GROOMING'
  | 'FOOD'
  | 'GEAR'
  | 'PUPPY'
  | 'ADOLESCENT'
  | 'ADULT'
  | 'SENIOR'
  | 'PLAYDATE';

export type AgeGroupEnum = 'PUPPY' | 'ADOLESCENT' | 'ADULT' | 'SENIOR';

export type EnergyLevelEnum = 'LOW' | 'MED' | 'HIGH';

export type ReactionEnum =
  | 'LIKE'
  | 'LOVE'
  | 'HAHA'
  | 'WOW'
  | 'SAD'
  | 'ANGRY';

export const BREEDS: BreedEnum[] = [
  'AUSTRALIAN_SHEPHERD',
  'HUSKY',
  'GOLDEN_RETRIEVER',
  'FRENCH_BULLDOG',
  'PIT_BULL',
  'LABRADOR_RETRIEVER',
];

export const POST_TYPES: PostTypeEnum[] = ['QUESTION', 'UPDATE_STORY', 'TIP'];

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
  dog_image_url: string | null;
  created_at: string;
  updated_at: string;
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
  type: 'COMMENT' | 'REACTION';
  post_id: string;
  comment_id: string | null;
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
export interface PostWithDetails extends Omit<Post, 'reaction_counts' | 'user_reaction' | 'comment_count'> {
  author_name: string;
  author_dog_image_url: string | null;
  author_dog_name: string | null;
  images: string[];
  reaction_counts: Partial<Record<ReactionEnum, number>>;
  user_reaction: ReactionEnum | null;
  comment_count: number;
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
  HUSKY: 'Husky',
  GOLDEN_RETRIEVER: 'Golden Retriever',
  FRENCH_BULLDOG: 'French Bulldog',
  PIT_BULL: 'Pit Bull',
  LABRADOR_RETRIEVER: 'Labrador Retriever',
};

export const POST_TYPE_LABELS: Record<PostTypeEnum, string> = {
  QUESTION: 'Question',
  UPDATE_STORY: 'Update/Story',
  TIP: 'Tip',
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
