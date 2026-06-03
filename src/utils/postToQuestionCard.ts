import type { PostWithDetails } from "@/types";
import type { QuestionCardData } from "@/ui/types";
import { BREED_TO_COLOR } from "./breedAssets";
import { formatAuthorDisplay, formatRelativeTime } from "./breed";
import { POST_TAG_LABELS } from "@/utils/breed";
import type { PostTagEnum } from "@/types";
import type { Tone } from "@/ui/TagChip";

export const tagTone: Record<PostTagEnum, Tone> = {
  TRAINING:   "training",
  BEHAVIOR:   "behavior",
  HEALTH:     "health",
  GROOMING:   "grooming",
  FOOD:       "food",
  GEAR:       "gear",
  PUPPY:      "puppy",
  ADOLESCENT: "adolescent",
  ADULT:      "adult",
  SENIOR:     "senior",
  PLAYDATE:   "playdate",
};

export function postToQuestionCardData(post: PostWithDetails): QuestionCardData {
  const content = post.content_text ?? "";
  const hasTitle = !!post.title;
  return {
    id: post.id,
    author: formatAuthorDisplay(post.author_name, post.author_dog_name),
    authorId: post.author_id,
    authorMeta: formatRelativeTime(post.created_at),
    authorAvatarUri: post.author_dog_image_url,
    breedKey: post.breed ? BREED_TO_COLOR[post.breed] : 'mixed',
    badge: POST_TAG_LABELS[post.tag],
    badgeTone: tagTone[post.tag] ?? "neutral",
    hasTitle,
    title: post.title ?? "",
    preview: hasTitle ? content : undefined,
    fullContent: content,
    images: post.images ?? [],
    likeCount: post.reaction_counts?.LIKE ?? 0,
    loveCount: post.reaction_counts?.LOVE ?? 0,
    hahaCount: post.reaction_counts?.HAHA ?? 0,
    reaction_counts: post.reaction_counts,
    user_reaction: post.user_reaction,
    answerCount: post.comment_count ?? 0,
  };
}
