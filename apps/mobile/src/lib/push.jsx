// Push notifications: sends this device's Expo push token to the API once signed in, removes it
// before sign-out, refreshes the alerts inbox when one arrives, and opens the loot when one is
// tapped. Push is optional: if permission is denied or the build has no FCM credentials,
// the Alerts screen still lists everything.

import {
  markAlertRead,
  queryKeys,
  registerPushToken,
  unregisterPushToken,
} from '@loot/shared';
import { useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { colors } from '@/theme';

// Must match ANDROID_CHANNEL_ID in apps/api/src/modules/alerts/expoPush.js.
const CHANNEL_ID = 'loot';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** The token this app registered for the current session, so sign-out can remove it. */
let registeredToken = null;

async function getPushToken({ ask }) {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Loot alerts',
      importance: AndroidImportance.HIGH,
      lightColor: colors.accent,
    });
  }
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted' && ask)
    ({ status } = await Notifications.requestPermissionsAsync());
  if (status !== 'granted') return null;
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  return data;
}

/** Asks for permission (once; Android 13+ shows a prompt) and registers this device. */
async function registerForPush() {
  try {
    const token = await getPushToken({ ask: true });
    if (!token) return;
    await registerPushToken({ token, platform: Platform.OS });
    registeredToken = token;
  } catch (err) {
    // No FCM credentials in this build, emulator without Play services, or offline.
    if (__DEV__) console.info('Push registration skipped:', err?.message);
  }
}

/** Stops pushes to this device. Called before signing out; never blocks it. */
export async function unregisterForPush() {
  try {
    const token = registeredToken ?? (await getPushToken({ ask: false }));
    if (token) await unregisterPushToken({ token });
  } catch {
    // The API drops tokens Expo reports as dead, and a token moves on the next sign-in.
  }
  registeredToken = null;
}

/** Mount once inside the signed-in navigator. */
export function PushController({ enabled }) {
  const queryClient = useQueryClient();
  const response = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (enabled) registerForPush();
  }, [enabled]);

  // A push arrived while the app is open: refresh the inbox and the bell.
  useEffect(() => {
    if (!enabled) return;
    const sub = Notifications.addNotificationReceivedListener(() =>
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts() }),
    );
    return () => sub.remove();
  }, [enabled, queryClient]);

  // Tapped, including the tap that launched the app. Waits until the session is restored.
  useEffect(() => {
    if (!enabled || !response) return;
    if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER)
      return;
    const { lootId, alertId } =
      response.notification.request.content.data ?? {};
    Notifications.clearLastNotificationResponse();
    if (alertId)
      markAlertRead(alertId)
        .then(() =>
          queryClient.invalidateQueries({ queryKey: queryKeys.alerts() }),
        )
        .catch(() => {});
    router.push(lootId ? `/loot/${lootId}` : '/alerts');
  }, [enabled, response, queryClient]);

  return null;
}
