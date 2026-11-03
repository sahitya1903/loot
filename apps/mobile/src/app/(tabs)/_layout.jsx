import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { AlertsBell } from '@/components/AlertsBell';
import { isBusiness, useAuth } from '@/lib/auth';
import { colors, headerOptions } from '@/theme';

function icon(name) {
  function TabIcon({ color, size }) {
    return <Ionicons name={name} color={color} size={size} />;
  }
  return TabIcon;
}

// Personal accounts hunt (save, claim); business accounts manage and redeem. Each sees
// only its own tabs — the API enforces the same split.
export default function TabsLayout() {
  const { user } = useAuth();
  const pro = isBusiness(user);
  return (
    <Tabs
      screenOptions={{
        ...headerOptions,
        sceneStyle: { backgroundColor: colors.bg },
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: pro ? colors.pro : colors.accent,
        tabBarInactiveTintColor: colors.textFaint,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: icon('flash'),
          // Alerts are about follows, saves and claims, which only hunters have.
          headerRight: pro ? undefined : AlertsBell,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          tabBarIcon: icon('bookmark'),
          href: pro ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="claims"
        options={{
          title: 'Claims',
          tabBarIcon: icon('ticket'),
          href: pro ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="business"
        options={{
          title: 'My loot',
          tabBarIcon: icon('storefront'),
          href: pro ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="redeem"
        options={{
          title: 'Redeem',
          tabBarIcon: icon('qr-code'),
          href: pro ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: icon('person-circle') }}
      />
    </Tabs>
  );
}
