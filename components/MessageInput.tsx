import { useState, useRef } from 'react';
import {
  View, TextInput, TouchableOpacity, StyleSheet,
  Text, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { pickFile, AttachedFile } from '../lib/filePicker';

type Props = {
  onSend: (text: string, files: AttachedFile[]) => void;
  disabled?: boolean;
};

export function MessageInput({ onSend, disabled }: Props) {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [picking, setPicking] = useState(false);

  const handleSend = () => {
    if (!text.trim() && files.length === 0) return;
    onSend(text.trim(), files);
    setText('');
    setFiles([]);
  };

  const handlePickFile = async () => {
    setPicking(true);
    const file = await pickFile();
    if (file) setFiles((prev) => [...prev, file]);
    setPicking(false);
  };

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  return (
    <View style={styles.container}>
      {files.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fileRow}>
          {files.map((f, i) => (
            <View key={i} style={styles.fileChip}>
              <Ionicons name="document-outline" size={14} color={Colors.primary} />
              <Text style={styles.fileName} numberOfLines={1}>{f.name}</Text>
              <TouchableOpacity onPress={() => removeFile(i)}>
                <Ionicons name="close" size={14} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.row}>
        <TouchableOpacity onPress={handlePickFile} disabled={picking} style={styles.iconBtn}>
          {picking ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Ionicons name="attach" size={22} color={Colors.textSecondary} />
          )}
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Message OpenAsk..."
          placeholderTextColor={Colors.textTertiary}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={8000}
        />

        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() && files.length === 0) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={disabled || (!text.trim() && files.length === 0)}
        >
          <Ionicons name="arrow-up" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.border, paddingHorizontal: 12, paddingVertical: 8, paddingBottom: 24 },
  fileRow: { marginBottom: 8 },
  fileChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.surface, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, marginRight: 6, borderWidth: 1, borderColor: Colors.border, maxWidth: 150 },
  fileName: { fontSize: 12, color: Colors.text, flex: 1 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  iconBtn: { padding: 6, justifyContent: 'center', alignItems: 'center', width: 36, height: 36 },
  input: { flex: 1, backgroundColor: Colors.surface, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 15, color: Colors.text, maxHeight: 120, borderWidth: 1, borderColor: Colors.border },
  sendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: Colors.border },
});
