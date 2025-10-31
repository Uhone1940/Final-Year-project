import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { 
  Users, 
  Activity,
  TrendingUp,
  Eye,
  Trash2,
  MoreHorizontal,
  FileText,
  Bell,
  Download,
  BarChart,
  LogOut,
  Shield,
  ShieldOff,
  Calendar,
  Building2,
  User
} from 'lucide-react';

// Helper function to get data from storage
const getStorageItem = (key) => {
  return localStorage.getItem(key) || sessionStorage.getItem(key);
};

// Helper function to remove data from storage
const removeStorageItem = (key) => {
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [notificationTarget, setNotificationTarget] = useState('all');
  
  // Data states
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [providers, setProviders] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    activeProviders: 0,
    growthRate: 0,
  });

  // Load user info and fetch data
  useEffect(() => {
    const storedUserName = getStorageItem('userName');
    if (storedUserName) {
      setUserName(storedUserName);
    }

    // Check authentication
    const token = getStorageItem('token') || getStorageItem('authToken');
    if (!token) {
      navigate('/login');
    }

    fetchDashboardData();
  }, [navigate]);

const fetchDashboardData = async () => {
  setLoading(true);
  try {
    let allUsers = [];
    let allEvents = [];
    let allProviders = [];

    // Fetch all users with error handling
    try {
      const usersResponse = await apiClient.get('/api/Users');
      allUsers = usersResponse.data;
      setUsers(allUsers);
      console.log('All users fetched:', allUsers);
    } catch (userError) {
      console.error('Error fetching users:', userError);
    }

    // Fetch all events with error handling
    try {
      const eventsResponse = await apiClient.get('/api/Events');
      allEvents = eventsResponse.data;
      setEvents(allEvents);
      console.log('All events fetched:', allEvents);
    } catch (eventError) {
      console.warn('Events endpoint not available:', eventError);
      // Continue without events data
    }

    // Fetch all providers with error handling
    try {
      const providersResponse = await apiClient.get('/api/Providers');
      allProviders = providersResponse.data.items || providersResponse.data;
      setProviders(allProviders);
      console.log('All providers fetched:', allProviders);
    } catch (providerError) {
      console.warn('Providers endpoint not available:', providerError);
      // Continue without providers data
    }

    // Calculate statistics from the fetched data
    const providerUsers = allUsers.filter(u => 
      u.role?.toLowerCase() === 'eventserviceprovider' || 
      u.role?.toLowerCase() === 'provider'
    );
    
    const activeProviderUsers = providerUsers.filter(p => !p.isSuspended);
    
    console.log('Provider users:', providerUsers.length);
    console.log('Active provider users:', activeProviderUsers.length);
    console.log('Total users:', allUsers.length);

    // Fetch statistics from the dedicated endpoint
    try {
      const statsResponse = await apiClient.get('/api/Users/statistics');
      const statsData = statsResponse.data;
      
      console.log('Statistics from backend:', statsData);
      
      setStats({
        totalUsers: statsData.totalUsers || allUsers.length,
        totalEvents: allEvents.length,
        activeProviders: statsData.providerCount || activeProviderUsers.length,
        growthRate: statsData.growthRate || 0,
      });
    } catch (statsError) {
      // Fallback to calculating stats manually if endpoint fails
      console.warn('Statistics endpoint not available, calculating manually:', statsError);
      
      setStats({
        totalUsers: allUsers.length,
        totalEvents: allEvents.length,
        activeProviders: activeProviderUsers.length,
        growthRate: 0,
      });
    }

  } catch (error) {
    console.error('Critical error in fetchDashboardData:', error);
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

  const handleViewUser = (userId) => {
    navigate(`/admin/user/${userId}`);
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiClient.delete(`/api/Users/${userId}`);
      alert('User deleted successfully');
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSuspendUser = async (userId, userName, currentStatus) => {
    const action = currentStatus ? 'unsuspend' : 'suspend';
    if (!window.confirm(`Are you sure you want to ${action} user "${userName}"?`)) {
      return;
    }

    try {
      await apiClient.put(`/api/Users/${userId}/${action}`);
      alert(`User ${action}ed successfully`);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      alert(`Failed to ${action} user: ` + (error.response?.data?.message || error.message));
    }
  };

  const getBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'suspended':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
      case 'systemadmin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'customer':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'provider':
      case 'eventserviceprovider':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get recent users (last 4)
  const recentUsers = users.slice(-4).reverse();

  const statsData = [
    { 
      title: "Total Users", 
      value: stats.totalUsers.toString(), 
      change: "+0%", 
      icon: Users, 
      color: "text-purple-600" 
    },
    { 
      title: "Total Events", 
      value: stats.totalEvents.toString(), 
      change: "+0%", 
      icon: Calendar, 
      color: "text-blue-600" 
    },
    { 
      title: "Active Providers", 
      value: stats.activeProviders.toString(), 
      change: "+0%", 
      icon: Building2, 
      color: "text-emerald-600" 
    },
    { 
      title: "Growth Rate", 
      value: `${stats.growthRate >= 0 ? '+' : ''}${stats.growthRate}%`, 
      change: "vs last month", 
      icon: TrendingUp, 
      color: "text-orange-600",
      isGrowth: true
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Welcome back, {userName}! 👋</h1>
            <p className="text-gray-600">Manage your Eventify platform</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-lg font-semibold text-sm border border-purple-200">
              Administrator
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsData.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600 text-sm font-medium">{stat.title}</span>
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${
                  stat.color === 'text-purple-600' ? 'from-purple-100 to-purple-200' :
                  stat.color === 'text-blue-600' ? 'from-blue-100 to-blue-200' :
                  stat.color === 'text-emerald-600' ? 'from-emerald-100 to-emerald-200' :
                  'from-orange-100 to-orange-200'
                } flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-800">{stat.value}</div>
              <p className={`text-xs flex items-center mt-2 ${
                stat.isGrowth 
                  ? (stats.growthRate >= 0 ? 'text-emerald-600' : 'text-red-600')
                  : 'text-emerald-600'
              }`}>
                {stat.isGrowth && stats.growthRate >= 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : stat.isGrowth && stats.growthRate < 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1 rotate-180" />
                ) : (
                  <TrendingUp className="h-3 w-3 mr-1" />
                )}
                {stat.change}
              </p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md p-1 flex max-w-4xl">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-8 py-3 rounded-md font-medium transition-all ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 px-8 py-3 rounded-md font-medium transition-all ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex-1 px-8 py-3 rounded-md font-medium transition-all ${
              activeTab === 'reports'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Reports & Notifications
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Users */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800">Recent Users</h2>
                <p className="text-gray-600 text-sm">Latest user registrations</p>
              </div>
              <div className="space-y-4">
                {recentUsers.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No users yet</p>
                ) : (
                  recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                          {(user.fullName || user.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{user.fullName || 'Unknown'}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeClass(user.role)}`}>
                        {user.role}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Platform Activity */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800">Platform Activity</h2>
                <p className="text-gray-600 text-sm">Recent system updates</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Bell className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">New Users Registered</p>
                    <p className="text-sm text-gray-600">{recentUsers.length} new users joined today</p>
                    <p className="text-xs text-gray-500 mt-1">Just now</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">Events Created</p>
                    <p className="text-sm text-gray-600">{stats.totalEvents} total events on platform</p>
                    <p className="text-xs text-gray-500 mt-1">Updated today</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">Active Providers</p>
                    <p className="text-sm text-gray-600">{stats.activeProviders} service providers active</p>
                    <p className="text-xs text-gray-500 mt-1">Current status</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">User Management</h2>
              <p className="text-gray-600 text-sm">Manage all platform users</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Join Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {(user.fullName || user.email).charAt(0).toUpperCase()}
                            </div>
                            <span className="ml-3 font-medium text-gray-800">{user.fullName || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeClass(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                            user.isSuspended 
                              ? 'bg-red-100 text-red-800 border-red-200' 
                              : 'bg-green-100 text-green-800 border-green-200'
                          }`}>
                            {user.isSuspended ? 'Suspended' : 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="relative inline-block text-left">
                            <button
                              onClick={(e) => {
                                const menu = e.currentTarget.nextElementSibling;
                                menu.classList.toggle('hidden');
                              }}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <MoreHorizontal className="w-5 h-5 text-gray-600" />
                            </button>
                            <div className="hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                              <button
                                onClick={() => handleViewUser(user.id)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 rounded-t-lg"
                              >
                                <Eye className="w-4 h-4" />
                                View Details
                              </button>
                              <button
                                onClick={() => handleSuspendUser(user.id, user.fullName || user.email, user.isSuspended)}
                                className="w-full px-4 py-2 text-left text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-2"
                              >
                                {user.isSuspended ? (
                                  <>
                                    <ShieldOff className="w-4 h-4" />
                                    Unsuspend User
                                  </>
                                ) : (
                                  <>
                                    <Shield className="w-4 h-4" />
                                    Suspend User
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id, user.fullName || user.email)}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-b-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete User
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Platform Analytics */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800">Platform Analytics</h2>
                <p className="text-gray-600 text-sm">Key performance metrics</p>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-gray-800">Total Users</span>
                  </div>
                  <span className="font-bold text-purple-600 text-xl">{stats.totalUsers}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-gray-800">Total Events</span>
                  </div>
                  <span className="font-bold text-blue-600 text-xl">{stats.totalEvents}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5 text-emerald-600" />
                    <span className="font-medium text-gray-800">Active Providers</span>
                  </div>
                  <span className="font-bold text-emerald-600 text-xl">{stats.activeProviders}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                    <span className="font-medium text-gray-800">Growth Rate</span>
                  </div>
                  <span className={`font-bold text-xl ${
                    stats.growthRate >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {stats.growthRate >= 0 ? '+' : ''}{stats.growthRate}%
                  </span>
                </div>
              </div>
            </div>

            {/* Generate Reports */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800">Generate Reports</h2>
                <p className="text-gray-600 text-sm">Download detailed analytics</p>
              </div>
              <div className="space-y-3">
                <button className="w-full px-4 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-lg hover:border-purple-300 hover:bg-purple-50 flex items-center justify-center gap-2 transition-all">
                  <Download className="w-4 h-4" />
                  User Activity Report
                </button>
                <button className="w-full px-4 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-lg hover:border-purple-300 hover:bg-purple-50 flex items-center justify-center gap-2 transition-all">
                  <Download className="w-4 h-4" />
                  Provider Performance Report
                </button>
                <button className="w-full px-4 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-lg hover:border-purple-300 hover:bg-purple-50 flex items-center justify-center gap-2 transition-all">
                  <Download className="w-4 h-4" />
                  Platform Analytics Report
                </button>
              </div>
            </div>

            {/* Notification Management */}
            <div className="bg-white rounded-xl shadow-md p-6 lg:col-span-2">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800">Send Notifications</h2>
                <p className="text-gray-600 text-sm">Broadcast messages to users</p>
              </div>
              
              {/* Notification Target Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Select Target Audience</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setNotificationTarget('all')}
                    className={`px-4 py-4 rounded-lg border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                      notificationTarget === 'all'
                        ? 'border-purple-500 bg-purple-50 shadow-md'
                        : 'border-gray-200 hover:border-purple-300 bg-white'
                    }`}
                  >
                    <Users className={`w-6 h-6 ${notificationTarget === 'all' ? 'text-purple-600' : 'text-gray-600'}`} />
                    <span className={`font-medium ${notificationTarget === 'all' ? 'text-purple-600' : 'text-gray-700'}`}>
                      All Users
                    </span>
                    <span className="text-xs text-gray-500">{stats.totalUsers} users</span>
                  </button>
                  
                  <button
                    onClick={() => setNotificationTarget('providers')}
                    className={`px-4 py-4 rounded-lg border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                      notificationTarget === 'providers'
                        ? 'border-orange-500 bg-orange-50 shadow-md'
                        : 'border-gray-200 hover:border-orange-300 bg-white'
                    }`}
                  >
                    <Building2 className={`w-6 h-6 ${notificationTarget === 'providers' ? 'text-orange-600' : 'text-gray-600'}`} />
                    <span className={`font-medium ${notificationTarget === 'providers' ? 'text-orange-600' : 'text-gray-700'}`}>
                      Providers Only
                    </span>
                    <span className="text-xs text-gray-500">{stats.activeProviders} providers</span>
                  </button>
                  
                  <button
                    onClick={() => setNotificationTarget('customers')}
                    className={`px-4 py-4 rounded-lg border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                      notificationTarget === 'customers'
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-blue-300 bg-white'
                    }`}
                  >
                    <User className={`w-6 h-6 ${notificationTarget === 'customers' ? 'text-blue-600' : 'text-gray-600'}`} />
                    <span className={`font-medium ${notificationTarget === 'customers' ? 'text-blue-600' : 'text-gray-700'}`}>
                      Customers Only
                    </span>
                    <span className="text-xs text-gray-500">
                      {users.filter(u => u.role?.toLowerCase() === 'customer').length} customers
                    </span>
                  </button>
                </div>
              </div>

              {/* Selected Target Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Selected Target:</p>
                    <p className="text-lg font-bold text-gray-800 capitalize mt-1">
                      {notificationTarget === 'all' ? 'All Users' : 
                       notificationTarget === 'providers' ? 'Service Providers' : 'Customers'}
                    </p>
                  </div>
                  <Bell className={`w-8 h-8 ${
                    notificationTarget === 'all' ? 'text-purple-600' :
                    notificationTarget === 'providers' ? 'text-orange-600' : 'text-blue-600'
                  }`} />
                </div>
              </div>

              {/* Create Notification Button */}
              <button
                onClick={() => navigate(`/create-notification?target=${notificationTarget}`)}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 flex items-center justify-center gap-2 shadow-lg transition-all font-medium text-lg"
              >
                <Bell className="w-5 h-5" />
                Create Notification
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}