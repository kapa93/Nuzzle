import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { PostWithDetails } from '../types';
import { DogAvatar } from './DogAvatar';
import { ImageGrid } from './ImageGrid';
import { ReactionBar } from './ReactionBar';
import { formatRelativeTime } from '../utils/breed';
import { BREED_LABELS, POST_TYPE_LABELS, POST_TAG_LABELS } from '../utils/breed';

const { width } = Dimensions.get('window');
const THUMB_SIZE = (width - 48) / 3;

interface PostCardProps {
  post: PostWithDetails;
  onPress: () => void;
  onReactionPress: () => void;
}

export function PostCard({ post, onPress, onReactionPress }: PostCardProps) {
  const breedLabel = BREED_LABELS[post.breed] ?? post.breed;
  const typeLabel = POST_TYPE_LABELS[post.type] ?? post.type;
  const tagLabel = POST_TAG_LABELS[post.tag] ?? post.tag;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.header}>
        <DogAvatar
          imageUrl={post.author_dog_image_url}
          name={post.author_dog_name ?? post.author_name}
          size={40}
        />
        <View style={styles.headerText}>
          <Text style={styles.authorName} numberOfLines={1}>
            {post.author_name}
          </Text>
          <Text style={styles.meta}>
            {breedLabel} · {typeLabel} · {tagLabel}
          </Text>
        </View>
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
          onPress={onReactionPress}
        />
        <Text style={styles.commentCount}>
          {post.comment_count ?? 0} comments
        </Text>
      </View>

      <Text style={styles.timestamp}>
        {formatRelativeTime(post.created_at)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  meta: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  content: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 12,
  },
  images: {
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentCount: {
    fontSize: 13,
    color: '#6b7280',
  },
  timestamp: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
