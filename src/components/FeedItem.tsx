import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { QuestionCard } from "@/ui/QuestionCard";
import { MeetupCard } from "@/components/MeetupCard";
import { postToQuestionCardData } from "@/utils/postToQuestionCard";
import { spacing } from "@/theme";
import type { PostWithDetails, ReactionEnum } from "@/types";

type Props = {
  item: PostWithDetails;
  onPostPress: (postId: string) => void;
  onReactionSelect: (postId: string, reaction: ReactionEnum | null) => void;
  onReactionMenuOpenChange: (open: boolean) => void;
  onRsvpToggle?: (postId: string, rsvped: boolean) => void;
  currentUserId?: string | null;
  onEdit: (postId: string) => void;
  onDelete: (postId: string) => void;
};

function FeedItemInner({
  item,
  onPostPress,
  onReactionSelect,
  onReactionMenuOpenChange,
  onRsvpToggle,
  currentUserId,
  onEdit,
  onDelete,
}: Props) {
  const handlePress = useCallback(() => onPostPress(item.id), [item.id, onPostPress]);
  const handleReactionSelect = useCallback(
    (reaction: ReactionEnum | null) => onReactionSelect(item.id, reaction),
    [item.id, onReactionSelect]
  );
  const handleRsvpToggle = useCallback(
    (postId: string, rsvped: boolean) => onRsvpToggle?.(postId, rsvped),
    [onRsvpToggle]
  );

  if (item.type === "MEETUP") {
    return (
      <View style={styles.cardWrap}>
        <MeetupCard
          post={item}
          onPress={handlePress}
          onReactionSelect={handleReactionSelect}
          onReactionMenuOpenChange={onReactionMenuOpenChange}
          onRsvpToggle={handleRsvpToggle}
          currentUserId={currentUserId}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </View>
    );
  }

  return (
    <View style={styles.cardWrap}>
      <QuestionCard
        data={postToQuestionCardData(item)}
        onPress={handlePress}
        onReactionSelect={handleReactionSelect}
        onReactionMenuOpenChange={onReactionMenuOpenChange}
        currentUserId={currentUserId}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </View>
  );
}

function feedItemPropsAreEqual(prev: Props, next: Props): boolean {
  if (prev.item.id !== next.item.id) return false;
  if (prev.item.user_reaction !== next.item.user_reaction) return false;
  if (prev.item.user_rsvped !== next.item.user_rsvped) return false;
  if (prev.item.attendee_count !== next.item.attendee_count) return false;
  if (prev.item.comment_count !== next.item.comment_count) return false;
  if (prev.currentUserId !== next.currentUserId) return false;
  const prevCounts = prev.item.reaction_counts ?? {};
  const nextCounts = next.item.reaction_counts ?? {};
  const prevTotal = Object.values(prevCounts).reduce((s, c) => s + (c ?? 0), 0);
  const nextTotal = Object.values(nextCounts).reduce((s, c) => s + (c ?? 0), 0);
  if (prevTotal !== nextTotal) return false;
  return true;
}

export const FeedItem = React.memo(FeedItemInner, feedItemPropsAreEqual);

const styles = StyleSheet.create({
  cardWrap: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
});
