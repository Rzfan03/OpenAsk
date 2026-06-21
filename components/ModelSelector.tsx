import { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../store/settingsStore';
import { PROVIDERS } from '../constants/providers';
import { fetchModelsForProvider } from '../lib/modelFetcher';
import { Colors } from '../constants/Colors';

type Props = { onClose: () => void };

export function ModelSelector({ onClose }: Props) {
  const {
    activeProviderId, providers, setActiveProvider,
    setSelectedModel, fetchedModels, setFetchedModels,
  } = useSettingsStore();
  const [refreshing, setRefreshing] = useState<string | null>(null);

  const allModels = (providerId: string) =>
    fetchedModels[providerId] ??
    PROVIDERS.find((p) => p.id === providerId)?.models ??
    [];

  const handleRefresh = async (providerId: string) => {
    const config = providers.find((p) => p.providerId === providerId);
    if (!config?.apiKey && providerId !== 'openrouter') return;
    setRefreshing(providerId);
    try {
      const models = await fetchModelsForProvider(providerId, config?.apiKey ?? '');
      setFetchedModels(providerId, models);
    } catch {}
    setRefreshing(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Model</Text>
        <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color={Colors.text} /></TouchableOpacity>
      </View>
      <ScrollView>
        {PROVIDERS.map((provider) => {
          const config = providers.find((p) => p.providerId === provider.id);
          const hasKey = !!config?.apiKey || provider.id === 'openrouter';
          const models = allModels(provider.id);
          const isRefreshing = refreshing === provider.id;
          return (
            <View key={provider.id}>
              <View style={styles.providerRow}>
                <Text style={styles.providerName}>{provider.name}</Text>
                <View style={styles.providerActions}>
                  {!hasKey && <Text style={styles.noKey}>No API key</Text>}
                  {hasKey && (
                    <TouchableOpacity onPress={() => handleRefresh(provider.id)} disabled={isRefreshing}>
                      {isRefreshing ? (
                        <ActivityIndicator size="small" color={Colors.primary} />
                      ) : (
                        <Ionicons name="refresh-outline" size={16} color={Colors.textSecondary} />
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              {models.map((model) => {
                const isActive = activeProviderId === provider.id && config?.selectedModel === model.id;
                return (
                  <TouchableOpacity
                    key={model.id}
                    style={[styles.modelRow, isActive && styles.modelRowActive]}
                    onPress={() => {
                      setActiveProvider(provider.id);
                      setSelectedModel(provider.id, model.id);
                      onClose();
                    }}
                    disabled={!hasKey}
                  >
                    <Text style={[styles.modelName, !hasKey && styles.disabled, isActive && styles.modelNameActive]}>
                      {model.name}
                    </Text>
                    {isActive && <Ionicons name="checkmark" size={16} color={Colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.background, borderRadius: 16, padding: 16, maxHeight: 480 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '600', color: Colors.text },
  providerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 4 },
  providerName: { fontSize: 12, fontWeight: '700', color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 },
  providerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  noKey: { fontSize: 11, color: Colors.error },
  modelRow: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modelRowActive: { backgroundColor: Colors.surface },
  modelName: { fontSize: 14, color: Colors.text },
  modelNameActive: { color: Colors.primary, fontWeight: '600' },
  disabled: { color: Colors.textTertiary },
});
