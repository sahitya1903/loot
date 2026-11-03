import Ionicons from '@expo/vector-icons/Ionicons';
import {
  listLootAlerts,
  markAlertRead,
  markAllAlertsRead,
  queryKeys,
} from '@loot/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useUnreadAlerts } from '@/components/AlertsBell';
import { StateView } from '@/components/ui';
import { errorMessage } from '@/lib/errors';
import { usePagedList } from '@/lib/paging';
import { colors, font, radius, space } from '@/theme';

const ICONS = {
  followed_business_drop: 'storefront',
  loot_ending_soon: 'timer',
  redemption_reminder: 'ticket',
};

/** "now", "5m", "3h", "2d". */
function ago(iso) {
  const minutes = Math.floor((Date.now() - Date.parse(iso)) / 60_000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)}h`;
  return `${Math.floor(minutes / (24 * 60))}d`;
}

function AlertRow({ alert, onPress }) {
  const unread = !alert.readAt;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        unread && styles.unread,
        pressed && styles.pressed,
      ]}
    >
      {alert.imageUrl ? (
        <Image
          source={alert.imageUrl}
          style={styles.thumb}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.thumb, styles.iconThumb]}>
          <Ionicons
            name={ICONS[alert.type] ?? 'notifications'}
            size={20}
            color={colors.textMuted}
          />
        </View>
      )}
      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={2}>
          {alert.title}
        </Text>
        <Text style={font.small} numberOfLines={3}>
          {alert.body}
        </Text>
      </View>
      <View style={styles.meta}>
        <Text style={styles.time}>{ago(alert.createdAt)}</Text>
        {unread ? <View style={styles.dot} /> : null}
      </View>
    </Pressable>
  );
}

export default function Alerts() {
  const queryClient = useQueryClient();
  const unread = useUnreadAlerts();
  const list = usePagedList([...queryKeys.alerts(), 'list'], (cursor) =>
    listLootAlerts({ cursor }),
  );
  const refreshAll = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.alerts() });

  const readAll = useMutation({
    mutationFn: markAllAlertsRead,
    onSuccess: refreshAll,
  });

  const open = (alert) => {
    if (!alert.readAt) markAlertRead(alert.alertId).then(refreshAll, () => {});
    if (alert.lootId) router.push(`/loot/${alert.lootId}`);
  };

  let emptyView;
  if (list.isPending) emptyView = <StateView loading />;
  else if (list.isError)
    emptyView = (
      <StateView
        error
        message={errorMessage(list.error)}
        onAction={() => list.refetch()}
      />
    );
  else
    emptyView = (
      <StateView
        empty
        title="All quiet"
        message="Follow businesses and save loot. We'll ping you when they drop something new or a deal is about to end."
      />
    );

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: unread
            ? () => (
                <Pressable
                  accessibilityRole="button"
                  disabled={readAll.isPending}
                  onPress={() => readAll.mutate()}
                  hitSlop={8}
                >
                  <Text style={styles.readAll}>Mark all read</Text>
                </Pressable>
              )
            : undefined,
        }}
      />
      <FlatList
        data={list.items}
        keyExtractor={(item) => item.alertId}
        renderItem={({ item }) => (
          <AlertRow alert={item} onPress={() => open(item)} />
        )}
        ListEmptyComponent={emptyView}
        ListFooterComponent={
          list.isFetchingNextPage ? (
            <ActivityIndicator color={colors.accent} style={styles.footer} />
          ) : null
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.content}
        onEndReached={list.loadMore}
        onEndReachedThreshold={0.6}
        refreshControl={
          <RefreshControl
            refreshing={list.isRefetching && !list.isFetchingNextPage}
            onRefresh={refreshAll}
            tintColor={colors.accent}
          />
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, flexGrow: 1 },
  separator: { height: space.sm },
  footer: { marginVertical: space.lg },
  row: {
    flexDirection: 'row',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  unread: { backgroundColor: colors.surfaceRaised },
  pressed: { opacity: 0.8 },
  thumb: { width: 48, height: 48, borderRadius: radius.sm },
  iconThumb: {
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: space.xs },
  title: { fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { alignItems: 'flex-end', gap: space.sm },
  time: { fontSize: 12, color: colors.textFaint },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  readAll: { color: colors.accent, fontWeight: '700', fontSize: 15 },
});
