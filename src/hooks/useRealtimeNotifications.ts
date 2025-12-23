import { useEffect, useState } from "react";
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

  // Fetch initial unread count
  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (!error && count !== null) {
        setUnreadCount(count);
      }
    };

    fetchUnreadCount();
  }, [user]);

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!user) return;

    console.log("Setting up realtime notifications for user:", user.id);

    const channel = supabase
      .channel("notifications-realtime")
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

          // Show toast for new notification
          toast({
            title: notification.title,
            description: notification.message,
          });

          // Update unread count
          setUnreadCount((prev) => prev + 1);

          // Invalidate notifications query to refresh the list
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

          // Update unread count if read status changed
          if (!oldNotification.is_read && notification.is_read) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }

          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }
      )
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
      });

    return () => {
      console.log("Cleaning up realtime subscription");
      supabase.removeChannel(channel);
    };
  }, [user, toast, queryClient]);

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

// Helper function to create notifications (for use in other parts of the app)
export const createNotification = async ({
  userId,
  title,
  message,
  type = "info",
  link,
}: {
  userId: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
}) => {
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type,
    link,
  });

  if (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};
