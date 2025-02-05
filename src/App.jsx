// gimme-memes-frontend/src/App.jsx
import React, { useState } from "react";
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
import CommunityPage from "./pages/CommunityPage";
import MemeViewPage from "./pages/MemeViewPage";

// Blog pages
import BlogListPage from "./pages/BlogListPage";
import BlogPostPage from "./pages/BlogPostPage";
import AdminBlogPage from "./pages/AdminBlogPage";

import { baseApiUrl } from "./utils/api";

// A simple ProtectedRoute component that checks for a token.
// (You can later expand this to do an actual backend verification if needed.)
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" />;
  }
  return children;
}

function App() {
  // We can initialize isAuthenticated based on whether a token exists.
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));
  const [isAdmin, setIsAdmin] = useState(false);

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
            <Route path="/meme/:id" element={<MemeViewPage />} />
            {/* Public Create Meme page */}
            <Route path="/create" element={<CreateMemePage />} />
            {/* Protected editing route */}
            <Route
              path="/create/:id"
              element={
                <ProtectedRoute>
                  <CreateMemePage />
                </ProtectedRoute>
              }
            />
            {/* Blog pages */}
            <Route path="/blog" element={<BlogListPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            {/* Admin-only blog page */}
            <Route
              path="/admin/blog"
              element={
                <ProtectedRoute>
                  {isAuthenticated && isAdmin ? (
                    <AdminBlogPage isAdmin={isAdmin} />
                  ) : (
                    <Navigate to="/" />
                  )}
                </ProtectedRoute>
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
            {/* Protected Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage
                    isAuthenticated={isAuthenticated}
                    setIsAuthenticated={setIsAuthenticated}
                  />
                </ProtectedRoute>
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