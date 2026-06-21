import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useChatStore, Conversation } from '../../store/chatStore';
import { Colors } from '../../constants/Colors';

export default function HistoryScreen() {
  const router = useRouter();
  const { conversations, setActiveConversation, deleteConversation } = useChatStore();

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Delete this conversation?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteConversation(id) },
    ]);
  };

  const renderItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity style={styles.item} onPress={() => { setActiveConversation(item.id); router.replace('/(app)/'); }}>
      <View style={styles.itemContent}>
        <Text style={styles.title} numberOfLines={1}>{item.title || 'Untitled'}</Text>
        <Text style={styles.meta}>
          {item.messages.length} messages · {new Date(item.updatedAt).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={18} color={Colors.textTertiary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
      </View>
      {conversations.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="time-outline" size={48} color={Colors.border} />
          <Text style={styles.emptyText}>No conversations yet</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(c) => c.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  item: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  itemContent: { flex: 1 },
  title: { fontSize: 15, fontWeight: '500', color: Colors.text },
  meta: { fontSize: 12, color: Colors.textTertiary, marginTop: 2 },
  deleteBtn: { padding: 8 },
  sep: { height: 1, backgroundColor: Colors.border, marginLeft: 16 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { color: Colors.textSecondary, fontSize: 16 },
});
