// gimme-memes-frontend/src/App.jsx
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
import NotFoundPage from "./pages/NotFoundPage";
import CommunityPage from './pages/CommunityPage';

// Blog pages
import BlogListPage from "./pages/BlogListPage";
import BlogPostPage from "./pages/BlogPostPage";
import AdminBlogPage from "./pages/AdminBlogPage";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // NEW: store if user is admin
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      // No token => user not authenticated
      setIsAuthenticated(false);
      setIsAdmin(false);
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
        console.log('USER DATA from /api/user/me =>', data);
        setIsAuthenticated(true);
        setIsAdmin(data.user?.isAdmin === true);
      })
      .catch((err) => {
        console.error(err);
        // If we fail => remove token, set auth false, admin false
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        setIsAdmin(false);
      })
      .finally(() => {
        setCheckingAuth(false);
      });
  }, []);

  if (checkingAuth) {
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
            <Route path="/community" element={<CommunityPage />} />

            {/* Public Create (no ID) */}
            <Route path="/create" element={<CreateMemePage />} />

            {/* Protected editing existing Meme by :id */}
            <Route
              path="/create/:id"
              element={
                isAuthenticated ? <CreateMemePage /> : <Navigate to="/login" />
              }
            />

            {/* Blog public pages */}
            <Route path="/blog" element={<BlogListPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />

            {/* Admin-only blog page */}
            <Route
              path="/admin/blog"
              element={
                isAuthenticated && isAdmin ? (
                  <AdminBlogPage isAdmin={isAdmin} />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            {/* Auth routes */}
            <Route
              path="/signup"
              element={<SignUpPage setIsAuthenticated={setIsAuthenticated} />}
            />
            <Route
              path="/login"
              element={<LoginPage setIsAuthenticated={setIsAuthenticated} />}
            />

            {/* Dashboard => protected */}
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

            {/* 404 Not Found */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;