import React, { useContext, useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Pressable,
  Modal,
  Dimensions,
  KeyboardEvent,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomTabBarHeightContext } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPostById, deletePost } from "@/api/posts";
import { rsvpMeetup, unrsvpMeetup } from "@/api/meetups";
import { getCommentsByPost } from "@/api/comments";
import { createCommentWithNotification } from "@/api/comments";
import { createReport } from "@/api/reports";
import { useAuthStore } from "@/store/authStore";
import { useReactionMutation } from "@/hooks/useReactionMutation";
import { DogAvatar } from "@/components/DogAvatar";
import { PostImageCarousel } from "@/components/PostImageCarousel";
import { ReactionBar } from "@/components/ReactionBar";
import { HealthDisclaimer } from "@/components/HealthDisclaimer";
import { AnswerCard } from "@/ui/AnswerCard";
import { PrimaryButton } from "@/ui/PrimaryButton";
import { formatAuthorDisplay, formatRelativeTime } from "@/utils/breed";
import { BREED_LABELS, POST_TYPE_LABELS, POST_TAG_LABELS, MEETUP_KIND_LABELS } from "@/utils/breed";
import { commentSchema } from "@/utils/validation";
import { useScrollDirection } from "@/context/ScrollDirectionContext";
import { useStackHeaderHeight } from "@/hooks/useStackHeaderHeight";
import { colors, MENU_DOTS_PRESS_IN_MS, MENU_DOTS_PRESS_OUT_MS, radius, shadow, spacing, typography } from "@/theme";
import type { ReactionEnum } from "@/types";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

function getBarksText(count: number) {
  return count === 1 ? "1 Bark" : `${count} Barks`;
}

export function PostDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const routeParams = (route.params as { postId: string; source?: "search" } | undefined) ?? undefined;
  const postId = routeParams?.postId ?? "";
  const isFromSearch = routeParams?.source === "search";
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { setScrollDirection } = useScrollDirection();
  const headerHeight = useStackHeaderHeight();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;
  const bottomInsetOffset = Math.max(0, tabBarHeight - insets.bottom - 8);
  const scrollTopPadding = tabBarHeight > 0 ? headerHeight - 60 + spacing.xxl - 5 : spacing.lg;
  const [commentText, setCommentText] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const commentInputRef = useRef<TextInput>(null);

  useEffect(() => {
    setScrollDirection("up");
  }, [setScrollDirection]);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, (event: KeyboardEvent) => {
      setIsKeyboardVisible(true);
      setKeyboardHeight(event.endCoordinates?.height ?? 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
  const [menuLayout, setMenuLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const menuBtnRef = useRef<View>(null);
  const menuBtnPressOverlay = useSharedValue(0);
  const menuBtnPressOverlayStyle = useAnimatedStyle(() => ({
    opacity: menuBtnPressOverlay.value,
  }));

  const { data: post, isLoading } = useQuery({
    queryKey: ["post", postId],
    queryFn: () => getPostById(postId, user?.id ?? null),
    enabled: !!postId,
  });

  const { data: comments } = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => getCommentsByPost(postId),
    enabled: !!postId,
  });

  const reactionMutation = useReactionMutation();

  const rsvpMutation = useMutation({
    mutationFn: (rsvped: boolean) =>
      rsvped ? unrsvpMeetup(postId, user!.id) : rsvpMeetup(postId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });
  const commentMutation = useMutation({
    mutationFn: () =>
      createCommentWithNotification(
        postId,
        user!.id,
        commentText.trim(),
        post!.author_id
      ),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["comments", postId], type: "active" });
      await queryClient.refetchQueries({ queryKey: ["post", postId], type: "active" });
      setCommentText("");
      commentInputRef.current?.blur();
      Keyboard.dismiss();
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["userPosts"] });
    },
  });

  const handleReactionSelect = (reaction: ReactionEnum | null) => {
    reactionMutation.mutate({ postId, userId: user!.id, reaction });
  };

  const handleSubmitComment = () => {
    const parsed = commentSchema.safeParse({ content: commentText.trim() });
    if (!parsed.success) {
      Alert.alert("Error", parsed.error.issues[0]?.message ?? "Invalid comment");
      return;
    }
    commentMutation.mutate();
  };

  const handleAuthorPress = (authorId: string) => {
    navigation.navigate("UserProfile", { userId: authorId });
  };

  const deleteMutation = useMutation({
    mutationFn: () => deletePost(postId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["post"] });
      navigation.goBack();
    },
  });

  const openMenu = () => {
    menuBtnRef.current?.measureInWindow((x, y, width, height) => {
      setMenuLayout({ x, y, width, height: height ?? 28 });
      setMenuVisible(true);
    });
  };

  const handleEdit = () => {
    setMenuVisible(false);
    navigation.navigate("EditPost", { postId });
  };

  const handleDelete = () => {
    setMenuVisible(false);
    Alert.alert(
      "Delete post",
      "Are you sure you want to delete this post? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate() },
      ]
    );
  };

  const handleReport = () => {
    Alert.alert(
      "Report post",
      "Are you sure you want to report this post?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Report",
          style: "destructive",
          onPress: async () => {
            await createReport({
              reporter_id: user!.id,
              reportable_type: "POST",
              reportable_id: postId,
              reason: "User reported",
            });
            Alert.alert("Thank you", "Your report has been submitted.");
          },
        },
      ]
    );
  };

  if (isLoading || !post) {
    return (
      <View style={styles.screenRoot}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  const breedLabel = BREED_LABELS[post.breed] ?? post.breed;
  const typeLabel = POST_TYPE_LABELS[post.type] ?? post.type;
  const tagLabel = POST_TAG_LABELS[post.tag] ?? post.tag;
  const searchClosedBottomOffset = Math.max(0, bottomInsetOffset - spacing.xxs);
  const closedInputBottomOffset = isFromSearch ? searchClosedBottomOffset : bottomInsetOffset + spacing.xs;
  const searchKeyboardOffset =
    isFromSearch && isKeyboardVisible
      ? Math.max(0, keyboardHeight - insets.bottom - spacing.sm + spacing.xxs)
      : 0;

  return (
    <View style={styles.screenRoot}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" && !isFromSearch ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: scrollTopPadding },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.postContent}>
            <View style={styles.header}>
              <Pressable
                style={styles.authorPressable}
                onPress={() => handleAuthorPress(post.author_id)}
              >
                <View style={styles.authorAvatarShift}>
                  <DogAvatar
                    imageUrl={post.author_dog_image_url}
                    name={post.author_dog_name ?? post.author_name}
                    size={32}
                  />
                </View>
                <View style={styles.headerText}>
                  <Text style={styles.authorName} numberOfLines={1}>
                    {formatAuthorDisplay(post.author_name, post.author_dog_name)}
                  </Text>
                  <Text style={styles.meta}>
                    {breedLabel} · {typeLabel} · {tagLabel}
                  </Text>
                </View>
              </Pressable>
              <View style={styles.headerRight}>
                <Text style={styles.headerTimestamp} numberOfLines={1}>
                  {formatRelativeTime(post.created_at)}
                </Text>
                {user?.id === post.author_id ? (
                  <>
                    <Pressable
                      ref={menuBtnRef}
                      hitSlop={12}
                      onPress={openMenu}
                      onPressIn={() => {
                        menuBtnPressOverlay.value = withTiming(1, {
                          duration: MENU_DOTS_PRESS_IN_MS,
                        });
                      }}
                      onPressOut={() => {
                        menuBtnPressOverlay.value = withTiming(0, {
                          duration: MENU_DOTS_PRESS_OUT_MS,
                        });
                      }}
                      style={[styles.menuBtn, styles.menuBtnShiftUp]}
                    >
                      <Animated.View
                        pointerEvents="none"
                        style={[styles.menuBtnPressOverlay, menuBtnPressOverlayStyle]}
                      />
                      <Ionicons name="ellipsis-horizontal" size={22} color={colors.textMuted} />
                    </Pressable>
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
                        >
                          <Pressable
                            style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                            onPress={handleEdit}
                          >
                            <Ionicons name="pencil-outline" size={20} color={colors.textPrimary} />
                            <Text style={styles.menuItemText}>Edit</Text>
                          </Pressable>
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
                        </View>
                      </Pressable>
                    </Modal>
                  </>
                ) : null}
              </View>
            </View>

            {post.tag === "HEALTH" && <HealthDisclaimer />}

            {post.title ? (
              <Text style={styles.title}>{post.title}</Text>
            ) : null}
            <Text style={post.title ? styles.body : styles.content}>{post.content_text}</Text>

            {post.images && post.images.length > 0 ? (
              <View style={styles.images}>
                <PostImageCarousel images={post.images} imageHeight={320} />
              </View>
            ) : null}

            {post.type === "MEETUP" && post.meetup_details ? (
              <View style={styles.meetupBlock}>
                <View style={styles.meetupDetailRow}>
                  <Ionicons name="location" size={20} color={colors.primary} />
                  <Text style={styles.meetupDetailText}>{post.meetup_details.location_name}</Text>
                </View>
                <View style={styles.meetupDetailRow}>
                  <Ionicons name="calendar" size={20} color={colors.primary} />
                  <Text style={styles.meetupDetailText}>
                    {new Date(post.meetup_details.start_time).toLocaleString(undefined, {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
                {post.meetup_details.end_time && (
                  <View style={styles.meetupDetailRow}>
                    <Ionicons name="time" size={20} color={colors.primary} />
                    <Text style={styles.meetupDetailText}>
                      Until {new Date(post.meetup_details.end_time).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                    </Text>
                  </View>
                )}
                {post.meetup_details.meetup_kind && (
                  <View style={styles.meetupDetailRow}>
                    <Ionicons name="paw" size={20} color={colors.primary} />
                    <Text style={styles.meetupDetailText}>{MEETUP_KIND_LABELS[post.meetup_details.meetup_kind]}</Text>
                  </View>
                )}
                {user && user.id !== post.author_id && (
                  <Pressable
                    style={[styles.rsvpBtn, post.user_rsvped && styles.rsvpBtnJoined]}
                    onPress={() => rsvpMutation.mutate(post.user_rsvped ?? false)}
                    disabled={rsvpMutation.isPending}
                  >
                    <Text style={styles.rsvpBtnText}>
                      {post.user_rsvped ? "Joined" : "Join"} ({post.attendee_count ?? 0} going)
                    </Text>
                  </Pressable>
                )}
              </View>
            ) : null}

            <View style={styles.footer}>
              <View style={styles.footerReactions}>
                <ReactionBar
                  reactions={post.reaction_counts}
                  userReaction={post.user_reaction}
                  onSelect={handleReactionSelect}
                  wrapperStyle={styles.footerReactionBarWrapper}
                />
              </View>
              <Pressable onPress={handleReport} style={styles.reportBtn}>
                <View style={styles.reportIconWrap}>
                  <Ionicons name="flag-outline" size={14} color={colors.textMuted} />
                </View>
                <Text style={styles.reportText}>Report</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.postCommentsDivider} />

          <View style={styles.commentsSection}>
            {(comments?.length ?? 0) === 0 ? (
              <Text style={styles.commentsTitleEmpty}>No barks yet.</Text>
            ) : (
              <Text style={styles.commentsTitle}>{getBarksText(comments?.length ?? 0)}</Text>
            )}

            {(comments ?? []).map((c) => (
              <AnswerCard
                key={c.id}
                author={formatAuthorDisplay(c.author_name, c.author_dog_name ?? undefined)}
                body={c.content_text}
                avatarUri={c.author_dog_image_url}
                timestamp={formatRelativeTime(c.created_at)}
                onAuthorPress={() => handleAuthorPress(c.author_id)}
              />
            ))}
          </View>
        </ScrollView>

        <View
          style={[
            styles.inputRow,
            {
              marginBottom: isKeyboardVisible
                ? searchKeyboardOffset
                : closedInputBottomOffset,
            },
          ]}
        >
          <TextInput
            ref={commentInputRef}
            style={styles.input}
            placeholder="Add an answer..."
            placeholderTextColor={colors.textMuted}
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={2000}
          />
          <PrimaryButton
            label="Post"
            onPress={handleSubmitComment}
            disabled={!commentText.trim() || commentMutation.isPending}
            style={styles.postButton}
          />
        </View>
      </KeyboardAvoidingView>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: { flex: 1, backgroundColor: colors.surface },
  safe: { flex: 1 },
  container: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { ...typography.bodyMuted },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxl },
  postContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  postCommentsDivider: {
    borderTopWidth: 1.5,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  authorPressable: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  /** Nudges avatar down without changing sibling layout (name / meta / menu). */
  authorAvatarShift: {
    transform: [{ translateY: 2 }],
  },
  headerText: { flex: 1, marginLeft: spacing.xs, minWidth: 0 },
  headerRight: {
    flexDirection: "column",
    alignItems: "flex-end",
    flexShrink: 0,
    gap: spacing.xxs,
    marginLeft: spacing.sm,
    paddingTop: 2,
  },
  headerTimestamp: { ...typography.caption },
  menuBtn: {
    padding: spacing.xs,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  menuBtnPressOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.07)",
    borderRadius: radius.sm,
  },
  /** Nudges only the ⋯ control up; timestamp / author block unchanged */
  menuBtnShiftUp: { marginTop: -5 },
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
  authorName: {
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
  title: { ...typography.titleMD, marginBottom: spacing.sm },
  content: { ...typography.body, marginBottom: spacing.md },
  body: {
    ...typography.bodyMuted,
    color: colors.textSupporting,
    marginBottom: spacing.md,
    fontSize: 14,
    lineHeight: 20,
    ...(Platform.OS === "web"
      ? { fontFamily: "'Inter', sans-serif", fontWeight: "400" as const }
      : { fontFamily: "Inter_400Regular" as const }),
  },
  images: { marginBottom: spacing.md },
  meetupBlock: {
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  meetupDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  meetupDetailText: { ...typography.body, fontSize: 15 },
  rsvpBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
  },
  rsvpBtnJoined: {
    backgroundColor: colors.primaryDark,
  },
  rsvpBtnText: { ...typography.body, fontWeight: "700", color: "#FFF" },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  footerReactions: {
    flex: 1,
    minWidth: 0,
  },
  footerReactionBarWrapper: {
    marginTop: 0,
  },
  reportBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  reportIconWrap: {
    marginRight: 2,
  },
  reportText: {
    ...typography.caption,
  },
  commentsSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: 0,
  },
  commentsTitle: {
    ...typography.subtitle,
    marginBottom: spacing.lg,
  },
  commentsTitleEmpty: {
    ...typography.bodyMuted,
    textAlign: "center",
    width: "100%",
    marginBottom: spacing.lg,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  postButton: {
    minHeight: 44,
    paddingVertical: spacing.sm,
    ...shadow.sm,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
});
