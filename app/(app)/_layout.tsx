import { useAuth, useUser } from '@clerk/clerk-expo';
import { Redirect, useRouter } from 'expo-router';
import { Drawer, DrawerContentScrollView, DrawerItemList } from 'expo-router/drawer';
import { Image, Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

function CustomDrawerContent(props: any) {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView {...props}>
        <View style={drawerStyles.profile}>
          {user?.imageUrl ? (
            <Image source={{ uri: user.imageUrl }} style={drawerStyles.avatar} />
          ) : (
            <View style={drawerStyles.avatarPlaceholder}>
              <Ionicons name="person" size={24} color={Colors.primary} />
            </View>
          )}
          <Text style={drawerStyles.name}>{user?.fullName ?? 'User'}</Text>
          <Text style={drawerStyles.email}>{user?.primaryEmailAddress?.emailAddress ?? ''}</Text>
        </View>
        <View style={drawerStyles.sep} />
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      <TouchableOpacity
        style={drawerStyles.signOut}
        onPress={() => signOut()}
      >
        <Ionicons name="log-out-outline" size={20} color={Colors.error} />
        <Text style={drawerStyles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const drawerStyles = StyleSheet.create({
  profile: { padding: 20, alignItems: 'center', gap: 4 },
  avatar: { width: 56, height: 56, borderRadius: 28, marginBottom: 4 },
  avatarPlaceholder: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 4, borderWidth: 1, borderColor: Colors.border },
  name: { fontSize: 16, fontWeight: '600', color: Colors.text },
  email: { fontSize: 12, color: Colors.textTertiary },
  sep: { height: 1, backgroundColor: Colors.border, marginVertical: 8 },
  signOut: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 20, borderTopWidth: 1, borderTopColor: Colors.border },
  signOutText: { color: Colors.error, fontSize: 15, fontWeight: '500' },
});

export default function AppLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />;

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        drawerActiveTintColor: Colors.primary,
        drawerInactiveTintColor: Colors.text,
        drawerActiveBackgroundColor: `${Colors.primary}15`,
        drawerLabelStyle: { fontSize: 15, fontWeight: '500' },
        drawerItemStyle: { borderRadius: 8, marginHorizontal: 12 },
        drawerStyle: { backgroundColor: Colors.background, width: 280 },
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: 'Chat',
          drawerIcon: ({ color, size }) => <Ionicons name="chatbubble-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="history"
        options={{
          title: 'History',
          drawerIcon: ({ color, size }) => <Ionicons name="time-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          title: 'Settings',
          drawerIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="personality"
        options={{
          title: 'Personality',
          drawerIcon: ({ color, size }) => <Ionicons name="color-wand-outline" size={size} color={color} />,
        }}
      />
    </Drawer>
  );
}
