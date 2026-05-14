import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Dimensions,
  Platform,
} from "react-native";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { ExpandablePostBody } from "@/components/ExpandablePostBody";
import { Avatar } from "@/ui/Avatar";
import { PostImageCarousel } from "@/components/PostImageCarousel";
import { ReactionBar } from "@/components/ReactionBar";
import { formatAuthorDisplay, formatRelativeTime } from "@/utils/breed";
import { MEETUP_KIND_LABELS } from "@/utils/breed";
import {
  colors,
  MENU_DOTS_PRESS_IN_MS,
  MENU_DOTS_PRESS_OUT_MS,
  radius,
  shadow,
  spacing,
  typography,
} from "@/theme";
import type { PostWithDetails, ReactionEnum } from "@/types";

function formatMeetupDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

type Props = {
  post: PostWithDetails;
  onPress?: () => void;
  onAuthorPress?: (authorId: string) => void;
  onReactionSelect?: (reaction: ReactionEnum | null) => void;
  onReactionMenuOpenChange?: (open: boolean) => void;
  onRsvpToggle?: (postId: string, rsvped: boolean) => void;
  currentUserId?: string | null;
  onEdit?: (postId: string) => void;
  onDelete?: (postId: string) => void;
};

const COMMENT_PRESS_ANIMATION = { duration: 180 };
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function getBarksText(count: number) {
  return count === 1 ? "1 Bark" : `${count} Barks`;
}

export function MeetupCard({
  post,
  onPress,
  onAuthorPress,
  onReactionSelect,
  onReactionMenuOpenChange,
  onRsvpToggle,
  currentUserId,
  onEdit,
  onDelete,
}: Props) {
  const commentButtonPress = useSharedValue(0);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuLayout, setMenuLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const menuBtnRef = useRef<View>(null);
  const menuBtnPressOverlay = useSharedValue(0);
  const menuBtnPressOverlayStyle = useAnimatedStyle(() => ({
    opacity: menuBtnPressOverlay.value,
  }));

  const md = post.meetup_details;
  if (!md) return null;

  const isOwnPost = currentUserId && post.author_id === currentUserId;
  const showMenu = isOwnPost && (onEdit || onDelete);
  const canRsvp = currentUserId && !isOwnPost;
  const isRsvped = post.user_rsvped ?? false;
  const attendeeCount = post.attendee_count ?? 0;

  const openMenu = () => {
    menuBtnRef.current?.measureInWindow((x, y, width, height) => {
      setMenuLayout({ x, y, width, height: height ?? 28 });
      setMenuVisible(true);
    });
  };

  const handleEdit = () => {
    setMenuVisible(false);
    onEdit?.(post.id);
  };

  const handleDelete = () => {
    setMenuVisible(false);
    onDelete?.(post.id);
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
          disabled={!onAuthorPress}
          onPress={(event) => {
            event.stopPropagation();
            onAuthorPress?.(post.author_id);
          }}
        >
          <View style={styles.authorAvatarShift}>
            <Avatar
              size={32}
              source={post.author_dog_image_url ? { uri: post.author_dog_image_url } : undefined}
              fallback={post.author_name?.[0]?.toUpperCase() ?? "🐶"}
            />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.author}>{formatAuthorDisplay(post.author_name, post.author_dog_name)}</Text>
            <Text style={styles.meta}>{formatRelativeTime(post.created_at)}</Text>
          </View>
        </Pressable>
        {/* Meetup badge */}
        <View style={styles.headerTag}>
          <View style={styles.meetupBadge}>
            <Ionicons name="paw" size={13} color={colors.primaryDark} />
            <Text style={styles.meetupBadgeText}>Meetup</Text>
          </View>
        </View>
        {showMenu && (
          <Pressable
            ref={menuBtnRef}
            hitSlop={12}
            onPress={openMenu}
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

      <Text style={styles.title}>{post.title ?? "Meetup"}</Text>
      {post.content_text ? (
        <ExpandablePostBody text={post.content_text} style={styles.preview} onMorePress={onPress} />
      ) : null}

      {post.images.length ? <PostImageCarousel images={post.images} imageHeight={220} /> : null}

      {/* Meetup details block */}
      <View style={styles.meetupDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={18} color={colors.primary} />
          <Text style={styles.detailText}>{md.location_name}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={18} color={colors.primary} />
          <Text style={styles.detailText}>{formatMeetupDateTime(md.start_time)}</Text>
        </View>
        {md.meetup_kind && (
          <View style={styles.detailRow}>
            <Ionicons name="paw" size={18} color={colors.primary} />
            <Text style={styles.detailText}>{MEETUP_KIND_LABELS[md.meetup_kind]}</Text>
          </View>
        )}
      </View>

      {/* RSVP / Attendees row */}
      <View style={styles.actionRow}>
        {onRsvpToggle && canRsvp ? (
          <Pressable
            style={[styles.rsvpButton, isRsvped && styles.rsvpButtonJoined]}
            onPress={() => onRsvpToggle(post.id, isRsvped)}
          >
            {isRsvped ? (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                <Text style={styles.rsvpButtonText}>Joined</Text>
              </>
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={20} color="#FFF" />
                <Text style={styles.rsvpButtonText}>Join</Text>
              </>
            )}
          </Pressable>
        ) : null}
        {attendeeCount > 0 && (
          <Text style={styles.attendeeText}>
            {attendeeCount} {attendeeCount === 1 ? "going" : "going"}
          </Text>
        )}
      </View>

      {/* Reactions & comments */}
      <View style={styles.footer}>
        {onReactionSelect ? (
          <ReactionBar
            reactions={post.reaction_counts ?? {}}
            userReaction={post.user_reaction}
            onSelect={onReactionSelect}
            onMenuOpenChange={onReactionMenuOpenChange}
          />
        ) : null}
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
            <FontAwesome6 name="comment" size={16} color={colors.textSecondary} />
            <Text style={styles.answersText}>{getBarksText(post.comment_count ?? 0)}</Text>
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
}

const styles = StyleSheet.create({
  card: {},
  headerTag: { flexShrink: 0, justifyContent: "center" },
  meetupBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  meetupBadgeText: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.primaryDark,
    ...(Platform.OS === "web"
      ? { fontFamily: "'Inter', sans-serif" }
      : { fontFamily: "Inter_700Bold" }),
  },
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
  menuBtn: {
    padding: spacing.xs,
    borderRadius: radius.sm,
    overflow: "hidden",
    flexShrink: 0,
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
    marginTop: spacing.sm,
    ...(Platform.OS === "web"
      ? { fontFamily: "'Inter', sans-serif", fontWeight: "600" as const }
      : { fontFamily: "Inter_600SemiBold" as const }),
  },
  preview: { ...typography.bodyMuted, marginTop: spacing.xs, lineHeight: 19, fontSize: 14, color: colors.textSupporting },
  meetupDetails: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  detailText: { ...typography.body, fontSize: 14 },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  rsvpButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    ...shadow.sm,
  },
  rsvpButtonJoined: {
    backgroundColor: colors.primaryDark,
  },
  rsvpButtonText: {
    ...typography.body,
    fontWeight: "700",
    color: "#FFF",
  },
  attendeeText: {
    ...typography.bodyMuted,
    fontSize: 14,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  answersPill: {
    height: 35,
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
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
});
