import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import apiClient from "../api/apiClient";

export default function SignupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userType, setUserType] = useState("customer");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    preferredEventTypes: [],
    businessName: "",
    serviceCategoryId: "",
    description: "",
    pricingDetails: "",
    portfolioLink: "",
    location: "",
  });

  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const eventTypes = [
    "Wedding",
    "Birthday Party",
    "Corporate Event",
    "Conference",
    "Concert",
    "Sports Event",
    "Festival",
    "Other",
  ];

    useEffect(() => {
    if (location.state?.userType) {
      setUserType(location.state.userType);
    }
  }, [location.state]);

  // ✅ Fetch service categories for providers
  useEffect(() => {
    if (userType === "provider") {
      fetchCategories();
    }
  }, [userType]);

  const fetchCategories = async () => {
    try {
      console.log("Fetching categories..."); // Debug
      const response = await apiClient.get("/api/Categories"); // ✅ Fixed endpoint
      console.log("Categories loaded:", response.data); // Debug
      setCategories(response.data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      console.error("Error details:", error.response?.data); // More debug info
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleEventTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      preferredEventTypes: prev.preferredEventTypes.includes(type)
        ? prev.preferredEventTypes.filter((t) => t !== type)
        : [...prev.preferredEventTypes, type],
    }));
  };

  const handleUserTypeChange = (type) => {
    setUserType(type);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    const { fullName, email, password, confirmPassword, phoneNumber } = formData;

    if (!fullName.trim()) newErrors.fullName = "Full name is required";
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Invalid email address";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6) newErrors.password = "Must be at least 6 characters";
    if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";

    // Phone validation (optional but if provided, must be valid)
    if (phoneNumber && !/^\+?[\d\s\-()]+$/.test(phoneNumber)) {
      newErrors.phoneNumber = "Invalid phone number format";
    }

    // Provider-specific validation
    if (userType === "provider") {
      if (!formData.businessName.trim()) newErrors.businessName = "Business name is required";
      if (!formData.serviceCategoryId) newErrors.serviceCategoryId = "Please select a category";
      if (!phoneNumber.trim()) newErrors.phoneNumber = "Phone number is required for providers";
      if (!formData.location.trim()) newErrors.location = "Location is required";
      if (!formData.description.trim()) newErrors.description = "Description is required";
      else if (formData.description.length < 50)
        newErrors.description = "Description must be at least 50 characters";
      if (!formData.pricingDetails.trim())
        newErrors.pricingDetails = "Pricing details are required";
      if (
        formData.portfolioLink.trim() &&
        !/^https?:\/\/.+/.test(formData.portfolioLink)
      )
        newErrors.portfolioLink = "Enter a valid URL (http:// or https://)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      const endpoint =
        userType === "customer"
          ? "/api//Auth/register-customer"
          : "/api//Auth/register-provider";

      const payload =
        userType === "customer"
          ? {
              fullName: formData.fullName,
              email: formData.email,
              password: formData.password,
              ...(formData.phoneNumber && { phoneNumber: formData.phoneNumber }), // ✅ Only include if provided
              ...(formData.preferredEventTypes.length > 0 && {
                preferredEventTypes: formData.preferredEventTypes.join(", "),
              }),
            }
          : {
              fullName: formData.fullName,
              email: formData.email,
              password: formData.password,
              businessName: formData.businessName,
              serviceCategoryId: parseInt(formData.serviceCategoryId),
              phoneNumber: formData.phoneNumber,
              location: formData.location,
              description: formData.description,
              pricingDetails: formData.pricingDetails,
              ...(formData.portfolioLink && { portfolioLink: formData.portfolioLink }),
            };

      console.log("Sending payload:", payload); // Debug

      const response = await apiClient.post(endpoint, payload);

      if (response.status === 200 || response.status === 201) {
        alert("Account created successfully!");
        navigate("/login");
      }
    } catch (error) {
      console.error("Registration failed:", error);
      console.error("Error response:", error.response?.data); // Debug
      setErrors({
        submit:
          error.response?.data?.message ||
          error.response?.data?.title ||
          "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      <div className="w-full max-w-2xl p-8 bg-white shadow-xl rounded-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center">
            <i className="fas fa-calendar-check text-purple-600 text-3xl mr-2"></i>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
              Eventify
            </h1>
          </div>
          <p className="text-gray-500 mt-2">Create your account</p>
        </div>

        {/* User Type */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            I want to sign up as:
          </label>
          <div className="flex space-x-6">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                value="customer"
                checked={userType === "customer"}
                onChange={() => handleUserTypeChange("customer")}
                className="text-purple-600"
              />
              <span className="ml-2 font-medium">Customer</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                value="provider"
                checked={userType === "provider"}
                onChange={() => handleUserTypeChange("provider")}
                className="text-purple-600"
              />
              <span className="ml-2 font-medium">Service Provider</span>
            </label>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name & Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <input
                type="text"
                name="fullName"
                placeholder="Full Name *"
                value={formData.fullName}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  errors.fullName ? "border-red-500" : "border-gray-300"
                } rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
              />
              {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
            </div>
            <div>
              <input
                type="email"
                name="email"
                placeholder="Email *"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  errors.email ? "border-red-500" : "border-gray-300"
                } rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <input
              type="tel"
              name="phoneNumber"
              placeholder={`Phone Number ${userType === "provider" ? "*" : "(optional)"}`}
              value={formData.phoneNumber}
              onChange={handleChange}
              className={`w-full px-3 py-2 border ${
                errors.phoneNumber ? "border-red-500" : "border-gray-300"
              } rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
            />
            {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>}
          </div>

          {/* Passwords */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <input
                type="password"
                name="password"
                placeholder="Password *"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  errors.password ? "border-red-500" : "border-gray-300"
                } rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>
            <div>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password *"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  errors.confirmPassword ? "border-red-500" : "border-gray-300"
                } rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
              />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>
          </div>

          {/* Customer Event Types */}
          {userType === "customer" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Event Types (optional)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {eventTypes.map((type) => (
                  <label key={type} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.preferredEventTypes.includes(type)}
                      onChange={() => handleEventTypeChange(type)}
                      className="text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm">{type}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Provider Fields */}
          {userType === "provider" && (
            <>
              <div>
                <input
                  type="text"
                  name="businessName"
                  placeholder="Business Name *"
                  value={formData.businessName}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.businessName ? "border-red-500" : "border-gray-300"
                  } rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                />
                {errors.businessName && <p className="text-red-500 text-xs mt-1">{errors.businessName}</p>}
              </div>

              <div>
                <select
                  name="serviceCategoryId"
                  value={formData.serviceCategoryId}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.serviceCategoryId ? "border-red-500" : "border-gray-300"
                  } rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                >
                  <option value="">Select Category *</option>
                  {categories.map((cat) => (
                    <option key={cat.serviceCategoryId} value={cat.serviceCategoryId}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.serviceCategoryId && <p className="text-red-500 text-xs mt-1">{errors.serviceCategoryId}</p>}
              </div>

              <div>
                <input
                  type="text"
                  name="location"
                  placeholder="Location (City, State) *"
                  value={formData.location}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.location ? "border-red-500" : "border-gray-300"
                  } rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                />
                {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
              </div>

              <div>
                <textarea
                  name="description"
                  placeholder="Tell customers about your services, experience, and what makes you unique... *"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className={`w-full px-3 py-2 border ${
                    errors.description ? "border-red-500" : "border-gray-300"
                  } rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                ></textarea>
                <div className="flex justify-between items-center mt-1">
                  {errors.description && <p className="text-red-500 text-xs">{errors.description}</p>}
                  <p className="text-gray-400 text-xs ml-auto">{formData.description.length}/50</p>
                </div>
              </div>

              <div>
                <input
                  type="text"
                  name="pricingDetails"
                  placeholder="Pricing Details (e.g., Starting from R500) *"
                  value={formData.pricingDetails}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.pricingDetails ? "border-red-500" : "border-gray-300"
                  } rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                />
                {errors.pricingDetails && <p className="text-red-500 text-xs mt-1">{errors.pricingDetails}</p>}
              </div>

              <div>
                <input
                  type="url"
                  name="portfolioLink"
                  placeholder="Portfolio Link (optional but recommended)"
                  value={formData.portfolioLink}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.portfolioLink ? "border-red-500" : "border-gray-300"
                  } rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                />
                {errors.portfolioLink && <p className="text-red-500 text-xs mt-1">{errors.portfolioLink}</p>}
              </div>
            </>
          )}

          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{errors.submit}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-md hover:opacity-90 disabled:opacity-50 transition-all font-medium"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Creating Account...
              </span>
            ) : (
              `Create ${userType === "customer" ? "Customer" : "Provider"} Account`
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="text-purple-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link
            to="/"
            className="text-sm text-gray-600 flex items-center justify-center hover:text-purple-600 transition-colors"
          >
            <i className="fas fa-arrow-left mr-2"></i> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}