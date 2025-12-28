import { createContext } from 'react';

export interface NotificationsContextType {
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  userId: string | null;
}

export const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);
