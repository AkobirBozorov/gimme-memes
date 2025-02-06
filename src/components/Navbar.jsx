import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";

const Navbar = ({ isAuthenticated }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  // Return classes based on active state using our brand color
  const navLinkClasses = ({ isActive }) =>
    isActive
      ? "text-[#528265] font-medium"
      : "text-gray-700 hover:text-[#528265] font-medium";

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-[#528265]">
          GimmeMemes
        </Link>

        {/* Navigation Links for Larger Screens */}
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
          <NavLink to="/contact" className={navLinkClasses}>
            Contact
          </NavLink>
          {!isAuthenticated && (
            <>
              <Link to="/signup" className="text-gray-700 hover:text-[#528265] font-medium">
                Sign Up
              </Link>
              <Link to="/login" className="text-gray-700 hover:text-[#528265] font-medium">
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

        {/* Create Meme Button (Right-Aligned) */}
        <div className="hidden md:block">
          <Link
            to="/create"
            className="bg-[#528265] text-white px-5 py-2 rounded-lg hover:bg-[#47795f] transition"
          >
            Create Meme
          </Link>
        </div>

        {/* Hamburger Menu for Mobile */}
        <button
          className="md:hidden text-[#528265] focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>
      </div>

      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity ${
          menuOpen ? "opacity-100 visible" : "opacity-0 invisible"
        } md:hidden`}
        onClick={() => setMenuOpen(false)}
      ></div>

      {/* Mobile Sidebar */}
      <div
        className={`fixed top-0 right-0 w-3/4 h-full z-50 bg-white shadow-lg p-6 transform ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        } transition-transform md:hidden`}
      >
        <button
          className="absolute top-4 right-4 text-[#528265]"
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
          <NavLink to="/contact" onClick={() => setMenuOpen(false)} className={navLinkClasses}>
            Contact
          </NavLink>

          {!isAuthenticated ? (
            <>
              <Link
                to="/signup"
                className="text-gray-700 hover:text-[#528265] font-medium"
                onClick={() => setMenuOpen(false)}
              >
                Sign Up
              </Link>
              <Link
                to="/login"
                className="text-gray-700 hover:text-[#528265] font-medium"
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
            className="bg-[#528265] text-white px-5 py-2 rounded-lg hover:bg-[#47795f] transition text-center"
          >
            Create Meme
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;