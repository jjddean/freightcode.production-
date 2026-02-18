// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";

interface Notification {
  _id: string;
  id: string; // Add mapped ID for frontend convenience
  title: string;
  message: string;
  type: string;
  priority: string;
  createdAt: number;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
}

interface NotificationCenterProps {
  className?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');
  const navigate = useNavigate();

  // Real Data
  const rawNotifications = useQuery(api.notifications.list, { limit: 50 });
  const dbUnreadCount = useQuery(api.notifications.getUnreadCount) || 0;
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);

  // Tracks notifications already toasted to avoid duplicates
  const toastedIds = useRef<Set<string>>(new Set());
  const isInitialLoad = useRef(true);
  const mountTime = useRef(Date.now());

  // Normalize data format
  const notifications = (rawNotifications || []).map((n: any) => ({
    ...n,
    id: n._id, // map _id to id for compatibility
    timestamp: new Date(n.createdAt).toISOString()
  }));

  // Real-time toast alerts for new unread notifications
  useEffect(() => {
    if (Array.isArray(rawNotifications)) {
      if (isInitialLoad.current) {
        // Just Mark existing ones as "seen" on first load
        rawNotifications.forEach(n => toastedIds.current.add(n._id));
        isInitialLoad.current = false;
      } else {
        // Check for new unread notifications
        rawNotifications.forEach(n => {
          // Robust suppression: Only toast if:
          // 1. It's unread
          // 2. We haven't toasted it in this session
          // 3. It was created AFTER the component mounted (with a 2s safety buffer for clock skew)
          const isFresh = n.createdAt > (mountTime.current - 2000);

          if (!n.read && !toastedIds.current.has(n._id) && isFresh) {
            toastedIds.current.add(n._id);
            toast.info(n.title, {
              description: n.message,
              duration: 5000,
            });
          }
        });
      }
    }
  }, [rawNotifications, navigate]);

  const unreadCount = dbUnreadCount;
  const urgentCount = notifications.filter((n: any) => n.priority === 'urgent' && !n.read).length;

  const filteredNotifications = notifications.filter((notification: any) => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'urgent':
        return notification.priority === 'urgent';
      default:
        return true;
    }
  });

  const markAsRead = (id: string) => {
    markRead({ notificationId: id as any });
  };

  const handleMarkAllRead = () => {
    markAllRead({});
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'shipment': return '🚢';
      case 'payment': return '💰';
      case 'document': return '📄';
      case 'system': return '⚙️';
      case 'alert': return '⚠️';
      default: return '📢';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-500 bg-red-50';
      case 'high': return 'border-l-orange-500 bg-orange-50';
      case 'medium': return 'border-l-blue-500 bg-blue-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      setIsOpen(false);
    }
  };

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM11 19H6.5A2.5 2.5 0 014 16.5v-9A2.5 2.5 0 016.5 5h11A2.5 2.5 0 0120 7.5v3.5" />
        </svg>

        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center border border-white shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-1">
              {[
                { key: 'all', label: 'All', count: notifications.length },
                { key: 'unread', label: 'Unread', count: unreadCount },
                { key: 'urgent', label: 'Urgent', count: urgentCount }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as any)}
                  className={cn(
                    "px-3 py-1 text-sm rounded-md transition-colors",
                    filter === tab.key
                      ? "bg-primary text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          {unreadCount > 0 && (
            <div className="p-3 border-b border-gray-200 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="text-[10px] h-6 px-2 text-primary"
                onClick={handleMarkAllRead}
              >
                Mark all as read
              </Button>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-[350px] overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-2">📭</div>
                <p>No notifications</p>
              </div>
            ) : (
              filteredNotifications.map((notification: any) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 border-l-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors",
                    getPriorityColor(notification.priority),
                    !notification.read && "bg-blue-50"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-lg">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={cn(
                          "text-sm font-medium",
                          !notification.read ? "text-gray-900" : "text-gray-600"
                        )}>
                          {notification.title}
                        </p>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>

                      {notification.actionUrl && (
                        <div className="mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[10px]"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotificationClick(notification);
                            }}
                          >
                            {notification.actionText || 'View'}
                          </Button>
                        </div>
                      )}
                    </div>

                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200">
            <Button variant="outline" className="w-full" size="sm">
              View All Notifications
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
