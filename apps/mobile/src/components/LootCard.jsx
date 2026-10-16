import { formatDistance } from '@loot/shared';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Countdown } from '@/components/Countdown';
import { useCountersFor } from '@/lib/realtime';
import { colors, radius, space } from '@/theme';

export function formatPrice(amount, currency = 'INR') {
  if (amount == null) return null;
  if (amount === 0) return 'Free';
  return currency === 'INR'
    ? `₹${amount.toLocaleString('en-IN')}`
    : `${currency} ${amount}`;
}

export function stockLabel(remaining) {
  if (remaining == null) return null;
  if (remaining === 0) return 'Sold out';
  return remaining <= 5 ? `Only ${remaining} left` : `${remaining} left`;
}

/** Media-first feed card. Live counters override the feed's snapshot while watched. */
export function LootCard({ item, footer }) {
  const live = useCountersFor(item.id);
  const remaining = live ? live.remainingQuantity : item.remainingQuantity;
  const claims = live ? live.claimCount : item.claimCount;
  const status = live?.status ?? item.status;
  const stock = stockLabel(remaining);
  const price = formatPrice(item.offerPrice, item.currency);
  const original =
    item.originalPrice != null && item.originalPrice !== item.offerPrice
      ? formatPrice(item.originalPrice)
      : null;

  return (
    <Link href={`/loot/${item.id}`} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${item.title} at ${item.businessName}`}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        <View style={styles.media}>
          {item.thumbnailUrl || item.primaryMediaUrl ? (
            <Image
              source={{ uri: item.thumbnailUrl ?? item.primaryMediaUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={150}
              recyclingKey={item.id}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.placeholder]} />
          )}
          <View style={styles.overlayTop}>
            <Countdown expiryAt={item.expiryAt} />
            {item.distanceKm != null ? (
              <Text style={styles.distance}>
                {formatDistance(item.distanceKm)}
              </Text>
            ) : null}
          </View>
          {item.offerText ? (
            <View style={styles.offerBadge}>
              <Text style={styles.offerText} numberOfLines={1}>
                {item.offerText}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.business} numberOfLines={1}>
            {item.businessName}
            {item.businessVerified ? ' ✓' : ''} · {item.branchName}
          </Text>
          <View style={styles.metaRow}>
            {price ? <Text style={styles.price}>{price}</Text> : null}
            {original ? <Text style={styles.original}>{original}</Text> : null}
            <View style={styles.spacer} />
            {stock ? (
              <Text style={[styles.meta, remaining === 0 && styles.soldOut]}>
                {stock}
              </Text>
            ) : null}
            <Text style={styles.meta}>{claims} claimed</Text>
          </View>
          {status === 'expired' || status === 'archived' ? (
            <Text style={styles.ended}>No longer available</Text>
          ) : null}
          {footer}
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.9 },
  media: { aspectRatio: 4 / 3, backgroundColor: colors.surfaceRaised },
  placeholder: { backgroundColor: colors.surfaceRaised },
  overlayTop: {
    position: 'absolute',
    top: space.md,
    left: space.md,
    right: space.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distance: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  offerBadge: {
    position: 'absolute',
    left: space.md,
    bottom: space.md,
    backgroundColor: colors.accent,
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.sm,
    maxWidth: '85%',
  },
  offerText: { color: colors.accentText, fontWeight: '900', fontSize: 16 },
  body: { padding: space.md, gap: 4 },
  title: { color: colors.text, fontSize: 18, fontWeight: '800' },
  business: { color: colors.textMuted, fontSize: 13 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: 4,
  },
  price: { color: colors.text, fontWeight: '900', fontSize: 16 },
  original: {
    color: colors.textFaint,
    textDecorationLine: 'line-through',
    fontSize: 13,
  },
  spacer: { flex: 1 },
  meta: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  soldOut: { color: colors.danger },
  ended: { color: colors.textFaint, fontSize: 13, marginTop: 4 },
});
