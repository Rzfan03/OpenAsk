import { ClerkProvider } from '@clerk/clerk-expo';
// @ts-ignore - subpath exports
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { registerForPushNotifications } from '../lib/notifications';
import { useNotifStore } from '../store/notifStore';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

export default function RootLayout() {
  const setPushToken = useNotifStore((s) => s.setPushToken);

  useEffect(() => {
    registerForPushNotifications().then((token) => {
      if (token) setPushToken(token);
    });
  }, []);

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <Stack screenOptions={{ headerShown: false }} />
    </ClerkProvider>
  );
}
