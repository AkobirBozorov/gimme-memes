import React from "react";

const Footer = () => {
  return (
    <footer className="bg-[#528265] text-white py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Branding & Social Media */}
          <div>
            <h2 className="text-2xl font-bold">GimmeMemes</h2>
            <p className="mt-4 text-gray-200">
              Create, share, and go viral with memes. Unleash your creativity and join our fun community.
            </p>
            <div className="flex mt-4 space-x-4">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-300 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.954 4.569c-.885.389-1.83.654-2.825.775 1.014-.611 1.794-1.574 2.163-2.723-.951.564-2.005.974-3.127 1.195-.897-.959-2.178-1.558-3.594-1.558-2.723 0-4.928 2.206-4.928 4.93 0 .39.045.765.127 1.124-4.094-.205-7.725-2.166-10.159-5.144a4.822 4.822 0 0 0-.664 2.475 4.92 4.92 0 0 0 2.188 4.1 4.903 4.903 0 0 1-2.229-.616c-.054 2.281 1.581 4.415 3.949 4.89a4.935 4.935 0 0 1-2.224.085c.63 1.966 2.445 3.377 4.604 3.415-1.68 1.32-3.809 2.105-6.102 2.105-.396 0-.787-.023-1.17-.067 2.179 1.394 4.768 2.209 7.557 2.209 9.054 0 14-7.496 14-13.986 0-.21 0-.42-.015-.63A9.935 9.935 0 0 0 24 4.557z"/>
                </svg>
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-300 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.675 0h-21.35C.597 0 0 .598 0 1.337v21.326C0 23.402.597 24 1.325 24h11.483v-9.294H9.69V11.31h3.118V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.464.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.716-1.795 1.763v2.312h3.587l-.467 3.396h-3.12V24h6.116C23.402 24 24 23.402 24 22.271V1.337C24 .598 23.402 0 22.675 0z" />
                </svg>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-300 transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <rect x="3" y="3" width="18" height="18" rx="4" ry="4" />
                  <circle cx="17.5" cy="6.5" r="1" />
                  <path d="M16 11.37a4 4 0 1 1-7.94.75 4 4 0 0 1 7.94-.75z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-300">
              <li>
                <a href="/about" className="hover:text-white transition">
                  About
                </a>
              </li>
              <li>
                <a href="/faq" className="hover:text-white transition">
                  FAQ
                </a>
              </li>
              <li>
                <a href="/contact" className="hover:text-white transition">
                  Contact
                </a>
              </li>
              <li>
                <a href="/terms" className="hover:text-white transition">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/privacy" className="hover:text-white transition">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter Subscription */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Stay Updated</h3>
            <p className="text-gray-300 mb-4">
              Subscribe to our newsletter for the latest memes and updates.
            </p>
            <form className="flex flex-col sm:flex-row sm:items-center">
              <input
                type="email"
                placeholder="Your email"
                className="w-full sm:w-auto flex-grow px-4 py-3 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
              />
              <button
                type="submit"
                className="mt-2 sm:mt-0 sm:ml-2 px-4 py-3 bg-white text-[#528265] rounded-md hover:bg-gray-100 transition whitespace-nowrap"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="mt-12 border-t border-white pt-4 text-center">
          <p className="text-sm text-gray-100">
            © {new Date().getFullYear()} GimmeMemes. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;