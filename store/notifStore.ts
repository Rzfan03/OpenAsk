import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type NotifStore = {
  pushToken: string | null;
  notificationsEnabled: boolean;
  setPushToken: (token: string) => void;
  setEnabled: (val: boolean) => void;
};

export const useNotifStore = create<NotifStore>()(
  persist(
    (set) => ({
      pushToken: null,
      notificationsEnabled: true,
      setPushToken: (token) => set({ pushToken: token }),
      setEnabled: (val) => set({ notificationsEnabled: val }),
    }),
    { name: 'openask-notif', storage: createJSONStorage(() => AsyncStorage) }
  )
);
