export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

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

export type PlayStyleEnum = 'gentle' | 'chase' | 'wrestle' | 'independent' | 'mixed';

export type CompatibilityAnswerEnum = 'yes' | 'no' | 'unsure';

export type ReactionEnum =
  | 'LIKE'
  | 'LOVE'
  | 'HAHA'
  | 'WOW'
  | 'SAD'
  | 'ANGRY';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          city: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          city?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          city?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      dogs: {
        Row: {
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
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          breed: BreedEnum;
          age_group: AgeGroupEnum;
          energy_level: EnergyLevelEnum;
          dog_friendliness?: number | null;
          play_style?: PlayStyleEnum | null;
          good_with_puppies?: CompatibilityAnswerEnum | null;
          good_with_large_dogs?: CompatibilityAnswerEnum | null;
          good_with_small_dogs?: CompatibilityAnswerEnum | null;
          temperament_notes?: string | null;
          dog_image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          breed?: BreedEnum;
          age_group?: AgeGroupEnum;
          energy_level?: EnergyLevelEnum;
          dog_friendliness?: number | null;
          play_style?: PlayStyleEnum | null;
          good_with_puppies?: CompatibilityAnswerEnum | null;
          good_with_large_dogs?: CompatibilityAnswerEnum | null;
          good_with_small_dogs?: CompatibilityAnswerEnum | null;
          temperament_notes?: string | null;
          dog_image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      dog_location_checkins: {
        Row: {
          id: string;
          user_id: string;
          dog_id: string;
          location_key: string;
          location_name: string;
          created_at: string;
          expires_at: string;
          ended_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          dog_id: string;
          location_key: string;
          location_name: string;
          created_at?: string;
          expires_at: string;
          ended_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          dog_id?: string;
          location_key?: string;
          location_name?: string;
          created_at?: string;
          expires_at?: string;
          ended_at?: string | null;
        };
      };
      posts: {
        Row: {
          id: string;
          author_id: string;
          breed: BreedEnum;
          type: PostTypeEnum;
          tag: PostTagEnum;
          title: string | null;
          content_text: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          breed: BreedEnum;
          type: PostTypeEnum;
          tag: PostTagEnum;
          title?: string | null;
          content_text: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          author_id?: string;
          breed?: BreedEnum;
          type?: PostTypeEnum;
          tag?: PostTagEnum;
          title?: string | null;
          content_text?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      post_images: {
        Row: {
          id: string;
          post_id: string;
          image_url: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          image_url: string;
          sort_order: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          image_url?: string;
          sort_order?: number;
          created_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          content_text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          author_id: string;
          content_text: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          author_id?: string;
          content_text?: string;
          created_at?: string;
        };
      };
      post_reactions: {
        Row: {
          post_id: string;
          user_id: string;
          reaction_type: ReactionEnum;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          post_id: string;
          user_id: string;
          reaction_type: ReactionEnum;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          reaction_type?: ReactionEnum;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          actor_id: string;
          type: 'COMMENT' | 'REACTION';
          post_id: string;
          comment_id: string | null;
          created_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          actor_id: string;
          type: 'COMMENT' | 'REACTION';
          post_id: string;
          comment_id?: string | null;
          created_at?: string;
          read_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          actor_id?: string;
          type?: 'COMMENT' | 'REACTION';
          post_id?: string;
          comment_id?: string | null;
          created_at?: string;
          read_at?: string | null;
        };
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          reportable_type: 'POST' | 'COMMENT';
          reportable_id: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          reportable_type: 'POST' | 'COMMENT';
          reportable_id: string;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          reportable_type?: 'POST' | 'COMMENT';
          reportable_id?: string;
          reason?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
