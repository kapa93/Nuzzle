import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "../theme";
import { Avatar } from "./Avatar";
import { ReactionPill } from "./ReactionPill";
import { ReactionBar } from "../components/ReactionBar";
import type { ReactionEnum } from "../types";

type Props = {
  author: string;
  body: string;
  avatarUri?: string | null;
  timestamp?: string;
  helpfulCount?: number;
  onAuthorPress?: () => void;
  onDeletePress?: () => void;
  reactionCounts?: Partial<Record<ReactionEnum, number>>;
  userReaction?: ReactionEnum | null;
  onReactionSelect?: (reaction: ReactionEnum | null) => void;
};

export function AnswerCard({ author, body, avatarUri, timestamp, helpfulCount = 0, onAuthorPress, onDeletePress, reactionCounts, userReaction, onReactionSelect }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Pressable style={styles.authorPressable} disabled={!onAuthorPress} onPress={onAuthorPress}>
          <Avatar
            size={32}
            source={avatarUri ? { uri: avatarUri } : undefined}
            fallback={author?.[0]?.toUpperCase() ?? "🐶"}
          />
          <View style={styles.authorTextColumn}>
            <Text style={styles.author}>{author}</Text>
            {timestamp ? <Text style={styles.timestamp}>{timestamp}</Text> : null}
          </View>
        </Pressable>
        {onDeletePress && (
          <Pressable onPress={onDeletePress} style={styles.deleteButton} hitSlop={8}>
            <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
      <Text style={styles.body}>{body}</Text>
      {onReactionSelect ? (
        <ReactionBar
          reactions={reactionCounts ?? {}}
          userReaction={userReaction ?? null}
          onSelect={onReactionSelect}
          wrapperStyle={styles.reactionBarWrapper}
        />
      ) : helpfulCount > 0 ? (
        <View style={styles.footer}>
          <ReactionPill emoji="🐾" label="Helpful" />
          <Text style={styles.count}>{helpfulCount}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  header: { flexDirection: "row", alignItems: "flex-start", marginBottom: spacing.sm },
  authorPressable: { flex: 1, flexDirection: "row", alignItems: "flex-start" },
  authorTextColumn: { flex: 1, marginLeft: spacing.md },
  author: { ...typography.subtitle, fontSize: 15, lineHeight: 20 },
  timestamp: { ...typography.caption, fontSize: 12, lineHeight: 14, marginTop: 1 },
  body: { ...typography.body, fontSize: 14, lineHeight: 19 },
  footer: { flexDirection: "row", alignItems: "center", marginTop: spacing.md },
  count: { ...typography.bodyMuted, marginLeft: spacing.sm, fontWeight: "700" },
  deleteButton: { padding: spacing.xs, marginLeft: spacing.sm },
  reactionBarWrapper: { marginTop: spacing.sm },
});
