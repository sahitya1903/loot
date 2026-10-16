import {
  claimLoot,
  formatDistance,
  getLoot,
  getRedemptionByLoot,
  haversineKm,
  queryKeys,
  saveLoot,
  trackLootView,
  unsaveLoot,
} from '@loot/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Countdown } from '@/components/Countdown';
import { formatPrice, stockLabel } from '@/components/LootCard';
import { RedemptionCard } from '@/components/RedemptionCard';
import { Banner, Button, StateView } from '@/components/ui';
import { isBusiness, useAuth } from '@/lib/auth';
import { errorMessage } from '@/lib/errors';
import { categoryLabel, statusLabel } from '@/lib/labels';
import { useFeedLocation } from '@/lib/location';
import { useLiveCounters } from '@/lib/realtime';
import { colors, font, radius, space } from '@/theme';

const LIVE = ['active', 'trending', 'expiring'];

export default function LootDetails() {
  const { id } = useLocalSearchParams();
  const lootId = String(id);
  const { user } = useAuth();
  const { location } = useFeedLocation();
  const queryClient = useQueryClient();
  const hunter = !isBusiness(user);

  const loot = useQuery({
    queryKey: queryKeys.loot.detail(lootId),
    queryFn: () => getLoot({ lootId }),
  });
  const claimed = Boolean(loot.data?.loot.viewer?.claimed);
  const redemption = useQuery({
    queryKey: queryKeys.loot.redemption(lootId),
    queryFn: () => getRedemptionByLoot(lootId),
    enabled: hunter && claimed,
  });
  const live = useLiveCounters(lootId);

  // Fire-and-forget view count.
  useEffect(() => {
    trackLootView({ lootId, source: 'detail' }).catch(() => {});
  }, [lootId]);

  const afterChange = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.loot.detail(lootId) });
    queryClient.invalidateQueries({ queryKey: ['user'] });
  };

  const save = useMutation({
    mutationFn: (saved) =>
      saved ? unsaveLoot({ lootId }) : saveLoot({ lootId }),
    onSuccess: ({ saved }) => {
      queryClient.setQueryData(queryKeys.loot.detail(lootId), (prev) =>
        prev
          ? { loot: { ...prev.loot, viewer: { ...prev.loot.viewer, saved } } }
          : prev,
      );
      afterChange();
    },
  });

  const claim = useMutation({
    mutationFn: () => claimLoot({ lootId }),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.loot.redemption(lootId), data);
      queryClient.setQueryData(queryKeys.loot.detail(lootId), (prev) =>
        prev
          ? {
              loot: {
                ...prev.loot,
                viewer: { ...prev.loot.viewer, claimed: true },
              },
            }
          : prev,
      );
      afterChange();
    },
    // Sold out / expired while looking: refresh so the screen shows the real state.
    onError: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.loot.detail(lootId),
      }),
  });

  if (loot.isPending) return <StateView loading />;
  if (loot.isError) {
    return (
      <StateView
        error
        message={errorMessage(loot.error)}
        onAction={() => loot.refetch()}
      />
    );
  }

  const item = loot.data.loot;
  const status = live?.status ?? item.status;
  const remaining = live ? live.remainingQuantity : item.remainingQuantity;
  const claimCount = live?.claimCount ?? item.claimCount;
  const saveCount = live?.saveCount ?? item.saveCount;
  const isLive = LIVE.includes(status);
  const soldOut = remaining === 0;
  const distance = location
    ? haversineKm(
        location.latitude,
        location.longitude,
        item.latitude,
        item.longitude,
      )
    : null;
  const price = formatPrice(item.offerPrice, item.currency);
  const original =
    item.originalPrice != null && item.originalPrice !== item.offerPrice
      ? formatPrice(item.originalPrice)
      : null;
  const myRedemption = claim.data?.redemption ?? redemption.data?.redemption;
  const saved = Boolean(item.viewer?.saved);

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <Stack.Screen options={{ title: item.business.businessName }} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loot.isRefetching}
            onRefresh={() => loot.refetch()}
            tintColor={colors.accent}
          />
        }
      >
        <View style={styles.hero}>
          {item.media[0] ? (
            <Image
              source={{ uri: item.media[0].url }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={150}
            />
          ) : null}
          <View style={styles.heroTop}>
            <Countdown expiryAt={item.expiryAt} large />
          </View>
          {item.offerText ? (
            <View style={styles.offerBadge}>
              <Text style={styles.offerText}>{item.offerText}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <Text style={font.title}>{item.title}</Text>
          <Text style={[font.body, styles.muted]}>
            {item.business.businessName}
            {item.business.verified ? ' ✓' : ''} ·{' '}
            {categoryLabel(item.category)}
          </Text>

          <View style={styles.priceRow}>
            {price ? <Text style={styles.price}>{price}</Text> : null}
            {original ? <Text style={styles.original}>{original}</Text> : null}
          </View>

          <View style={styles.stats}>
            <Stat label="claimed" value={claimCount} />
            <Stat label="saved" value={saveCount} />
            <Stat
              label="stock"
              value={stockLabel(remaining) ?? 'Unlimited'}
              danger={soldOut}
            />
          </View>

          {!isLive ? (
            <Banner
              tone="error"
              text={`This loot is ${statusLabel(status).toLowerCase()}.`}
            />
          ) : null}

          {hunter ? (
            myRedemption ? (
              <RedemptionCard redemption={myRedemption} />
            ) : (
              <View style={styles.actions}>
                <Button
                  title={
                    soldOut
                      ? 'Sold out'
                      : claim.isPending
                        ? 'Claiming…'
                        : 'Claim this loot'
                  }
                  onPress={() => claim.mutate()}
                  loading={claim.isPending}
                  disabled={!isLive || soldOut}
                />
                <Button
                  title={saved ? 'Saved ✓' : 'Save for later'}
                  variant="secondary"
                  onPress={() => save.mutate(saved)}
                  loading={save.isPending}
                  disabled={!isLive && !saved}
                />
              </View>
            )
          ) : (
            <Banner text="You’re viewing as a business. Hunters claim loot; you redeem their codes from the Redeem tab." />
          )}
          {claim.isError ? (
            <Banner tone="error" text={errorMessage(claim.error)} />
          ) : null}
          {save.isError ? (
            <Banner tone="error" text={errorMessage(save.error)} />
          ) : null}

          {item.description ? (
            <Text style={[font.body, styles.description]}>
              {item.description}
            </Text>
          ) : null}

          <View style={styles.place}>
            <Text style={font.label}>Where</Text>
            <Text style={font.body}>{item.location.name}</Text>
            <Text style={[font.small]}>{item.location.address}</Text>
            {distance != null ? (
              <Text style={font.small}>{formatDistance(distance)}</Text>
            ) : null}
            {item.outletInfo.hours ? (
              <Text style={font.small}>Hours: {item.outletInfo.hours}</Text>
            ) : null}
          </View>

          {item.terms ? (
            <View style={styles.place}>
              <Text style={font.label}>Terms</Text>
              <Text style={font.small}>{item.terms}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value, danger }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, danger && styles.danger]}>{value}</Text>
      <Text style={font.small}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: space.xxl },
  hero: { aspectRatio: 1, backgroundColor: colors.surfaceRaised },
  heroTop: { position: 'absolute', top: space.lg, left: space.lg },
  offerBadge: {
    position: 'absolute',
    left: space.lg,
    bottom: space.lg,
    backgroundColor: colors.accent,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.sm,
  },
  offerText: { color: colors.accentText, fontWeight: '900', fontSize: 22 },
  body: { padding: space.lg, gap: space.md },
  muted: { color: colors.textMuted },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
  price: { color: colors.text, fontSize: 26, fontWeight: '900' },
  original: {
    color: colors.textFaint,
    fontSize: 16,
    textDecorationLine: 'line-through',
  },
  stats: { flexDirection: 'row', gap: space.md },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.md,
    alignItems: 'center',
  },
  statValue: { color: colors.text, fontSize: 18, fontWeight: '900' },
  danger: { color: colors.danger },
  actions: { gap: space.sm },
  description: { color: colors.textMuted, lineHeight: 22 },
  place: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.md,
    gap: 2,
  },
});
