import '@/lib/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/lib/auth';
import { LocationProvider, useFeedLocation } from '@/lib/location';
import { RealtimeProvider } from '@/lib/realtime';
import { colors, headerOptions } from '@/theme';

SplashScreen.preventAutoHideAsync();

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: 1 },
      mutations: { retry: 0 },
    },
  });
}

/** Keeps the splash up until the saved session and location have been read. */
function SplashController() {
  const { status } = useAuth();
  const { ready } = useFeedLocation();
  useEffect(() => {
    if (status !== 'loading' && ready) SplashScreen.hide();
  }, [status, ready]);
  return null;
}

function RootNavigator() {
  const { status } = useAuth();
  const signedIn = status === 'signedIn';
  return (
    <RealtimeProvider enabled={signedIn}>
      <Stack screenOptions={headerOptions}>
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="loot/[id]" options={{ title: '' }} />
          <Stack.Screen
            name="location"
            options={{ title: 'Where to look', presentation: 'modal' }}
          />
          <Stack.Screen
            name="business/onboard"
            options={{ title: 'Set up your business' }}
          />
          <Stack.Screen
            name="business/new-loot"
            options={{ title: 'New loot' }}
          />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    </RealtimeProvider>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(makeQueryClient);
  return (
    <SafeAreaProvider style={{ backgroundColor: colors.bg }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <LocationProvider>
            <SplashController />
            <RootNavigator />
            <StatusBar style="light" />
          </LocationProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
