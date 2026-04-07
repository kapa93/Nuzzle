import type { ImageSourcePropType } from "react-native";
import type { BreedColorKey } from "../theme";

export type BreedKey = "aussie" | "husky" | "golden" | "frenchie" | "pitbull" | "lab";

export type PackItem = {
  key: BreedKey;
  label: string;
  image: ImageSourcePropType;
};

import type { ReactionEnum } from "@/types";

export type QuestionCardData = {
  id: string;
  author: string;
  authorId?: string;
  authorMeta?: string;
  authorAvatarUri?: string | null;
  breedKey: BreedColorKey;
  badge?: string;
  badgeTone?: "neutral" | "question" | "tip" | "story";
  /** True when the post has a dedicated title (body is separate from title line). */
  hasTitle: boolean;
  /** Post title when hasTitle; may be empty string when !hasTitle (use fullContent for body). */
  title: string;
  /** Body text when hasTitle (same as full content). */
  preview?: string;
  /** Full post body; used for expandable preview when there is no title line. */
  fullContent: string;
  images?: string[];
  likeCount?: number;
  loveCount?: number;
  hahaCount?: number;
  answerCount?: number;
  reaction_counts?: Partial<Record<ReactionEnum, number>>;
  user_reaction?: ReactionEnum | null;
};
