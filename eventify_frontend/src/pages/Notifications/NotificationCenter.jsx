import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { 
  Bell, 
  BellOff,
  Trash2, 
  Check, 
  X,
  ArrowLeft,
  Filter,
  Loader
} from 'lucide-react';

// Helper function to get data from storage
const getStorageItem = (key) => {
  return localStorage.getItem(key) || sessionStorage.getItem(key);
};

export default function NotificationCenter() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    // Get user info
    const storedUserName = getStorageItem('userName');
    const storedUserRole = getStorageItem('userRole');
    
    if (storedUserName) setUserName(storedUserName);
    if (storedUserRole) setUserRole(storedUserRole);

    // Check authentication
    const token = getStorageItem('token') || getStorageItem('authToken');
    if (!token) {
      navigate('/login');
      return;
    }

    fetchNotifications();
  }, [navigate]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/Notifications/me');
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await apiClient.put(`/api/Notifications/${notificationId}/mark-read`);
      
      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.notificationId === notificationId
            ? { ...notif, isRead: true }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      alert('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.isRead);
    
    if (unreadNotifications.length === 0) {
      alert('No unread notifications');
      return;
    }

    try {
      // Mark all unread notifications as read
      await Promise.all(
        unreadNotifications.map(notif =>
          apiClient.put(`/api/Notifications/${notif.notificationId}/mark-read`)
        )
      );
      
      // Update local state
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      
      alert('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      alert('Failed to mark all as read');
    }
  };

  const handleDelete = async (notificationId) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) {
      return;
    }

    try {
      await apiClient.delete(`/api/Notifications/${notificationId}`);
      
      // Remove from local state
      setNotifications(prev =>
        prev.filter(notif => notif.notificationId !== notificationId)
      );
      
      alert('Notification deleted successfully');
    } catch (error) {
      console.error('Error deleting notification:', error);
      alert('Failed to delete notification');
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Are you sure you want to delete ALL notifications? This action cannot be undone.')) {
      return;
    }

    try {
      await Promise.all(
        notifications.map(notif =>
          apiClient.delete(`/api/Notifications/${notif.notificationId}`)
        )
      );
      
      setNotifications([]);
      alert('All notifications deleted successfully');
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      alert('Failed to delete all notifications');
    }
  };

  const getBackRoute = () => {
    const role = userRole?.toLowerCase();
    if (role === 'admin' || role === 'systemadmin') return '/AdminDashboard';
    if (role === 'eventserviceprovider' || role === 'provider') return '/ProviderDashboard';
    return '/CustomerDashboard';
  };

  // Filter notifications based on selected filter
  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.isRead;
    if (filter === 'read') return notif.isRead;
    return true; // 'all'
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(getBackRoute())}
            className="inline-flex items-center text-gray-600 hover:text-purple-600 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            Back to Dashboard
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg relative">
                <Bell className="w-6 h-6 text-white" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Notifications</h1>
                <p className="text-gray-600">
                  {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                </p>
              </div>
            </div>
            
            {notifications.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={unreadCount === 0}
                  className="px-4 py-2 bg-white border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <Check className="w-4 h-4" />
                  Mark All Read
                </button>
                <button
                  onClick={handleDeleteAll}
                  className="px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-2 transition-all text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete All
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-md p-1 inline-flex mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-md font-medium transition-all ${
              filter === 'all'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-6 py-2 rounded-md font-medium transition-all ${
              filter === 'unread'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-6 py-2 rounded-md font-medium transition-all ${
              filter === 'read'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Read ({notifications.length - unreadCount})
          </button>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-16">
              <BellOff className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium mb-2">
                {filter === 'all' ? 'No notifications yet' : 
                 filter === 'unread' ? 'No unread notifications' : 
                 'No read notifications'}
              </p>
              <p className="text-gray-400 text-sm">
                {filter === 'all' ? "You'll be notified when there's something new" : 
                 filter === 'unread' ? "All your notifications are read" : 
                 "You haven't read any notifications yet"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.notificationId}
                  className={`p-6 transition-all hover:bg-gray-50 ${
                    !notification.isRead ? 'bg-purple-50 border-l-4 border-purple-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-gray-800 text-lg">
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <span className="px-2 py-0.5 bg-purple-600 text-white text-xs font-semibold rounded-full">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3 whitespace-pre-wrap">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Bell className="w-3 h-3" />
                        {formatDate(notification.sentAt)}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification.notificationId)}
                          className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-all"
                          title="Mark as read"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification.notificationId)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                        title="Delete notification"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        {notifications.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Tip:</strong> Unread notifications are highlighted with a purple accent. 
              Click the check icon to mark individual notifications as read.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}