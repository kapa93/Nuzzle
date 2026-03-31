import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Pressable,
} from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { PostWithDetails } from '../types';
import { DogAvatar } from './DogAvatar';
import { ImageGrid } from './ImageGrid';
import { ReactionBar } from './ReactionBar';
import { formatAuthorDisplay, formatRelativeTime } from '../utils/breed';
import { BREED_LABELS, POST_TYPE_LABELS, POST_TAG_LABELS } from '../utils/breed';
import { colors, radius, shadow, spacing, typography } from '@/theme';

const { width } = Dimensions.get('window');
const THUMB_SIZE = (width - 48) / 3;
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

      {post.content_text ? (
        <Text style={styles.content} numberOfLines={4}>
          {post.content_text}
        </Text>
      ) : null}

      {post.images && post.images.length > 0 ? (
        <View style={styles.images}>
          <ImageGrid
            images={post.images.slice(0, 3)}
            maxDisplay={3}
            size={THUMB_SIZE}
          />
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
  content: { ...typography.body, marginBottom: spacing.md },
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
