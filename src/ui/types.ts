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
  title: string;
  preview?: string;
  images?: string[];
  likeCount?: number;
  loveCount?: number;
  hahaCount?: number;
  answerCount?: number;
  reaction_counts?: Partial<Record<ReactionEnum, number>>;
  user_reaction?: ReactionEnum | null;
};
