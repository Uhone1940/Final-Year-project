import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { Calendar, Clock, MapPin, DollarSign, Bell, Search, Plus, CheckCircle, AlertCircle, MessageSquare, Heart, Star, Menu, LogOut, Settings, ChevronRight, X, Eye, Users, FileText, Loader, Filter, TrendingUp, Building2, UtensilsCrossed, Camera, Music, PartyPopper, Shield } from 'lucide-react';

// Helper function to get data from either localStorage or sessionStorage
const getStorageItem = (key) => {
  return localStorage.getItem(key) || sessionStorage.getItem(key);
};

// Helper function to remove data from both storages
const removeStorageItem = (key) => {
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
};

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  // Modals
  const [eventDetailsModal, setEventDetailsModal] = useState(null);
  const [providerSearchModal, setProviderSearchModal] = useState(null);

  // Add these new states after existing state declarations
  const [editEventModal, setEditEventModal] = useState(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(null);
  const [cancelBookingModal, setCancelBookingModal] = useState(null);
  const [reviewModal, setReviewModal] = useState(null);
  const [historyFilter, setHistoryFilter] = useState('all'); // 'all', 'events', 'bookings'

  // Add these state for form data
  const [editFormData, setEditFormData] = useState({
    name: '',
    eventType: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    fullAddress: '',
    expectedGuests: '',
    description: '',
    serviceCategoryIds: []
  });

  const [reviewFormData, setReviewFormData] = useState({
    rating: 5,
    comment: ''
  });

  // Helper function to check if event is past
  const isEventPast = (eventDate) => {
    return new Date(eventDate) < new Date();
  };

  // Helper function to check if booking can be reviewed
  const canReviewBooking = (booking) => {
    // Check if booking is confirmed AND event has passed
    // OR if booking status is "Completed"
    const isCompleted = booking.status === 'Completed';
    const isConfirmedAndPast = booking.status === 'Confirmed' && isEventPast(booking.eventDate);

    return isCompleted || isConfirmedAndPast;
  };

  // Data states
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [providers, setProviders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [serviceCategories, setServiceCategories] = useState([]);
  const [selectedEventBookings, setSelectedEventBookings] = useState([]);

  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [providersLoading, setProvidersLoading] = useState(false);

  const [stats, setStats] = useState({
    upcomingEvents: 0,
    pendingBookings: 0,
    completedEvents: 0,
    totalSpent: 0,
  });

  useEffect(() => {
    // Check authentication
    const token = getStorageItem('token') || getStorageItem('authToken');
    if (!token) {
      navigate('/login');
      return;
    }

    // Get user info
    const storedUserName = getStorageItem('userName');
    if (storedUserName) {
      setUserName(storedUserName);
    } else {
      const userObj = getStorageItem('user');
      if (userObj) {
        try {
          const user = JSON.parse(userObj);
          setUserName(user.fullName || user.name || user.email || 'User');
        } catch (e) {
          setUserName('User');
        }
      }
    }

    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch events
      const eventsResponse = await apiClient.get('/api/Events/get-all-events');
      const allEvents = eventsResponse.data;

      const today = new Date();
      const upcomingEvents = allEvents.filter(event => new Date(event.date) >= today);
      const completedEvents = allEvents.filter(event => new Date(event.date) < today);

      setEvents(allEvents);

      // Fetch bookings
      const bookingsResponse = await apiClient.get('/api/Bookings/my-bookings');
      const allBookings = bookingsResponse.data;
      const pendingBookings = allBookings.filter(b => b.status === 'Pending');

      setBookings(allBookings);

      // Fetch service categories
      const categoriesResponse = await apiClient.get('/api/Categories');
      setServiceCategories(categoriesResponse.data);

      // Fetch notifications
      try {
        const notificationsResponse = await apiClient.get('/api/Notifications/me');
        setNotifications(notificationsResponse.data);
      } catch (error) {
        console.log('Notifications not available:', error);
        setNotifications([]);
      }

      setStats({
        upcomingEvents: upcomingEvents.length,
        pendingBookings: pendingBookings.length,
        completedEvents: completedEvents.length,
        totalSpent: allBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0),
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    removeStorageItem('token');
    removeStorageItem('authToken');
    removeStorageItem('user');
    removeStorageItem('userName');
    removeStorageItem('userEmail');
    removeStorageItem('userRole');
    navigate('/login');
  };

  const handleViewEventDetails = async (event) => {
    setEventDetailsModal(event);

    // Fetch bookings for this specific event
    try {
      const response = await apiClient.get(`/api/Bookings/event/${event.eventId}`);
      setSelectedEventBookings(response.data);
    } catch (error) {
      console.error('Error fetching event bookings:', error);
      setSelectedEventBookings([]);
    }
  };

  const handleFindProvidersForEvent = async (event) => {
    setEventDetailsModal(null);
    setProviderSearchModal(event);
    setSelectedCategory(null);
    setSearchQuery('');

    // Load all providers initially
    await fetchProviders(null);
  };

  const fetchProviders = async (categoryId) => {
    setProvidersLoading(true);
    try {
      const response = await apiClient.get(
        `/api/Providers/search?categoryId=${categoryId || ''}&page=1&pageSize=12`
      );
      setProviders(response.data.items || response.data);
    } catch (error) {
      console.error('Error fetching providers:', error);
      setProviders([]);
    } finally {
      setProvidersLoading(false);
    }
  };

  const handleCategoryFilter = (categoryId) => {
    setSelectedCategory(categoryId);
    fetchProviders(categoryId);
  };

  const handleBookProvider = async (provider) => {
    if (!providerSearchModal) return;

    if (window.confirm(`Book ${provider.businessName} for ${providerSearchModal.name}?\n\nThis will send a booking request to the provider.`)) {
      try {
        const bookingData = {
          eventId: providerSearchModal.eventId,
          eventServiceProviderId: provider.providerId,
          bookingDate: new Date().toISOString()
        };

        await apiClient.post('/api/Bookings/create-booking', bookingData);

        alert(`✅ Booking request sent successfully!\n\n${provider.businessName} will review your request for "${providerSearchModal.name}".`);

        setProviderSearchModal(null);
        fetchDashboardData();
      } catch (error) {
        console.error('Error creating booking:', error);
        const errorMessage = error.response?.data?.message || 'Failed to create booking. Please try again.';
        alert(`❌ ${errorMessage}`);
      }
    }
  };

  const getIconForCategory = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('venue') || lowerName.includes('location')) return Building2;
    if (lowerName.includes('cater') || lowerName.includes('food')) return UtensilsCrossed;
    if (lowerName.includes('photo') || lowerName.includes('video')) return Camera;
    if (lowerName.includes('entertain') || lowerName.includes('music') || lowerName.includes('dj')) return Music;
    if (lowerName.includes('decor') || lowerName.includes('flower')) return PartyPopper;
    if (lowerName.includes('security')) return Shield;
    return Building2;
  };

  const statusColors = {
    Confirmed: 'bg-green-100 text-green-800 border-green-200',
    Pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Cancelled: 'bg-red-100 text-red-800 border-red-200',
    confirmed: 'bg-green-100 text-green-800 border-green-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
  };

  const filteredProviders = providers.filter(provider =>
    provider.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    provider.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statsData = [
    { icon: Calendar, label: 'Upcoming Events', value: stats.upcomingEvents, color: 'from-purple-500 to-indigo-500' },
    { icon: Clock, label: 'Pending Bookings', value: stats.pendingBookings, color: 'from-yellow-500 to-orange-500' },
    { icon: CheckCircle, label: 'Completed Events', value: stats.completedEvents, color: 'from-green-500 to-emerald-500' },
    { icon: DollarSign, label: 'Total Spent', value: `R${stats.totalSpent.toLocaleString()}`, color: 'from-pink-500 to-rose-500' },
  ];

  // Add these functions before the return statement

  const handleEditEvent = async (event) => {
    setEditFormData({
      name: event.name,
      eventType: event.eventType,
      date: event.date.split('T')[0],
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      fullAddress: event.fullAddress || '',
      expectedGuests: event.expectedGuests,
      description: event.description || '',
      serviceCategoryIds: serviceCategories
        .filter(cat => event.servicesNeeded?.includes(cat.name))
        .map(cat => cat.serviceCategoryId)
    });
    setEditEventModal(event);
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();

    try {
      await apiClient.put(`/api/Events/${editEventModal.eventId}`, editFormData);

      alert('✅ Event updated successfully!');
      setEditEventModal(null);
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating event:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update event.';
      alert(`❌ ${errorMessage}`);
    }
  };

  const handleDeleteEvent = async () => {
    try {
      await apiClient.delete(`/api/Events/${deleteConfirmModal.eventId}`);

      alert('✅ Event deleted successfully!');
      setDeleteConfirmModal(null);
      fetchDashboardData();
    } catch (error) {
      console.error('Error deleting event:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete event.';
      alert(`❌ ${errorMessage}`);
    }
  };

  const handleCancelBooking = async () => {
    try {
      await apiClient.put(`/api/Bookings/${cancelBookingModal.bookingId}/cancel`);

      alert('✅ Booking cancelled successfully!');
      setCancelBookingModal(null);
      fetchDashboardData();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      const errorMessage = error.response?.data?.message || 'Failed to cancel booking.';
      alert(`❌ ${errorMessage}`);
    }
  };

  const handleOpenReviewModal = (booking) => {
    setReviewFormData({ rating: 5, comment: '' });
    setReviewModal(booking);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    try {
      await apiClient.post('/api/Reviews', {
        eventServiceProviderId: reviewModal.providerId,
        bookingId: reviewModal.bookingId,
        rating: reviewFormData.rating,
        comment: reviewFormData.comment
      });

      alert('✅ Review submitted successfully! Thank you for your feedback.');
      setReviewModal(null);
      fetchDashboardData();
    } catch (error) {
      console.error('Error submitting review:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit review.';
      alert(`❌ ${errorMessage}`);
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
      {/* Top Navigation */}
      <nav className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="mr-4 lg:hidden text-gray-600 hover:text-purple-600 transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              <Calendar className="w-8 h-8 text-purple-600 mr-2" />
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Eventify
              </span>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/notifications')}
                className="relative text-gray-600 hover:text-purple-600 transition-colors"
              >
                <Bell className="w-6 h-6" />
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </button>
              <div className="flex items-center space-x-2 cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:inline text-gray-700 font-medium">
                  {userName}
                </span>
              </div>
            </div>
          </div>

        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white shadow-xl transition-transform duration-300 mt-16 lg:mt-0`}
        >
          <nav className="p-4 space-y-2">
            {[
              { id: 'overview', icon: Calendar, label: 'Dashboard' },
              { id: 'events', icon: Calendar, label: 'My Events' },
              { id: 'bookings', icon: CheckCircle, label: 'Bookings' },
              { id: 'history', icon: FileText, label: 'History' },
              { id: 'messages', icon: MessageSquare, label: 'Messages' },
              { id: 'favorites', icon: Heart, label: 'Favorites' },
              { id: 'settings', icon: Settings, label: 'Settings' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === item.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-purple-50'
                  }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all mt-8"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </nav>
        </aside>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Welcome back, {userName}! 👋
              </h1>
              <p className="text-gray-600">Manage your events and book service providers seamlessly.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statsData.map((stat, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm mb-1">{stat.label}</p>
                      <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                    </div>
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                      <stat.icon className="w-7 h-7 text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tabs Content */}
            {activeTab === 'overview' && (
              <>
                {/* Info Banner */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 mb-8 flex items-start space-x-3 shadow-sm">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">📝 How it works</h3>
                    <p className="text-sm text-blue-800">
                      <strong>Step 1:</strong> Create an event and select the services you need.
                      <strong className="ml-2">Step 2:</strong> Find and book providers specifically for that event.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* My Events */}
                  <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold text-gray-800 flex items-center">
                        <Calendar className="w-6 h-6 mr-2 text-purple-600" />
                        My Events
                      </h2>
                      <button
                        onClick={() => navigate('/create-event')}
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="font-medium">Create Event</span>
                      </button>
                    </div>

                    {events.filter(e => !isEventPast(e.date)).length === 0 ? (
                      <div className="text-center py-16 bg-gray-50 rounded-lg">
                        <Calendar className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg mb-2">No upcoming events</p>
                        <p className="text-sm text-gray-400 mb-4">Create your first event to start booking providers</p>
                        <button
                          onClick={() => navigate('/create-event')}
                          className="text-purple-600 hover:text-purple-700 font-medium"
                        >
                          Create your first event →
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {events.filter(e => !isEventPast(e.date)).map((event) => (
                          <div
                            key={event.eventId}
                            className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:shadow-md transition-all"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-800 text-lg">{event.name}</h3>
                                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>{new Date(event.date).toLocaleDateString()}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Clock className="w-4 h-4" />
                                    <span>{event.startTime} - {event.endTime}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <MapPin className="w-4 h-4" />
                                    <span>{event.location}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Users className="w-4 h-4" />
                                    <span>{event.expectedGuests} guests</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                              <div className="flex items-center space-x-2 text-sm">
                                <span className="text-gray-600">
                                  <span className="font-medium">Type:</span> {event.eventType}
                                </span>
                                {event.bookingCount > 0 && (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                    {event.bookingCount} {event.bookingCount === 1 ? 'booking' : 'bookings'}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleViewEventDetails(event)}
                                  className="flex items-center space-x-1 px-3 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-all text-sm"
                                >
                                  <Eye className="w-4 h-4" />
                                  <span className="font-medium">View</span>
                                </button>
                                <button
                                  onClick={() => handleEditEvent(event)}
                                  className="flex items-center space-x-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all text-sm"
                                >
                                  <Settings className="w-4 h-4" />
                                  <span className="font-medium">Edit</span>
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmModal(event)}
                                  className="flex items-center space-x-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all text-sm"
                                >
                                  <X className="w-4 h-4" />
                                  <span className="font-medium">Delete</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent Bookings */}
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Recent Bookings</h2>
                    {bookings.filter(b => !isEventPast(b.eventDate)).length === 0 ? (
                      <div className="text-center py-12">
                        <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-sm">No active bookings</p>
                        <p className="text-xs text-gray-400 mt-2">Create an event first, then book providers</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {bookings.filter(b => !isEventPast(b.eventDate)).slice(0, 5).map((booking) => (
                          <div key={booking.bookingId} className="border border-gray-100 rounded-lg p-3 hover:border-purple-200 transition-all">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-800">{booking.providerBusinessName}</p>
                                <p className="text-xs text-gray-500 mt-1">{booking.eventName}</p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${statusColors[booking.status]}`}>
                                {booking.status}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-xs text-gray-600">
                              <span>{new Date(booking.bookingDate).toLocaleDateString()}</span>
                              {booking.totalPrice && (
                                <span className="font-semibold text-purple-600">R{booking.totalPrice}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}


            {activeTab === 'events' && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                    <Calendar className="w-7 h-7 mr-3 text-purple-600" />
                    Manage Events
                  </h2>
                  <button
                    onClick={() => navigate('/create-event')}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition-all shadow-md"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="font-medium">Create Event</span>
                  </button>
                </div>

                {events.filter(e => !isEventPast(e.date)).length === 0 ? (
                  <div className="text-center py-16 bg-gray-50 rounded-lg">
                    <Calendar className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg mb-2">No upcoming events</p>
                    <p className="text-sm text-gray-400 mb-4">Create your first event to get started</p>
                    <button
                      onClick={() => navigate('/create-event')}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
                    >
                      Create Event
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {events.filter(e => !isEventPast(e.date)).map((event) => (
                      <div
                        key={event.eventId}
                        className="border border-gray-200 rounded-lg p-5 hover:border-purple-300 hover:shadow-lg transition-all"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-800 text-xl mb-2">{event.name}</h3>
                            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-purple-600" />
                                <span>{new Date(event.date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4 text-purple-600" />
                                <span>{event.startTime} - {event.endTime}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <MapPin className="w-4 h-4 text-purple-600" />
                                <span>{event.location}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Users className="w-4 h-4 text-purple-600" />
                                <span>{event.expectedGuests} guests</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                              {event.eventType}
                            </span>
                            {event.bookingCount > 0 && (
                              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                                {event.bookingCount} {event.bookingCount === 1 ? 'booking' : 'bookings'}
                              </span>
                            )}
                          </div>
                        </div>

                        {event.servicesNeeded && event.servicesNeeded.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs text-gray-500 mb-2">Services Needed:</p>
                            <div className="flex flex-wrap gap-2">
                              {event.servicesNeeded.map((service, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                                >
                                  {service}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {event.description && (
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <button
                            onClick={() => handleViewEventDetails(event)}
                            className="flex items-center space-x-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-all"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="font-medium">View Details</span>
                          </button>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditEvent(event)}
                              className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all"
                            >
                              <Settings className="w-4 h-4" />
                              <span className="font-medium">Edit</span>
                            </button>
                            <button
                              onClick={() => setDeleteConfirmModal(event)}
                              className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                            >
                              <X className="w-4 h-4" />
                              <span className="font-medium">Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'bookings' && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                    <CheckCircle className="w-7 h-7 mr-3 text-purple-600" />
                    Manage Bookings
                  </h2>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span className="font-medium">Total:</span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-semibold">
                      {bookings.filter(b => !isEventPast(b.eventDate)).length}
                    </span>
                  </div>
                </div>

                {bookings.filter(b => !isEventPast(b.eventDate)).length === 0 ? (
                  <div className="text-center py-16 bg-gray-50 rounded-lg">
                    <CheckCircle className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg mb-2">No active bookings</p>
                    <p className="text-sm text-gray-400 mb-4">Book providers for your events to see them here</p>
                    <button
                      onClick={() => setActiveTab('events')}
                      className="text-purple-600 hover:text-purple-700 font-medium"
                    >
                      Go to Events →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.filter(b => !isEventPast(b.eventDate)).map((booking) => (
                      <div
                        key={booking.bookingId}
                        className="border border-gray-200 rounded-lg p-5 hover:border-purple-300 hover:shadow-lg transition-all"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-bold text-gray-800 text-lg">{booking.providerBusinessName}</h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[booking.status]}`}>
                                {booking.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">
                              <span className="font-medium">Event:</span> {booking.eventName}
                            </p>
                            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-purple-600" />
                                <span>Event: {new Date(booking.eventDate).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4 text-purple-600" />
                                <span>Booked: {new Date(booking.bookingDate).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <MapPin className="w-4 h-4 text-purple-600" />
                                <span>{booking.eventLocation}</span>
                              </div>
                              {booking.totalPrice && (
                                <div className="flex items-center space-x-2">
                                  <DollarSign className="w-4 h-4 text-purple-600" />
                                  <span className="font-semibold text-purple-600">R{booking.totalPrice}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="text-xs text-gray-500">
                            Provider: {booking.providerEmail}
                          </div>
                          <div className="flex items-center space-x-2">
                            {booking.status === 'Pending' && (
                              <button
                                onClick={() => setCancelBookingModal(booking)}
                                className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                              >
                                <X className="w-4 h-4" />
                                <span className="font-medium">Cancel</span>
                              </button>
                            )}
                            {canReviewBooking(booking) && (
                              <button
                                onClick={() => {
                                  console.log('Opening review modal for:', booking); // 🔍 DEBUG
                                  handleOpenReviewModal(booking)
                                }}
                                className="flex items-center space-x-2 px-4 py-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-all"
                              >
                                <Star className="w-4 h-4" />
                                <span className="font-medium">Leave Review</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                    <FileText className="w-7 h-7 mr-3 text-purple-600" />
                    History
                  </h2>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setHistoryFilter('all')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${historyFilter === 'all'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setHistoryFilter('events')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${historyFilter === 'events'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      Events
                    </button>
                    <button
                      onClick={() => setHistoryFilter('bookings')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${historyFilter === 'bookings'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      Bookings
                    </button>
                  </div>
                </div>

                {/* Past Events */}
                {(historyFilter === 'all' || historyFilter === 'events') && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Calendar className="w-5 h-5 mr-2 text-purple-600" />
                      Past Events ({events.filter(e => isEventPast(e.date)).length})
                    </h3>
                    {events.filter(e => isEventPast(e.date)).length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <p className="text-gray-500 text-sm">No past events</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {events.filter(e => isEventPast(e.date)).map((event) => (
                          <div
                            key={event.eventId}
                            className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-800">{event.name}</h4>
                                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>{new Date(event.date).toLocaleDateString()}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <MapPin className="w-4 h-4" />
                                    <span>{event.location}</span>
                                  </div>
                                  <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs">
                                    {event.eventType}
                                  </span>
                                  {event.bookingCount > 0 && (
                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                      {event.bookingCount} {event.bookingCount === 1 ? 'booking' : 'bookings'}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => handleViewEventDetails(event)}
                                className="flex items-center space-x-1 px-3 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-all text-sm border border-purple-200"
                              >
                                <Eye className="w-4 h-4" />
                                <span className="font-medium">View</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Past Bookings */}
                {(historyFilter === 'all' || historyFilter === 'bookings') && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2 text-purple-600" />
                      Past Bookings ({bookings.filter(b => isEventPast(b.eventDate)).length})
                    </h3>
                    {bookings.filter(b => isEventPast(b.eventDate)).length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <p className="text-gray-500 text-sm">No past bookings</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {bookings.filter(b => isEventPast(b.eventDate)).map((booking) => (
                          <div
                            key={booking.bookingId}
                            className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h4 className="font-semibold text-gray-800">{booking.providerBusinessName}</h4>
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${statusColors[booking.status]}`}>
                                    {booking.status}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  Event: <span className="font-medium">{booking.eventName}</span>
                                </p>
                                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>{new Date(booking.eventDate).toLocaleDateString()}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <MapPin className="w-4 h-4" />
                                    <span>{booking.eventLocation}</span>
                                  </div>
                                  {booking.totalPrice && (
                                    <div className="flex items-center space-x-1">
                                      <DollarSign className="w-4 h-4" />
                                      <span className="font-semibold text-purple-600">R{booking.totalPrice}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {canReviewBooking(booking) && (
                                <button
                                  onClick={() => handleOpenReviewModal(booking)}
                                  className="flex items-center space-x-1 px-3 py-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-all text-sm border border-yellow-200"
                                >
                                  <Star className="w-4 h-4" />
                                  <span className="font-medium">Review</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {(historyFilter === 'all' || historyFilter === 'events') &&
                  events.filter(e => isEventPast(e.date)).length === 0 &&
                  (historyFilter === 'all' || historyFilter === 'bookings') &&
                  bookings.filter(b => isEventPast(b.eventDate)).length === 0 && (
                    <div className="text-center py-16">
                      <FileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg mb-2">No history yet</p>
                      <p className="text-sm text-gray-400">Your completed events and bookings will appear here</p>
                    </div>
                  )}
              </div>
            )}

            {/* Event Details Modal */}
            {eventDetailsModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">Event Details</h2>
                    <button
                      onClick={() => setEventDetailsModal(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="p-6">
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-4">{eventDetailsModal.name}</h3>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Calendar className="w-5 h-5 text-purple-600" />
                          <div>
                            <p className="text-xs text-gray-500">Date</p>
                            <p className="font-medium">{new Date(eventDetailsModal.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Clock className="w-5 h-5 text-purple-600" />
                          <div>
                            <p className="text-xs text-gray-500">Time</p>
                            <p className="font-medium">{eventDetailsModal.startTime} - {eventDetailsModal.endTime}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <MapPin className="w-5 h-5 text-purple-600" />
                          <div>
                            <p className="text-xs text-gray-500">Location</p>
                            <p className="font-medium">{eventDetailsModal.location}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Users className="w-5 h-5 text-purple-600" />
                          <div>
                            <p className="text-xs text-gray-500">Guests</p>
                            <p className="font-medium">{eventDetailsModal.expectedGuests} people</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600 col-span-2">
                          <FileText className="w-5 h-5 text-purple-600" />
                          <div>
                            <p className="text-xs text-gray-500">Type</p>
                            <p className="font-medium">{eventDetailsModal.eventType}</p>
                          </div>
                        </div>
                      </div>

                      {eventDetailsModal.fullAddress && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Full Address</p>
                          <p className="text-sm text-gray-700">{eventDetailsModal.fullAddress}</p>
                        </div>
                      )}

                      {eventDetailsModal.description && (
                        <div className="mt-4">
                          <p className="text-xs text-gray-500 mb-1">Description</p>
                          <p className="text-gray-700">{eventDetailsModal.description}</p>
                        </div>
                      )}

                      {eventDetailsModal.servicesNeeded && eventDetailsModal.servicesNeeded.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs text-gray-500 mb-2">Services Needed</p>
                          <div className="flex flex-wrap gap-2">
                            {eventDetailsModal.servicesNeeded.map((service, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                              >
                                {service}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-800 mb-3">Booked Providers ({selectedEventBookings.length})</h4>
                      {selectedEventBookings.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
                          No providers booked yet for this event
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {selectedEventBookings.map((booking) => (
                            <div key={booking.bookingId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium text-gray-800">{booking.providerBusinessName}</p>
                                <p className="text-xs text-gray-500">{booking.providerEmail}</p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${statusColors[booking.status]}`}>
                                {booking.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleFindProvidersForEvent(eventDetailsModal)}
                      className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition-all shadow-md font-semibold"
                    >
                      <Search className="w-5 h-5" />
                      <span>Find Providers for this Event</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Provider Search Modal */}
            {providerSearchModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">Find Providers</h2>
                        <p className="text-sm text-gray-600 mt-1">
                          Booking for: <span className="font-semibold text-purple-600">{providerSearchModal.name}</span>
                        </p>
                      </div>
                      <button
                        onClick={() => setProviderSearchModal(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search providers by name or description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    {/* Category Filter Pills */}
                    {providerSearchModal.servicesNeeded && providerSearchModal.servicesNeeded.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Filter by services you need:</p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleCategoryFilter(null)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedCategory === null
                              ? 'bg-purple-600 text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                          >
                            All Providers
                          </button>
                          {serviceCategories
                            .filter(cat => providerSearchModal.servicesNeeded.includes(cat.name))
                            .map((category) => {
                              const Icon = getIconForCategory(category.name);
                              return (
                                <button
                                  key={category.serviceCategoryId}
                                  onClick={() => handleCategoryFilter(category.serviceCategoryId)}
                                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedCategory === category.serviceCategoryId
                                    ? 'bg-purple-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                  <Icon className="w-4 h-4" />
                                  <span>{category.name}</span>
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    {providersLoading ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                        <p className="text-gray-600 mt-4">Loading providers...</p>
                      </div>
                    ) : filteredProviders.length === 0 ? (
                      <div className="text-center py-12">
                        <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg mb-2">No providers found</p>
                        <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredProviders.map((provider) => {
                          const Icon = getIconForCategory(provider.categoryName);
                          return (
                            <div
                              key={provider.providerId}
                              className="border border-gray-200 rounded-lg p-5 hover:border-purple-300 hover:shadow-md transition-all"
                            >
                              <div className="flex items-start space-x-4 mb-4">
                                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                                  <Icon className="w-8 h-8 text-white" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-semibold text-gray-800 text-lg">{provider.businessName}</h3>
                                  <p className="text-sm text-purple-600 font-medium">{provider.categoryName}</p>
                                  {provider.location && (
                                    <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
                                      <MapPin className="w-3 h-3" />
                                      <span>{provider.location}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {provider.description && (
                                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{provider.description}</p>
                              )}

                              <div className="flex items-center justify-between mb-4">
                                {provider.pricingDetails && (
                                  <div className="text-sm">
                                    <p className="text-gray-500">Pricing</p>
                                    <p className="font-semibold text-gray-800">{provider.pricingDetails}</p>
                                  </div>
                                )}
                                <div className="flex items-center space-x-1">
                                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                  <span className="text-sm font-medium">{provider.rating || '5.0'}</span>
                                  <span className="text-xs text-gray-500">({provider.reviewCount || 0})</span>
                                </div>
                              </div>

                              <button
                                onClick={() => handleBookProvider(provider)}
                                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition-all shadow-md font-medium"
                              >
                                <CheckCircle className="w-4 h-4" />
                                <span>Book Now</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {filteredProviders.length > 0 && (
                      <div className="mt-6 text-center text-sm text-gray-500">
                        Showing {filteredProviders.length} provider{filteredProviders.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            {editEventModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">Edit Event</h2>
                    <button
                      onClick={() => setEditEventModal(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <form onSubmit={handleUpdateEvent} className="p-6">
                    <div className="space-y-4">
                      {/* Event Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Event Name *
                        </label>
                        <input
                          type="text"
                          value={editFormData.name}
                          onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        />
                      </div>

                      {/* Event Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Event Type *
                        </label>
                        <select
                          value={editFormData.eventType}
                          onChange={(e) => setEditFormData({ ...editFormData, eventType: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        >
                          <option value="">Select Type</option>
                          <option value="Wedding">Wedding</option>
                          <option value="Birthday">Birthday</option>
                          <option value="Corporate">Corporate</option>
                          <option value="Conference">Conference</option>
                          <option value="Party">Party</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {/* Date & Time */}
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date *
                          </label>
                          <input
                            type="date"
                            value={editFormData.date}
                            onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start Time *
                          </label>
                          <input
                            type="time"
                            value={editFormData.startTime}
                            onChange={(e) => setEditFormData({ ...editFormData, startTime: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            End Time *
                          </label>
                          <input
                            type="time"
                            value={editFormData.endTime}
                            onChange={(e) => setEditFormData({ ...editFormData, endTime: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            required
                          />
                        </div>
                      </div>

                      {/* Location */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Location *
                        </label>
                        <input
                          type="text"
                          value={editFormData.location}
                          onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        />
                      </div>

                      {/* Full Address */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Address
                        </label>
                        <textarea
                          value={editFormData.fullAddress}
                          onChange={(e) => setEditFormData({ ...editFormData, fullAddress: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          rows="2"
                        />
                      </div>

                      {/* Expected Guests */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expected Guests *
                        </label>
                        <input
                          type="number"
                          value={editFormData.expectedGuests}
                          onChange={(e) => setEditFormData({ ...editFormData, expectedGuests: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                          min="1"
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={editFormData.description}
                          onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          rows="3"
                        />
                      </div>

                      {/* Services Needed */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Services Needed *
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {serviceCategories.map((category) => (
                            <label key={category.serviceCategoryId} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editFormData.serviceCategoryIds.includes(category.serviceCategoryId)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setEditFormData({
                                      ...editFormData,
                                      serviceCategoryIds: [...editFormData.serviceCategoryIds, category.serviceCategoryId]
                                    });
                                  } else {
                                    setEditFormData({
                                      ...editFormData,
                                      serviceCategoryIds: editFormData.serviceCategoryIds.filter(id => id !== category.serviceCategoryId)
                                    });
                                  }
                                }}
                                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                              />
                              <span className="text-sm text-gray-700">{category.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => setEditEventModal(null)}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition-all shadow-md"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Delete Event Confirmation Modal */}
            {deleteConfirmModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl max-w-md w-full p-6">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>

                  <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">Delete Event?</h2>
                  <p className="text-gray-600 text-center mb-6">
                    Are you sure you want to delete "<span className="font-semibold">{deleteConfirmModal.name}</span>"?
                    This action cannot be undone.
                  </p>

                  {deleteConfirmModal.bookingCount > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">Warning</p>
                          <p className="text-sm text-yellow-700 mt-1">
                            This event has {deleteConfirmModal.bookingCount} active {deleteConfirmModal.bookingCount === 1 ? 'booking' : 'bookings'}.
                            Deleting will affect these bookings.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setDeleteConfirmModal(null)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteEvent}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium shadow-md"
                    >
                      Delete Event
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Cancel Booking Confirmation Modal */}
            {cancelBookingModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl max-w-md w-full p-6">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mx-auto mb-4">
                    <X className="w-8 h-8 text-orange-600" />
                  </div>

                  <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">Cancel Booking?</h2>
                  <p className="text-gray-600 text-center mb-2">
                    Are you sure you want to cancel your booking with
                    <span className="font-semibold"> {cancelBookingModal.providerBusinessName}</span>?
                  </p>

                  <div className="bg-gray-50 rounded-lg p-4 mb-6 mt-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Event:</span>
                        <span className="font-medium text-gray-800">{cancelBookingModal.eventName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium text-gray-800">
                          {new Date(cancelBookingModal.eventDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${statusColors[cancelBookingModal.status]}`}>
                          {cancelBookingModal.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-blue-700">
                        The provider will be notified of the cancellation.
                        You can book another provider for this event at any time.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setCancelBookingModal(null)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
                    >
                      Keep Booking
                    </button>
                    <button
                      onClick={handleCancelBooking}
                      className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all font-medium shadow-md"
                    >
                      Cancel Booking
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Review Modal */}
            {reviewModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl max-w-lg w-full">
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-400 px-6 py-4 rounded-t-xl">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-2xl font-bold text-white">Leave a Review</h2>
                        <p className="text-yellow-50 text-sm mt-1">Share your experience</p>
                      </div>
                      <button
                        onClick={() => setReviewModal(null)}
                        className="text-white hover:text-yellow-100"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleSubmitReview} className="p-6">
                    {/* Provider Info */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <div className="flex items-start space-x-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{reviewModal.providerBusinessName}</h3>
                          <p className="text-sm text-gray-600 mt-1">Event: {reviewModal.eventName}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(reviewModal.eventDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Rating *
                      </label>
                      <div className="flex items-center justify-center space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewFormData({ ...reviewFormData, rating: star })}
                            className="focus:outline-none transform hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`w-10 h-10 ${star <= reviewFormData.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                                }`}
                            />
                          </button>
                        ))}
                      </div>
                      <p className="text-center text-sm text-gray-600 mt-2">
                        {reviewFormData.rating === 1 && '😞 Poor'}
                        {reviewFormData.rating === 2 && '😕 Fair'}
                        {reviewFormData.rating === 3 && '😊 Good'}
                        {reviewFormData.rating === 4 && '😃 Very Good'}
                        {reviewFormData.rating === 5 && '🤩 Excellent'}
                      </p>
                    </div>

                    {/* Comment */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Review (Optional)
                      </label>
                      <textarea
                        value={reviewFormData.comment}
                        onChange={(e) => setReviewFormData({ ...reviewFormData, comment: e.target.value })}
                        placeholder="Tell us about your experience with this provider..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
                        rows="4"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Share details about the service quality, professionalism, and overall experience.
                      </p>
                    </div>

                    {/* Tips */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-900">Review Tips</p>
                          <ul className="text-xs text-blue-700 mt-2 space-y-1 list-disc list-inside">
                            <li>Be honest and constructive</li>
                            <li>Mention specific aspects of the service</li>
                            <li>Your review helps other customers make informed decisions</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={() => setReviewModal(null)}
                        className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-lg hover:opacity-90 transition-all font-medium shadow-md"
                      >
                        Submit Review
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Messages Tab Placeholder */}
            {activeTab === 'messages' && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="text-center py-16">
                  <MessageSquare className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Messages</h2>
                  <p className="text-gray-500 mb-4">Coming soon! Chat with your service providers.</p>
                </div>
              </div>
            )}

            {/* Favorites Tab Placeholder */}
            {activeTab === 'favorites' && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="text-center py-16">
                  <Heart className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Favorite Providers</h2>
                  <p className="text-gray-500 mb-4">Save your favorite providers for quick access.</p>
                </div>
              </div>
            )}

            {/* Settings Tab Placeholder */}
            {activeTab === 'settings' && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="text-center py-16">
                  <Settings className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Settings</h2>
                  <p className="text-gray-500 mb-4">Manage your account settings and preferences.</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div >
    </div >
  );
}