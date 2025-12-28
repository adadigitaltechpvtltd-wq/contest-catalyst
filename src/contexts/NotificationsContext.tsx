import React, { useEffect, useState, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { NotificationsContext, NotificationsContextType } from './NotificationsContextType';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
  user_id: string;
}

export const NotificationsProvider: React.FC<{ children: ReactNode; userId: string | null }> = ({ children, userId }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch initial unread count
  useEffect(() => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const { count, error } = await supabase
          .from('notifications')
          .select('*', { count: 'exact' })
          .eq('user_id', userId)
          .eq('is_read', false)
          .limit(0);

        if (!error && count !== null) {
          setUnreadCount(count);
        }
      } catch (err) {
        console.error('Failed to fetch unread count:', err);
      }
    };

    fetchUnreadCount();
  }, [userId]);

  // Subscribe to realtime notifications - simplified
  useEffect(() => {
    if (!userId) {
      // Clean up if user logs out
      if (subscriptionRef.current) {
        try {
          supabase.removeChannel(subscriptionRef.current);
        } catch (err) {
          console.error('Error removing channel:', err);
        }
        subscriptionRef.current = null;
      }
      return;
    }

    // Check if subscription already exists
    if (subscriptionRef.current) {
      console.log('Notification subscription already active for user:', userId);
      return;
    }

    console.log('Setting up realtime notifications for user:', userId);

    try {
      const channel = supabase
        .channel(`notifications-realtime-${userId}`, {
          config: {
            broadcast: { self: false },
          },
        })
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            console.log('New notification received:', payload);
            const notification = payload.new as Notification;

            try {
              toast({
                title: notification.title,
                description: notification.message,
              });
            } catch (err) {
              console.error('Error showing toast:', err);
            }

            setUnreadCount((prev) => prev + 1);
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            console.log('Notification updated:', payload);
            const notification = payload.new as Notification;
            const oldNotification = payload.old as Notification;

            if (!oldNotification.is_read && notification.is_read) {
              setUnreadCount((prev) => Math.max(0, prev - 1));
            }

            queryClient.invalidateQueries({ queryKey: ['notifications'] });
          }
        )
        .subscribe((status) => {
          console.log('Realtime notification subscription status:', status);
        });

      subscriptionRef.current = channel;
    } catch (err) {
      console.error('Error setting up notification subscription:', err);
    }

    return () => {
      console.log('Cleaning up realtime subscription for user:', userId);
      if (subscriptionRef.current) {
        try {
          supabase.removeChannel(subscriptionRef.current);
        } catch (err) {
          console.error('Error removing channel:', err);
        }
        subscriptionRef.current = null;
      }
    };
  }, [userId, toast, queryClient]);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (!error) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (!error) {
        setUnreadCount(0);
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  return (
    <NotificationsContext.Provider value={{ unreadCount, markAsRead, markAllAsRead, userId }}>
      {children}
    </NotificationsContext.Provider>
  );
};
