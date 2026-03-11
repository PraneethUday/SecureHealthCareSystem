"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  X,
  Calendar,
  UserX,
  FileText,
  Pill,
  AlertCircle,
} from "lucide-react";
import { Notification, NotificationType, UserRole } from "@/lib/database.types";

interface NotificationBellProps {
  userId: string;
  userRole: UserRole;
}

const typeIcons: Record<NotificationType, React.ReactNode> = {
  appointment_booked: <Calendar className="w-4 h-4 text-green-500" />,
  appointment_cancelled: <X className="w-4 h-4 text-red-500" />,
  appointment_reminder: <Calendar className="w-4 h-4 text-blue-500" />,
  appointment_updated: <Calendar className="w-4 h-4 text-yellow-500" />,
  access_granted: <Check className="w-4 h-4 text-green-500" />,
  access_revoked: <UserX className="w-4 h-4 text-red-500" />,
  report_uploaded: <FileText className="w-4 h-4 text-blue-500" />,
  prescription_created: <Pill className="w-4 h-4 text-purple-500" />,
  security_alert: <AlertCircle className="w-4 h-4 text-orange-500" />,
  breach_notification: <AlertCircle className="w-4 h-4 text-red-600" />,
  system: <AlertCircle className="w-4 h-4 text-gray-500" />,
  general: <Bell className="w-4 h-4 text-gray-500" />,
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function NotificationBell({
  userId,
  userRole,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/notifications?userId=${userId}&userRole=${userRole}&limit=20`,
      );
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, userRole]);

  // Initial fetch and polling
  useEffect(() => {
    fetchNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mark single notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: "POST",
      });
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await fetch(`/api/notifications/mark-all-read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, userRole }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Notifications
              </h3>
              {notifications.length > 0 && (
                <span className="px-1.5 py-0.5 text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded">
                  {notifications.length}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List - Fixed height with scroll */}
          <div className="h-[350px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
                <Bell className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    onClick={() =>
                      !notification.is_read && markAsRead(notification.id)
                    }
                    className={`px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                      !notification.is_read
                        ? "bg-blue-50/50 dark:bg-blue-900/10"
                        : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          {typeIcons[notification.type] || typeIcons.general}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm font-medium truncate ${
                              !notification.is_read
                                ? "text-slate-900 dark:text-white"
                                : "text-slate-600 dark:text-slate-300"
                            }`}
                          >
                            {notification.title}
                          </p>
                          {!notification.is_read && (
                            <span className="flex-shrink-0 w-1.5 h-1.5 mt-1.5 bg-blue-500 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          {notification.created_at &&
                            formatTimeAgo(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
