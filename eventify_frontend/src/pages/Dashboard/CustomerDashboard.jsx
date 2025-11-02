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

  // Data states
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [providers, setProviders] = useState([]);
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

            <div className="flex items-center space-x-4">
              <button className="relative text-gray-600 hover:text-purple-600 transition-colors">
                <Bell className="w-6 h-6" />
                {stats.pendingBookings > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                    {stats.pendingBookings}
                  </span>
                )}
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold shadow-md">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:inline text-gray-700 font-medium">{userName}</span>
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

                {events.length === 0 ? (
                  <div className="text-center py-16 bg-gray-50 rounded-lg">
                    <Calendar className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg mb-2">No events yet</p>
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
                    {events.map((event) => (
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
                          <button
                            onClick={() => handleViewEventDetails(event)}
                            className="flex items-center space-x-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-all"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="font-medium">View Details</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Bookings */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Recent Bookings</h2>
                {bookings.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-sm">No bookings yet</p>
                    <p className="text-xs text-gray-400 mt-2">Create an event first, then book providers</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.slice(0, 5).map((booking) => (
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
          </div>
        </main>
      </div>

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
    </div>
  );
}