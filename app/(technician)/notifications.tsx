import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl, ScrollView,
  NativeSyntheticEvent, NativeScrollEvent, useWindowDimensions,
} from 'react-native';
import { Screen } from '../../components/common/Screen';
import { UnifiedNotificationItem } from '../../components/notifications/UnifiedNotificationItem';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingOverlay } from '../../components/common/LoadingOverlay';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useUnifiedNotifications } from '../../hooks/useUnifiedNotifications';
import { useMarkRead } from '../../hooks/useNotifications';
import { theme } from '../../constants/theme';

export default function TechnicianNotifications() {
  const { profile } = useCurrentUser();
  const { width: SCREEN_W } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<'alerts' | 'announcements'>('alerts');
  const pagerRef = useRef<ScrollView>(null);

  // Technicians see all broadcasts (no store filter)
  const {
    ticketNotifications,
    announcementNotifications,
    unreadTicketCount,
    unreadAnnouncementCount,
    markAllBroadcastsRead,
    isLoading,
    isRefetching,
    refetch,
  } = useUnifiedNotifications(profile?.id ?? '', null);
  const { markOne, markAll } = useMarkRead(profile?.id ?? '');

  const switchTab = (tab: 'alerts' | 'announcements') => {
    setActiveTab(tab);
    pagerRef.current?.scrollTo({ x: tab === 'announcements' ? SCREEN_W : 0, animated: true });
    if (tab === 'announcements') markAllBroadcastsRead();
  };

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    const tab = page === 0 ? 'alerts' : 'announcements';
    setActiveTab(tab);
    if (tab === 'announcements') markAllBroadcastsRead();
  };

  if (isLoading) return <LoadingOverlay />;

  return (
    <Screen edges={['top', 'left', 'right']} style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alerts</Text>
        <TouchableOpacity
          style={styles.markAllBtn}
          onPress={() => markAll.mutate()}
          activeOpacity={0.75}
        >
          <Text style={styles.markAllText}>Mark all as read</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {/* Tab nav */}
        <View style={styles.tabNav}>
          <TouchableOpacity style={styles.tabItem} onPress={() => switchTab('alerts')} activeOpacity={0.7}>
            <View style={styles.tabContent}>
              <Text style={[styles.tabLabel, activeTab === 'alerts' && styles.tabLabelActive]}>
                Alerts
              </Text>
              {unreadTicketCount > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{unreadTicketCount}</Text>
                </View>
              )}
            </View>
            {activeTab === 'alerts' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => switchTab('announcements')} activeOpacity={0.7}>
            <View style={styles.tabContent}>
              <Text style={[styles.tabLabel, activeTab === 'announcements' && styles.tabLabelActive]}>
                Announcements
              </Text>
              {unreadAnnouncementCount > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{unreadAnnouncementCount}</Text>
                </View>
              )}
            </View>
            {activeTab === 'announcements' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        </View>

        {/* Swipeable pager */}
        <ScrollView
          ref={pagerRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.pager}
          onMomentumScrollEnd={handleScrollEnd}
          scrollEventThrottle={16}
        >
          {/* Alerts page */}
          <View style={[styles.page, { width: SCREEN_W }]}>
            <FlatList
              data={ticketNotifications}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <UnifiedNotificationItem item={item} onMarkRead={(nid) => markOne.mutate(nid)} />
              )}
              style={styles.flex}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={isRefetching}
                  onRefresh={refetch}
                  tintColor={theme.colors.brand}
                  colors={[theme.colors.brand]}
                />
              }
              ListEmptyComponent={
                <EmptyState
                  icon="notifications-outline"
                  title="No alerts yet"
                  subtitle="Ticket updates will appear here"
                />
              }
            />
          </View>

          {/* Announcements page */}
          <View style={[styles.page, { width: SCREEN_W }]}>
            <FlatList
              data={announcementNotifications}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <UnifiedNotificationItem item={item} />}
              style={styles.flex}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={isRefetching}
                  onRefresh={refetch}
                  tintColor={theme.colors.brand}
                  colors={[theme.colors.brand]}
                />
              }
              ListEmptyComponent={
                <EmptyState
                  icon="megaphone-outline"
                  title="No announcements yet"
                  subtitle="Broadcasts and gold rate updates will appear here"
                />
              }
            />
          </View>
        </ScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.brand,
  },
  header: {
    height: 52,
    backgroundColor: theme.colors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
  markAllBtn: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  markAllText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
  },
  body: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  tabNav: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: 'row',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingBottom: theme.spacing.sm,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textTertiary,
  },
  tabLabelActive: {
    color: theme.colors.brand,
  },
  tabIndicator: {
    height: 2,
    backgroundColor: theme.colors.brand,
    alignSelf: 'stretch',
    marginHorizontal: theme.spacing.xl,
  },
  tabBadge: {
    backgroundColor: theme.colors.brand,
    borderRadius: theme.radius.full,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  listContent: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.xxl,
  },
});
