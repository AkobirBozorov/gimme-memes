// gimme-memes-frontend/src/pages/FaqPage.jsx
import React, { useState } from "react";
import { Helmet } from "react-helmet-async";

const FaqPage = () => {
  const faqs = [
    {
      question: "How does GimmeMemes work?",
      answer: "Simply upload an image or short video, add your captions, adjust text overlays, and download your final meme. No advanced skills required!",
    },
    {
      question: "Do I need to pay to use GimmeMemes?",
      answer: "Currently, GimmeMemes is 100% free to use. We aim to keep it that way, but may add optional premium features in the future.",
    },
    {
      question: "Can I create video memes?",
      answer: "Yes! GimmeMemes supports short videos. Just upload your file and add text overlays as you would with an image.",
    },
  ];

  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
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

      <h1 className="text-4xl font-bold text-center mb-8">Frequently Asked Questions</h1>
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer"
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
          >
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">{faq.question}</h2>
              <span className="text-xl">{openIndex === index ? "➖" : "➕"}</span>
            </div>
            {openIndex === index && <p className="mt-2 text-gray-600">{faq.answer}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FaqPage;