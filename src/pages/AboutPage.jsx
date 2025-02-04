// src/pages/AboutPage.jsx
import React from "react";
import { Helmet } from "react-helmet-async";

const AboutPage = () => {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <Helmet>
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-CR21WBQXGL"></script>
        <script>{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-CR21WBQXGL');
        `}</script>
      </Helmet>

      <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
        About GimmeMemes
      </h1>
      <p className="text-lg text-gray-700 leading-relaxed text-center max-w-3xl mx-auto mb-6">
        GimmeMemes is a powerful yet simple tool that helps you create 
        engaging and viral memes effortlessly. Whether you're making memes 
        for fun, for a brand, or just to share with friends, our platform 
        ensures a seamless experience.
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            🎨 Simple & Intuitive
          </h2>
          <p className="text-gray-600">
            No prior experience needed! Just upload an image, add captions, and download your meme.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            🚀 Fast & Lightweight
          </h2>
          <p className="text-gray-600">
            Meme Maker is designed to run smoothly on all devices, ensuring a fast workflow.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            💯 High-Quality Output
          </h2>
          <p className="text-gray-600">
            Generate high-resolution memes optimized for sharing on social media platforms.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            📡 No Downloads Required
          </h2>
          <p className="text-gray-600">
            Everything is handled online—no need to install apps or software.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;