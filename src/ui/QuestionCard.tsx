import React, { useState, useRef } from "react";
import { Pressable, StyleSheet, Text, View, Modal, Dimensions, Platform } from "react-native";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import {
  colors,
  MENU_DOTS_PRESS_IN_MS,
  MENU_DOTS_PRESS_OUT_MS,
  radius,
  spacing,
  typography,
} from "@/theme";
import { Avatar } from "./Avatar";
import { ReactionBar } from "@/components/ReactionBar";
import { ExpandablePostBody } from "@/components/ExpandablePostBody";
import { PostImageCarousel } from "@/components/PostImageCarousel";
import { TagChip } from "./TagChip";
import type { QuestionCardData } from "./types";
import type { ReactionEnum } from "@/types";

type Props = {
  data: QuestionCardData;
  onPress?: () => void;
  onAuthorPress?: (authorId: string) => void;
  onReactionSelect?: (reaction: ReactionEnum | null) => void;
  onReactionMenuOpenChange?: (open: boolean) => void;
  currentUserId?: string | null;
  onEdit?: (postId: string) => void;
  onDelete?: (postId: string) => void;
};

const COMMENT_PRESS_ANIMATION = { duration: 180 };
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function getBarksText(count: number) {
  return count === 1 ? "1 Bark" : `${count} Barks`;
}

const QuestionCardInner = ({ data, onPress, onAuthorPress, onReactionSelect, onReactionMenuOpenChange, currentUserId, onEdit, onDelete }: Props) => {
  const commentButtonPress = useSharedValue(0);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuLayout, setMenuLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const menuBtnRef = useRef<View>(null);
  const menuBtnPressOverlay = useSharedValue(0);
  const menuBtnPressOverlayStyle = useAnimatedStyle(() => ({
    opacity: menuBtnPressOverlay.value,
  }));
  const isOwnPost = currentUserId && data.authorId === currentUserId;
  const showMenu = isOwnPost && (onEdit || onDelete);

  const openMenu = () => {
    menuBtnRef.current?.measureInWindow((x, y, width, height) => {
      setMenuLayout({ x, y, width, height: height ?? 28 });
      setMenuVisible(true);
    });
  };

  const handleEdit = () => {
    setMenuVisible(false);
    onEdit?.(data.id);
  };

  const handleDelete = () => {
    setMenuVisible(false);
    onDelete?.(data.id);
  };

  const commentPillAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - commentButtonPress.value * 0.06 }],
    backgroundColor: interpolateColor(
      commentButtonPress.value,
      [0, 1],
      [colors.surfaceMuted, colors.border]
    ),
  }));

  const content = (
    <View style={styles.card}>
      <View style={styles.header}>
        <Pressable
          style={styles.authorPressable}
          disabled={!onAuthorPress || !data.authorId}
          onPress={(event) => {
            event.stopPropagation();
            if (data.authorId) onAuthorPress?.(data.authorId);
          }}
        >
          <View style={styles.authorAvatarShift}>
            <Avatar
              size={32}
              source={data.authorAvatarUri ? { uri: data.authorAvatarUri } : undefined}
              fallback={data.author?.[0]?.toUpperCase() ?? "🐶"}
            />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.author}>{data.author}</Text>
            <Text style={styles.meta}>{data.authorMeta ?? "—"}</Text>
          </View>
        </Pressable>
        {!!data.badge && (
          <View style={styles.headerTag}>
            <TagChip label={data.badge} tone={data.badgeTone ?? "neutral"} />
          </View>
        )}
        {showMenu && (
          <Pressable
            ref={menuBtnRef}
            hitSlop={12}
            onPress={openMenu}
            onStartShouldSetResponder={() => true}
            onPressIn={() => {
              menuBtnPressOverlay.value = withTiming(1, { duration: MENU_DOTS_PRESS_IN_MS });
            }}
            onPressOut={() => {
              menuBtnPressOverlay.value = withTiming(0, { duration: MENU_DOTS_PRESS_OUT_MS });
            }}
            style={[styles.menuBtn, styles.menuBtnShiftUp]}
          >
            <Animated.View
              pointerEvents="none"
              style={[styles.menuBtnPressOverlay, menuBtnPressOverlayStyle]}
            />
            <Ionicons name="ellipsis-horizontal" size={22} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {showMenu && (
        <Modal visible={menuVisible} transparent animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
            <View
              style={[
                styles.menuDropdown,
                {
                  top: menuLayout.y + menuLayout.height + 4,
                  right: Dimensions.get("window").width - (menuLayout.x + menuLayout.width),
                },
              ]}
              onStartShouldSetResponder={() => true}
            >
              {onEdit && (
                <Pressable
                  style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                  onPress={handleEdit}
                >
                  <Ionicons name="pencil-outline" size={20} color={colors.textPrimary} />
                  <Text style={styles.menuItemText}>Edit</Text>
                </Pressable>
              )}
              {onDelete && (
                <Pressable
                  style={({ pressed }) => [
                    styles.menuItem,
                    styles.menuItemDanger,
                    pressed && styles.menuItemPressedDanger,
                  ]}
                  onPress={handleDelete}
                >
                  <Ionicons name="trash-outline" size={20} color="#DC2626" />
                  <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Delete</Text>
                </Pressable>
              )}
            </View>
          </Pressable>
        </Modal>
      )}

      {data.hasTitle ? (
        <>
          {!!data.title ? <Text style={styles.title}>{data.title}</Text> : null}
          {!!data.preview ? (
            <ExpandablePostBody text={data.preview} style={styles.preview} onMorePress={onPress} />
          ) : null}
        </>
      ) : (
        <ExpandablePostBody text={data.fullContent} style={styles.title} onMorePress={onPress} />
      )}
      {!!data.images?.length && <PostImageCarousel images={data.images} imageHeight={200} />}
      <View style={styles.actionRow}>
        {onReactionSelect ? (
          <ReactionBar
            reactions={data.reaction_counts ?? {}}
            userReaction={data.user_reaction}
            onSelect={onReactionSelect}
            onMenuOpenChange={onReactionMenuOpenChange}
          />
        ) : (
          <View style={styles.reactionPlaceholder}>
            <Text style={styles.reactionPlaceholderText}>
              👍{" "}
              {data.reaction_counts
                ? Object.values(data.reaction_counts).reduce((s, c) => s + (c ?? 0), 0)
                : (data.likeCount ?? 0) + (data.loveCount ?? 0) + (data.hahaCount ?? 0)}{" "}
              reactions
            </Text>
          </View>
        )}
        <AnimatedPressable
          onPress={(event) => {
            event.stopPropagation();
            onPress?.();
          }}
          onPressIn={() => {
            commentButtonPress.value = withTiming(1, COMMENT_PRESS_ANIMATION);
          }}
          onPressOut={() => {
            commentButtonPress.value = withTiming(0, COMMENT_PRESS_ANIMATION);
          }}
          style={[styles.answersPill, commentPillAnimatedStyle]}
        >
          <View style={styles.answersPillRow}>
            <FontAwesome6 name="comment" size={17} color={colors.textSecondary} />
            <Text style={styles.answersText}>{getBarksText(data.answerCount ?? 0)}</Text>
          </View>
        </AnimatedPressable>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
        {content}
      </Pressable>
    );
  }
  return content;
};

export const QuestionCard = React.memo(QuestionCardInner);

const styles = StyleSheet.create({
  card: {},
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  authorPressable: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  authorAvatarShift: {
    transform: [{ translateY: 2 }],
  },
  headerText: { flex: 1, marginLeft: spacing.xs, minWidth: 0 },
  author: {
    ...typography.subtitle,
    fontSize: 15,
    lineHeight: 20,
  },
  meta: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 14,
    marginTop: 0,
  },
  headerTag: { flexShrink: 0, justifyContent: "center" },
  menuBtn: {
    flexShrink: 0,
    padding: spacing.xs,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  menuBtnShiftUp: { marginTop: -5 },
  menuBtnPressOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.07)",
    borderRadius: radius.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  menuDropdown: {
    position: "absolute",
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
    borderRadius: radius.sm,
  },
  menuItemPressed: {
    backgroundColor: "rgba(0, 0, 0, 0.08)",
  },
  menuItemPressedDanger: {
    backgroundColor: "rgba(220, 38, 38, 0.1)",
  },
  menuItemDanger: {},
  menuItemText: { ...typography.body, fontWeight: "600" },
  menuItemTextDanger: { color: "#DC2626" },
  title: {
    ...typography.titleMD,
    fontSize: 19,
    lineHeight: 24,
    letterSpacing: -0.1,
    marginTop: 0,
    ...(Platform.OS === "web"
      ? { fontFamily: "'Inter', sans-serif", fontWeight: "600" as const }
      : { fontFamily: "Inter_600SemiBold" as const }),
  },
  preview: {
    ...typography.bodyMuted,
    marginTop: spacing.sm,
    fontSize: 14,
    lineHeight: 19,
    color: colors.textSupporting,
    ...(Platform.OS === "web"
      ? { fontFamily: "'Inter', sans-serif", fontWeight: "400" as const }
      : { fontFamily: "Inter_400Regular" as const }),
  },
  actionRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.md, gap: spacing.sm, flexWrap: "wrap" },
  answersPill: { height: 36, justifyContent: "center", backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md },
  answersPillRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  answersText: {
    ...typography.bodyMuted,
    fontSize: 14,
    lineHeight: 18,
    ...(Platform.OS === "web"
      ? { fontFamily: "'Inter', sans-serif", fontWeight: "600" as const }
      : { fontFamily: "Inter_600SemiBold" as const }),
  },
  pressed: { opacity: 0.95 },
  reactionPlaceholder: { marginTop: spacing.sm },
  reactionPlaceholderText: { ...typography.bodyMuted, fontSize: 14 },
});
