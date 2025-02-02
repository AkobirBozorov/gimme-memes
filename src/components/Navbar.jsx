import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";

const Navbar = ({ isAuthenticated }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  // Function to return the appropriate classes based on active state
  const navLinkClasses = ({ isActive }) =>
    isActive
      ? "text-blue-600 font-medium"
      : "text-gray-700 hover:text-blue-600 font-medium";

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-blue-600">
          GimmeMemes
        </Link>

        {/* Navigation Links for Larger Screens (Centered) */}
        <div className="hidden md:flex flex-1 justify-center space-x-6">
          <NavLink to="/" className={navLinkClasses}>
            Home
          </NavLink>
          <NavLink to="/community" className={navLinkClasses}>
            Community
          </NavLink>
          <NavLink to="/blog" className={navLinkClasses}>
            Blog
          </NavLink>
          <NavLink to="/about" className={navLinkClasses}>
            About
          </NavLink>
          <NavLink to="/faq" className={navLinkClasses}>
            FAQ
          </NavLink>
          <NavLink to="/contact" className={navLinkClasses}>
            Contact
          </NavLink>
          {!isAuthenticated && (
            <>
              <Link to="/signup" className="text-gray-700 hover:text-blue-600 font-medium">
                Sign Up
              </Link>
              <Link to="/login" className="text-gray-700 hover:text-blue-600 font-medium">
                Login
              </Link>
            </>
          )}
          {isAuthenticated && (
            <NavLink to="/dashboard" className={navLinkClasses}>
              Dashboard
            </NavLink>
          )}
        </div>

        {/* Create Meme Button (Aligned to Right) */}
        <div className="hidden md:block">
          <Link
            to="/create"
            className="bg-blue-500 text-white px-5 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Create Meme
          </Link>
        </div>

        {/* Hamburger Menu (Mobile) */}
        <button
          className="md:hidden text-gray-700 focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>
      </div>

      {/* Mobile Overlay (clicking outside closes the menu) */}
      <div
        className={`fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity ${
          menuOpen ? "opacity-100 visible" : "opacity-0 invisible"
        } md:hidden`}
        onClick={() => setMenuOpen(false)}
      ></div>

      {/* Mobile Sidebar (Sliding in from the Right) */}
      <div
        className={`fixed top-0 right-0 w-3/4 h-full z-50 bg-white shadow-lg p-6 transform ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        } transition-transform md:hidden`}
      >
        {/* Close Button on the Right Side */}
        <button
          className="absolute top-4 right-4 text-gray-700"
          onClick={() => setMenuOpen(false)}
        >
          ✖
        </button>

        <div className="flex flex-col space-y-4 mt-8">
          <NavLink to="/" onClick={() => setMenuOpen(false)} className={navLinkClasses}>
            Home
          </NavLink>
          <NavLink to="/community" onClick={() => setMenuOpen(false)} className={navLinkClasses}>
            Community
          </NavLink>
          <NavLink to="/blog" onClick={() => setMenuOpen(false)} className={navLinkClasses}>
            Blog
          </NavLink>
          <NavLink to="/about" onClick={() => setMenuOpen(false)} className={navLinkClasses}>
            About
          </NavLink>
          <NavLink to="/faq" onClick={() => setMenuOpen(false)} className={navLinkClasses}>
            FAQ
          </NavLink>
          <NavLink to="/contact" onClick={() => setMenuOpen(false)} className={navLinkClasses}>
            Contact
          </NavLink>

          {!isAuthenticated ? (
            <>
              <Link
                to="/signup"
                className="text-gray-700 hover:text-blue-600 font-medium"
                onClick={() => setMenuOpen(false)}
              >
                Sign Up
              </Link>
              <Link
                to="/login"
                className="text-gray-700 hover:text-blue-600 font-medium"
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Link>
            </>
          ) : (
            <NavLink
              to="/dashboard"
              onClick={() => setMenuOpen(false)}
              className={navLinkClasses}
            >
              Dashboard
            </NavLink>
          )}

          <Link
            to="/create"
            onClick={() => setMenuOpen(false)}
            className="bg-blue-500 text-white px-5 py-2 rounded-lg hover:bg-blue-600 transition text-center"
          >
            Create Meme
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;