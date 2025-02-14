// gimme-memes-frontend/src/pages/ContactPage.jsx
// gimme-memes-frontend/src/pages/ContactPage.jsx
import React from 'react';
import { Helmet } from 'react-helmet-async';

const ContactPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-10">
      <Helmet>
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-DQEQJR9424"></script>
        <script>{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-DQEQJR9424');
        `}</script>
      </Helmet>

      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-lg">
        <h1 className="text-3xl font-bold text-center mb-6">Contact Us</h1>
        <p className="text-gray-700 leading-relaxed text-center mb-8">
          Have questions, feedback, or suggestions? We’d love to hear from you.
          Fill out the form below or reach out via email, and we’ll get back to you as soon as possible.
        </p>
        <form className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-gray-600 mb-1">
              Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="Your name"
              className="w-full border border-gray-300 rounded-full p-3 focus:outline-none focus:border-blue-500 transition-colors duration-200"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-gray-600 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="Your email"
              className="w-full border border-gray-300 rounded-full p-3 focus:outline-none focus:border-blue-500 transition-colors duration-200"
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-gray-600 mb-1">
              Message
            </label>
            <textarea
              id="message"
              rows="5"
              placeholder="Your message here..."
              className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:border-blue-500 transition-colors duration-200"
            ></textarea>
          </div>
          <button
            type="submit"
            className="w-full relative bg-[#528265] text-white font-semibold px-4 py-3 rounded-full hover:bg-blue-700 transition-colors duration-300"
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
};

export default ContactPage;