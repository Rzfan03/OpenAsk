import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PROVIDERS } from '../constants/providers';

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: { name: string; type: string; content: string }[];
  timestamp: number;
};

export type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  providerId: string;
  modelId: string;
  createdAt: number;
  updatedAt: number;
};

type ChatStore = {
  conversations: Conversation[];
  activeConversationId: string | null;
  isStreaming: boolean;
  setActiveConversation: (id: string | null) => void;
  createConversation: (providerId: string, modelId: string) => string;
  addMessage: (conversationId: string, message: Message) => void;
  updateLastMessage: (conversationId: string, content: string) => void;
  deleteConversation: (id: string) => void;
  setStreaming: (val: boolean) => void;
  getActiveConversation: () => Conversation | null;
};

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      isStreaming: false,

      setActiveConversation: (id) => set({ activeConversationId: id }),

      createConversation: (providerId, modelId) => {
        const id = Date.now().toString();
        const conv: Conversation = {
          id,
          title: 'New Chat',
          messages: [],
          providerId,
          modelId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((s) => ({ conversations: [conv, ...s.conversations], activeConversationId: id }));
        return id;
      },

      addMessage: (conversationId, message) =>
        set((s) => ({
          conversations: s.conversations.map((c) => {
            if (c.id !== conversationId) return c;
            const msgs = [...c.messages, message];
            const title =
              c.messages.length === 0 && message.role === 'user'
                ? message.content.slice(0, 40)
                : c.title;
            return { ...c, messages: msgs, title, updatedAt: Date.now() };
          }),
        })),

      updateLastMessage: (conversationId, content) =>
        set((s) => ({
          conversations: s.conversations.map((c) => {
            if (c.id !== conversationId) return c;
            const msgs = [...c.messages];
            if (msgs.length > 0) msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content };
            return { ...c, messages: msgs };
          }),
        })),

      deleteConversation: (id) =>
        set((s) => ({
          conversations: s.conversations.filter((c) => c.id !== id),
          activeConversationId: s.activeConversationId === id ? null : s.activeConversationId,
        })),

      setStreaming: (val) => set({ isStreaming: val }),

      getActiveConversation: () => {
        const { conversations, activeConversationId } = get();
        return conversations.find((c) => c.id === activeConversationId) ?? null;
      },
    }),
    { name: 'openask-chat', storage: createJSONStorage(() => AsyncStorage) }
  )
);
