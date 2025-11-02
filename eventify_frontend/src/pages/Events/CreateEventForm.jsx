import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { Calendar, Clock, MapPin, Users, ChevronRight, ChevronLeft, PartyPopper, Heart, Building2, Shield, Camera, Music, UtensilsCrossed, X, Check } from 'lucide-react';

// Helper function to get data from either localStorage or sessionStorage
const getStorageItem = (key) => {
  return localStorage.getItem(key) || sessionStorage.getItem(key);
};

export default function CreateEventForm() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedServices, setSelectedServices] = useState([]);
  const [Categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    eventName: '',
    eventType: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    location: '',
    address: '',
    guestCount: 0,
    description: '',
  });

  // Fetch service categories from backend on mount
  useEffect(() => {
    fetchCategories();
    
    // Check if user is authenticated
    const token = getStorageItem('token') || getStorageItem('authToken');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get('/api/Categories');
      const categories = response.data;
      
      // Map backend categories to our UI
      const mappedCategories = categories.map(cat => ({
        id: cat.id,
        name: cat.categoryName || cat.name,
        description: cat.description || '',
        icon: getIconForCategory(cat.categoryName || cat.name),
        color: getColorForCategory(cat.categoryName || cat.name)
      }));
      
      setCategories(mappedCategories);
    } catch (error) {
      console.error('Error fetching service categories:', error);
      // Use fallback categories if API fails
      setCategories(fallbackCategories);
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
    return Building2; // default
  };

  const getColorForCategory = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('venue')) return 'from-blue-500 to-cyan-500';
    if (lowerName.includes('cater')) return 'from-green-500 to-emerald-500';
    if (lowerName.includes('photo')) return 'from-purple-500 to-pink-500';
    if (lowerName.includes('entertain')) return 'from-orange-500 to-red-500';
    if (lowerName.includes('decor')) return 'from-pink-500 to-rose-500';
    if (lowerName.includes('security')) return 'from-gray-700 to-gray-900';
    return 'from-indigo-500 to-purple-500'; // default
  };

  const fallbackCategories = [
    { id: 1, name: 'Venue', icon: Building2, description: 'Event spaces and locations', color: 'from-blue-500 to-cyan-500' },
    { id: 2, name: 'Catering', icon: UtensilsCrossed, description: 'Food and beverage services', color: 'from-green-500 to-emerald-500' },
    { id: 3, name: 'Photography', icon: Camera, description: 'Professional photography', color: 'from-purple-500 to-pink-500' },
    { id: 4, name: 'Entertainment', icon: Music, description: 'DJs, bands, performers', color: 'from-orange-500 to-red-500' },
    { id: 5, name: 'Decoration', icon: PartyPopper, description: 'Flowers and decor', color: 'from-pink-500 to-rose-500' },
    { id: 6, name: 'Security', icon: Shield, description: 'Security Services', color: 'from-gray-700 to-gray-900' },
  ];

  const eventTypes = [
    { value: 'Birthday Party', icon: PartyPopper, color: 'from-pink-500 to-rose-500' },
    { value: 'Wedding', icon: Heart, color: 'from-red-500 to-pink-500' },
    { value: 'Corporate Event', icon: Building2, color: 'from-blue-500 to-indigo-500' },
    { value: 'Concert', icon: Music, color: 'from-green-500 to-emerald-500' },
    { value: 'Anniversary', icon: Heart, color: 'from-purple-500 to-pink-500' },
    { value: 'Graduation', icon: PartyPopper, color: 'from-yellow-500 to-orange-500' },
    { value: 'Conference', icon: Building2, color: 'from-indigo-500 to-purple-500' },
    { value: 'Other', icon: Calendar, color: 'from-gray-500 to-slate-500' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const toggleService = (serviceId) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.eventName.trim()) newErrors.eventName = 'Event name is required';
      if (!formData.eventType) newErrors.eventType = 'Event type is required';
    }

    if (step === 2) {
      if (!formData.eventDate) newErrors.eventDate = 'Event date is required';
      if (!formData.startTime) newErrors.startTime = 'Start time is required';
      if (!formData.endTime) newErrors.endTime = 'End time is required';
      if (!formData.location.trim()) newErrors.location = 'Location is required';
      if (!formData.address.trim()) newErrors.address = 'Address is required';
      if (formData.guestCount < 1) newErrors.guestCount = 'Guest count must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(2)) return;

    setLoading(true);
    try {
      
      // Create ISO 8601 datetime string for the backend
      const eventDateTime = new Date(`${formData.eventDate}T${formData.startTime}:00`).toISOString();

      const payload = {
        name: formData.eventName,
        eventType: formData.eventType,
        date: eventDateTime,
        startTime: formData.startTime,
        endTime: formData.endTime,
        location: formData.location,
        fullAddress: formData.address,
        expectedGuests: parseInt(formData.guestCount),
        description: formData.description || '',
        serviceCategoryIds: selectedServices, // Array of category IDs
      };

      console.log('Submitting event payload:', payload); // Debug log

      const response = await apiClient.post('/api/Events/create-event', payload);
      
      if (response.status === 200 || response.status === 201) {
        alert('Event created successfully!');
        navigate('/CustomerDashboard');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      console.error('Error response:', error.response?.data); // Debug log
      
      // More detailed error message
      let errorMessage = 'Failed to create event';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        // Handle validation errors
        const errorMessages = [];
        for (const key in error.response.data.errors) {
          errorMessages.push(...error.response.data.errors[key]);
        }
        errorMessage = errorMessages.join(', ');
      } else if (error.response?.data?.title) {
        errorMessage = error.response.data.title;
      }
      
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Event Details</h3>
              <p className="text-gray-600">Tell us about your special event</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Event Name *</label>
                <input
                  type="text"
                  name="eventName"
                  value={formData.eventName}
                  onChange={handleChange}
                  placeholder="e.g., Sarah's Birthday Party"
                  className={`w-full px-4 py-3 border-2 ${errors.eventName ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:border-purple-500 focus:outline-none transition-colors`}
                />
                {errors.eventName && <p className="text-red-500 text-xs mt-1">{errors.eventName}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Event Type *</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {eventTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = formData.eventType === type.value;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, eventType: type.value }))}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-purple-500 bg-purple-50 shadow-md'
                            : 'border-gray-200 hover:border-purple-300 bg-white'
                        }`}
                      >
                        <div className={`w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br ${type.color} flex items-center justify-center`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-sm font-medium text-gray-800">{type.value}</p>
                      </button>
                    );
                  })}
                </div>
                {errors.eventType && <p className="text-red-500 text-xs mt-1">{errors.eventType}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description (Optional)</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Brief description of your event, Help service providers understand your vision..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none resize-none transition-colors"
                  
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Date, Time & Location</h3>
              <p className="text-gray-600">When and where will it happen?</p>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Event Date *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      name="eventDate"
                      value={formData.eventDate}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      className={`w-full pl-10 pr-4 py-3 border-2 ${errors.eventDate ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:border-purple-500 focus:outline-none transition-colors`}
                    />
                  </div>
                  {errors.eventDate && <p className="text-red-500 text-xs mt-1">{errors.eventDate}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time *</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type="time"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border-2 ${errors.startTime ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:border-purple-500 focus:outline-none transition-colors`}
                    />
                  </div>
                  {errors.startTime && <p className="text-red-500 text-xs mt-1">{errors.startTime}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">End Time *</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type="time"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border-2 ${errors.endTime ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:border-purple-500 focus:outline-none transition-colors`}
                    />
                  </div>
                  {errors.endTime && <p className="text-red-500 text-xs mt-1">{errors.endTime}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Venue/Location Name *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., Grand Ballroom, City Park"
                    className={`w-full pl-10 pr-4 py-3 border-2 ${errors.location ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:border-purple-500 focus:outline-none transition-colors`}
                  />
                </div>
                {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Address *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street address, city, state, zip code"
                  className={`w-full px-4 py-3 border-2 ${errors.address ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:border-purple-500 focus:outline-none transition-colors`}
                />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Expected Guest Count *</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      name="guestCount"
                      value={formData.guestCount}
                      onChange={handleChange}
                      min="1"
                      className={`w-full pl-10 pr-4 py-3 border-2 ${errors.guestCount ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:border-purple-500 focus:outline-none transition-colors`}
                    />
                  </div>
                  {errors.guestCount && <p className="text-red-500 text-xs mt-1">{errors.guestCount}</p>}
                </div>

              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Services Needed</h3>
              <p className="text-gray-600">What services do you need for your event?</p>
            </div>

            {Categories.length === 0 ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading service categories...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Categories.map((category) => {
                    const Icon = category.icon;
                    const isSelected = selectedServices.includes(category.id);

                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => toggleService(category.id)}
                        className={`p-5 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? 'border-purple-500 bg-purple-50 shadow-md'
                            : 'border-gray-200 hover:border-purple-300 bg-white'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800">{category.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                          </div>
                          {isSelected && (
                            <Check className="w-6 h-6 text-purple-600" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {selectedServices.length > 0 && (
                  <div className="p-5 bg-purple-50 rounded-xl border-2 border-purple-200">
                    <p className="font-semibold text-gray-800 mb-3">Selected Services:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedServices.map((serviceId) => {
                        const category = Categories.find(c => c.id === serviceId);
                        return (
                          <span
                            key={serviceId}
                            className="px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-700 border border-purple-200"
                          >
                            {category?.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            <p className="text-sm text-gray-500 text-center">
              Don't worry, you can add or modify services later
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate('/CustomerDashboard')}
            className="inline-flex items-center text-gray-600 hover:text-purple-600 mb-4"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to Dashboard
          </button>
          <div className="flex items-center justify-center mb-4">
            <PartyPopper className="w-8 h-8 text-purple-600 mr-2" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Create New Event
            </h1>
          </div>
          <p className="text-gray-600">Step {currentStep} of 3</p>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step === currentStep
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-110'
                    : step < currentStep
                    ? 'bg-purple-200 text-purple-600'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step < currentStep ? <Check className="w-5 h-5" /> : step}
              </div>
              {step < 3 && (
                <div
                  className={`w-20 h-1 mx-2 transition-all ${
                    step < currentStep ? 'bg-purple-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit}>
            {renderStepContent()}

            {errors.submit && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-600 text-sm">{errors.submit}</p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                Previous
              </button>

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:opacity-90 transition-all shadow-lg flex items-center"
                >
                  Next Step
                  <ChevronRight className="w-5 h-5 ml-1" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition-all shadow-lg flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Event
                      <PartyPopper className="w-5 h-5 ml-2" />
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}