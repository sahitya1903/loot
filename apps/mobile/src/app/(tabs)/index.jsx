import { LOOT_CATEGORIES, getNearbyFeed, queryKeys } from '@loot/shared';
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
import { errorMessage } from '@/lib/errors';
import { categoryLabel } from '@/lib/labels';
import { useFeedLocation } from '@/lib/location';
import { usePagedList } from '@/lib/paging';
import { useWatchArea, useWatchLoot } from '@/lib/realtime';
import { colors, font, radius, space } from '@/theme';

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

export default function Nearby() {
  const { location, radiusKm, setRadiusKm } = useFeedLocation();
  const [category, setCategory] = useState(null);
  const enabled = Boolean(location);
  const latitude = location?.latitude ?? 0;
  const longitude = location?.longitude ?? 0;

  const feed = usePagedList(
    queryKeys.feed.nearby(latitude, longitude, radiusKm, category),
    (cursor) =>
      getNearbyFeed({
        latitude,
        longitude,
        radiusKm,
        category: category ?? undefined,
        cursor,
        limit: 10,
      }),
    { enabled },
  );
  useWatchLoot(feed.items.map((item) => item.id));
  const { nearbyNew, clearNearbyNew } = useWatchArea(location, radiusKm);

  if (!enabled) return <NoLocation />;

  const refresh = () => {
    clearNearbyNew();
    return feed.refetch();
  };

  const header = (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/location')}
        style={styles.locationRow}
      >
        <Text style={font.label}>Near</Text>
        <Text style={styles.locationText} numberOfLines={1}>
          {location.label} · {radiusKm} km ▾
        </Text>
      </Pressable>
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
      {nearbyNew.length ? (
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
  if (feed.isPending) empty = <StateView loading />;
  else if (feed.isError) {
    empty = (
      <StateView
        error
        message={errorMessage(feed.error)}
        onAction={() => feed.refetch()}
      />
    );
  } else {
    const wider = [25, 10, 5].find((km) => km > radiusKm);
    empty = (
      <StateView
        empty
        title="No live loot here right now"
        message={`Nothing within ${radiusKm} km${category ? ` in ${categoryLabel(category)}` : ''}. Loot drops all the time.`}
        actionLabel={wider ? `Look within ${wider} km` : 'Refresh'}
        onAction={wider ? () => setRadiusKm(wider) : () => feed.refetch()}
      />
    );
  }

  return (
    <FlatList
      data={feed.items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <LootCard item={item} />}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      ListFooterComponent={
        feed.isFetchingNextPage ? (
          <ActivityIndicator color={colors.accent} style={styles.footer} />
        ) : null
      }
      contentContainerStyle={styles.list}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      onEndReached={feed.loadMore}
      onEndReachedThreshold={0.6}
      refreshControl={
        <RefreshControl
          refreshing={feed.isRefetching && !feed.isFetchingNextPage}
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
