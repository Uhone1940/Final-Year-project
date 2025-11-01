import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { 
  User, 
  Building2, 
  MapPin, 
  Phone, 
  DollarSign, 
  Link as LinkIcon, 
  FileText, 
  Save, 
  ArrowLeft,
  Image,
  Loader
} from 'lucide-react';

// Helper function to get data from storage
const getStorageItem = (key) => {
  return localStorage.getItem(key) || sessionStorage.getItem(key);
};

export default function UpdateProfileForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    businessName: '',
    description: '',
    pricingDetails: '',
    portfolioLink: '',
    location: '',
    phoneNumber: '',
    profilePictureUrl: '',
    categoryName: '',
  });

  // Check authentication and fetch profile
  useEffect(() => {
    const token = getStorageItem('token') || getStorageItem('authToken');
    const role = getStorageItem('userRole');
    
    if (!token || (role !== 'eventserviceprovider' && role !== 'provider')) {
      navigate('/login');
      return;
    }

    fetchProfile();
  }, [navigate]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/Providers/me');
      const profile = response.data;
      
      setFormData({
        businessName: profile.businessName || '',
        description: profile.description || '',
        pricingDetails: profile.pricingDetails || '',
        portfolioLink: profile.portfolioLink || '',
        location: profile.location || '',
        phoneNumber: profile.phoneNumber || '',
        profilePictureUrl: profile.profilePictureUrl || '',
        categoryName: profile.categoryName || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear messages when user types
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.description.trim()) {
      setError('Business description is required');
      return;
    }

    if (!formData.location.trim()) {
      setError('Location is required');
      return;
    }

    if (!formData.phoneNumber.trim()) {
      setError('Phone number is required');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        description: formData.description.trim(),
        pricingDetails: formData.pricingDetails.trim() || null,
        portfolioLink: formData.portfolioLink.trim() || null,
        location: formData.location.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        profilePictureUrl: formData.profilePictureUrl.trim() || null,
      };

      const response = await apiClient.put('/api/Providers/update-profile', payload);

      if (response.status === 200) {
        setSuccess('Profile updated successfully!');
        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Redirect after 2 seconds
        setTimeout(() => {
          navigate('/ProviderDashboard');
        }, 2000);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.message || 'Failed to update profile. Please try again.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading profile...</p>
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
            onClick={() => navigate('/ProviderDashboard')}
            className="inline-flex items-center text-gray-600 hover:text-purple-600 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            Back to Dashboard
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Update Profile</h1>
              <p className="text-gray-600">Manage your business information</p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-green-600 font-medium">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        )}

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Name (Read-only) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Business Name
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.businessName}
                  disabled
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Contact admin to change business name</p>
            </div>

            {/* Service Category (Read-only) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Service Category
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.categoryName}
                  disabled
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Contact admin to change category</p>
            </div>

            {/* Business Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Business Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                placeholder="Tell customers about your services, experience, and what makes your business unique..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none resize-none transition-colors"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.description.length} characters
              </p>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Location *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., Johannesburg, Gauteng"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="e.g., 0123456789"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            {/* Pricing Details */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Pricing Details (Optional)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <textarea
                  name="pricingDetails"
                  value={formData.pricingDetails}
                  onChange={handleChange}
                  rows={3}
                  placeholder="e.g., Starting from R5,000 per event. Custom packages available..."
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none resize-none transition-colors"
                />
              </div>
            </div>

            {/* Portfolio Link */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Portfolio Link (Optional)
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="url"
                  name="portfolioLink"
                  value={formData.portfolioLink}
                  onChange={handleChange}
                  placeholder="e.g., https://www.yourwebsite.com"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Add a link to your website or social media portfolio
              </p>
            </div>

            {/* Profile Picture URL */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Profile Picture URL (Optional)
              </label>
              <div className="relative">
                <Image className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="url"
                  name="profilePictureUrl"
                  value={formData.profilePictureUrl}
                  onChange={handleChange}
                  placeholder="e.g., https://example.com/logo.jpg"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Add a URL to your business logo or profile picture
              </p>
            </div>

            {/* Preview Profile Picture */}
            {formData.profilePictureUrl && (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">Profile Picture Preview:</p>
                <img 
                  src={formData.profilePictureUrl} 
                  alt="Profile preview" 
                  className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'block';
                  }}
                />
                <p className="text-xs text-red-500 mt-2" style={{ display: 'none' }}>
                  Failed to load image. Please check the URL.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/ProviderDashboard')}
                disabled={saving}
                className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
              >
                {saving ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> Changes to your business name and service category require admin approval. 
              Please contact support if you need to update these fields.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}