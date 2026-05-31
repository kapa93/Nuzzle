import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "../theme";
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
  onReportPress?: () => void;
  reactionCounts?: Partial<Record<ReactionEnum, number>>;
  userReaction?: ReactionEnum | null;
  onReactionSelect?: (reaction: ReactionEnum | null) => void;
};

const AVATAR_SIZE = 32;
const INDENT = AVATAR_SIZE + spacing.md;

export function AnswerCard({ author, body, avatarUri, timestamp, helpfulCount = 0, onAuthorPress, onDeletePress, onReportPress, reactionCounts, userReaction, onReactionSelect }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Pressable style={styles.authorPressable} disabled={!onAuthorPress} onPress={onAuthorPress}>
          <View style={styles.avatarShift}>
            <Avatar
              size={AVATAR_SIZE}
              source={avatarUri ? { uri: avatarUri } : undefined}
              fallback={author?.[0]?.toUpperCase() ?? "🐶"}
            />
          </View>
          <Text style={styles.author}>{author}</Text>
        </Pressable>
        {timestamp ? <Text style={styles.timestamp}>{timestamp}</Text> : null}
      </View>

      <Text style={styles.body}>{body}</Text>

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          {onReactionSelect ? (
            <ReactionBar
              reactions={reactionCounts ?? {}}
              userReaction={userReaction ?? null}
              onSelect={onReactionSelect}
              wrapperStyle={styles.reactionBarWrapper}
            />
          ) : helpfulCount > 0 ? (
            <View style={styles.helpfulRow}>
              <ReactionPill emoji="🐾" label="Helpful" />
              <Text style={styles.count}>{helpfulCount}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.footerActions}>
          {onReportPress && (
            <Pressable onPress={onReportPress} style={styles.moreButton} hitSlop={8}>
              <Ionicons name="flag-outline" size={16} color={colors.textMuted} />
            </Pressable>
          )}
          {onDeletePress && (
            <Pressable onPress={onDeletePress} style={styles.moreButton} hitSlop={8}>
              <Ionicons name="trash-outline" size={19} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingTop: spacing.sm - 2,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    marginHorizontal: -spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderStrong,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 0,
  },
  avatarShift: { transform: [{ translateY: 7 }] },
  authorPressable: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  author: { ...typography.subtitle, fontSize: 15, lineHeight: 20 },
  timestamp: {
    ...typography.caption,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
    flexShrink: 0,
    marginLeft: spacing.sm,
  },
  body: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    paddingLeft: INDENT,
    marginBottom: spacing.xs,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: INDENT,
    marginBottom: -7,
  },
  footerLeft: { flex: 1 },
  helpfulRow: { flexDirection: "row", alignItems: "center" },
  count: { ...typography.bodyMuted, marginLeft: spacing.sm, fontWeight: "700" },
  footerActions: { flexDirection: "row", alignItems: "center" },
  moreButton: { padding: spacing.xs, marginLeft: spacing.sm },
  reactionBarWrapper: { marginTop: 0 },
});
