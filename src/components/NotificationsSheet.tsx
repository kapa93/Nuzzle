import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { Heart, MapPin, MessageSquare, Star, Users } from 'lucide-react-native';
import { colors, shadow, spacing, typography } from '@/theme';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/api/notifications';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { formatRelativeTime } from '@/utils/breed';
import { DogPawIcon } from '@/assets/DogPawIcon';

const AVATAR_SIZE = 46;
const BADGE_SIZE = 20;

type NotificationItem = {
  id: string;
  type: 'COMMENT' | 'REACTION' | 'COMMENT_REACTION' | 'MEETUP_RSVP' | 'DOG_INTERACTION' | 'NEW_BREED_POST' | 'NEW_PLACE_POST';
  actor_name?: string;
  actor_profile_image_url?: string | null;
  post_id: string | null;
  content_preview?: string;
  breed?: string | null;
  place_name?: string | null;
  created_at: string;
  read_at: string | null;
};

type Section = { title: string; data: NotificationItem[] };

type Props = {
  /** Called after the sheet closes when user taps a notification with a post */
  onPostPress?: (postId: string) => void;
};

type BadgeConfig = {
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
  bg: string;
};

const TYPE_BADGE: Record<NotificationItem['type'], BadgeConfig> = {
  COMMENT:          { Icon: MessageSquare, bg: '#22C55E' },
  REACTION:         { Icon: Heart,         bg: '#EF4444' },
  COMMENT_REACTION: { Icon: Heart,         bg: '#EC4899' },
  MEETUP_RSVP:  { Icon: Users,         bg: '#3B82F6' },
  DOG_INTERACTION: { Icon: Star,       bg: '#F59E0B' },
  NEW_BREED_POST:  { Icon: Users,      bg: '#14B8A6' },
  NEW_PLACE_POST:  { Icon: MapPin,     bg: '#F97316' },
};

function getDateGroup(dateStr: string): 'TODAY' | 'YESTERDAY' | 'EARLIER' {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const d = new Date(dateStr);
  const itemDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (itemDay.getTime() === today.getTime()) return 'TODAY';
  if (itemDay.getTime() === yesterday.getTime()) return 'YESTERDAY';
  return 'EARLIER';
}

function buildSections(items: NotificationItem[]): Section[] {
  const groups: Record<'TODAY' | 'YESTERDAY' | 'EARLIER', NotificationItem[]> = {
    TODAY: [], YESTERDAY: [], EARLIER: [],
  };
  for (const item of items) groups[getDateGroup(item.created_at)].push(item);
  return (['TODAY', 'YESTERDAY', 'EARLIER'] as const)
    .filter((k) => groups[k].length > 0)
    .map((k) => ({ title: k, data: groups[k] }));
}

export function NotificationsSheet({ onPostPress }: Props) {
  const visible = useUIStore((s) => s.notificationsOpen);
  const onClose = useUIStore((s) => s.closeNotifications);
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const slideAnim = useRef(new Animated.Value(500)).current;
  const [pushGranted, setPushGranted] = useState(true);

  const { data: rawNotifications, isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => getNotifications(user!.id),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!visible || Platform.OS === 'web') return;
    Notifications.getPermissionsAsync().then(({ status }) => {
      setPushGranted(status === 'granted');
    });
  }, [visible]);

  const markReadMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => markNotificationRead(id, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread', user?.id] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread', user?.id] });
    },
  });

  const items: NotificationItem[] = (rawNotifications ?? []).map((n: any) => ({
    id: n.id,
    type: n.type,
    actor_name: n.actor?.name,
    actor_profile_image_url: n.actor?.profile_image_url ?? null,
    post_id: n.post_id,
    content_preview: n.post?.content_text?.slice(0, 60),
    breed: n.post?.breed ?? null,
    place_name: n.post?.place?.name ?? null,
    created_at: n.created_at,
    read_at: n.read_at,
  }));

  const unreadCount = items.filter((i) => !i.read_at).length;
  const sections = buildSections(items);

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
    if (!visible) slideAnim.setValue(500);
  }, [visible, slideAnim]);

  const notificationLabel = (item: NotificationItem) => {
    if (item.type === 'COMMENT') return ' commented on your post';
    if (item.type === 'COMMENT_REACTION') return ' reacted to your comment';
    if (item.type === 'MEETUP_RSVP') return ' joined your meetup';
    if (item.type === 'DOG_INTERACTION') return ' marked that your dog met their dog';
    if (item.type === 'NEW_BREED_POST') return ' posted in a breed feed you follow';
    if (item.type === 'NEW_PLACE_POST') {
      return item.place_name ? ` posted at ${item.place_name}` : ' posted at a place you saved';
    }
    return ' reacted to your post';
  };

  const renderItem = useCallback(
    ({ item }: { item: NotificationItem }) => {
      const badge = TYPE_BADGE[item.type];
      const BadgeIcon = badge.Icon;
      return (
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
          {/* Avatar + type badge */}
          <View style={styles.avatarWrap}>
            {item.actor_profile_image_url ? (
              <Image source={{ uri: item.actor_profile_image_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>
                  {item.actor_name ? item.actor_name[0].toUpperCase() : '?'}
                </Text>
              </View>
            )}
            <View style={[styles.typeBadge, { backgroundColor: badge.bg }]}>
              <BadgeIcon size={10} color="#fff" strokeWidth={2.5} />
            </View>
          </View>

          {/* Text content */}
          <View style={styles.itemContent}>
            <View style={styles.itemTopRow}>
              <Text style={styles.itemText} numberOfLines={2}>
                <Text style={styles.actorName}>{item.actor_name ?? 'Someone'}</Text>
                {notificationLabel(item)}
              </Text>
              <View style={styles.itemMeta}>
                <Text style={styles.time}>{formatRelativeTime(item.created_at)}</Text>
                {!item.read_at && <View style={styles.unreadDot} />}
              </View>
            </View>
            {item.content_preview ? (
              <Text style={styles.preview} numberOfLines={1}>
                &ldquo;{item.content_preview}&hellip;&rdquo;
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>
      );
    },
    [markReadMutation, startSlideOut, onClose, onPostPress]
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: Section }) => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
      </View>
    ),
    []
  );

  const handleEnablePush = useCallback(async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === 'granted') setPushGranted(true);
  }, []);

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
          {/* Drag handle */}
          <View style={styles.handleArea} {...panResponder.panHandlers}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
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

          {/* Body */}
          {isLoading ? (
            <View style={styles.stateBox}>
              <Text style={styles.helperText}>Loading…</Text>
            </View>
          ) : items.length === 0 ? (
            <View style={styles.stateBox}>
              <Text style={styles.emptyBody}>You're all caught up!</Text>
            </View>
          ) : (
            <SectionList
              sections={sections}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              renderSectionHeader={renderSectionHeader}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              stickySectionHeadersEnabled={false}
            />
          )}

          {/* Push notification enable banner */}
          {!pushGranted && (
            <View style={styles.pushBanner}>
              <DogPawIcon size={26} color={colors.primary} />
              <View style={styles.pushBannerText}>
                <Text style={styles.pushBannerTitle}>Stay in the loop!</Text>
                <Text style={styles.pushBannerBody}>
                  Enable push notifications to get updates.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.enableButton}
                onPress={handleEnablePush}
                activeOpacity={0.75}
              >
                <Text style={styles.enableButtonText}>Enable</Text>
              </TouchableOpacity>
            </View>
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: '30%',
    maxHeight: '88%',
    ...shadow.md,
  },
  handleArea: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 2,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(60, 60, 67, 0.25)',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  sheetTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  markAllText: {
    ...typography.caption,
    color: colors.primary,
    fontFamily: 'Inter_600SemiBold',
  },
  list: {
    paddingBottom: spacing.sm,
  },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
    backgroundColor: colors.surface,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: colors.textMuted,
    letterSpacing: 0.9,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  itemUnread: {
    backgroundColor: colors.primarySoft,
  },
  avatarWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    marginRight: 12,
    flexShrink: 0,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.border,
  },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: colors.primary,
  },
  typeBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  itemContent: {
    flex: 1,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
    fontFamily: 'Inter_400Regular',
    marginRight: 6,
  },
  actorName: {
    fontFamily: 'Inter_600SemiBold',
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 0,
    marginTop: 2,
  },
  time: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    lineHeight: 16,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  preview: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    marginTop: 3,
    fontFamily: 'Inter_400Regular',
  },
  stateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxl,
  },
  helperText: {
    ...typography.bodyMuted,
  },
  emptyBody: {
    ...typography.bodyMuted,
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
  pushBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  pushBannerText: {
    flex: 1,
  },
  pushBannerTitle: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: colors.textPrimary,
    lineHeight: 20,
  },
  pushBannerBody: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
    lineHeight: 16,
    marginTop: 1,
  },
  enableButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  enableButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.primary,
    lineHeight: 20,
  },
});
