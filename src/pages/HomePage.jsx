// gimme-memes-frontend/src/pages/HomePage.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const HomePage = () => {
  return (
    <div className="font-sans text-gray-800">
      <Helmet>
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-CR21WBQXGL"></script>
        <script>{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-CR21WBQXGL');
        `}</script>

        <title>
          GimmeMemes - Create & Share Memes Instantly | Your Ultimate Meme Creation Platform for Viral Humor
        </title>
        <meta 
          name="description" 
          content="GimmeMemes is your ultimate platform to create and share hilarious memes instantly. With a user-friendly interface, powerful editing tools, and a vibrant community, you can craft memes in minutes and share them across social media. Join us and unleash your creativity today!" 
        />
        <link rel="canonical" href="https://www.gimmememes.com/" />
      </Helmet>
      
      {/* Hero Section with brand gradient */}
      <section
        className="relative bg-gradient-to-r from-[#6EE2F5] to-[#001F3F] text-white overflow-hidden"
        aria-label="Hero Section"
      >
        <div className="relative max-w-6xl mx-auto px-4 py-24 md:py-32 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 drop-shadow-lg">
            Welcome to GimmeMemes
          </h1>
          <p className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
            Easily create hilarious memes with just a few clicks! Upload images or short videos, add captions, and share your creations with the world.
          </p>
          <Link
            to="/create"
            className="inline-block bg-white text-[#001F3F] px-10 py-3 rounded-full shadow-lg transform hover:scale-105 transition duration-300 ease-in-out"
          >
            Create a Meme
          </Link>
        </div>
      </section>

      <section className="py-20 bg-gray-50" aria-label="Why Choose GimmeMemes">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-[#001F3F] mb-6">
            Why Choose GimmeMemes?
          </h2>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
            GimmeMemes empowers everyone—from influencers to casual users—to craft hilarious memes effortlessly. With an intuitive UI and powerful tools, you can create viral-worthy content in minutes.
          </p>
        </div>
      </section>

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

      <section className="py-20 bg-gray-50" aria-label="Our Other Website">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">Explore Our Other Website</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="flex-shrink-0">
              <img 
                src="/logo.png" 
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
                className="mx-auto inline-block bg-[#6EE2F5] text-[#001F3F] px-8 py-3 rounded-full shadow hover:bg-[#6adff9] transition duration-300"
              >
                Visit
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50" aria-label="Share This Page">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">Share GimmeMemes</h2>
          <p className="text-lg text-gray-700 mb-8">
            Spread the laughter by sharing GimmeMemes on your favorite social media platforms.
          </p>
          <div className="flex justify-center gap-6">
            <a 
              href="https://www.facebook.com/sharer/sharer.php?u=https://www.gimmememes.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="Share on Facebook"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="#1877F2" viewBox="0 0 24 24" width="36" height="36">
                <path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.406.593 24 1.325 24h11.495v-9.294H9.691v-3.622h3.129V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.464.099 2.797.143v3.243l-1.918.001c-1.504 0-1.796.715-1.796 1.762v2.312h3.587l-.467 3.622h-3.12V24h6.116C23.406 24 24 23.406 24 22.676V1.325C24 .593 23.406 0 22.675 0z"/>
              </svg>
            </a>
            <a 
              href="https://twitter.com/intent/tweet?url=https://www.gimmememes.com&text=Check%20out%20GimmeMemes!" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="Share on Twitter"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="#1DA1F2" viewBox="0 0 24 24" width="36" height="36">
                <path d="M23.954 4.569c-.885.389-1.83.654-2.825.775 1.014-.611 1.794-1.574 2.163-2.723-.951.564-2.005.974-3.127 1.195-.897-.959-2.178-1.558-3.594-1.558-2.723 0-4.928 2.206-4.928 4.93 0 .39.045.765.127 1.124-4.094-.205-7.725-2.166-10.159-5.144-.424.722-.666 1.561-.666 2.457 0 1.69.861 3.179 2.173 4.053-.8-.026-1.555-.245-2.214-.61v.061c0 2.362 1.679 4.332 3.907 4.777-.409.111-.839.171-1.282.171-.314 0-.615-.03-.916-.086.631 1.953 2.445 3.377 4.604 3.415-1.68 1.32-3.809 2.105-6.102 2.105-.396 0-.787-.023-1.17-.067 2.179 1.394 4.768 2.209 7.557 2.209 9.054 0 14-7.496 14-13.986 0-.21 0-.42-.015-.63A9.935 9.935 0 0 0 24 4.557z"/>
              </svg>
            </a>
            <a 
              href="https://www.linkedin.com/shareArticle?mini=true&url=https://www.gimmememes.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="Share on LinkedIn"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="#0077B5" viewBox="0 0 24 24" width="36" height="36">
                <path d="M20.447 20.452H17.41v-5.569c0-1.327-.027-3.037-1.848-3.037-1.849 0-2.132 1.445-2.132 2.939v5.667H10.376V9h3.131v1.561h.045c.436-.823 1.497-1.69 3.08-1.69 3.296 0 3.904 2.168 3.904 4.988v6.593zM5.337 7.433a1.811 1.811 0 1 1 0-3.623 1.811 1.811 0 0 1 0 3.623zm1.707 13.019H3.63V9h3.414v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/>
              </svg>
            </a>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-[#001F3F] to-[#6EE2F5] text-white py-20" aria-label="Call to Action">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">Start Creating Memes Now</h2>
          <p className="text-lg text-gray-200 max-w-2xl mx-auto mb-8">
            Express your creativity and humor with GimmeMemes. Get started in seconds and create memes that make the internet laugh!
          </p>
          <Link
            to="/create"
            className="inline-block bg-white text-[#001F3F] px-10 py-3 rounded-full shadow-lg transform hover:scale-105 transition duration-300 ease-in-out"
          >
            Get Started
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;