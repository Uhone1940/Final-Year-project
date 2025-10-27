import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { Calendar, Clock, MapPin, DollarSign, Bell, Search, Plus, CheckCircle, AlertCircle, MessageSquare, Heart, Star, Menu, LogOut, Settings, ChevronRight } from 'lucide-react';

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
  
  // Get user info from storage
  const [userName, setUserName] = useState('');
  
  // Data states
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [providers, setProviders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({
    upcomingEvents: 0,
    pendingBookings: 0,
    completedEvents: 0,
    favoriteProviders: 0,
  });

  // Load user info on mount
  useEffect(() => {
    const storedUserName = getStorageItem('userName');
    if (storedUserName) {
      setUserName(storedUserName);
    } else {
      // If no userName found, try to get from user object
      const userObj = getStorageItem('user');
      if (userObj) {
        try {
          const user = JSON.parse(userObj);
          const name = user.fullName || user.name || user.email || 'User';
          setUserName(name);
        } catch (e) {
          setUserName('User');
        }
      } else {
        setUserName('User');
      }
    }
  }, []);

  // Fetch all dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch events
      const eventsResponse = await apiClient.get('/Events');
      const allEvents = eventsResponse.data;
      
      // Filter upcoming events (events in the future)
      const today = new Date();
      const upcomingEvents = allEvents.filter(event => new Date(event.eventDate) >= today);
      
      // Filter completed events (events in the past)
      const completedEvents = allEvents.filter(event => new Date(event.eventDate) < today);
      
      setEvents(upcomingEvents);

      // Fetch bookings
      const bookingsResponse = await apiClient.get('/Bookings/my-bookings');
      const allBookings = bookingsResponse.data;
      
      // Filter pending bookings
      const pendingBookings = allBookings.filter(b => b.status === 'Pending' || b.status === 'pending');
      
      setBookings(allBookings);

      // Fetch providers (top 3 for recent providers section)
      const providersResponse = await apiClient.get('/Providers?page=1&pageSize=3');
      setProviders(providersResponse.data.items || providersResponse.data);

      // Fetch notifications
      try {
        const notificationsResponse = await apiClient.get('/Notifications/me');
        setNotifications(notificationsResponse.data);
      } catch (error) {
        console.log('Notifications not available:', error);
        setNotifications([]);
      }

      // Calculate stats
      setStats({
        upcomingEvents: upcomingEvents.length,
        pendingBookings: pendingBookings.length,
        completedEvents: completedEvents.length,
        favoriteProviders: 0, // You can implement favorites later
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (error.response?.status === 401) {
        // Token expired or invalid, redirect to login
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // Remove from both storages
    removeStorageItem('token');
    removeStorageItem('authToken');
    removeStorageItem('user');
    removeStorageItem('userName');
    removeStorageItem('userEmail');
    removeStorageItem('userRole');
    navigate('/login');
  };

  const handleCreateEvent = () => {
    navigate('/create-event');
  };

  const statusColors = {
    confirmed: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    draft: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
    Confirmed: 'bg-green-100 text-green-800',
    Pending: 'bg-yellow-100 text-yellow-800',
    Draft: 'bg-gray-100 text-gray-800',
    Cancelled: 'bg-red-100 text-red-800',
  };

  const statsData = [
    { icon: Calendar, label: 'Upcoming Events', value: stats.upcomingEvents, color: 'from-purple-500 to-indigo-500' },
    { icon: Clock, label: 'Pending Bookings', value: stats.pendingBookings, color: 'from-yellow-500 to-orange-500' },
    { icon: CheckCircle, label: 'Completed Events', value: stats.completedEvents, color: 'from-green-500 to-emerald-500' },
    { icon: Heart, label: 'Favorite Providers', value: stats.favoriteProviders, color: 'from-pink-500 to-rose-500' },
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
            {/* Logo */}
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="mr-4 lg:hidden text-gray-600 hover:text-purple-600"
              >
                <Menu className="w-6 h-6" />
              </button>
              <Calendar className="w-8 h-8 text-purple-600 mr-2" />
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Eventify
              </span>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search events, providers..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              <button className="relative text-gray-600 hover:text-purple-600">
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
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white shadow-xl transition-transform duration-300 ease-in-out mt-16 lg:mt-0`}
        >
          <nav className="p-4 space-y-2">
            {[
              { id: 'overview', icon: Calendar, label: 'Dashboard' },
              { id: 'events', icon: Calendar, label: 'My Events' },
              { id: 'providers', icon: Search, label: 'Find Providers' },
              { id: 'bookings', icon: CheckCircle, label: 'Bookings' },
              { id: 'messages', icon: MessageSquare, label: 'Messages' },
              { id: 'favorites', icon: Heart, label: 'Favorites' },
              { id: 'settings', icon: Settings, label: 'Settings' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === item.id
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
        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Welcome back, {userName}! 👋
              </h1>
              <p className="text-gray-600">Here's what's happening with your events today.</p>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Upcoming Events */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Upcoming Events</h2>
                  <button 
                    onClick={handleCreateEvent}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition-all shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Event</span>
                  </button>
                </div>

                {events.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No upcoming events</p>
                    <button 
                      onClick={handleCreateEvent}
                      className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
                    >
                      Create your first event
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {events.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-800 text-lg">{event.eventName}</h3>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(event.eventDate).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MapPin className="w-4 h-4" />
                                <span>{event.location || 'TBD'}</span>
                              </div>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[event.status] || 'bg-gray-100 text-gray-800'}`}>
                            {event.status}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Type:</span> {event.eventType}
                          </div>
                          {event.budget && (
                            <div className="flex items-center space-x-1 text-purple-600 font-semibold">
                              <DollarSign className="w-4 h-4" />
                              <span>{event.budget}</span>
                            </div>
                          )}
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
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.slice(0, 4).map((booking) => (
                      <div key={booking.id} className="flex space-x-3 border-b border-gray-100 pb-3 last:border-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          booking.status === 'Confirmed' ? 'bg-green-100' : 
                          booking.status === 'Pending' ? 'bg-yellow-100' : 'bg-gray-100'
                        }`}>
                          {booking.status === 'Confirmed' ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Clock className="w-4 h-4 text-yellow-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">Booking #{booking.id}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(booking.bookingDate).toLocaleDateString()}
                          </p>
                          <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-semibold ${statusColors[booking.status]}`}>
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Providers */}
            <div className="mt-6 bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Service Providers</h2>
                <button 
                  onClick={() => navigate('/providers')}
                  className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center space-x-1"
                >
                  <span>View All</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {providers.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No providers available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {providers.map((provider) => (
                    <div
                      key={provider.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                          {provider.businessName?.charAt(0).toUpperCase() || 'P'}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{provider.businessName}</h3>
                          <p className="text-xs text-gray-500">{provider.category || 'Service Provider'}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium">{provider.rating || '5.0'}</span>
                        </div>
                        <button 
                          onClick={() => navigate(`/providers/${provider.id}`)}
                          className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}