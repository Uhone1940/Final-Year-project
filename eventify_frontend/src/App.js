import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import CustomerDashboard from "./pages/Dashboard/CustomerDashboard";
import CreateEventForm from "./pages/Events/CreateEventForm";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/customer" element={<CustomerDashboard />} />
        <Route path="/create-event" element={<CreateEventForm />} />
      </Routes>
    </Router>
  );
}

export default App;
