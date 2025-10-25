import React, { useState } from 'react';
import { Calendar, Clock, MapPin, DollarSign, User, Bell, Search, Plus, CheckCircle, XCircle, AlertCircle, MessageSquare, Heart, Star, Menu, X, LogOut, Settings, ChevronRight } from 'lucide-react';

export default function CustomerDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const stats = [
    { icon: Calendar, label: 'Upcoming Events', value: '3', color: 'from-purple-500 to-indigo-500' },
    { icon: Clock, label: 'Pending Bookings', value: '2', color: 'from-yellow-500 to-orange-500' },
    { icon: CheckCircle, label: 'Completed Events', value: '12', color: 'from-green-500 to-emerald-500' },
    { icon: Heart, label: 'Favorite Providers', value: '8', color: 'from-pink-500 to-rose-500' },
  ];

  const upcomingEvents = [
    { id: 1, name: 'Wedding Anniversary', date: '2025-06-15', location: 'Grand Plaza Hotel', services: 'DJ, Catering, Photography', status: 'confirmed', budget: '$5,000' },
    { id: 2, name: 'Birthday Party', date: '2025-07-03', location: 'Home', services: 'Catering, Decoration', status: 'pending', budget: '$1,500' },
    { id: 3, name: 'Corporate Meeting', date: '2025-08-22', location: 'Business Center', services: 'Catering, Audio/Visual', status: 'draft', budget: '$3,000' },
  ];

  const recentProviders = [
    { id: 1, name: 'Elite Catering', category: 'Catering', rating: 4.5, reviews: 120, image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=100&h=100&fit=crop' },
    { id: 2, name: 'DJ Groove Masters', category: 'DJ & Music', rating: 4.0, reviews: 85, image: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=100&h=100&fit=crop' },
    { id: 3, name: 'Capture Moments Photography', category: 'Photography', rating: 5.0, reviews: 42, image: 'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=100&h=100&fit=crop' },
  ];

  const recentActivity = [
    { id: 1, type: 'confirmed', message: 'Booking confirmed for DJ Groove Masters', time: 'Today, 10:30 AM', icon: CheckCircle, color: 'text-green-600' },
    { id: 2, type: 'updated', message: 'Updated Wedding Anniversary event details', time: 'Yesterday, 3:45 PM', icon: AlertCircle, color: 'text-blue-600' },
    { id: 3, type: 'pending', message: 'Sent booking request to Elite Catering', time: 'June 5, 2025, 2:15 PM', icon: Clock, color: 'text-yellow-600' },
    { id: 4, type: 'created', message: 'Created new event: Birthday Party', time: 'June 3, 2025, 9:20 AM', icon: Plus, color: 'text-purple-600' },
  ];

  const notifications = [
    { id: 1, message: 'DJ Groove Masters accepted your booking', time: '2 hours ago', read: false },
    { id: 2, message: 'Your payment for Elite Catering was processed', time: '1 day ago', read: false },
    { id: 3, message: 'Reminder: Wedding Anniversary in 5 days', time: '2 days ago', read: true },
  ];

  const statusColors = {
    confirmed: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    draft: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
  };

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
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  2
                </span>
              </button>
              <div className="flex items-center space-x-2 cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                  JD
                </div>
                <span className="hidden md:inline text-gray-700 font-medium">John Doe</span>
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
            <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all mt-8">
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
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome back, John! 👋</h1>
              <p className="text-gray-600">Here's what's happening with your events today.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, index) => (
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
                  <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition-all shadow-md">
                    <Plus className="w-4 h-4" />
                    <span>Create Event</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-800 text-lg">{event.name}</h3>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(event.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{event.location}</span>
                            </div>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[event.status]}`}>
                          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Services:</span> {event.services}
                        </div>
                        <div className="flex items-center space-x-1 text-purple-600 font-semibold">
                          <DollarSign className="w-4 h-4" />
                          <span>{event.budget}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Recent Activity</h2>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex space-x-3">
                      <div className={`w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0`}>
                        <activity.icon className={`w-4 h-4 ${activity.color}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">{activity.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Providers */}
            <div className="mt-6 bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Recent Service Providers</h2>
                <button className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center space-x-1">
                  <span>View All</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recentProviders.map((provider) => (
                  <div
                    key={provider.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <img
                        src={provider.image}
                        alt={provider.name}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{provider.name}</h3>
                        <p className="text-xs text-gray-500">{provider.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium">{provider.rating}</span>
                        <span className="text-xs text-gray-500">({provider.reviews})</span>
                      </div>
                      <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}