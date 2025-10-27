import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await apiClient.post("/api/Auth/login", {
        email,
        password,
      });

      console.log("Login response:", response.data); // Debug log

      if (response.status === 200 || response.status === 201) {
        // Handle different possible response structures
        const responseData = response.data;
        const token = responseData.token || responseData.accessToken;
        
        // Extract user data - if there's no separate user object, the data IS the user object
        const user = responseData.user || {
          fullName: responseData.fullName,
          email: responseData.email,
          role: responseData.role,
        };

        // Validate we have necessary data
        if (!token) {
          setError("Authentication token not received. Please try again.");
          setIsLoading(false);
          return;
        }

        // Redirect based on user role
        const dashboardRoutes = {
          admin: "/AdminDashboard",
          systemadmin: "/AdminDashboard",
          customer: "/CustomerDashboard",
          eventserviceprovider: "/ProviderDashboard",
          provider: "/ProviderDashboard",
        };

        // Normalize role to lowercase for matching
        // Try multiple possible role property names
        const userRole = (
          user.role || 
          user.userType || 
          user.userRole ||
          responseData.role ||
          responseData.userType ||
          ""
        ).toLowerCase().replace(/\s+/g, '');

        console.log("User role detected:", userRole); // Debug log

        const dashboardPath = dashboardRoutes[userRole];

        if (!dashboardPath) {
          setError(`Invalid user role: "${userRole}". Please contact support.`);
          setIsLoading(false);
          return;
        }

        // Store authentication token and user data
        const storage = rememberMe ? localStorage : sessionStorage;
        
        storage.setItem("authToken", token);
        storage.setItem("token", token); // Also store as 'token' for compatibility
        storage.setItem("user", JSON.stringify(user));
        storage.setItem("userName", user.fullName || user.name || user.email);
        storage.setItem("userEmail", user.email);
        storage.setItem("userRole", userRole);

        // Debug: Verify what was stored
        console.log("Stored userName:", storage.getItem("userName"));
        console.log("Stored userRole:", storage.getItem("userRole"));

        // Navigate to the appropriate dashboard
        navigate(dashboardPath, { replace: true });
      }
    } catch (error) {
      console.error("Login failed:", error);
      console.error("Error response:", error.response?.data);
      
      setError(
        error.response?.data?.message ||
        error.response?.data?.title ||
        "Invalid email or password. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white shadow-md rounded-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center">
            <i className="fas fa-calendar-check text-purple-600 text-3xl mr-2"></i>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
              Eventify
            </h1>
          </div>
          <p className="text-gray-500 mt-2">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            <i className="fas fa-exclamation-circle mr-2"></i>
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Enter your password"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
                className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label className="ml-2 text-sm text-gray-700">Remember me</label>
            </div>
            <Link
              to="/forgot-password"
              className="text-sm text-purple-600 hover:text-purple-500"
            >
              Forgot password?
            </Link>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-2 rounded-md shadow hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-medium text-purple-600 hover:text-purple-500"
            >
              Sign up
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link
            to="/"
            className="text-sm text-gray-600 flex items-center justify-center hover:text-gray-800"
          >
            <i className="fas fa-arrow-left mr-2"></i> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}