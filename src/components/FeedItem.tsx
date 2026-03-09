import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { QuestionCard } from "@/ui/QuestionCard";
import { postToQuestionCardData } from "@/utils/postToQuestionCard";
import { spacing } from "@/theme";
import type { PostWithDetails, ReactionEnum } from "@/types";

type Props = {
  item: PostWithDetails;
  onPostPress: (postId: string) => void;
  onReactionSelect: (postId: string, reaction: ReactionEnum | null) => void;
  onReactionMenuOpenChange: (open: boolean) => void;
  currentUserId?: string | null;
  onEdit: (postId: string) => void;
  onDelete: (postId: string) => void;
};

function FeedItemInner({ item, onPostPress, onReactionSelect, onReactionMenuOpenChange, currentUserId, onEdit, onDelete }: Props) {
  const handlePress = useCallback(() => onPostPress(item.id), [item.id, onPostPress]);
  const handleReactionSelect = useCallback(
    (reaction: ReactionEnum | null) => onReactionSelect(item.id, reaction),
    [item.id, onReactionSelect]
  );

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

export const FeedItem = React.memo(FeedItemInner);

const styles = StyleSheet.create({
  cardWrap: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
});
