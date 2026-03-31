import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Avatar } from "@/ui/Avatar";
import { ReactionBar } from "@/components/ReactionBar";
import { formatAuthorDisplay, formatRelativeTime } from "@/utils/breed";
import { MEETUP_KIND_LABELS } from "@/utils/breed";
import { colors, radius, shadow, spacing, typography } from "@/theme";
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
      {/* Meetup badge */}
      <View style={styles.meetupBadge}>
        <Ionicons name="paw" size={16} color={colors.primary} />
        <Text style={styles.meetupBadgeText}>Meetup</Text>
      </View>

      <View style={styles.header}>
        <Pressable
          style={styles.authorPressable}
          disabled={!onAuthorPress}
          onPress={(event) => {
            event.stopPropagation();
            onAuthorPress?.(post.author_id);
          }}
        >
          <Avatar
            size={42}
            source={post.author_dog_image_url ? { uri: post.author_dog_image_url } : undefined}
            fallback={post.author_name?.[0]?.toUpperCase() ?? "🐶"}
          />
          <View style={styles.headerText}>
            <Text style={styles.author}>{formatAuthorDisplay(post.author_name, post.author_dog_name)}</Text>
            <Text style={styles.meta}>{formatRelativeTime(post.created_at)}</Text>
          </View>
        </Pressable>
        {showMenu && (
          <Pressable ref={menuBtnRef} hitSlop={12} onPress={openMenu} style={styles.menuBtn}>
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
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
                <TouchableOpacity style={styles.menuItem} onPress={handleEdit} activeOpacity={0.7}>
                  <Ionicons name="pencil-outline" size={20} color={colors.textPrimary} />
                  <Text style={styles.menuItemText}>Edit</Text>
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity
                  style={[styles.menuItem, styles.menuItemDanger]}
                  onPress={handleDelete}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={20} color="#DC2626" />
                  <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          </Pressable>
        </Modal>
      )}

      <Text style={styles.title}>{post.title ?? "Meetup"}</Text>
      {post.content_text ? (
        <Text style={styles.preview} numberOfLines={3}>
          {post.content_text}
        </Text>
      ) : null}

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
        <Text style={styles.attendeeText}>
          {attendeeCount} {attendeeCount === 1 ? "going" : "going"}
        </Text>
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
          <Text style={styles.answersText}>💬 {getBarksText(post.comment_count ?? 0)}</Text>
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.primary,
    borderLeftWidth: 6,
    ...shadow.sm,
  },
  meetupBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
    marginBottom: spacing.md,
  },
  meetupBadgeText: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  authorPressable: { flex: 1, flexDirection: "row", alignItems: "center" },
  headerText: { flex: 1, marginLeft: spacing.md },
  author: { ...typography.subtitle, fontSize: 18 },
  meta: { ...typography.caption },
  menuBtn: { padding: spacing.xs },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  menuDropdown: {
    position: "absolute",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.xs,
    paddingLeft: spacing.lg,
    paddingRight: spacing.md,
    minWidth: 140,
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
    gap: spacing.md,
  },
  menuItemDanger: {},
  menuItemText: { ...typography.body, fontWeight: "600" },
  menuItemTextDanger: { color: "#DC2626" },
  title: { ...typography.titleMD, marginTop: spacing.sm },
  preview: { ...typography.bodyMuted, marginTop: spacing.xs },
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
    paddingVertical: spacing.sm,
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
    height: 36,
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  answersText: { ...typography.bodyMuted, fontWeight: "700", fontSize: 14 },
  pressed: { opacity: 0.95 },
});
