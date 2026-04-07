import type { PostWithDetails } from "@/types";
import type { QuestionCardData } from "@/ui/types";
import { BREED_TO_COLOR } from "./breedAssets";
import { formatAuthorDisplay, formatRelativeTime } from "./breed";
import { POST_TAG_LABELS } from "@/utils/breed";
import type { PostTypeEnum } from "@/types";

const typeTone: Record<PostTypeEnum, "question" | "tip" | "story"> = {
  QUESTION: "question",
  TIP: "tip",
  UPDATE_STORY: "story",
  MEETUP: "story", // fallback for any edge case; MeetupCard used for MEETUP posts
};

export function postToQuestionCardData(post: PostWithDetails): QuestionCardData {
  return {
    id: post.id,
    author: formatAuthorDisplay(post.author_name, post.author_dog_name),
    authorId: post.author_id,
    authorMeta: formatRelativeTime(post.created_at),
    authorAvatarUri: post.author_dog_image_url,
    breedKey: BREED_TO_COLOR[post.breed],
    badge: POST_TAG_LABELS[post.tag],
    badgeTone: typeTone[post.type],
    title: post.title ?? post.content_text.slice(0, 80) + (post.content_text.length > 80 ? "…" : ""),
    preview: post.title ? post.content_text : undefined,
    images: post.images ?? [],
    likeCount: post.reaction_counts?.LIKE ?? 0,
    loveCount: post.reaction_counts?.LOVE ?? 0,
    hahaCount: post.reaction_counts?.HAHA ?? 0,
    reaction_counts: post.reaction_counts,
    user_reaction: post.user_reaction,
    answerCount: post.comment_count ?? 0,
  };
}
