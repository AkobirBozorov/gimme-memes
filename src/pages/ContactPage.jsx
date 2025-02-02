import React from 'react';

const ContactPage = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
      <p className="text-gray-700 leading-relaxed mb-6">
        Have questions, feedback, or suggestions? We’d love to hear from you.
        Fill out the form below or reach out via email, and we’ll get back to
        you as soon as possible.
      </p>

      {/* Example contact form layout */}
      <form className="max-w-md space-y-4">
        <div>
          <label className="block text-gray-600 mb-1">Name</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:border-blue-500"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-gray-600 mb-1">Email</label>
          <input
            type="email"
            className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:border-blue-500"
            placeholder="Your email"
          />
        </div>
        <div>
          <label className="block text-gray-600 mb-1">Message</label>
          <textarea
            className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:border-blue-500"
            rows="5"
            placeholder="Your message here..."
          ></textarea>
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Send Message
        </button>
      </form>
    </div>
  );
};

export default ContactPage;