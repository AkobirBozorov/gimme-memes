import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async"; // make sure to install it

const HomePage = () => {
  return (
    <div className="font-sans text-gray-800">
      <Helmet>
        <title>GimmeMemes - Create & Share Memes Instantly</title>
        <meta 
          name="description" 
          content="Easily create hilarious memes with just a few clicks! Upload images or short videos, add captions, and share your creations with the world on GimmeMemes." 
        />
        <link rel="canonical" href="https://www.gimmememes.com/" />
        {/* Additional meta tags, like Open Graph tags, can be added here */}
      </Helmet>
      
      {/* Hero Section */}
      <section
        className="relative bg-gradient-to-br from-blue-700 via-indigo-600 to-purple-600 text-white overflow-hidden"
        aria-label="Hero Section"
      >
        <div className="relative max-w-6xl mx-auto px-4 py-24 md:py-32 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 drop-shadow-lg">
            Welcome to GimmeMemes
          </h1>
          <p className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
            Easily create hilarious memes with just a few clicks! Upload images or short videos,
            add captions, and share your creations with the world.
          </p>
          <Link
            to="/create"
            className="inline-block bg-white text-blue-600 px-10 py-3 rounded-full shadow-lg transform hover:scale-105 transition duration-300 ease-in-out"
          >
            Create a Meme
          </Link>
        </div>
      </section>

      {/* Why Choose GimmeMemes */}
      <section className="py-20 bg-gray-50" aria-label="Why Choose GimmeMemes">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Why Choose GimmeMemes?
          </h2>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
            GimmeMemes empowers everyone—from influencers to casual users—to craft hilarious memes effortlessly. With an intuitive UI and powerful tools, you can create viral-worthy content in minutes.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20" aria-label="Key Features">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Easy Uploads",
                desc: "Upload images or short video clips with support for popular formats.",
                icon: "📤",
              },
              {
                title: "Visual Editing",
                desc: "Drag, resize, and style text overlays easily for a smooth workflow.",
                icon: "🎨",
              },
              {
                title: "Custom Styles",
                desc: "Choose colors, fonts, and backgrounds to make your meme unique.",
                icon: "🖌️",
              },
              {
                title: "Download & Share",
                desc: "Save your meme in high quality or share it instantly online.",
                icon: "📲",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-8 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 text-center"
              >
                <div className="text-6xl mb-4">{feature.icon}</div>
                <h3 className="text-2xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50" aria-label="How It Works">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid gap-10 md:grid-cols-2">
            {[
              {
                step: "1. Upload Your Media",
                desc: "Click 'Create a Meme' and upload an image or short video clip.",
              },
              {
                step: "2. Add & Customize Text",
                desc: "Resize text boxes, choose fonts, and adjust colors with ease.",
              },
              {
                step: "3. Fine-Tune & Preview",
                desc: "Adjust everything to perfection before exporting your meme.",
              },
              {
                step: "4. Download & Share",
                desc: "Save your meme in high resolution or share it instantly.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="p-8 bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300"
              >
                <h3 className="text-2xl font-semibold mb-2">{item.step}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20" aria-label="User Benefits">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-10">Why Users Love GimmeMemes</h2>
          <ul className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              "Quick and easy meme creation in minutes.",
              "No design skills needed—perfect for beginners.",
              "Works on any device, including mobile.",
              "Supports both image and video memes.",
              "Completely free—no hidden fees or subscriptions.",
              "Download memes in high-quality formats.",
            ].map((benefit, index) => (
              <li
                key={index}
                className="p-6 bg-white rounded-xl shadow hover:shadow-2xl transition-shadow duration-300 flex items-center justify-center"
              >
                <span className="mr-2 text-green-500 text-xl">✅</span>
                <span className="text-gray-700">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Our Other Website Section */}
      <section className="py-20 bg-gray-50" aria-label="Our Other Website">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">Explore Our Other Website</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="flex-shrink-0">
              <img 
                src="/src/assets/logo.png" 
                alt="Imagerize Logo" 
                className="w-32 h-32 object-contain rounded-full" 
              />
            </div>
            <div className="text-left md:text-left">
              <p className="text-lg text-gray-700 mb-4">
                Discover <strong>Imagerize</strong>—our advanced image enhancement tool that transforms your visuals into stunning masterpieces using cutting-edge AI technology. Whether you’re a professional photographer or simply looking to elevate your images, Imagerize provides powerful tools and an intuitive interface to help your creativity shine.
              </p>
              <a 
                href="https://www.imagerize.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="mx-auto inline-block bg-blue-500 text-white px-8 py-3 rounded-full shadow hover:bg-blue-600 transition duration-300"
              >
                Visit
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Our Mission Section */}
      <section className="py-20 bg-white" aria-label="Our Mission">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">Our Mission</h2>
          <p className="text-lg text-gray-700 mb-4">
            At GimmeMemes, we believe that humor and creativity should be accessible to everyone. Our mission is to empower individuals from all walks of life to express themselves through memes—turning everyday moments into sources of laughter and connection.
          </p>
          <p className="text-lg text-gray-700">
            We continuously innovate and integrate the latest technologies to ensure that our users enjoy a seamless and inspiring creative experience. Whether you're here to create or just to be entertained, we're dedicated to helping you share joy with the world.
          </p>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white py-20" aria-label="Call to Action">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">Start Creating Memes Now</h2>
          <p className="text-lg text-gray-200 max-w-2xl mx-auto mb-8">
            Express your creativity and humor with GimmeMemes. Get started in seconds and create memes that make the internet laugh!
          </p>
          <Link
            to="/create"
            className="inline-block bg-white text-indigo-600 px-10 py-3 rounded-full shadow-lg transform hover:scale-105 transition duration-300 ease-in-out"
          >
            Get Started
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;