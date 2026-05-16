import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  FlatList,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, radius, shadow, spacing, typography } from '@/theme';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/api/notifications';
import { useAuthStore } from '@/store/authStore';
import { formatRelativeTime } from '@/utils/breed';

type NotificationItem = {
  id: string;
  type: 'COMMENT' | 'REACTION' | 'MEETUP_RSVP' | 'DOG_INTERACTION' | 'NEW_BREED_POST' | 'NEW_PLACE_POST';
  actor_name?: string;
  post_id: string | null;
  content_preview?: string;
  breed?: string | null;
  place_name?: string | null;
  created_at: string;
  read_at: string | null;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Called after the sheet closes when user taps a notification with a post */
  onPostPress?: (postId: string) => void;
};

export function NotificationsSheet({ visible, onClose, onPostPress }: Props) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const slideAnim = useRef(new Animated.Value(500)).current;

  const { data: rawNotifications, isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => getNotifications(user!.id),
    enabled: !!user?.id,
  });

  const markReadMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => markNotificationRead(id, user!.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(user!.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] }),
  });

  const items: NotificationItem[] = (rawNotifications ?? []).map((n: any) => ({
    id: n.id,
    type: n.type,
    actor_name: n.actor?.name,
    post_id: n.post_id,
    content_preview: n.post?.content_text?.slice(0, 50),
    breed: n.post?.breed ?? null,
    place_name: n.post?.place?.name ?? null,
    created_at: n.created_at,
    read_at: n.read_at,
  }));

  const unreadCount = items.filter((i) => !i.read_at).length;

  const startSlideOut = useCallback(
    (onDone?: () => void) => {
      Animated.timing(slideAnim, {
        toValue: 500,
        duration: 220,
        useNativeDriver: true,
      }).start(onDone);
    },
    [slideAnim]
  );

  const handleModalShow = useCallback(() => {
    slideAnim.setValue(500);
    Animated.spring(slideAnim, {
      toValue: 0,
      damping: 22,
      stiffness: 220,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const handleClose = useCallback(() => {
    startSlideOut(onClose);
  }, [startSlideOut, onClose]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 5,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) slideAnim.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 80 || gs.vy > 0.5) {
          startSlideOut(onClose);
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            damping: 22,
            stiffness: 220,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (!visible) {
      slideAnim.setValue(500);
    }
  }, [visible, slideAnim]);

  const notificationLabel = (item: NotificationItem) => {
    if (item.type === 'COMMENT') return ' commented on your post';
    if (item.type === 'MEETUP_RSVP') return ' joined your meetup';
    if (item.type === 'DOG_INTERACTION') return ' marked that your dog met their dog';
    if (item.type === 'NEW_BREED_POST') return ' posted in a breed feed you follow';
    if (item.type === 'NEW_PLACE_POST') {
      return item.place_name ? ` posted at ${item.place_name}` : ' posted at a place you saved';
    }
    return ' reacted to your post';
  };

  const renderItem = useCallback(
    ({ item }: { item: NotificationItem }) => (
      <TouchableOpacity
        style={[styles.item, !item.read_at && styles.itemUnread]}
        onPress={() => {
          if (!item.read_at) markReadMutation.mutate({ id: item.id });
          if (item.post_id) {
            startSlideOut(() => {
              onClose();
              onPostPress?.(item.post_id!);
            });
          }
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.itemText}>
          <Text style={styles.actorName}>{item.actor_name ?? 'Someone'}</Text>
          {notificationLabel(item)}
        </Text>
        {item.content_preview ? (
          <Text style={styles.preview} numberOfLines={1}>
            &ldquo;{item.content_preview}&hellip;&rdquo;
          </Text>
        ) : null}
        <Text style={styles.time}>{formatRelativeTime(item.created_at)}</Text>
      </TouchableOpacity>
    ),
    [markReadMutation, startSlideOut, onClose, onPostPress]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onShow={handleModalShow}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={handleClose}
          accessibilityLabel="Close notifications"
        />

        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, spacing.lg) },
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.handleArea} {...panResponder.panHandlers}>
            <View style={styles.handle} />
          </View>

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <TouchableOpacity
                onPress={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                hitSlop={8}
              >
                <Text style={styles.markAllText}>Mark all read</Text>
              </TouchableOpacity>
            )}
          </View>

          {isLoading ? (
            <View style={styles.stateBox}>
              <Text style={styles.helperText}>Loading…</Text>
            </View>
          ) : items.length === 0 ? (
            <View style={styles.stateBox}>
              <Text style={styles.emptyBody}>You're all caught up!</Text>
            </View>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            />
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: spacing.sm,
    minHeight: '30%',
    maxHeight: '80%',
    ...shadow.md,
  },
  handleArea: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 37,
    height: 2,
    borderRadius: 2,
    backgroundColor: 'rgba(60, 60, 67, 0.75)',
    marginBottom: 11,
    transform: [{ translateY: -2 }],
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginTop: -3,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(231, 226, 216, 0.5)',
  },
  sheetTitle: {
    ...typography.subtitle,
    fontFamily: 'Inter_700Bold',
    transform: [{ translateY: -12 }],
  },
  markAllText: {
    ...typography.caption,
    color: colors.primary,
    fontFamily: 'Inter_600SemiBold',
    transform: [{ translateY: -12 }],
  },
  list: {
    paddingVertical: spacing.xs,
  },
  item: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(231, 226, 216, 0.5)',
  },
  itemUnread: {
    backgroundColor: colors.primarySoft,
  },
  itemText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  actorName: {
    fontFamily: 'Inter_600SemiBold',
  },
  preview: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
    fontStyle: 'italic',
  },
  time: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xxs,
  },
  stateBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.md,
  },
  helperText: {
    ...typography.bodyMuted,
  },
  emptyTitle: {
    ...typography.subtitle,
    textAlign: 'center',
  },
  emptyBody: {
    ...typography.bodyMuted,
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
});
