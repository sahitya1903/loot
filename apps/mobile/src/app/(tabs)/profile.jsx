import { getMyBusiness, queryKeys } from '@loot/shared';
import { useQuery } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Banner, Button } from '@/components/ui';
import { isBusiness, useAuth } from '@/lib/auth';
import { errorMessage } from '@/lib/errors';
import { categoryLabel } from '@/lib/labels';
import { useFeedLocation } from '@/lib/location';
import { useRealtimeStatus } from '@/lib/realtime';
import { colors, font, radius, space } from '@/theme';

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={font.label}>{label}</Text>
      <Text style={[font.body, styles.value]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export default function Profile() {
  const { user, signOut, refreshUser } = useAuth();
  const { location, radiusKm } = useFeedLocation();
  const live = useRealtimeStatus();
  const pro = isBusiness(user);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const business = useQuery({
    queryKey: queryKeys.business.mine(),
    queryFn: getMyBusiness,
    enabled: pro,
  });

  async function refresh() {
    setRefreshing(true);
    setError(null);
    try {
      await Promise.all([refreshUser(), pro ? business.refetch() : null]);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor={colors.accent}
        />
      }
    >
      {!user ? (
        <Banner tone="error" text="You’re offline. Pull down to retry." />
      ) : null}
      {error ? <Banner tone="error" text={error} /> : null}

      <View style={[styles.card, pro && styles.proCard]}>
        <Text style={font.heading}>
          {user?.name || user?.phoneNumber || 'Your account'}
        </Text>
        <Text style={[styles.badge, pro && styles.proBadge]}>
          {pro ? 'BUSINESS' : 'HUNTER'}
        </Text>
        <Row label="Phone" value={user?.phoneNumber ?? '—'} />
        {!pro ? (
          <Row label="Claims" value={String(user?.claimsCount ?? 0)} />
        ) : null}
        {!pro ? (
          <Row label="Saved" value={String(user?.savesCount ?? 0)} />
        ) : null}
      </View>

      {pro && business.data ? (
        <View style={[styles.card, styles.proCard]}>
          <Text style={font.heading}>
            {business.data.business.businessName}
          </Text>
          <Text style={font.small}>
            @{business.data.business.username} ·{' '}
            {categoryLabel(business.data.business.category)}
          </Text>
          <Row
            label="Live loot"
            value={String(business.data.business.lootCount)}
          />
          <Row
            label="Claims"
            value={String(business.data.business.totalClaimsCount)}
          />
          <Row
            label="Followers"
            value={String(business.data.business.followersCount)}
          />
          {business.data.business.branchLocations.map((b) => (
            <Row
              key={b.branchId}
              label="Branch"
              value={`${b.name} · ${b.address}`}
            />
          ))}
        </View>
      ) : null}

      <View style={styles.card}>
        <Row
          label="Feed location"
          value={location ? `${location.label} · ${radiusKm} km` : 'Not set'}
        />
        <Row
          label="Live updates"
          value={live ? 'Connected' : 'Offline, refreshing periodically'}
        />
        <Link href="/location" asChild>
          <Button title="Change location" variant="secondary" />
        </Link>
      </View>

      {user && !pro ? (
        <View style={styles.card}>
          <Text style={font.heading}>Run a business?</Text>
          <Text style={[font.body, styles.muted]}>
            Post loot for people nearby. Business accounts manage loot and
            redeem codes, and can’t claim loot.
          </Text>
          <Button
            title="Set up a business account"
            variant="pro"
            onPress={() => router.push('/business/onboard')}
          />
        </View>
      ) : null}

      <Button title="Sign out" variant="secondary" onPress={signOut} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  proCard: { borderColor: colors.pro },
  badge: {
    alignSelf: 'flex-start',
    color: colors.accent,
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 1,
  },
  proBadge: { color: colors.pro },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md },
  value: { flexShrink: 1, textAlign: 'right' },
  muted: { color: colors.textMuted },
});
