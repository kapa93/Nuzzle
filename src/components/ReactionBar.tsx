import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { REACTION_EMOJI } from "@/utils/breed";
import { colors, radius, spacing, typography } from "@/theme";
import type { ReactionEnum } from "@/types";

const REACTIONS: ReactionEnum[] = ["LIKE", "LOVE", "HAHA", "WOW", "SAD", "ANGRY"];

interface ReactionBarProps {
  reactions: Partial<Record<ReactionEnum, number>>;
  userReaction?: ReactionEnum | null;
  onSelect: (reaction: ReactionEnum | null) => void;
}

export function ReactionBar({ reactions, userReaction, onSelect }: ReactionBarProps) {
  const [stripVisible, setStripVisible] = useState(false);

  const totalCount = Object.values(reactions || {}).reduce((s, c) => s + (c ?? 0), 0);
  const displayEmoji = userReaction ? REACTION_EMOJI[userReaction] : "👍";

  const handleTap = () => {
    if (userReaction === "LIKE") {
      onSelect(null);
    } else {
      onSelect("LIKE");
    }
  };

  const handleLongPress = () => {
    setStripVisible(true);
  };

  const handleStripSelect = (reaction: ReactionEnum) => {
    onSelect(reaction === userReaction ? null : reaction);
    setStripVisible(false);
  };

  return (
    <>
      <View style={styles.wrapper}>
        <Pressable
          onPress={handleTap}
          onLongPress={handleLongPress}
          style={({ pressed }) => [
            styles.likeButton,
            userReaction && styles.likeButtonActive,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.emoji}>{displayEmoji}</Text>
          <Text
            style={[
              styles.label,
              userReaction ? styles.labelActive : styles.labelInactive,
            ]}
          >
            {userReaction === "LIKE"
              ? "Like"
              : userReaction
                ? REACTION_LABELS[userReaction]
                : "Like"}
          </Text>
          {totalCount > 0 && (
            <Text style={[styles.count, userReaction && styles.countActive]}> {totalCount}</Text>
          )}
        </Pressable>
      </View>

      <Modal
        visible={stripVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStripVisible(false)}
      >
        <TouchableOpacity
          style={styles.stripOverlay}
          activeOpacity={1}
          onPress={() => setStripVisible(false)}
        >
          <View style={styles.stripContainer}>
            <View style={styles.strip}>
              {REACTIONS.map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => handleStripSelect(type)}
                  style={[
                    styles.stripEmoji,
                    userReaction === type && styles.stripEmojiActive,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={styles.stripEmojiText}>{REACTION_EMOJI[type]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const REACTION_LABELS: Record<ReactionEnum, string> = {
  LIKE: "Like",
  LOVE: "Love",
  HAHA: "Haha",
  WOW: "Wow",
  SAD: "Sad",
  ANGRY: "Angry",
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  likeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  likeButtonActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  pressed: {
    opacity: 0.7,
  },
  emoji: {
    fontSize: 18,
    marginRight: spacing.xs,
  },
  label: {
    ...typography.bodyMuted,
    fontWeight: "600",
  },
  labelActive: {
    color: colors.primary,
  },
  labelInactive: {
    color: colors.textSecondary,
  },
  count: {
    ...typography.bodyMuted,
    marginLeft: 2,
  },
  countActive: {
    color: colors.primary,
  },
  stripOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  stripContainer: {
    padding: spacing.md,
  },
  strip: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  stripEmoji: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
  },
  stripEmojiActive: {
    backgroundColor: colors.primarySoft,
  },
  stripEmojiText: {
    fontSize: 28,
  },
});
