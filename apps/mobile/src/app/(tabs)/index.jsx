import {
  LOOT_CATEGORIES,
  getFollowingFeed,
  getNearbyFeed,
  getTrendingFeed,
  queryKeys,
} from '@loot/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LootCard } from '@/components/LootCard';
import { Button, Chip, StateView } from '@/components/ui';
import { isBusiness, useAuth } from '@/lib/auth';
import { errorMessage } from '@/lib/errors';
import { categoryLabel } from '@/lib/labels';
import { useFeedLocation } from '@/lib/location';
import { usePagedList } from '@/lib/paging';
import { useWatchArea, useWatchLoot } from '@/lib/realtime';
import { colors, font, radius, space } from '@/theme';

const FEEDS = [
  { key: 'nearby', label: 'Nearby' },
  { key: 'trending', label: 'Trending' },
  { key: 'following', label: 'Following' },
];

const WIDER_RADII = [25, 10, 5];

/** The query key and page fetcher for one feed. */
function feedQuery(feed, { userId, latitude, longitude, radiusKm, category }) {
  const shared = { category: category ?? undefined, limit: 10 };
  switch (feed) {
    case 'trending':
      return {
        key: queryKeys.feed.trending(latitude, longitude, radiusKm, category),
        fetchPage: (cursor) =>
          getTrendingFeed({ latitude, longitude, radiusKm, cursor, ...shared }),
      };
    case 'following':
      // Followed businesses' loot wherever it is; coordinates only add distances.
      return {
        key: queryKeys.feed.following(userId, category, latitude, longitude),
        fetchPage: (cursor) =>
          getFollowingFeed({ latitude, longitude, cursor, ...shared }),
      };
    default:
      return {
        key: queryKeys.feed.nearby(latitude, longitude, radiusKm, category),
        fetchPage: (cursor) =>
          getNearbyFeed({ latitude, longitude, radiusKm, cursor, ...shared }),
      };
  }
}

function NoLocation() {
  const { locateWithGps } = useFeedLocation();
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(false);
  return (
    <View style={styles.center}>
      <Text style={[font.title, styles.centerText]}>Find loot near you</Text>
      <Text style={[font.body, styles.muted, styles.centerText]}>
        Share your location, or pick an area — GPS isn’t required.
      </Text>
      <Button
        title="Use my location"
        loading={busy}
        style={styles.stretch}
        onPress={async () => {
          setBusy(true);
          const result = await locateWithGps();
          setBusy(false);
          if (!result.ok) setDenied(true);
        }}
      />
      {denied ? (
        <Text style={[font.small, styles.centerText]}>
          Location unavailable. Pick an area instead.
        </Text>
      ) : null}
      <Button
        title="Choose an area"
        variant="secondary"
        style={styles.stretch}
        onPress={() => router.push('/location')}
      />
    </View>
  );
}

function FeedSwitch({ feeds, selected, onSelect }) {
  return (
    <View style={styles.switch} accessibilityRole="tablist">
      {feeds.map((f) => {
        const active = f.key === selected;
        return (
          <Pressable
            key={f.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(f.key)}
            style={[styles.switchItem, active && styles.switchItemActive]}
          >
            <Text style={[styles.switchText, active && styles.switchTextActive]}>
              {f.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function Feed() {
  const { user } = useAuth();
  const { location, radiusKm, setRadiusKm } = useFeedLocation();
  const [selected, setSelected] = useState('nearby');
  const [category, setCategory] = useState(null);
  // Business accounts can't follow anyone, so they have no Following feed.
  const feeds = isBusiness(user)
    ? FEEDS.filter((f) => f.key !== 'following')
    : FEEDS;
  const feed = feeds.some((f) => f.key === selected) ? selected : 'nearby';
  const enabled = Boolean(location);
  const latitude = location?.latitude ?? 0;
  const longitude = location?.longitude ?? 0;

  const { key, fetchPage } = feedQuery(feed, {
    userId: user?.userId ?? 'anon',
    latitude,
    longitude,
    radiusKm,
    category,
  });
  const list = usePagedList(key, fetchPage, { enabled });
  useWatchLoot(list.items.map((item) => item.id));
  const { nearbyNew, clearNearbyNew } = useWatchArea(location, radiusKm);

  if (!enabled) return <NoLocation />;

  const refresh = () => {
    if (feed === 'nearby') clearNearbyNew();
    return list.refetch();
  };
  const inCategory = category ? ` in ${categoryLabel(category)}` : '';
  const wider = WIDER_RADII.find((km) => km > radiusKm);

  const header = (
    <View style={styles.header}>
      <FeedSwitch feeds={feeds} selected={feed} onSelect={setSelected} />
      {feed === 'following' ? (
        <Text style={font.label}>
          Live loot from businesses you follow, newest first
        </Text>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/location')}
          style={styles.locationRow}
        >
          <Text style={font.label}>
            {feed === 'trending' ? 'Hot near' : 'Near'}
          </Text>
          <Text style={styles.locationText} numberOfLines={1}>
            {location.label} · {radiusKm} km ▾
          </Text>
        </Pressable>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        <Chip
          label="All"
          selected={!category}
          onPress={() => setCategory(null)}
        />
        {LOOT_CATEGORIES.filter((c) => c !== 'other').map((c) => (
          <Chip
            key={c}
            label={categoryLabel(c)}
            selected={category === c}
            onPress={() => setCategory(c)}
          />
        ))}
      </ScrollView>
      {feed === 'nearby' && nearbyNew.length ? (
        <Pressable
          accessibilityRole="button"
          onPress={refresh}
          style={styles.newPill}
        >
          <Text style={styles.newPillText}>
            {nearbyNew.length === 1
              ? '1 new loot nearby'
              : `${nearbyNew.length} new loot nearby`}{' '}
            · tap to refresh
          </Text>
        </Pressable>
      ) : null}
    </View>
  );

  let empty = null;
  if (list.isPending) empty = <StateView loading />;
  else if (list.isError) {
    empty = (
      <StateView
        error
        message={errorMessage(list.error)}
        onAction={() => list.refetch()}
      />
    );
  } else if (feed === 'trending') {
    empty = (
      <StateView
        empty
        title="Nothing trending here yet"
        message={`Loot trends as people save, claim and share it. Nothing within ${radiusKm} km${inCategory} is taking off right now.`}
        actionLabel="See everything nearby"
        onAction={() => setSelected('nearby')}
      />
    );
  } else if (feed === 'following') {
    empty = (
      <StateView
        empty
        title={
          category
            ? `Nothing${inCategory} right now`
            : 'No loot from your follows yet'
        }
        message={
          category
            ? 'None of the businesses you follow has live loot in this category.'
            : 'Open any loot and tap Follow on its business. Their new drops land here.'
        }
        actionLabel="Find businesses nearby"
        onAction={() => setSelected('nearby')}
      />
    );
  } else {
    empty = (
      <StateView
        empty
        title="No live loot here right now"
        message={`Nothing within ${radiusKm} km${inCategory}. Loot drops all the time.`}
        actionLabel={wider ? `Look within ${wider} km` : 'Refresh'}
        onAction={wider ? () => setRadiusKm(wider) : () => list.refetch()}
      />
    );
  }

  return (
    <FlatList
      data={list.items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <LootCard item={item} />}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      ListFooterComponent={
        list.isFetchingNextPage ? (
          <ActivityIndicator color={colors.accent} style={styles.footer} />
        ) : null
      }
      contentContainerStyle={styles.list}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      onEndReached={list.loadMore}
      onEndReachedThreshold={0.6}
      refreshControl={
        <RefreshControl
          refreshing={list.isRefetching && !list.isFetchingNextPage}
          onRefresh={refresh}
          tintColor={colors.accent}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: space.lg, flexGrow: 1 },
  header: { gap: space.md, marginBottom: space.lg },
  switch: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
  },
  switchItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: space.sm,
    borderRadius: radius.pill,
  },
  switchItemActive: { backgroundColor: colors.accent },
  switchText: { color: colors.textMuted, fontWeight: '800', fontSize: 14 },
  switchTextActive: { color: colors.accentText },
  locationRow: { gap: 2 },
  locationText: { color: colors.text, fontSize: 20, fontWeight: '900' },
  chips: { gap: space.sm },
  newPill: {
    alignSelf: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
  newPillText: { color: colors.accentText, fontWeight: '800' },
  separator: { height: space.lg },
  footer: { marginVertical: space.lg },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: space.xl,
    gap: space.md,
  },
  centerText: { textAlign: 'center' },
  muted: { color: colors.textMuted },
  stretch: { alignSelf: 'stretch' },
});
