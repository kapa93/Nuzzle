import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import {
  fetchAdminReports,
  updateReportStatus,
  deleteReportedContent,
  type AdminReport,
} from '@/api/adminReports';
import {
  fetchPendingCommunities,
  fetchActiveCommunities,
  launchCommunity,
  rejectCommunity,
  type AdminPendingCommunity,
  type AdminActiveCommunity,
} from '@/api/adminCommunities';
import {
  fetchNewUsers,
  fetchMostActiveUsers,
  fetchCommunitiesAtRisk,
  type AdminNewUsersData,
  type AdminActiveUser,
  type AdminCommunityAtRisk,
} from '@/api/adminGrowth';
import {
  AlertTriangle,
  Rocket,
  Users,
  TrendingDown,
  CheckCircle,
  XCircle,
  Trash2,
  ChevronRight,
} from 'lucide-react-native';

type Tab = 'moderation' | 'communities' | 'growth';

function formatRelative(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Summary card
// ---------------------------------------------------------------------------

function SummaryCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <View style={[styles.summaryCard, { borderTopColor: accent }]}>
      <View style={[styles.summaryIconWrap, { backgroundColor: accent + '18' }]}>{icon}</View>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Action button
// ---------------------------------------------------------------------------

function ActionButton({
  label,
  onPress,
  variant = 'default',
  loading,
}: {
  label: string;
  onPress: () => void;
  variant?: 'default' | 'danger' | 'success';
  loading?: boolean;
}) {
  const bg =
    variant === 'danger'
      ? colors.dangerSurface
      : variant === 'success'
      ? colors.primarySoft
      : colors.chipNeutral;
  const textColor =
    variant === 'danger'
      ? colors.danger
      : variant === 'success'
      ? colors.primaryDark
      : colors.textSecondary;

  return (
    <Pressable
      style={({ pressed }) => [styles.actionBtn, { backgroundColor: bg, opacity: pressed ? 0.7 : 1 }]}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <Text style={[styles.actionBtnText, { color: textColor }]}>{label}</Text>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {count !== undefined && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Moderation tab
// ---------------------------------------------------------------------------

function ModerationTab() {
  const queryClient = useQueryClient();
  const { data: reports, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: fetchAdminReports,
  });

  const dismissMutation = useMutation({
    mutationFn: (reportId: string) => updateReportStatus(reportId, 'dismissed'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] }),
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const reviewMutation = useMutation({
    mutationFn: (reportId: string) => updateReportStatus(reportId, 'reviewed'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] }),
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: ({
      reportId,
      contentType,
      contentId,
    }: {
      reportId: string;
      contentType: AdminReport['reportable_type'];
      contentId: string;
    }) => deleteReportedContent(reportId, contentType, contentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] }),
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const pending = (reports ?? []).filter((r) => r.status === 'pending');
  const reviewed = (reports ?? []).filter((r) => r.status !== 'pending');

  const handleDelete = (report: AdminReport) => {
    const label = report.reportable_type === 'POST' ? 'post' : 'comment';
    Alert.alert(
      `Delete ${label}`,
      `Permanently delete this ${label}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            deleteMutation.mutate({
              reportId: report.id,
              contentType: report.reportable_type,
              contentId: report.reportable_id,
            }),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const renderReport = (report: AdminReport) => {
    const isPost = report.reportable_type === 'POST';
    const preview = isPost
      ? report.post?.content_text ?? '(content deleted)'
      : report.comment?.content_text ?? '(content deleted)';
    const author = isPost ? report.post?.author?.name : report.comment?.author?.name;
    const contentExists = isPost ? !!report.post : !!report.comment;

    return (
      <View key={report.id} style={styles.reportCard}>
        <View style={styles.reportHeader}>
          <View style={[styles.typePill, isPost ? styles.typePillPost : styles.typePillComment]}>
            <Text style={[styles.typePillText, isPost ? styles.typePillTextPost : styles.typePillTextComment]}>
              {isPost ? 'Post' : 'Comment'}
            </Text>
          </View>
          {report.status !== 'pending' && (
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>{report.status}</Text>
            </View>
          )}
          <Text style={styles.reportDate}>{formatDate(report.created_at)}</Text>
        </View>

        <Text style={styles.reportPreview} numberOfLines={3}>
          {preview}
        </Text>

        {!isPost && report.comment?.post_title && (
          <Text style={styles.reportMeta} numberOfLines={1}>
            In: {report.comment.post_title}
          </Text>
        )}

        <View style={styles.reportMetaRow}>
          {author && <Text style={styles.reportMeta}>Author: {author}</Text>}
          {report.reason ? (
            <Text style={styles.reportMeta}>Reason: {report.reason}</Text>
          ) : (
            <Text style={[styles.reportMeta, { fontStyle: 'italic' }]}>No reason provided</Text>
          )}
        </View>

        {report.status === 'pending' && (
          <View style={styles.reportActions}>
            <ActionButton
              label="Dismiss"
              onPress={() => dismissMutation.mutate(report.id)}
              loading={dismissMutation.isPending && dismissMutation.variables === report.id}
            />
            <ActionButton
              label="Mark Reviewed"
              variant="success"
              onPress={() => reviewMutation.mutate(report.id)}
              loading={reviewMutation.isPending && reviewMutation.variables === report.id}
            />
            {contentExists && (
              <ActionButton
                label="Delete"
                variant="danger"
                onPress={() => handleDelete(report)}
                loading={
                  deleteMutation.isPending &&
                  deleteMutation.variables?.reportId === report.id
                }
              />
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.tabScroll}
      contentContainerStyle={styles.tabContent}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
      }
    >
      <SectionHeader title="Pending Reports" count={pending.length} />
      {pending.length === 0 ? (
        <Text style={styles.emptyText}>No pending reports</Text>
      ) : (
        pending.map(renderReport)
      )}

      {reviewed.length > 0 && (
        <>
          <SectionHeader title="Reviewed" count={reviewed.length} />
          {reviewed.map(renderReport)}
        </>
      )}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Communities tab
// ---------------------------------------------------------------------------

function CommunitiesTab() {
  const queryClient = useQueryClient();

  const { data: pending, isLoading: loadingPending, refetch: refetchPending } = useQuery({
    queryKey: ['admin', 'pendingCommunities'],
    queryFn: fetchPendingCommunities,
  });

  const { data: active, isLoading: loadingActive, refetch: refetchActive } = useQuery({
    queryKey: ['admin', 'activeCommunities'],
    queryFn: fetchActiveCommunities,
  });

  const launchMutation = useMutation({
    mutationFn: launchCommunity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pendingCommunities'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'activeCommunities'] });
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: rejectCommunity,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'pendingCommunities'] }),
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const handleLaunch = (community: AdminPendingCommunity) => {
    Alert.alert(
      'Launch community',
      `Launch "${community.name}"? All interested users will be notified.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Launch', onPress: () => launchMutation.mutate(community.id) },
      ]
    );
  };

  const handleReject = (community: AdminPendingCommunity) => {
    Alert.alert('Reject community', `Archive "${community.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: () => rejectMutation.mutate(community.id),
      },
    ]);
  };

  const isLoading = loadingPending || loadingActive;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.tabScroll}
      contentContainerStyle={styles.tabContent}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={() => {
            refetchPending();
            refetchActive();
          }}
          tintColor={colors.primary}
        />
      }
    >
      <SectionHeader title="Ready to Launch" count={pending?.length ?? 0} />
      {(pending ?? []).length === 0 ? (
        <Text style={styles.emptyText}>No communities at threshold yet</Text>
      ) : (
        (pending ?? []).map((community) => (
          <View key={community.id} style={styles.communityCard}>
            <View style={styles.communityCardBody}>
              <Text style={styles.communityName}>{community.name}</Text>
              <Text style={styles.communityMeta}>
                {[community.neighborhood, community.city].filter(Boolean).join(', ')}
              </Text>
              <View style={styles.communityStats}>
                <Text style={styles.communityStatText}>
                  {community.interest_count} interested
                </Text>
                <Text style={styles.communitySep}>·</Text>
                <Text style={styles.communityStatText}>
                  Created {formatDate(community.created_at)}
                </Text>
              </View>
            </View>
            <View style={styles.communityActions}>
              <ActionButton
                label="Launch"
                variant="success"
                onPress={() => handleLaunch(community)}
                loading={launchMutation.isPending && launchMutation.variables === community.id}
              />
              <ActionButton
                label="Reject"
                variant="danger"
                onPress={() => handleReject(community)}
                loading={rejectMutation.isPending && rejectMutation.variables === community.id}
              />
            </View>
          </View>
        ))
      )}

      <SectionHeader title="Active Communities" count={active?.length ?? 0} />
      {(active ?? []).length === 0 ? (
        <Text style={styles.emptyText}>No active communities</Text>
      ) : (
        (active ?? []).map((community: AdminActiveCommunity) => (
          <View key={community.id} style={styles.communityCard}>
            <View style={styles.communityCardBody}>
              <Text style={styles.communityName}>{community.name}</Text>
              <Text style={styles.communityMeta}>
                {[community.neighborhood, community.city].filter(Boolean).join(', ')}
              </Text>
              <View style={styles.communityStats}>
                <Text style={styles.communityStatText}>{community.member_count} members</Text>
                <Text style={styles.communitySep}>·</Text>
                <Text style={styles.communityStatText}>
                  {community.posts_last_7_days} posts this week
                </Text>
                <Text style={styles.communitySep}>·</Text>
                <Text style={styles.communityStatText}>
                  {formatRelative(community.last_activity_at)}
                </Text>
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Growth tab
// ---------------------------------------------------------------------------

function GrowthTab() {
  const { data: usersData, isLoading: loadingUsers, refetch: refetchUsers } = useQuery({
    queryKey: ['admin', 'newUsers'],
    queryFn: fetchNewUsers,
  });

  const { data: activeUsers, isLoading: loadingActive, refetch: refetchActive } = useQuery({
    queryKey: ['admin', 'activeUsers'],
    queryFn: fetchMostActiveUsers,
  });

  const { data: atRisk, isLoading: loadingRisk, refetch: refetchRisk } = useQuery({
    queryKey: ['admin', 'communitiesAtRisk'],
    queryFn: fetchCommunitiesAtRisk,
  });

  const isLoading = loadingUsers || loadingActive || loadingRisk;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.tabScroll}
      contentContainerStyle={styles.tabContent}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={() => {
            refetchUsers();
            refetchActive();
            refetchRisk();
          }}
          tintColor={colors.primary}
        />
      }
    >
      {/* New Users */}
      <SectionHeader title="New Users" />
      <View style={styles.growthStats}>
        <View style={styles.growthStatCard}>
          <Text style={styles.growthStatValue}>{usersData?.total_users ?? 0}</Text>
          <Text style={styles.growthStatLabel}>Total users</Text>
        </View>
        <View style={styles.growthStatCard}>
          <Text style={styles.growthStatValue}>{usersData?.users_this_week ?? 0}</Text>
          <Text style={styles.growthStatLabel}>Joined this week</Text>
        </View>
      </View>
      {(usersData?.recent_users ?? []).map((user) => (
        <View key={user.id} style={styles.userRow}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>{user.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.name}</Text>
            {user.city && <Text style={styles.userMeta}>{user.city}</Text>}
          </View>
          <Text style={styles.userDate}>{formatDate(user.created_at)}</Text>
        </View>
      ))}

      {/* Most Active Users */}
      <SectionHeader title="Most Active Users" />
      {(activeUsers ?? []).length === 0 ? (
        <Text style={styles.emptyText}>No activity yet</Text>
      ) : (
        (activeUsers ?? []).map((user: AdminActiveUser) => (
          <View key={user.id} style={styles.userRow}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>{user.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userMeta}>
                {user.post_count} posts · {user.comment_count} comments
              </Text>
            </View>
            <Text style={styles.userDate}>{formatRelative(user.last_active_at)}</Text>
          </View>
        ))
      )}

      {/* Communities at Risk */}
      <SectionHeader title="Communities at Risk" count={atRisk?.length ?? 0} />
      {(atRisk ?? []).length === 0 ? (
        <Text style={styles.emptyText}>All communities are active</Text>
      ) : (
        (atRisk ?? []).map((community: AdminCommunityAtRisk) => (
          <View key={community.id} style={styles.riskCard}>
            <View style={styles.riskCardLeft}>
              <Text style={styles.communityName}>{community.name}</Text>
              <Text style={styles.communityMeta}>
                {[community.neighborhood, community.city].filter(Boolean).join(', ')}
              </Text>
              <View style={styles.communityStats}>
                <Text style={styles.communityStatText}>{community.member_count} members</Text>
                <Text style={styles.communitySep}>·</Text>
                <Text style={styles.communityStatText}>
                  {community.posts_last_14_days} posts (14d)
                </Text>
                <Text style={styles.communitySep}>·</Text>
                <Text style={styles.communityStatText}>
                  {formatRelative(community.last_activity_at)}
                </Text>
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Root screen
// ---------------------------------------------------------------------------

export function AdminDashboardScreen() {
  const { profile } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('moderation');

  const { data: reports } = useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: fetchAdminReports,
    enabled: profile?.is_admin === true,
  });

  const { data: pendingCommunities } = useQuery({
    queryKey: ['admin', 'pendingCommunities'],
    queryFn: fetchPendingCommunities,
    enabled: profile?.is_admin === true,
  });

  const { data: usersData } = useQuery({
    queryKey: ['admin', 'newUsers'],
    queryFn: fetchNewUsers,
    enabled: profile?.is_admin === true,
  });

  const { data: atRisk } = useQuery({
    queryKey: ['admin', 'communitiesAtRisk'],
    queryFn: fetchCommunitiesAtRisk,
    enabled: profile?.is_admin === true,
  });

  if (!profile?.is_admin) return null;

  const pendingReports = (reports ?? []).filter((r) => r.status === 'pending').length;

  const TABS: { key: Tab; label: string }[] = [
    { key: 'moderation', label: 'Moderation' },
    { key: 'communities', label: 'Communities' },
    { key: 'growth', label: 'Growth' },
  ];

  return (
    <View style={styles.screen}>
      {/* Summary cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.summaryScroll}
        contentContainerStyle={styles.summaryRow}
      >
        <SummaryCard
          label="Pending Reports"
          value={pendingReports}
          accent={colors.danger}
          icon={<AlertTriangle size={18} color={colors.danger} strokeWidth={2} />}
        />
        <SummaryCard
          label="Ready to Launch"
          value={pendingCommunities?.length ?? 0}
          accent={colors.primary}
          icon={<Rocket size={18} color={colors.primary} strokeWidth={2} />}
        />
        <SummaryCard
          label="New This Week"
          value={usersData?.users_this_week ?? 0}
          accent="#6366F1"
          icon={<Users size={18} color="#6366F1" strokeWidth={2} />}
        />
        <SummaryCard
          label="At Risk"
          value={atRisk?.length ?? 0}
          accent={colors.warningText}
          icon={<TrendingDown size={18} color={colors.warningText} strokeWidth={2} />}
        />
      </ScrollView>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Tab content */}
      {activeTab === 'moderation' && <ModerationTab />}
      {activeTab === 'communities' && <CommunitiesTab />}
      {activeTab === 'growth' && <GrowthTab />}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },

  // Summary cards
  summaryScroll: {
    flexGrow: 0,
    flexShrink: 0,
    marginVertical: spacing.sm,
    marginTop: spacing.sm - 2,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    width: 120,
    borderTopWidth: 3,
    alignItems: 'flex-start',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 1,
  },
  summaryIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxs,
  },
  summaryValue: {
    ...typography.subtitle,
    fontSize: 20,
    marginBottom: 1,
  },
  summaryLabel: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 14,
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabItem: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: colors.primary,
  },
  tabLabel: {
    ...typography.bodyMuted,
    fontSize: 14,
  },
  tabLabelActive: {
    color: colors.primary,
    fontFamily: 'Inter_700Bold',
  },

  // Tab content
  tabScroll: {
    flex: 1,
  },
  tabContent: {
    padding: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: 40,
    gap: spacing.sm,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.subtitle,
    fontSize: 15,
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },

  // Empty state
  emptyText: {
    ...typography.bodyMuted,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },

  // Report card
  reportCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  typePill: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  typePillPost: {
    backgroundColor: colors.primarySoft,
  },
  typePillComment: {
    backgroundColor: colors.warningSoft,
  },
  typePillText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
  typePillTextPost: {
    color: colors.primaryDark,
  },
  typePillTextComment: {
    color: colors.warningText,
  },
  statusPill: {
    backgroundColor: colors.chipNeutral,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusPillText: {
    ...typography.caption,
    fontSize: 11,
  },
  reportDate: {
    ...typography.caption,
    marginLeft: 'auto',
  },
  reportPreview: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  reportMetaRow: {
    gap: spacing.xxs,
    marginBottom: spacing.xs,
  },
  reportMeta: {
    ...typography.caption,
  },
  reportActions: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },

  // Action button
  actionBtn: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
    minHeight: 30,
  },
  actionBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },

  // Community card
  communityCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  communityCardBody: {
    marginBottom: spacing.sm,
  },
  communityName: {
    ...typography.body,
    fontFamily: 'Inter_700Bold',
    marginBottom: 2,
  },
  communityMeta: {
    ...typography.caption,
    marginBottom: spacing.xxs,
  },
  communityStats: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xxs,
  },
  communityStatText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  communitySep: {
    ...typography.caption,
    color: colors.textMuted,
  },
  communityActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },

  // Risk card
  riskCard: {
    backgroundColor: colors.warningSoft,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: '#E8D098',
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskCardLeft: {
    flex: 1,
  },

  // Growth / user rows
  growthStats: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  growthStatCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  growthStatValue: {
    ...typography.titleMD,
    fontSize: 28,
    marginBottom: 2,
  },
  growthStatLabel: {
    ...typography.caption,
    textAlign: 'center',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: colors.primaryDark,
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...typography.body,
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  userMeta: {
    ...typography.caption,
  },
  userDate: {
    ...typography.caption,
  },
});
