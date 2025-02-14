import React from "react";
import { Link, NavLink } from "react-router-dom";

const Navbar = () => {
  const navLinkClasses = ({ isActive }) =>
    isActive
      ? "text-[#528265] font-medium border-b-2 border-[#528265] pb-1"
      : "text-gray-700 hover:text-[#528265] font-medium";

  return (
    <nav className="bg-white shadow-md py-4">
      <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-[#528265]">
          GimmeMemes
        </Link>

        {/* Navigation Links */}
        <div className="flex space-x-6">
          <NavLink to="/" className={navLinkClasses}>
            Home
          </NavLink>
          <NavLink to="/blog" className={navLinkClasses}>
            Blog
          </NavLink>
          <NavLink to="/contact" className={navLinkClasses}>
            Contact
          </NavLink>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;