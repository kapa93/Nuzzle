import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { getUnreadCount } from '@/api/notifications';

export function NotificationBell() {
  const user = useAuthStore((s) => s.user);
  const openNotifications = useUIStore((s) => s.openNotifications);

  const { data: count = 0 } = useQuery({
    queryKey: ['notifications-unread', user?.id],
    queryFn: () => getUnreadCount(user!.id),
    enabled: !!user?.id,
    staleTime: 0,
  });

  const badgeLabel = count > 99 ? '99+' : count > 0 ? String(count) : null;

  return (
    <Pressable
      onPress={openNotifications}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={count > 0 ? `Notifications, ${count} unread` : 'Notifications'}
    >
      <Bell size={24} strokeWidth={2.15} color="#000000" />
      {badgeLabel !== null && (
        <View style={[styles.badge, badgeLabel.length > 1 && styles.badgeWide]}>
          <Text style={styles.badgeText}>{badgeLabel}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  pressed: {
    opacity: 0.6,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeWide: {
    minWidth: 20,
    borderRadius: 10,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    lineHeight: 12,
    includeFontPadding: false,
  },
});
