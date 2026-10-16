import { countdown } from '@loot/shared';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, space } from '@/theme';

const TIER_COLOR = {
  urgent: colors.urgent,
  warm: colors.warm,
  normal: colors.normal,
  expired: colors.expired,
};

/** Ticks every second under an hour, every 30s otherwise. */
function useCountdown(expiryAt) {
  const [, setTick] = useState(0);
  const value = countdown(expiryAt);
  const everyMs =
    value.tier === 'expired' ? null : value.totalSeconds < 3600 ? 1000 : 30_000;
  useEffect(() => {
    if (!everyMs) return undefined;
    const id = setInterval(() => setTick((tick) => tick + 1), everyMs);
    return () => clearInterval(id);
  }, [everyMs]);
  return value;
}

/** Urgency pill: colour follows @loot/shared urgencyTier. */
export function Countdown({ expiryAt, large = false }) {
  const { label, tier } = useCountdown(expiryAt);
  const color = TIER_COLOR[tier];
  return (
    <View
      accessibilityLabel={tier === 'expired' ? 'Expired' : `Ends in ${label}`}
      style={[styles.pill, { borderColor: color }, large && styles.large]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }, large && styles.largeText]}>
        {tier === 'expired'
          ? 'Expired'
          : tier === 'urgent'
            ? `Ending · ${label}`
            : label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  large: { paddingHorizontal: space.md, paddingVertical: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  text: { fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] },
  largeText: { fontSize: 15 },
});
