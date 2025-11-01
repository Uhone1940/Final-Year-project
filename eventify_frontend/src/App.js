import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import AdminDashboard from "./pages/Dashboard/AdminDashboard";
import CustomerDashboard from "./pages/Dashboard/CustomerDashboard";
import ProviderDashboard from "./pages/Dashboard/ProviderDashboard";
import CreateEventForm from "./pages/Events/CreateEventForm";
import CreateNotificationForm from "./pages/Notifications/CreateNotificationForm";
import UpdateProfileForm from "./pages/Profile/UpdateProfileForm";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/AdminDashboard" element={<AdminDashboard />} />
        <Route path="/CustomerDashboard" element={<CustomerDashboard />} />
        <Route path="/ProviderDashboard" element={<ProviderDashboard />} />
        <Route path="/create-event" element={<CreateEventForm />} />
        <Route path="/create-notification" element={<CreateNotificationForm />} />
        <Route path="/update-profile" element={<UpdateProfileForm />} />

      </Routes>
    </Router>
  );
}

export default App;
