import { View, Text, StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Colors } from '../constants/Colors';

type Props = {
  role: 'user' | 'assistant';
  content: string;
};

const markdownStyles = {
  body: { color: Colors.aiText, fontSize: 15, lineHeight: 22 },
  code_inline: { backgroundColor: Colors.codeBlock, borderRadius: 4, paddingHorizontal: 4, fontFamily: 'monospace', fontSize: 13 },
  fence: { backgroundColor: Colors.codeBlock, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: Colors.codeBorder },
  code_block: { backgroundColor: Colors.codeBlock, borderRadius: 8, padding: 12, fontFamily: 'monospace', fontSize: 13 },
  blockquote: { borderLeftWidth: 3, borderLeftColor: Colors.primary, paddingLeft: 12, opacity: 0.8 },
  bullet_list_icon: { color: Colors.primary },
};

export function ChatBubble({ role, content }: Props) {
  const isUser = role === 'user';

  return (
    <View style={[styles.wrapper, isUser ? styles.userWrapper : styles.aiWrapper]}>
      {!isUser && <Text style={styles.aiLabel}>AI</Text>}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        {isUser ? (
          <Text style={styles.userText}>{content}</Text>
        ) : (
          <Markdown style={markdownStyles}>{content}</Markdown>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginVertical: 4, paddingHorizontal: 16 },
  userWrapper: { alignItems: 'flex-end' },
  aiWrapper: { alignItems: 'flex-start' },
  aiLabel: { fontSize: 11, color: Colors.textTertiary, marginBottom: 2, marginLeft: 4 },
  bubble: { maxWidth: '85%', borderRadius: 16, padding: 12 },
  userBubble: { backgroundColor: Colors.userBubble, borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: Colors.aiBubble, borderBottomLeftRadius: 4 },
  userText: { color: Colors.userBubbleText, fontSize: 15, lineHeight: 22 },
});
