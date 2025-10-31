import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { Bell, Send, X, Users, Building2, User, ArrowLeft } from 'lucide-react';

// Helper function to get data from storage
const getStorageItem = (key) => {
  return localStorage.getItem(key) || sessionStorage.getItem(key);
};

export default function CreateNotificationForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetFromUrl = searchParams.get('target') || 'all';
  
  const [recipientType, setRecipientType] = useState(targetFromUrl);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  // Check authentication
  useEffect(() => {
    const token = getStorageItem('token') || getStorageItem('authToken');
    const role = getStorageItem('userRole');
    
    if (!token || (role !== 'admin' && role !== 'systemadmin')) {
      navigate('/login');
    }
  }, [navigate]);

  const handleSend = async () => {
    setError('');

    // Validation
    if (!title.trim()) {
      setError('Please enter a notification title');
      return;
    }

    if (title.length < 3) {
      setError('Title must be at least 3 characters long');
      return;
    }

    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    if (message.length < 10) {
      setError('Message must be at least 10 characters long');
      return;
    }

    setIsSending(true);

    try {
      const response = await apiClient.post('/api/Notifications/bulk', {
        title: title.trim(),
        message: message.trim(),
        recipientType: recipientType,
      });

      if (response.status === 200) {
        const recipientLabel =
          recipientType === 'all'
            ? 'all users'
            : recipientType === 'providers'
            ? 'all service providers'
            : 'all customers';

        alert(`✅ Notification sent successfully to ${recipientLabel}!\n\nRecipients: ${response.data.recipientCount} users`);
        
        // Reset form and go back
        setTitle('');
        setMessage('');
        navigate('/AdminDashboard');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      setError(error.response?.data?.message || 'Failed to send notification. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const recipientOptions = [
    {
      value: 'all',
      label: 'All Users',
      description: 'Send to all customers and providers',
      icon: Users,
      color: 'from-purple-500 to-indigo-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-500',
      textColor: 'text-purple-600',
    },
    {
      value: 'providers',
      label: 'Service Providers',
      description: 'Send to all service providers only',
      icon: Building2,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-500',
      textColor: 'text-orange-600',
    },
    {
      value: 'customers',
      label: 'Customers',
      description: 'Send to all customers only',
      icon: User,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-500',
      textColor: 'text-blue-600',
    },
  ];

  const selectedOption = recipientOptions.find(opt => opt.value === recipientType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/AdminDashboard')}
            className="inline-flex items-center text-gray-600 hover:text-purple-600 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            Back to Dashboard
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Send Notification</h1>
              <p className="text-gray-600">Create and broadcast messages to users</p>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Recipient Type Selection */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Select Recipients *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recipientOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = recipientType === option.value;
                
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRecipientType(option.value)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? `${option.borderColor} ${option.bgColor} shadow-md`
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${option.color} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className={`font-semibold ${isSelected ? option.textColor : 'text-gray-700'}`}>
                          {option.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Recipient Info */}
          {selectedOption && (
            <div className={`mb-6 p-4 rounded-lg border-2 ${selectedOption.borderColor} ${selectedOption.bgColor}`}>
              <div className="flex items-center gap-3">
                <selectedOption.icon className={`w-6 h-6 ${selectedOption.textColor}`} />
                <div>
                  <p className="text-sm font-medium text-gray-700">Sending notification to:</p>
                  <p className={`font-bold ${selectedOption.textColor}`}>{selectedOption.label}</p>
                </div>
              </div>
            </div>
          )}

          {/* Title Input */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notification Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Platform Maintenance, New Feature Available, Important Update"
              maxLength={100}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                error && !title.trim()
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-gray-200 focus:border-purple-500'
              }`}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">
                {title.length} / 100 characters {title.length > 0 && title.length < 3 && '(minimum 3)'}
              </p>
            </div>
          </div>

          {/* Message Input */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notification Message *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your notification message here..."
              rows={8}
              maxLength={500}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors resize-none ${
                error && !message.trim()
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-gray-200 focus:border-purple-500'
              }`}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">
                {message.length} / 500 characters {message.length > 0 && message.length < 10 && '(minimum 10)'}
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm flex items-center gap-2">
                <X className="w-4 h-4" />
                {error}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/AdminDashboard')}
              disabled={isSending}
              className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={
                isSending || 
                !title.trim() || 
                title.length < 3 || 
                !message.trim() || 
                message.length < 10 || 
                message.length > 500
              }
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              {isSending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Notification
                </>
              )}
            </button>
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> This notification will be sent to all users in the selected category. 
              Recipients will see this message in their notification center.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}