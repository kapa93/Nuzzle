import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Platform,
} from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { PostWithDetails } from '../types';
import { DogAvatar } from './DogAvatar';
import { PostImageCarousel } from './PostImageCarousel';
import { ReactionBar } from './ReactionBar';
import { formatAuthorDisplay, formatRelativeTime } from '../utils/breed';
import { BREED_LABELS, POST_TYPE_LABELS, POST_TAG_LABELS } from '../utils/breed';
import { colors, radius, shadow, spacing, typography } from '@/theme';

const COMMENT_PRESS_ANIMATION = { duration: 180 };
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PostCardProps {
  post: PostWithDetails;
  onPress: () => void;
  onReactionSelect: (reaction: import('@/types').ReactionEnum | null) => void;
  onAuthorPress?: (authorId: string) => void;
}

export function PostCard({ post, onPress, onReactionSelect, onAuthorPress }: PostCardProps) {
  const commentButtonPress = useSharedValue(0);
  const breedLabel = BREED_LABELS[post.breed] ?? post.breed;
  const typeLabel = POST_TYPE_LABELS[post.type] ?? post.type;
  const tagLabel = POST_TAG_LABELS[post.tag] ?? post.tag;
  const title = post.title ?? post.content_text.slice(0, 80) + (post.content_text.length > 80 ? '…' : '');
  const preview = post.title ? post.content_text : undefined;

  const commentPillAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - commentButtonPress.value * 0.06 }],
    backgroundColor: interpolateColor(
      commentButtonPress.value,
      [0, 1],
      [colors.surfaceMuted, colors.border]
    ),
  }));

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.header}>
        <Pressable
          style={styles.authorPressable}
          disabled={!onAuthorPress}
          onPress={(event) => {
            event.stopPropagation();
            onAuthorPress?.(post.author_id);
          }}
        >
          <DogAvatar
            imageUrl={post.author_dog_image_url}
            name={post.author_dog_name ?? post.author_name}
            size={40}
          />
          <View style={styles.headerText}>
            <Text style={styles.authorName} numberOfLines={1}>
              {formatAuthorDisplay(post.author_name, post.author_dog_name)}
            </Text>
            <Text style={styles.meta}>
              {breedLabel} · {typeLabel} · {tagLabel}
            </Text>
          </View>
        </Pressable>
      </View>

      <Text style={styles.title} numberOfLines={3}>
        {title}
      </Text>

      {preview ? (
        <Text style={styles.preview} numberOfLines={4}>
          {preview}
        </Text>
      ) : null}

      {post.images && post.images.length > 0 ? (
        <View style={styles.images}>
          <PostImageCarousel images={post.images} imageHeight={220} />
        </View>
      ) : null}

      <View style={styles.footer}>
        <ReactionBar
          reactions={post.reaction_counts ?? {}}
          userReaction={post.user_reaction}
          onSelect={onReactionSelect}
        />
        <AnimatedPressable
          onPress={(event) => {
            event.stopPropagation();
            onPress();
          }}
          onPressIn={() => {
            commentButtonPress.value = withTiming(1, COMMENT_PRESS_ANIMATION);
          }}
          onPressOut={() => {
            commentButtonPress.value = withTiming(0, COMMENT_PRESS_ANIMATION);
          }}
          style={[styles.commentPill, commentPillAnimatedStyle]}
        >
          <Text style={styles.commentCount}>
            {post.comment_count ?? 0} comments
          </Text>
        </AnimatedPressable>
      </View>

      <Text style={styles.timestamp}>
        {formatRelativeTime(post.created_at)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  authorPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  authorName: { ...typography.subtitle },
  meta: { ...typography.caption, marginTop: spacing.xxs },
  title: { ...typography.titleMD, marginBottom: spacing.xs },
  preview: {
    ...typography.bodyMuted,
    marginBottom: spacing.md,
    fontSize: 14,
    lineHeight: 20,
    ...(Platform.OS === 'web'
      ? { fontFamily: "'Inter', sans-serif", fontWeight: '400' as const }
      : { fontFamily: 'Inter_400Regular' as const }),
  },
  images: { marginBottom: spacing.md },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  commentPill: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  commentCount: { ...typography.bodyMuted, fontSize: 13 },
  timestamp: { ...typography.caption },
});
