import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, SafeAreaView, Switch, Alert,
} from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../../store/settingsStore';
import { useNotifStore } from '../../store/notifStore';
import { PROVIDERS } from '../../constants/providers';
import { fetchModelsForProvider } from '../../lib/modelFetcher';
import { Colors } from '../../constants/Colors';

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const { providers, setApiKey, activeProviderId, setActiveProvider, setFetchedModels } = useSettingsStore();
  const { notificationsEnabled, setEnabled } = useNotifStore();
  const [visible, setVisible] = useState<Record<string, boolean>>({});

  const toggleVisible = (id: string) => setVisible((s) => ({ ...s, [id]: !s[id] }));

  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const handleApiKeyChange = (providerId: string, key: string) => {
    setApiKey(providerId, key);
    if (debounceTimers.current[providerId]) {
      clearTimeout(debounceTimers.current[providerId]);
    }
    debounceTimers.current[providerId] = setTimeout(async () => {
      if (key) {
        try {
          const models = await fetchModelsForProvider(providerId, key);
          setFetchedModels(providerId, models);
        } catch {}
      }
    }, 500);
  };

  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(clearTimeout);
    };
  }, []);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Account */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="person-circle-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.rowText}>{user?.primaryEmailAddress?.emailAddress ?? 'User'}</Text>
          </View>
          <View style={styles.sep} />
          <TouchableOpacity style={styles.row} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color={Colors.error} />
            <Text style={[styles.rowText, { color: Colors.error }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Notifications */}
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="notifications-outline" size={20} color={Colors.textSecondary} />
            <Text style={[styles.rowText, { flex: 1 }]}>Push Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setEnabled}
              trackColor={{ true: Colors.primary }}
            />
          </View>
        </View>

        {/* API Keys */}
        <Text style={styles.sectionTitle}>API Keys</Text>
        {PROVIDERS.map((provider) => {
          const config = providers.find((p) => p.providerId === provider.id);
          const apiKey = config?.apiKey ?? '';
          const isActive = provider.id === activeProviderId;
          return (
            <View key={provider.id} style={[styles.card, styles.providerCard]}>
              <TouchableOpacity
                style={styles.providerHeader}
                onPress={() => setActiveProvider(provider.id)}
              >
                <Text style={styles.providerName}>{provider.name}</Text>
                {isActive && (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>Active</Text>
                  </View>
                )}
              </TouchableOpacity>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder={`${provider.name} API Key`}
                  placeholderTextColor={Colors.textTertiary}
                  value={apiKey}
                  onChangeText={(v) => handleApiKeyChange(provider.id, v)}
                  secureTextEntry={!visible[provider.id]}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={() => toggleVisible(provider.id)} style={styles.eyeBtn}>
                  <Ionicons
                    name={visible[provider.id] ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={Colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <Text style={styles.hint}>
          API keys are stored locally on your device only.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  scroll: { padding: 16, paddingBottom: 40, gap: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 12, marginBottom: 4 },
  card: { backgroundColor: Colors.surface, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  providerCard: { padding: 12, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  rowText: { fontSize: 15, color: Colors.text },
  sep: { height: 1, backgroundColor: Colors.border },
  providerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  providerName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  activeBadge: { backgroundColor: `${Colors.primary}20`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  activeBadgeText: { fontSize: 11, color: Colors.primary, fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  input: { flex: 1, backgroundColor: Colors.background, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: Colors.text, borderWidth: 1, borderColor: Colors.border, fontFamily: 'monospace' },
  eyeBtn: { padding: 8 },
  hint: { fontSize: 12, color: Colors.textTertiary, textAlign: 'center', marginTop: 8 },
});
