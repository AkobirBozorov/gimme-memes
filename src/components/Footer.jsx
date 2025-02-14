import React from "react";

const Footer = () => {
  return (
    <footer className="bg-gray-50 text-gray-600 py-4 text-center text-sm">
      © {new Date().getFullYear()} GimmeMemes. All rights reserved.
    </footer>
  );
};

export default Footer;