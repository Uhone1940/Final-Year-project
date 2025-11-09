import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  DollarSign,
  CheckCircle,
  XCircle,
  Star,
  TrendingUp,
  Settings,
  Phone,
  Mail,
  Menu,
  LogOut,
  Bell,
  Plus,
  Edit,
  Package,
  Filter,
  History,
  Trash2,
  AlertCircle
} from 'lucide-react';

// Helper function to get data from either localStorage or sessionStorage
const getStorageItem = (key) => {
  return localStorage.getItem(key) || sessionStorage.getItem(key);
};

// Helper function to remove data from both storages
const removeStorageItem = (key) => {
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
};

export default function ServiceProviderDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('bookings');
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [providerId, setProviderId] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Added this for Booking History
  const [bookingFilter, setBookingFilter] = useState('active');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Add these states at the top
  const [availabilities, setAvailabilities] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);



  // Fetch availabilities
  const fetchAvailabilities = async () => {
    setLoadingCalendar(true);
    try {
      const response = await apiClient.get('/api/Availabilities/me');
      console.log('Availabilities Response:', response.data); // 🔍 DEBUG
      setAvailabilities(response.data);
    } catch (error) {
      console.error('Error fetching availabilities:', error);
      setAvailabilities([]);
    } finally {
      setLoadingCalendar(false);
    }
  };

  // Create availability
  const createAvailability = async (date) => {
    try {
      await apiClient.post('/api/Availabilities/create-availability', {
        AvailableDate: date.toISOString(),
        EventServiceProviderId: 0 // Will use logged-in provider
      });
      fetchAvailabilities();
      alert('Availability added successfully!');
    } catch (error) {
      console.error('Error creating availability:', error);
      alert('Failed to add availability');
    }
  };

  // Delete availability
  const deleteAvailability = async (availabilityId) => {
    try {
      await apiClient.delete(`/api/Availabilities/${availabilityId}`);
      fetchAvailabilities();
      alert('Availability removed successfully!');
    } catch (error) {
      console.error('Error deleting availability:', error);
      const errorMsg = error.response?.data?.Message || 'Failed to remove availability';
      alert(errorMsg);
    }
  };

  // Call fetchAvailabilities when calendar tab is opened
  useEffect(() => {
    if (activeTab === 'calendar') {
      fetchAvailabilities();
    }
  }, [activeTab]);

  // Helper function to get calendar days
  const getCalendarDays = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty slots for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days in month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  // Data states
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState({
    pendingBookings: 0,
    monthlyEarnings: 0,
    averageRating: 0,
    activeServices: 0,
  });

  const getFilteredBookings = () => {
    switch (bookingFilter) {
      case 'pending':
        return bookings.filter(b => b.status === 'Pending');
      case 'confirmed':
        return bookings.filter(b => b.status === 'Confirmed');
      case 'completed':
        return bookings.filter(b => b.status === 'Completed');
      case 'cancelled':
        return bookings.filter(b => b.status === 'Cancelled' || b.status === 'Declined');
      case 'active':
        return bookings.filter(b => b.status === 'Pending' || b.status === 'Confirmed');
      default:
        return bookings;
    }
  };

  // Load user info and fetch data on mount
  useEffect(() => {
    const storedUserName = getStorageItem('userName');
    if (storedUserName) {
      setUserName(storedUserName);
    }

    const userStr = getStorageItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log('User Data:', user); // DEBUG
        setProviderId(user.id || user.providerId || user.userId);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    // Check if user is authenticated
    const token = getStorageItem('token') || getStorageItem('authToken');
    console.log('Token exists:', !!token); // DEBUG
    if (!token) {
      navigate('/login');
    }

    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch bookings
      const bookingsResponse = await apiClient.get('/api/Bookings/my-bookings');
      console.log('Bookings Response:', bookingsResponse.data); // DEBUG
      const allBookings = bookingsResponse.data;
      setBookings(allBookings);

      // Fetch provider services
      //const servicesResponse = await apiClient.get('/ProviderServices/my-services');
      //const allServices = servicesResponse.data;
      //setServices(allServices);

      // Calculate stats
      const pending = allBookings.filter(b => b.status === 'Pending').length;
      const confirmed = allBookings.filter(b => b.status === 'Confirmed');

      // Calculate monthly earnings (sum of confirmed bookings)
      const monthlyEarnings = confirmed.reduce((sum, booking) => {
        return sum + (parseFloat(booking.totalCost) || 0);
      }, 0);

      // Calculate average rating from services
      //const totalRating = allServices.reduce((sum, service) => sum + (service.rating || 0), 0);
      //const avgRating = allServices.length > 0 ? (totalRating / allServices.length).toFixed(1) : 0;

      // Fetch notifications
      try {
        const notificationsResponse = await apiClient.get('/api/Notifications/me');
        console.log('Notifications Response:', notificationsResponse.data); // DEBUG
        setNotifications(notificationsResponse.data);
      } catch (error) {
        console.log('Notifications not available:', error);
        setNotifications([]);
      }

      setStats({
        pendingBookings: pending,
        monthlyEarnings: monthlyEarnings,
        averageRating: 0,
        activeServices: 0,
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      console.error('Error details:', error.response?.data); // DEBUG
      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  // Update markNotificationAsRead to use correct endpoint
  const markNotificationAsRead = async (notificationId) => {
    try {
      await apiClient.put(`/api/Notifications/${notificationId}/mark-read`);
      fetchDashboardData();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await apiClient.put('/api/Notifications/mark-all-read');
      fetchDashboardData();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotificationPanel && !event.target.closest('.notification-panel')) {
        setShowNotificationPanel(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotificationPanel]);


  const handleLogout = () => {
    removeStorageItem('token');
    removeStorageItem('authToken');
    removeStorageItem('user');
    removeStorageItem('userName');
    removeStorageItem('userEmail');
    removeStorageItem('userRole');
    navigate('/login');
  };

  const handleBookingAction = async (bookingId, action) => {
    try {
      const endpoint = action === 'accept'
        ? `/api/Bookings/${bookingId}/confirm`
        : `/api/Bookings/${bookingId}/decline`;

      await apiClient.put(endpoint);

      // Refresh bookings
      fetchDashboardData();

      alert(`Booking ${action === 'accept' ? 'accepted' : 'declined'} successfully!`);
    } catch (error) {
      console.error(`Error ${action}ing booking:`, error);
      alert(`Failed to ${action} booking. Please try again.`);
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusLower = (status || '').toLowerCase();
    switch (statusLower) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
      case 'declined':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    try {
      // Use the provider-specific delete endpoint
      await apiClient.delete(`/api/Bookings/provider/${bookingId}`);

      fetchDashboardData();
      setShowDeleteConfirm(null);
      alert('Booking deleted successfully!');
    } catch (error) {
      console.error('Error deleting booking:', error);
      const errorMsg = error.response?.data?.message || 'Failed to delete booking. Only completed or cancelled bookings can be deleted.';
      alert(errorMsg);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-md border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{userName}'s Services</h1>
                <p className="text-gray-600">Professional Event Service Provider</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Enhanced Notification Panel */}
              <div className="relative notification-panel">
                <button
                  onClick={() => setShowNotificationPanel(!showNotificationPanel)}
                  className="relative text-gray-600 hover:text-purple-600 transition-colors p-2 rounded-lg hover:bg-purple-50"
                >
                  <Bell className="w-6 h-6" />
                  {notifications.filter(n => !n.isRead).length > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                      {notifications.filter(n => !n.isRead).length}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotificationPanel && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[32rem] overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-gray-800 text-lg">Notifications</h3>
                        <button
                          onClick={() => setShowNotificationPanel(false)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <p className="text-gray-600">
                          {notifications.filter(n => !n.isRead).length} unread
                        </p>
                        {notifications.filter(n => !n.isRead).length > 0 && (
                          <button
                            onClick={markAllNotificationsAsRead}
                            className="text-purple-600 hover:text-purple-700 font-medium"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Notifications List */}
                    <div className="divide-y divide-gray-100 overflow-y-auto max-h-96">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500 font-medium">No notifications yet</p>
                          <p className="text-gray-400 text-sm mt-1">We'll notify you about bookings and reviews</p>
                        </div>
                      ) : (
                        notifications.slice(0, 20).map((notification) => (
                          <div
                            key={notification.notificationId}
                            onClick={() => {
                              if (!notification.isRead) {
                                markNotificationAsRead(notification.notificationId);
                              }
                            }}
                            className={`p-4 hover:bg-gray-50 cursor-pointer transition-all ${!notification.isRead ? 'bg-purple-50 border-l-4 border-purple-500' : ''
                              }`}
                          >
                            <div className="flex items-start gap-3">
                              {/* Icon based on type */}
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${notification.Type === 'review'
                                ? 'bg-yellow-100'
                                : notification.Type === 'cancellation'
                                  ? 'bg-red-100'
                                  : notification.Type === 'booking'
                                    ? 'bg-green-100'
                                    : 'bg-purple-100'
                                }`}>
                                {notification.Type === 'review' ? (
                                  <Star className="w-5 h-5 text-yellow-600" />
                                ) : notification.Type === 'cancellation' ? (
                                  <XCircle className="w-5 h-5 text-red-600" />
                                ) : notification.Type === 'booking' ? (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                  <Bell className="w-5 h-5 text-purple-600" />
                                )}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm ${!notification.isRead ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>
                                  {notification.title}
                                </p>
                                <p className="text-gray-600 text-xs mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                                <p className="text-gray-400 text-xs mt-2 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(notification.sentAt).toLocaleDateString('en-ZA', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>

                              {/* Unread indicator */}
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-purple-600 rounded-full flex-shrink-0 mt-2"></div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                      <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
                        <button
                          onClick={() => {
                            setShowNotificationPanel(false);
                            navigate('/notifications');
                          }}
                          className="text-purple-600 text-sm font-semibold hover:text-purple-700"
                        >
                          View All Notifications →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => navigate('/update-profile')}
                className="px-4 py-2 border border-purple-300 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 flex items-center gap-2 transition-all"
              >
                <User className="w-4 h-4" />
                My Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600 text-sm font-medium">Pending Requests</span>
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-orange-600">{stats.pendingBookings || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting response</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600 text-sm font-medium">Monthly Earnings</span>
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-green-600">R{(stats.monthlyEarnings || 0).toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">This month's revenue</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600 text-sm font-medium">Average Rating</span>
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-yellow-600">{(stats.averageRating || 0).toFixed(1)}</div>
            <p className="text-xs text-gray-500 mt-1">Based on reviews</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600 text-sm font-medium">Active Services</span>
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-purple-600">{stats.activeServices || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Services available</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-md p-1 inline-flex">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${activeTab === 'bookings'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              Booking Requests
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${activeTab === 'calendar'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${activeTab === 'services'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              My Services
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            {/* Filter Buttons */}
            <div className="bg-white rounded-xl shadow-md p-4">
              <div className="flex items-center gap-4 flex-wrap">
                <Filter className="w-5 h-5 text-gray-500" />
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setBookingFilter('active')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${bookingFilter === 'active'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    Active ({bookings.filter(b => b.status === 'Pending' || b.status === 'Confirmed').length})
                  </button>
                  <button
                    onClick={() => setBookingFilter('pending')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${bookingFilter === 'pending'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    Pending ({bookings.filter(b => b.status === 'Pending').length})
                  </button>
                  <button
                    onClick={() => setBookingFilter('confirmed')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${bookingFilter === 'confirmed'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    Confirmed ({bookings.filter(b => b.status === 'Confirmed').length})
                  </button>
                  <button
                    onClick={() => setBookingFilter('completed')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${bookingFilter === 'completed'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    Completed ({bookings.filter(b => b.status === 'Completed').length})
                  </button>
                  <button
                    onClick={() => setBookingFilter('cancelled')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${bookingFilter === 'cancelled'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    Cancelled ({bookings.filter(b => b.status === 'Cancelled' || b.status === 'Declined').length})
                  </button>
                  <button
                    onClick={() => setBookingFilter('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${bookingFilter === 'all'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    All History ({bookings.length})
                  </button>
                </div>
              </div>
            </div>

            {/* Bookings List */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  {bookingFilter === 'active' ? 'Active Bookings' :
                    bookingFilter === 'pending' ? 'Pending Requests' :
                      bookingFilter === 'confirmed' ? 'Confirmed Bookings' :
                        bookingFilter === 'completed' ? 'Completed Bookings' :
                          bookingFilter === 'cancelled' ? 'Cancelled Bookings' :
                            'All Booking History'}
                </h2>
                <p className="text-gray-600 text-sm">
                  {getFilteredBookings().length} booking(s) found
                </p>
              </div>

              {getFilteredBookings().length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No bookings found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getFilteredBookings().map((booking) => (
                    <div
                      key={booking.bookingId}
                      className={`border-2 rounded-lg p-5 transition-all ${booking.status === 'Pending' ? 'border-orange-200 bg-orange-50' :
                        booking.status === 'Confirmed' ? 'border-green-200 bg-green-50' :
                          booking.status === 'Completed' ? 'border-blue-200 bg-blue-50' :
                            'border-gray-200 bg-gray-50'
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h4 className="font-bold text-gray-800 text-lg">
                              {booking.eventName || 'Event Booking'}
                            </h4>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getStatusBadgeClass(booking.status)}`}>
                              {booking.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-gray-700">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">Customer:</span>
                              <span>{booking.customerFullName || booking.customerEmail}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span>{booking.customerEmail}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">Event Date:</span>
                              <span>{new Date(booking.eventDate).toLocaleDateString('en-ZA', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span>
                                {booking.startTime
                                  ? `${booking.startTime}${booking.endTime ? ` - ${booking.endTime}` : ''}`
                                  : new Date(booking.eventDate).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700 md:col-span-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">Location:</span>
                              <span>{booking.eventLocation || 'Location TBD'}</span>
                            </div>
                            {booking.totalCost && (
                              <div className="flex items-center gap-2 text-gray-700">
                                <DollarSign className="w-4 h-4 text-gray-400" />
                                <span className="font-medium">Amount:</span>
                                <span className="font-bold text-green-600">R{parseFloat(booking.totalCost).toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 ml-4">
                          {booking.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => handleBookingAction(booking.bookingId, 'decline')}
                                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-2 transition-all"
                                title="Decline this booking"
                              >
                                <XCircle className="w-4 h-4" />
                                Decline
                              </button>
                              <button
                                onClick={() => handleBookingAction(booking.bookingId, 'accept')}
                                className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:opacity-90 flex items-center gap-2 transition-all"
                                title="Accept this booking"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Accept
                              </button>
                            </>
                          )}

                          {booking.status === 'Confirmed' && (
                            <>
                              <button
                                onClick={async () => {
                                  try {
                                    await apiClient.put(`/api/Bookings/${booking.bookingId}/complete`);
                                    fetchDashboardData();
                                    alert('Booking marked as completed!');
                                  } catch (error) {
                                    console.error('Error completing booking:', error);
                                    alert('Failed to mark booking as completed.');
                                  }
                                }}
                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:opacity-90 flex items-center gap-2"
                                title="Mark as completed"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Complete
                              </button>
                              <button
                                onClick={() => window.location.href = `mailto:${booking.customerEmail}`}
                                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                                title="Email customer"
                              >
                                <Mail className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => window.location.href = `tel:${booking.customerEmail}`}
                                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                                title="Contact customer"
                              >
                                <Phone className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {(booking.status === 'Completed' || booking.status === 'Cancelled' || booking.status === 'Declined') && (
                            <button
                              onClick={() => setShowDeleteConfirm(booking.bookingId)}
                              className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-2 transition-all"
                              title="Delete from history"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowDeleteConfirm(null)}>
                <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Delete Booking?</h3>
                  </div>
                  <p className="text-gray-600 mb-6">
                    This action cannot be undone. The booking will be permanently removed from your history.
                  </p>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="px-5 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDeleteBooking(showDeleteConfirm)}
                      className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-all flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Permanently
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Availability Calendar</h2>
                <p className="text-gray-600 text-sm">Manage your available dates for bookings</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  ←
                </button>
                <span className="px-4 py-2 font-semibold text-gray-700">
                  {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  →
                </button>
              </div>
            </div>

            {loadingCalendar ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading calendar...</p>
              </div>
            ) : (
              <>
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2 mb-6">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center font-bold text-gray-700 text-sm py-2 border-b-2 border-gray-200">
                      {day}
                    </div>
                  ))}

                  {getCalendarDays().map((date, index) => {
                    if (!date) {
                      return <div key={`empty-${index}`} className="aspect-square"></div>;
                    }

                    const dateStr = date.toISOString().split('T')[0];

                    // ✅ FIX: Check if availableDate exists before calling split
                    const availability = availabilities.find(a =>
                      a.availableDate && a.availableDate.split('T')[0] === dateStr
                    );

                    // ✅ FIX: Use camelCase for eventDate and status
                    const hasBooking = bookings.some(b =>
                      b.eventDate && b.eventDate.split('T')[0] === dateStr &&
                      (b.status === 'Confirmed' || b.status === 'Pending')
                    );

                    const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
                    const isToday = dateStr === new Date().toISOString().split('T')[0];

                    return (
                      <button
                        key={index}
                        onClick={() => {
                          if (isPast) return;
                          if (availability) {
                            // ✅ FIX: Use camelCase
                            if (availability.isBooked) {
                              alert('Cannot remove availability for a booked date');
                            } else {
                              deleteAvailability(availability.availabilityId);
                            }
                          } else {
                            createAvailability(date);
                          }
                        }}
                        disabled={isPast}
                        className={`aspect-square rounded-lg border-2 p-2 text-sm font-semibold transition-all relative ${isPast
                            ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                            : availability?.isBooked // ✅ FIX: camelCase
                              ? 'bg-red-100 border-red-300 text-red-700 cursor-not-allowed'
                              : availability
                                ? 'bg-green-100 border-green-400 text-green-800 hover:bg-green-200'
                                : hasBooking
                                  ? 'bg-orange-100 border-orange-300 text-orange-700'
                                  : 'bg-white border-gray-300 text-gray-700 hover:border-purple-400 hover:bg-purple-50'
                          } ${isToday ? 'ring-2 ring-purple-600' : ''}`}
                        title={
                          isPast ? 'Past date' :
                            availability?.isBooked ? 'Booked (cannot be removed)' : // ✅ FIX: camelCase
                              availability ? 'Click to remove availability' :
                                hasBooking ? 'Has pending/confirmed booking' :
                                  'Click to add availability'
                        }
                      >
                        <div className="text-center">
                          {date.getDate()}
                        </div>
                        {hasBooking && !availability?.isBooked && ( // ✅ FIX: camelCase
                          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-white border-2 border-gray-300 rounded"></div>
                    <span className="text-gray-600">Not Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 border-2 border-green-400 rounded"></div>
                    <span className="text-gray-600">Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-red-100 border-2 border-red-300 rounded"></div>
                    <span className="text-gray-600">Booked</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-orange-100 border-2 border-orange-300 rounded flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                    </div>
                    <span className="text-gray-600">Has Booking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-white border-2 border-purple-600 rounded"></div>
                    <span className="text-gray-600">Today</span>
                  </div>
                </div>

                {/* Upcoming Bookings List */}
                <div className="border-t pt-6">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    Upcoming Bookings
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {bookings
                      .filter(b => new Date(b.eventDate) >= new Date() && (b.status === 'Confirmed' || b.status === 'Pending'))
                      .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate))
                      .slice(0, 10)
                      .map(booking => (
                        <div key={booking.bookingId} className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 hover:shadow-md transition-all">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${booking.status === 'Confirmed' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                            <div>
                              <p className="font-semibold text-gray-800 text-sm">{booking.eventName}</p>
                              <div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(booking.eventDate).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}
                                </span>
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {booking.customerFullName}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {booking.eventLocation}
                                </span>
                              </div>
                            </div>
                          </div>
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${booking.status === 'Confirmed'
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : 'bg-orange-100 text-orange-700 border border-orange-300'
                            }`}>
                            {booking.status}
                          </span>
                        </div>
                      ))}
                    {bookings.filter(b => new Date(b.eventDate) >= new Date() && (b.status === 'Confirmed' || b.status === 'Pending')).length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p>No upcoming bookings</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}


        {activeTab === 'services' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">My Services</h2>
                <p className="text-gray-600 text-sm">Manage your service offerings and pricing</p>
              </div>
              <button
                onClick={() => navigate('/add-service')}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Service
              </button>
            </div>

            {services.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No services added yet</p>
                <button
                  onClick={() => navigate('/add-service')}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90"
                >
                  Add Your First Service
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {services.map((service) => (
                  <div key={service.id} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 text-lg">{service.serviceName || service.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            R{service.price || service.basePrice}
                          </span>
                          {service.rating && (
                            <span className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              {service.rating.toFixed(1)}
                            </span>
                          )}
                          {service.category && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                              {service.category}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${service.isActive || service.status === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                          }`}>
                          {service.isActive || service.status === 'Active' ? 'Active' : 'Inactive'}
                        </span>
                        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Logout Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-2 shadow-md"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}