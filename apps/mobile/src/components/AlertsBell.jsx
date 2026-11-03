import Ionicons from '@expo/vector-icons/Ionicons';
import { listLootAlerts, queryKeys } from '@loot/shared';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, space } from '@/theme';

/** Unread alerts, shared by the bell and the Alerts screen. */
export const unreadAlertsKey = () => [...queryKeys.alerts(), 'unread'];

export function useUnreadAlerts() {
  const { data } = useQuery({
    queryKey: unreadAlertsKey(),
    queryFn: async () => (await listLootAlerts({ limit: 1 })).unreadCount,
    // Pushes refresh this right away; polling covers devices without push.
    refetchInterval: 60_000,
  });
  return data ?? 0;
}

/** Header button that opens the Alerts screen, with an unread badge. */
export function AlertsBell() {
  const unread = useUnreadAlerts();
  const label = unread > 9 ? '9+' : String(unread);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={unread ? `Alerts, ${unread} unread` : 'Alerts'}
      hitSlop={8}
      onPress={() => router.push('/alerts')}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Ionicons
        name={unread ? 'notifications' : 'notifications-outline'}
        size={24}
        color={colors.text}
      />
      {unread ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{label}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { marginRight: space.lg, padding: space.xs },
  pressed: { opacity: 0.6 },
  badge: {
    position: 'absolute',
    top: 0,
    right: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.accentText, fontSize: 11, fontWeight: '800' },
});
