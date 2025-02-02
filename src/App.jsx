// src/App.jsx
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import FaqPage from "./pages/FaqPage";
import ContactPage from "./pages/ContactPage";
import CreateMemePage from "./pages/CreateMemePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import MemeViewPage from "./pages/MemeViewPage";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true); 
  // a flag to show we’re verifying token

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsAuthenticated(false);
      setCheckingAuth(false);
      return;
    }
    // We do have a token => verify with backend
    fetch("http://localhost:5000/api/user/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Token invalid or expired");
        }
        return res.json();
      })
      .then((data) => {
        // If successful => we have a valid token
        setIsAuthenticated(true);
      })
      .catch((err) => {
        console.error(err);
        // If we fail => remove token, set auth false
        localStorage.removeItem("token");
        setIsAuthenticated(false);
      })
      .finally(() => {
        setCheckingAuth(false);
      });
  }, []);

  if (checkingAuth) {
    // Optionally, show a loading spinner while verifying
    return (
      <div className="flex items-center justify-center h-screen text-xl">
        Checking credentials...
      </div>
    );
  }

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar isAuthenticated={isAuthenticated} />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* Public Create (no ID) */}
            <Route path="/create" element={<CreateMemePage />} />

            {/* Protected editing existing Meme by :id */}
            <Route
              path="/create/:id"
              element={
                isAuthenticated ? <CreateMemePage /> : <Navigate to="/login" />
              }
            />

            <Route path="/meme/:id" element={<MemeViewPage />} />

            <Route
              path="/signup"
              element={<SignUpPage setIsAuthenticated={setIsAuthenticated} />}
            />
            <Route
              path="/login"
              element={<LoginPage setIsAuthenticated={setIsAuthenticated} />}
            />

            <Route
              path="/dashboard"
              element={
                isAuthenticated ? (
                  <DashboardPage
                    isAuthenticated={isAuthenticated}
                    setIsAuthenticated={setIsAuthenticated}
                  />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;