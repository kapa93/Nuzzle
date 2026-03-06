import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPostById } from '@/api/posts';
import { getCommentsByPost } from '@/api/comments';
import { createCommentWithNotification } from '@/api/comments';
import { createReport } from '@/api/reports';
import { useAuthStore } from '@/store/authStore';
import { useReactionMutation } from '@/hooks/useReactionMutation';
import { DogAvatar } from '@/components/DogAvatar';
import { ImageGrid } from '@/components/ImageGrid';
import { ReactionBar } from '@/components/ReactionBar';
import { ReactionPicker } from '@/components/ReactionPicker';
import { HealthDisclaimer } from '@/components/HealthDisclaimer';
import { formatRelativeTime } from '@/utils/breed';
import { BREED_LABELS, POST_TYPE_LABELS, POST_TAG_LABELS } from '@/utils/breed';
import { commentSchema } from '@/utils/validation';
import type { ReactionEnum } from '@/types';

export function PostDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const postId = (route.params as { postId: string })?.postId ?? '';
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [reactionPickerVisible, setReactionPickerVisible] = useState(false);

  const { data: post, isLoading } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => getPostById(postId, user?.id ?? null),
    enabled: !!postId,
  });

  const { data: comments } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => getCommentsByPost(postId),
    enabled: !!postId,
  });

  const reactionMutation = useReactionMutation();
  const commentMutation = useMutation({
    mutationFn: () =>
      createCommentWithNotification(
        postId,
        user!.id,
        commentText.trim(),
        post!.author_id
      ),
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    },
  });

  const handleReactionSelect = (reaction: ReactionEnum) => {
    reactionMutation.mutate({
      postId,
      userId: user!.id,
      reaction: reaction === post?.user_reaction ? null : reaction,
    });
    setReactionPickerVisible(false);
  };

  const handleSubmitComment = () => {
    const parsed = commentSchema.safeParse({ content: commentText.trim() });
    if (!parsed.success) {
      Alert.alert('Error', parsed.error.issues[0]?.message ?? 'Invalid comment');
      return;
    }
    commentMutation.mutate();
  };

  const handleReport = () => {
    Alert.alert(
      'Report post',
      'Are you sure you want to report this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: async () => {
            await createReport({
              reporter_id: user!.id,
              reportable_type: 'POST',
              reportable_id: postId,
              reason: 'User reported',
            });
            Alert.alert('Thank you', 'Your report has been submitted.');
          },
        },
      ]
    );
  };

  if (isLoading || !post) {
    return (
      <View style={styles.centered}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const breedLabel = BREED_LABELS[post.breed] ?? post.breed;
  const typeLabel = POST_TYPE_LABELS[post.type] ?? post.type;
  const tagLabel = POST_TAG_LABELS[post.tag] ?? post.tag;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView style={styles.scroll}>
        <View style={styles.card}>
          <View style={styles.header}>
            <DogAvatar
              imageUrl={post.author_dog_image_url}
              name={post.author_dog_name ?? post.author_name}
              size={48}
            />
            <View style={styles.headerText}>
              <Text style={styles.authorName}>{post.author_name}</Text>
              <Text style={styles.meta}>
                {breedLabel} · {typeLabel} · {tagLabel}
              </Text>
            </View>
          </View>

          {post.tag === 'HEALTH' && <HealthDisclaimer />}

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

          <View style={styles.footer}>
            <ReactionBar
              reactions={post.reaction_counts}
              userReaction={post.user_reaction}
              onPress={() => setReactionPickerVisible(true)}
            />
            <Text style={styles.timestamp}>
              {formatRelativeTime(post.created_at)}
            </Text>
          </View>

          <TouchableOpacity style={styles.reportBtn} onPress={handleReport}>
            <Text style={styles.reportText}>Report</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>
            {comments?.length ?? 0} Comments
          </Text>

          {(comments ?? []).map((c) => (
            <View key={c.id} style={styles.comment}>
              <DogAvatar
                imageUrl={c.author_dog_image_url}
                name={c.author_dog_name ?? c.author_name}
                size={36}
              />
              <View style={styles.commentBody}>
                <Text style={styles.commentAuthor}>{c.author_name}</Text>
                <Text style={styles.commentText}>{c.content_text}</Text>
                <Text style={styles.commentTime}>
                  {formatRelativeTime(c.created_at)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Add a comment..."
          placeholderTextColor="#9ca3af"
          value={commentText}
          onChangeText={setCommentText}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            (!commentText.trim() || commentMutation.isPending) &&
              styles.sendBtnDisabled,
          ]}
          onPress={handleSubmitComment}
          disabled={!commentText.trim() || commentMutation.isPending}
        >
          <Text style={styles.sendText}>Post</Text>
        </TouchableOpacity>
      </View>

      <ReactionPicker
        visible={reactionPickerVisible}
        onClose={() => setReactionPickerVisible(false)}
        onSelect={handleReactionSelect}
        currentReaction={post.user_reaction}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  card: {
    backgroundColor: '#FFF',
    padding: 16,
    margin: 16,
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
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
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#9ca3af',
  },
  reportBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  reportText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  commentsSection: {
    padding: 16,
    paddingTop: 0,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  comment: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentBody: {
    flex: 1,
    marginLeft: 12,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  commentText: {
    fontSize: 14,
    color: '#374151',
    marginTop: 2,
  },
  commentTime: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    fontSize: 15,
    color: '#1a1a1a',
    marginRight: 8,
  },
  sendBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#2563EB',
    borderRadius: 20,
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#9ca3af',
  },
  sendText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
});
