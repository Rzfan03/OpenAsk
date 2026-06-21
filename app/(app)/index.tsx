import { useRef, useState } from 'react';
import {
  View, FlatList, StyleSheet, Text, TouchableOpacity,
  Modal, SafeAreaView, StatusBar,
} from 'react-native';
import { DrawerToggleButton } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useChatStore, Message } from '../../store/chatStore';
import { useSettingsStore } from '../../store/settingsStore';
import { ChatBubble } from '../../components/ChatBubble';
import { MessageInput } from '../../components/MessageInput';
import { ModelSelector } from '../../components/ModelSelector';
import { streamChat } from '../../lib/aiStream';
import { formatFileForPrompt, AttachedFile } from '../../lib/filePicker';
import { PROVIDERS } from '../../constants/providers';
import { Colors } from '../../constants/Colors';

export default function ChatScreen() {
  const flatListRef = useRef<FlatList>(null);
  const [showModelSelector, setShowModelSelector] = useState(false);

  const {
    createConversation, addMessage, updateLastMessage,
    setStreaming, isStreaming, getActiveConversation, activeConversationId,
  } = useChatStore();
  const { activeProviderId, providers, getActiveProvider, fetchedModels } = useSettingsStore();

  const conversation = getActiveConversation();
  const messages = conversation?.messages ?? [];

  const activeConfig = getActiveProvider();
  const providerInfo = PROVIDERS.find((p) => p.id === activeProviderId);
  const fetchedModelList = fetchedModels[activeProviderId] ?? [];
  const fetchedName = fetchedModelList.find((m) => m.id === activeConfig?.selectedModel)?.name;
  const modelName = providerInfo?.models.find((m) => m.id === activeConfig?.selectedModel)?.name
    ?? fetchedName
    ?? activeConfig?.selectedModel
    ?? 'Select Model';

  const handleSend = async (text: string, files: AttachedFile[]) => {
    let convId = activeConversationId;
    if (!convId) {
      convId = createConversation(activeProviderId, activeConfig?.selectedModel ?? '');
    }

    let content = text;
    files.forEach((f) => { content += formatFileForPrompt(f); });

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    addMessage(convId, userMsg);

    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };
    addMessage(convId, aiMsg);
    setStreaming(true);

    const allMsgs = [...(useChatStore.getState().conversations.find((c) => c.id === convId)?.messages ?? [])];
    const apiMessages = allMsgs
      .slice(0, -1)
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    let accumulated = '';
    await streamChat(
      apiMessages,
      (chunk) => {
        accumulated += chunk;
        updateLastMessage(convId!, accumulated);
      },
      () => setStreaming(false),
      (err) => {
        updateLastMessage(convId!, `Error: ${err}`);
        setStreaming(false);
      }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <DrawerToggleButton />
        </View>
        <TouchableOpacity style={styles.modelBtn} onPress={() => setShowModelSelector(true)}>
          <Text style={styles.modelBtnText} numberOfLines={1}>{modelName}</Text>
          <Ionicons name="chevron-down" size={14} color={Colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => useChatStore.getState().setActiveConversation(null)}>
          <Ionicons name="create-outline" size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      {messages.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>OpenAsk</Text>
          <Text style={styles.emptySubtitle}>How can I help you today?</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <ChatBubble role={item.role} content={item.content} />}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      <MessageInput onSend={handleSend} disabled={isStreaming} />

      <Modal visible={showModelSelector} transparent animationType="slide">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowModelSelector(false)}>
          <View style={styles.sheet}>
            <ModelSelector onClose={() => setShowModelSelector(false)} />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerLeft: { marginLeft: -8 },
  modelBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, maxWidth: 200 },
  modelBtnText: { fontSize: 13, fontWeight: '500', color: Colors.text },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 28, fontWeight: '700', color: Colors.text },
  emptySubtitle: { fontSize: 16, color: Colors.textSecondary },
  list: { paddingVertical: 12 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 32 },
});
