import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Bone } from "lucide-react-native";
import { REACTION_EMOJI } from "@/utils/breed";
import { colors, radius, spacing, typography } from "@/theme";
import type { ReactionEnum } from "@/types";

const REACTIONS: ReactionEnum[] = ["LIKE", "LOVE", "HAHA", "WOW", "SAD", "ANGRY"];

interface ReactionBarProps {
  reactions: Partial<Record<ReactionEnum, number>>;
  userReaction?: ReactionEnum | null;
  onSelect: (reaction: ReactionEnum | null) => void;
  onMenuOpenChange?: (open: boolean) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const STRIP_WIDTH = 308;
const STRIP_HEIGHT = 84;

export function ReactionBar({ reactions, userReaction, onSelect, onMenuOpenChange }: ReactionBarProps) {
  const [stripVisible, setStripVisible] = useState(false);
  const [buttonLayout, setButtonLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const likeButtonRef = useRef<View>(null);

  const totalCount = Object.values(reactions || {}).reduce((s, c) => s + (c ?? 0), 0);
  const showBone = !userReaction || userReaction === "LIKE";
  const displayEmoji = userReaction ? REACTION_EMOJI[userReaction] : "👍";

  const handleTap = () => {
    if (userReaction) {
      onSelect(null);
    } else {
      onSelect("LIKE");
    }
  };

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    likeButtonRef.current?.measureInWindow((x, y, width, height) => {
      setButtonLayout({ x, y, width, height: height ?? 0 });
      setStripVisible(true);
    });
  };

  useEffect(() => {
    onMenuOpenChange?.(stripVisible);
  }, [stripVisible, onMenuOpenChange]);

  const handleStripSelect = (reaction: ReactionEnum) => {
    onSelect(reaction === userReaction ? null : reaction);
    setStripVisible(false);
  };

  return (
    <>
      <View style={styles.wrapper}>
        <Pressable
          ref={likeButtonRef}
          onPress={handleTap}
          onLongPress={handleLongPress}
          delayLongPress={200}
          style={({ pressed }) => [
            styles.likeButton,
            userReaction && styles.likeButtonActive,
            pressed && styles.pressed,
          ]}
        >
          {showBone ? (
            <View style={styles.iconWrap} pointerEvents="none">
              <Bone
                size={20}
                color={userReaction ? colors.primary : colors.textSecondary}
              />
            </View>
          ) : (
            <Text style={styles.emoji} pointerEvents="none">{displayEmoji}</Text>
          )}
          <Text
            pointerEvents="none"
            style={[
              styles.label,
              userReaction ? styles.labelActive : styles.labelInactive,
            ]}
          >
            {userReaction === "LIKE"
              ? "Treat"
              : userReaction
                ? REACTION_LABELS[userReaction]
                : "Treat"}
          </Text>
          {totalCount > 0 && (
            <Text pointerEvents="none" style={[styles.count, userReaction && styles.countActive]}> {totalCount}</Text>
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
          <View
            style={[
              styles.stripContainer,
              {
                position: "absolute",
                top:
                  buttonLayout.y - STRIP_HEIGHT - 4 >= 16
                    ? buttonLayout.y - STRIP_HEIGHT - 4
                    : buttonLayout.y + buttonLayout.height + 4,
                left: Math.max(16, Math.min(SCREEN_WIDTH - STRIP_WIDTH - 16, buttonLayout.x + buttonLayout.width / 2 - STRIP_WIDTH / 2)),
              },
            ]}
          >
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
                  {type === "LIKE" ? (
                    <Bone
                      size={28}
                      color={userReaction === type ? colors.primary : colors.textSecondary}
                    />
                  ) : (
                    <Text style={styles.stripEmojiText}>{REACTION_EMOJI[type]}</Text>
                  )}
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
  LIKE: "Treat",
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
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.7,
  },
  iconWrap: { marginRight: spacing.xxs },
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
