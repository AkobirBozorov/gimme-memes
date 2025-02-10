// gimme-memes-frontend/src/pages/HomePage.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const HomePage = () => {
  const [mode, setMode] = useState("chatbot"); // "chatbot" or "search"

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

        <script type="application/ld+json">{`
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "GimmeMemes",
            "url": "https://www.gimmememes.com",
            "description": "GimmeMemes is your meme assistant to chat with and search for the perfect viral meme.",
            "sameAs": [
              "https://www.facebook.com/GimmeMemes",
              "https://twitter.com/GimmeMemes",
              "https://www.linkedin.com/company/gimmememes"
            ],
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://www.gimmememes.com/search?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          }
        `}</script>

        <title>
          GimmeMemes - Meme Chatbot & Search Assistant | Your Ultimate Meme Assistant
        </title>
        <meta 
          name="description" 
          content="Interact with our Meme Chatbot to receive memes that match your mood or use our Meme Search Assistant to find exactly the meme you need. Try it now!" 
        />
        <link rel="canonical" href="https://www.gimmememes.com/" />

        <meta property="og:title" content="GimmeMemes - Meme Chatbot & Search Assistant" />
        <meta property="og:description" content="Chat with our Meme Bot or search for the perfect viral meme using our advanced meme assistant tool." />
        <meta property="og:image" content="https://www.gimmememes.com/logo.png" />
        <meta property="og:url" content="https://www.gimmememes.com/" />
        <meta property="og:type" content="website" />
  
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="GimmeMemes - Meme Chatbot & Search Assistant" />
        <meta name="twitter:description" content="Interact with our Meme Bot for mood-based memes or use our search assistant to find the exact meme you're looking for." />
        <meta name="twitter:image" content="https://www.gimmememes.com/logo.png" />
      </Helmet>
      
      {/* Hero Section with Brand Color */}
      <section
        className="relative bg-[#528265] text-white overflow-hidden"
        aria-label="Hero Section"
      >
        <div className="relative max-w-6xl mx-auto px-4 py-24 md:py-32 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 drop-shadow-lg">
            Your Ultimate Meme Assistant
          </h1>
          <p className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
            Chat with our Meme Bot to get mood-matching memes or search for the perfect viral meme using our assistant. All powered by the Humor API.
          </p>
          <div className="flex justify-center space-x-4">
            <button 
              onClick={() => setMode("chatbot")}
              className={`px-6 py-3 rounded-full font-bold transition duration-300 ${mode === "chatbot" ? "bg-white text-[#528265]" : "bg-transparent text-white border border-white"}`}
            >
              Meme Chatbot
            </button>
            <button 
              onClick={() => setMode("search")}
              className={`px-6 py-3 rounded-full font-bold transition duration-300 ${mode === "search" ? "bg-white text-[#528265]" : "bg-transparent text-white border border-white"}`}
            >
              Meme Search
            </button>
          </div>
          <div className="mt-8">
            {mode === "chatbot" ? (
              <p className="text-lg md:text-xl">
                Type your message and let our Meme Bot reply with a perfectly matched meme.
              </p>
            ) : (
              <p className="text-lg md:text-xl">
                Describe the meme you're looking for and our assistant will find the closest match for you.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-20 bg-gray-50" aria-label="Why Choose GimmeMemes">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-[#528265] mb-6">
            Why Choose GimmeMemes?
          </h2>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
            With our combined Meme Chatbot and Meme Search Assistant, finding the right meme has never been easier. Whether you're in the mood for a laugh or looking for the perfect reaction, we've got you covered.
          </p>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-20" aria-label="Key Features">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Meme Chatbot",
                desc: "Chat naturally and receive memes that reflect your mood and context.",
                icon: "💬",
              },
              {
                title: "Meme Search",
                desc: "Describe a meme and find the closest match from our Humor API.",
                icon: "🔍",
              },
              {
                title: "Instant Results",
                desc: "Get memes instantly with our fast, API‑powered responses.",
                icon: "⚡",
              },
              {
                title: "User Friendly",
                desc: "An intuitive interface that makes meme searching a breeze.",
                icon: "👍",
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
            {mode === "chatbot"
              ? [
                  {
                    step: "1. Send a Message",
                    desc: "Type a message describing your mood or a reaction.",
                  },
                  {
                    step: "2. Get a Meme",
                    desc: "Our Meme Chatbot analyzes your message and fetches a matching meme.",
                  },
                ]
              : [
                  {
                    step: "1. Describe the Meme",
                    desc: "Enter a description of the meme you're searching for.",
                  },
                  {
                    step: "2. Receive the Best Match",
                    desc: "Our assistant queries the Humor API and returns the closest matching meme.",
                  },
                ]
            .map((item, index) => (
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

      {/* User Benefits Section */}
      <section className="py-20" aria-label="User Benefits">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-10">Why Users Love GimmeMemes</h2>
          <ul className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              "Instant meme responses that match your mood.",
              "Effortless search for the perfect reaction meme.",
              "An interactive and fun chat experience.",
              "Works seamlessly on any device.",
              "Completely free with no hidden costs.",
              "Powered by the best Humor API for quality memes.",
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

      {/* Imagerize Section (Unchanged) */}
      <section className="py-20 bg-gray-50" aria-label="Our Other Website">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">Explore Our Other Website</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="flex-shrink-0">
              <img 
                src="/imagerize.png" 
                alt="Imagerize Logo - Image transforming tool" 
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
                className="mx-auto inline-block bg-[#528265] text-white px-8 py-3 rounded-full shadow hover:bg-[#47795f] transition duration-300"
              >
                Visit
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Share Section */}
      <section className="py-20 bg-gray-50" aria-label="Share This Page">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">Share GimmeMemes</h2>
          <p className="text-lg text-gray-700 mb-8">
            Spread the word about our Meme Assistant by sharing GimmeMemes on your favorite social media platforms.
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
                <path d="M23.954 4.569c-.885.389-1.83.654-2.825.775 1.014-.611 1.794-1.574 2.163-2.723-.951.564-2.005.974-3.127 1.195-.897-.959-2.178-1.558-3.594-1.558-2.723 0-4.928 2.206-4.928 4.93 0 .39.045.765.127 1.124-4.094-.205-7.725-2.166-10.159-5.144a4.822 4.822 0 0 0-.664 2.475 4.92 4.92 0 0 0 2.188 4.1 4.903 4.903 0 0 1-2.229-.616c-.054 2.281 1.581 4.415 3.949 4.89a4.935 4.935 0 0 1-2.224.085c.63 1.966 2.445 3.377 4.604 3.415-1.68 1.32-3.809 2.105-6.102 2.105-.396 0-.787-.023-1.17-.067 2.179 1.394 4.768 2.209 7.557 2.209 9.054 0 14-7.496 14-13.986 0-.21 0-.42-.015-.63A9.935 9.935 0 0 0 24 4.557z"/>
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
    </div>
  );
};

export default HomePage;