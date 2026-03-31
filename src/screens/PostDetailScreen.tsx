import React, { useState, useRef, useEffect } from "react";
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
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
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
import { ImageGrid } from "@/components/ImageGrid";
import { ReactionBar } from "@/components/ReactionBar";
import { HealthDisclaimer } from "@/components/HealthDisclaimer";
import { AnswerCard } from "@/ui/AnswerCard";
import { PrimaryButton } from "@/ui/PrimaryButton";
import { formatAuthorDisplay, formatRelativeTime } from "@/utils/breed";
import { BREED_LABELS, POST_TYPE_LABELS, POST_TAG_LABELS, MEETUP_KIND_LABELS } from "@/utils/breed";
import { commentSchema } from "@/utils/validation";
import { ScreenWithWallpaper } from "@/components/ScreenWithWallpaper";
import { useScrollDirection } from "@/context/ScrollDirectionContext";
import { useStackHeaderHeight } from "@/hooks/useStackHeaderHeight";
import { colors, radius, shadow, spacing, typography } from "@/theme";
import type { ReactionEnum } from "@/types";

function getBarksText(count: number) {
  return count === 1 ? "1 Bark" : `${count} Barks`;
}

export function PostDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const postId = (route.params as { postId: string })?.postId ?? "";
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { setScrollDirection } = useScrollDirection();
  const headerHeight = useStackHeaderHeight();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [commentText, setCommentText] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const commentInputRef = useRef<TextInput>(null);

  useEffect(() => {
    setScrollDirection("up");
  }, [setScrollDirection]);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
  const [menuLayout, setMenuLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const menuBtnRef = useRef<View>(null);

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
      <ScreenWithWallpaper>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </ScreenWithWallpaper>
    );
  }

  const breedLabel = BREED_LABELS[post.breed] ?? post.breed;
  const typeLabel = POST_TYPE_LABELS[post.type] ?? post.type;
  const tagLabel = POST_TAG_LABELS[post.tag] ?? post.tag;

  return (
    <ScreenWithWallpaper>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingTop: headerHeight - 60 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View style={styles.header}>
              <Pressable
                style={styles.authorPressable}
                onPress={() => handleAuthorPress(post.author_id)}
              >
                <DogAvatar
                  imageUrl={post.author_dog_image_url}
                  name={post.author_dog_name ?? post.author_name}
                  size={48}
                />
                <View style={styles.headerText}>
                  <Text style={styles.authorName}>{formatAuthorDisplay(post.author_name, post.author_dog_name)}</Text>
                  <Text style={styles.meta}>
                    {breedLabel} · {typeLabel} · {tagLabel}
                  </Text>
                </View>
              </Pressable>
              {user?.id === post.author_id && (
                <>
                  <Pressable
                    ref={menuBtnRef}
                    hitSlop={12}
                    onPress={openMenu}
                    style={styles.menuBtn}
                  >
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
                        <TouchableOpacity style={styles.menuItem} onPress={handleEdit} activeOpacity={0.7}>
                          <Ionicons name="pencil-outline" size={20} color={colors.textPrimary} />
                          <Text style={styles.menuItemText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.menuItem, styles.menuItemDanger]} onPress={handleDelete} activeOpacity={0.7}>
                          <Ionicons name="trash-outline" size={20} color="#DC2626" />
                          <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </Pressable>
                  </Modal>
                </>
              )}
            </View>

            {post.tag === "HEALTH" && <HealthDisclaimer />}

            {post.title ? (
              <Text style={styles.title}>{post.title}</Text>
            ) : null}
            <Text style={styles.content}>{post.content_text}</Text>

            {post.images && post.images.length > 0 ? (
              <View style={styles.images}>
                <ImageGrid
                  images={post.images}
                  maxDisplay={post.images.length}
                  size={120}
                  compact
                />
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
              <ReactionBar
                reactions={post.reaction_counts}
                userReaction={post.user_reaction}
                onSelect={handleReactionSelect}
              />
            </View>

            <View style={styles.timestampRow}>
              <Text style={styles.timestamp}>
                {formatRelativeTime(post.created_at)}
              </Text>
              <Pressable onPress={handleReport} style={styles.reportBtn}>
                <View style={styles.reportIconWrap}>
                  <Ionicons name="flag-outline" size={14} color={colors.textMuted} />
                </View>
                <Text style={styles.reportText}>Report</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>
              {getBarksText(comments?.length ?? 0)}
            </Text>

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
            { marginBottom: isKeyboardVisible ? 0 : Math.max(0, tabBarHeight - insets.bottom - 8) },
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
    </ScreenWithWallpaper>
  );
}

const styles = StyleSheet.create({
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
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    margin: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  authorPressable: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: { flex: 1, marginLeft: spacing.md },
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
  authorName: { ...typography.subtitle },
  meta: { ...typography.caption, marginTop: spacing.xxs },
  title: { ...typography.titleMD, marginBottom: spacing.sm },
  content: { ...typography.body, marginBottom: spacing.md },
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
    marginBottom: spacing.sm,
  },
  timestampRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timestamp: { ...typography.caption },
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
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
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
