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
  Package
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
  
  // Data states
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState({
    pendingBookings: 0,
    monthlyEarnings: 0,
    averageRating: 0,
    activeServices: 0,
  });

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
        setProviderId(user.id || user.providerId || user.userId);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    // Check if user is authenticated
    const token = getStorageItem('token') || getStorageItem('authToken');
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
      const allBookings = bookingsResponse.data;
      setBookings(allBookings);

      // Fetch provider services
      const servicesResponse = await apiClient.get('/ProviderServices/my-services');
      const allServices = servicesResponse.data;
      setServices(allServices);

      // Calculate stats
      const pending = allBookings.filter(b => b.status === 'Pending').length;
      const confirmed = allBookings.filter(b => b.status === 'Confirmed');
      
      // Calculate monthly earnings (sum of confirmed bookings)
      const monthlyEarnings = confirmed.reduce((sum, booking) => {
        return sum + (parseFloat(booking.totalCost) || 0);
      }, 0);

      // Calculate average rating from services
      const totalRating = allServices.reduce((sum, service) => sum + (service.rating || 0), 0);
      const avgRating = allServices.length > 0 ? (totalRating / allServices.length).toFixed(1) : 0;

      setStats({
        pendingBookings: pending,
        monthlyEarnings: monthlyEarnings,
        averageRating: parseFloat(avgRating),
        activeServices: allServices.filter(s => s.isActive || s.status === 'Active').length,
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

  const pendingBookings = bookings.filter(b => b.status === 'Pending');
  const confirmedBookings = bookings.filter(b => b.status === 'Confirmed');

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
              <button 
                onClick={() => navigate('/notifications')}
                className="relative text-gray-600 hover:text-purple-600 transition-colors"
              >
                <Bell className="w-6 h-6" />
                {pendingBookings.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {pendingBookings.length}
                  </span>
                )}
              </button>
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
            <div className="text-3xl font-bold text-orange-600">{stats.pendingBookings}</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting response</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600 text-sm font-medium">Monthly Earnings</span>
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-green-600">R{stats.monthlyEarnings.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">This month's revenue</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600 text-sm font-medium">Average Rating</span>
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-yellow-600">{stats.averageRating}</div>
            <p className="text-xs text-gray-500 mt-1">Based on reviews</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600 text-sm font-medium">Active Services</span>
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-purple-600">{stats.activeServices}</div>
            <p className="text-xs text-gray-500 mt-1">Services available</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-md p-1 inline-flex">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                activeTab === 'bookings'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Booking Requests
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                activeTab === 'calendar'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                activeTab === 'services'
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
            {/* Pending Requests */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800">Pending Booking Requests</h2>
                <p className="text-gray-600 text-sm">Review and respond to new booking requests</p>
              </div>

              {pendingBookings.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No pending booking requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingBookings.map((booking) => (
                    <div key={booking.id} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-all">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 text-lg mb-3">{booking.eventName || 'Event Booking'}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span>{booking.customerName || 'Customer'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span>{booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString() : 'TBD'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span>{booking.startTime || 'TBD'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="truncate">{booking.location || 'TBD'}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(booking.status)}`}>
                              {booking.status}
                            </span>
                            {booking.totalCost && (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                                R{parseFloat(booking.totalCost).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => handleBookingAction(booking.id, 'decline')}
                            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-2 transition-all"
                          >
                            <XCircle className="w-4 h-4" />
                            Decline
                          </button>
                          <button
                            onClick={() => handleBookingAction(booking.id, 'accept')}
                            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 flex items-center gap-2 transition-all"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Accept
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirmed Bookings */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800">Confirmed Bookings</h2>
                <p className="text-gray-600 text-sm">Your upcoming confirmed events</p>
              </div>

              {confirmedBookings.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No confirmed bookings yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {confirmedBookings.map((booking) => (
                    <div key={booking.id} className="border border-green-200 bg-green-50 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 text-lg mb-3">{booking.eventName || 'Event Booking'}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span>{booking.customerName || 'Customer'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span>{booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString() : 'TBD'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span>{booking.startTime || 'TBD'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="truncate">{booking.location || 'TBD'}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-600 text-white">
                              Confirmed
                            </span>
                            {booking.totalCost && (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white text-green-800 border border-green-200">
                                R{parseFloat(booking.totalCost).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Contact
                          </button>
                          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Message
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800">Calendar View</h2>
              <p className="text-gray-600 text-sm">Your schedule and availability</p>
            </div>
            <div className="h-96 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
              <div className="text-center">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Calendar integration coming soon</p>
              </div>
            </div>
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
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          service.isActive || service.status === 'Active'
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