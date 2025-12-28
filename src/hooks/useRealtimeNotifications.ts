import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

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

export const useRealtimeNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch initial unread count
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const fetchUnreadCount = async () => {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .eq("is_read", false)
        .limit(0);

      if (!error && count !== null) {
        setUnreadCount(count);
      }
    };

    fetchUnreadCount();
  }, [user?.id]);

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!user?.id) return;

    // If there's already an active subscription for this user, don't create a new one
    if (subscriptionRef.current) {
      console.log("Subscription already active for user:", user.id);
      return;
    }

    console.log("Setting up realtime notifications for user:", user.id);

    const channel = supabase
      .channel(`notifications-realtime-${user.id}`, {
        config: {
          broadcast: { self: false },
          presence: { key: `notification-listener-${user.id}` },
        },
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("New notification received:", payload);
          const notification = payload.new as Notification;

          toast({
            title: notification.title,
            description: notification.message,
          });

          setUnreadCount((prev) => prev + 1);
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Notification updated:", payload);
          const notification = payload.new as Notification;
          const oldNotification = payload.old as Notification;

          if (!oldNotification.is_read && notification.is_read) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }

          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }
      )
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
      });

    subscriptionRef.current = channel;

    return () => {
      console.log("Cleaning up realtime subscription for user:", user.id);
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [user?.id, toast, queryClient]);

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (!error) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (!error) {
      setUnreadCount(0);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  };

  return {
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
};
// Note: Notification creation is now restricted to admin/moderator roles only via RLS
// Use server-side Edge Functions with service role key for system notifications
