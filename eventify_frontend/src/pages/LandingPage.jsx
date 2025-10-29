import React from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { Link, useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  // Navigate to signup with provider selected
  const goToProviderSignup = () => {
    navigate("/signup", { state: { userType: "provider" } });
  };

  return (
    <div className="bg-gray-50 min-h-screen font-[Poppins]">
      {/* Navbar */}
      <nav className="bg-white shadow-md py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center">
            <i className="fas fa-calendar-check text-purple-600 text-2xl mr-2"></i>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">Eventify</span>
          </div>
          <div className="flex items-center">
            <Link
              to="/login" 
              className="mr-4 px-4 py-2 rounded-md text-purple-600 border border-purple-600 hover:bg-purple-50 transition-all"
            >
              Log In
            </Link>
            
            <Link 
              to="/signup" 
              className="px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-all"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="landing-gradient text-white py-20 bg-gradient-to-br from-indigo-500 to-purple-600">
        <div className="container mx-auto px-4 flex flex-wrap items-center">
          <div className="w-full lg:w-1/2 mb-10 lg:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Plan Your Perfect Event, All In One Place</h1>
            <p className="text-lg mb-8">Find and book the best service providers for your events — DJs, caterers, venues, photographers, and more!</p>
            <div className="flex flex-wrap gap-4">
              <button className="px-8 py-3 bg-white text-purple-600 font-medium rounded-lg hover:bg-gray-100 transition-all">Get Started</button>
              <button className="px-8 py-3 bg-transparent border-2 border-white text-white font-medium rounded-lg hover:bg-white hover:bg-opacity-10 transition-all">Learn More</button>
            </div>
          </div>
          <div className="w-full lg:w-1/2">
            <img src="https://cdn.pixabay.com/photo/2016/11/22/19/15/hand-1850120_1280.jpg" alt="Event Planning" className="rounded-lg shadow-xl" />
          </div>
        </div>
      </div>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How Eventify Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting Lines */}
            <div className="hidden md:block absolute top-20 left-0 right-0 h-1 bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200" style={{width: '66%', left: '17%'}}></div>
            
            {[
              { icon: "fa-calendar-plus", title: "Create Your Event", desc: "Define your event details, requirements, and budget in just a few clicks.", color: "from-indigo-500 to-purple-500" },
              { icon: "fa-search", title: "Find Providers", desc: "Browse verified service providers and compare their offerings and reviews.", color: "from-purple-500 to-pink-500" },
              { icon: "fa-check-circle", title: "Book & Manage", desc: "Secure your bookings and manage all your event services in one dashboard.", color: "from-pink-500 to-rose-500" },
            ].map((step, index) => (
              <div key={index} className="relative">
                <div className="group text-center p-8 bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-3 cursor-pointer border border-gray-100">
                  {/* Step Number */}
                  <div className={`absolute -top-4 left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white text-xl font-bold shadow-lg group-hover:scale-110 transition-transform duration-300 z-10`}>
                    {index + 1}
                  </div>
                  
                  {/* Icon */}
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-6 mt-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                    <i className={`fas ${step.icon} text-3xl text-white`}></i>
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-3 text-gray-800">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-2">Our Services</h2>
          <p className="text-gray-600 text-center mb-12">Find the perfect services for your special event</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: "fa-music", label: "DJs & Music", color: "bg-blue-100 text-blue-600", image: "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400&h=300&fit=crop" },
              { icon: "fa-utensils", label: "Catering", color: "bg-green-100 text-green-600", image: "https://images.unsplash.com/photo-1555244162-803834f70033?w=400&h=300&fit=crop" },
              { icon: "fa-camera", label: "Photography / Videography", color: "bg-purple-100 text-purple-600", image: "https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=400&h=300&fit=crop" },
              { icon: "fa-building", label: "Venues", color: "bg-yellow-100 text-yellow-600", image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=300&fit=crop" },
              { icon: "fa-paint-brush", label: "Decorators", color: "bg-pink-100 text-pink-600", image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=300&fit=crop" },
              { icon: "fa-clipboard-list", label: "Event Planning", color: "bg-indigo-100 text-indigo-600", image: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&h=300&fit=crop" },
              { icon: "fa-shield-alt", label: "Security", color: "bg-gray-100 text-gray-700", image: "https://herongrange.com/wp-content/uploads/2022/11/Personal-security.jpg?w=400&h=300&fit=crop" },
            ].map((service, i) => (
              <div key={i} className="group relative bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                <div className="relative h-56 overflow-hidden">
                  <img 
                    src={service.image} 
                    alt={service.label}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <div className={`${service.color} w-14 h-14 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                    <i className={`fas ${service.icon} text-2xl`}></i>
                  </div>
                  <h3 className="font-semibold text-xl">{service.label}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Provider Call to Action */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 flex flex-wrap items-center">
          <div className="w-full lg:w-1/2 mb-10 lg:mb-0">
            <h2 className="text-3xl font-bold mb-6">Are You a Service Provider?</h2>
            <p className="text-gray-600 mb-8">Join our platform to reach more customers, manage your bookings, and grow your business with Eventify.</p>
            <button 
              onClick={goToProviderSignup}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-lg hover:opacity-90 transition-all"
            >
              Register as Provider
            </button>
          </div>
          <div className="w-full lg:w-1/2">
            <img src="/serviceprovider.png" alt="Service Provider" className="rounded-lg shadow-xl" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <i className="fas fa-calendar-check text-purple-400 text-2xl mr-2"></i>
                <span className="text-2xl font-bold">Eventify</span>
              </div>
              <p className="text-gray-400">Making event planning seamless and stress-free.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                {['Home', 'About Us', 'Services', 'Contact'].map(link => (
                  <li key={link} className="hover:text-white transition-all">{link}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-gray-400">
                {['DJs & Music', 'Catering', 'Photography', 'Venues', 'Decorators'].map(service => (
                  <li key={service} className="hover:text-white transition-all">{service}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
              <ul className="space-y-2 text-gray-400">
                <li><i className="fas fa-envelope mr-2 text-purple-400"></i> info@eventify.com</li>
                <li><i className="fas fa-phone mr-2 text-purple-400"></i> +123 456 7890</li>
              </ul>
              <div className="mt-4 flex space-x-4 text-gray-400">
                <i className="fab fa-facebook-f hover:text-white"></i>
                <i className="fab fa-twitter hover:text-white"></i>
                <i className="fab fa-instagram hover:text-white"></i>
                <i className="fab fa-linkedin-in hover:text-white"></i>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>© 2025 Eventify. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
