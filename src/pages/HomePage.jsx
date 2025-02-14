import React, { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || "";

export default function HomePage() {
  const [mode, setMode] = useState("chatbot");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      setTimeout(() => {
        chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" });
      }, 100);
    }
  }, [chatMessages.length]); // Change dependency from `chatMessages` to `chatMessages.length`  

  async function callOpenAIForChatReply(userText) {
    const sys = {
        role: "system",
        content: `
        You are a witty AI that replies in exactly two lines.
        Line 1: A fun, engaging response based on user input.
        Line 2: The most relevant 1-3 words describing a meme topic (NO hashtags, NO emojis, NO extra words).
        STRICTLY return only these two lines, nothing else.
        `,
    };

    try {
        console.log("GPT Chat Reply Request with:", userText);
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json", 
                Authorization: `Bearer ${OPENAI_API_KEY}` 
            },
            body: JSON.stringify({
                model: "gpt-4-turbo",
                messages: [sys, { role: "user", content: userText }],
                max_tokens: 40,
                temperature: 0.8,
            }),
        });

        if (!response.ok) throw new Error(`GPT error: ${response.status}`);
        const data = await response.json();
        const output = data.choices?.[0]?.message?.content?.trim() || "";
        console.log("GPT Chat Reply Raw Output:", output);

        let lines = output.split("\n").map(s => s.trim()).filter(Boolean);

        if (lines.length !== 2) {
            console.error("Unexpected GPT format:", output);
            return { reply: "Let's just get a random one!", keywords: "random meme" };
        }

        const reply = lines[0];
        let keywords = lines[1];

        // **Ensure keywords are valid** by limiting to 3 words & cleaning input
        keywords = keywords.replace(/[^a-zA-Z0-9\s]/g, "").trim();
        keywords = keywords.split(/\s+/).slice(0, 3).join(" ");

        console.log("Extracted Chat Reply:", reply, "Keywords:", keywords);
        return { reply, keywords };
    } catch (err) {
        console.error("Error in callOpenAIForChatReply:", err);
        return { reply: "Let's just get a random one!", keywords: "random meme" };
    }
}

  function addUserMessage(c) {
    setChatMessages(p => [...p, { sender: "user", content: c }]);
  }
  function addBotTextMessage(c) {
    setChatMessages(p => [...p, { sender: "bot_text", content: c }]);
  }
  function addBotMemeMessage(u) {
    setChatMessages(p => [...p, { sender: "bot_meme", content: u }]);
  
    const img = new Image();
    img.src = u;
    img.onload = () => {
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: "smooth" });
        }
      }, 100);
    };
  }  

  function cleanKeywords(rawKeywords) {
    const ignoredWords = ["funny", "humor", "meme", "trend", "joke", "random"];
    let words = rawKeywords.split(/\s+/).filter(w => !ignoredWords.includes(w));

    // **Allow up to 3 words instead of filtering everything**
    if (words.length === 0) words = rawKeywords.split(/\s+/);
  
    return words.slice(0, 3).join(" "); 
} 
  
async function fetchRedditMeme(query) {
  if (!query) {
      console.log("No keywords provided; falling back to hot memes.");
      return await fetchFromHot();
  }

  const searchQuery = cleanKeywords(query);
  const variants = [
      `title:"${searchQuery}"`, 
      searchQuery,
      searchQuery.split(" ").slice(0, 2).join(" "), 
      searchQuery.split(" ")[0]
  ];

  let bestMeme = null;
  let bestScore = -Infinity;

  for (const variant of variants) {
      const url = `https://www.reddit.com/r/memes/search.json?q=${encodeURIComponent(variant)}&restrict_sr=1&sort=relevance&limit=50`;
      console.log("Searching variant:", variant, "URL:", url);

      try {
          const res = await fetch(url);
          if (!res.ok) {
              console.log("Variant query failed with status", res.status);
              continue;
          }

          const data = await res.json();
          const posts = data?.data?.children || [];
          console.log("Variant", variant, "returned", posts.length, "posts");

          posts.forEach(post => {
              const img = extractImage(post);
              if (!img) return;

              const score = computeScore(post, searchQuery);
              console.log("Post:", post.data.title, "Score:", score);

              // **Reduce filtering threshold slightly** 
              if (score > 5 && score > bestScore) {
                  bestScore = score;
                  bestMeme = img;
              }
          });

          if (bestMeme) break; // Stop early if a good meme is found
      } catch (err) {
          console.error("Error with variant:", variant, err);
      }
  }

  console.log("Best meme score:", bestScore);
  return bestMeme || await fetchFromHot();
}

function extractImage(post) {
  const pd = post.data;
  let url = pd.url_overridden_by_dest || "";

  // ✅ Only allow static image formats (JPG, JPEG, PNG)
  if (!/\.(jpg|jpeg|png)$/i.test(url)) {
      url = pd.preview?.images?.[0]?.source?.url || "";
  }

  // ✅ Filter again to ensure no GIFs/videos
  if (!/\.(jpg|jpeg|png)$/i.test(url)) return null;

  return url.replace(/&amp;/g, "&");
}

  function computeScore(post, query) {
    const pd = post.data;
    const title = (pd.title || "").toLowerCase();
    const upvotes = pd.score || 0;
    const comments = pd.num_comments || 0;
    const agePenalty = (Date.now() / 1000 - pd.created_utc) / (60 * 60 * 24 * 30); // Older memes get small penalty
  
    let relevance = 0;
    const words = query.toLowerCase().split(/\s+/);
    const allMatch = words.every(w => title.includes(w));
    const partialMatch = words.some(w => title.includes(w));
  
    if (allMatch) relevance += 50;
    else if (partialMatch) relevance += 30;
    else relevance -= 20;
  
    let finalScore = relevance + upvotes * 0.05 + comments * 0.01 - agePenalty * 2;
  
    // **Lower the threshold for filtering out memes**
    if (finalScore < 10) {
      console.log("Skipping meme due to low score:", finalScore);
      return -1000; // Forces exclusion
    }
  
    return finalScore;
  }  

  async function fetchFromHot() {
    const url = "https://www.reddit.com/r/memes/hot.json?limit=50";
    console.log("Fetching hot memes from:", url);
  
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Hot memes fetch error");
      const data = await res.json();
      const posts = data?.data?.children || [];
  
      let best = null, bestScore = -Infinity;
      posts.forEach(post => {
        const img = extractImage(post);
        if (!img) return;
  
        const sc = computeScore(post, "");
        
        // **Ignore generic meme titles**
        const ignoreWords = ["meme", "funny", "lol", "random", "haha"];
        const title = post.data.title.toLowerCase();
        if (ignoreWords.some(w => title.includes(w))) return;
  
        if (sc > bestScore) {
          bestScore = sc;
          best = img;
        }
      });
  
      console.log("Best hot meme score:", bestScore);
      return best || "https://placekitten.com/400/400";
    } catch (err) {
      console.error("Error fetching hot memes:", err);
      return "https://placekitten.com/400/400";
    }
  }  

  async function handleSendChatMessage() {
    const text = chatInput.trim();
    if (!text) {
        addUserMessage("(Random)");
        const fallback = await fetchFromHot();
        addBotMemeMessage(fallback);
        return;
    }
    setChatInput("")
    addUserMessage(text);
    setChatLoading(true);

    try {
        const { reply, keywords } = await callOpenAIForChatReply(text);
        addBotTextMessage(reply);
        
        // **Ensure meme is always returned, even if keywords are wrong**
        let memeUrl = await fetchRedditMeme(keywords);
        if (!memeUrl) memeUrl = await fetchFromHot();
        
        addBotMemeMessage(memeUrl);
    } catch (err) {
        console.error("Chatbot error:", err);
        addBotTextMessage("Couldn't fetch meme. Try again.");
    } finally {
        setChatLoading(false);
        setChatInput("");
    }
}

return (
  <div className="font-sans text-gray-800 bg-gradient-to-br from-gray-100 to-pink-200 min-h-screen flex items-center justify-center p-4 overflow-hidden w-full max-w-full">
    <Helmet>
      <title>Meme Chatbot</title>
      <meta name="description" content="Chat with the Meme Bot and get the perfect meme for any mood!" />
    </Helmet>

    <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl p-8 text-center">
      {/* Header Section */}
      <h2 className="text-xl font-semibold">Hi, Meme Lover</h2>
      <p className="text-gray-600 mt-1">Can I help you with anything?</p>

      {/* Chat Container */}
      <div className="mt-6 border border-gray-200 rounded-lg bg-gray-50 shadow p-4 max-h-[550px] overflow-y-auto w-full max-w-full overflow-x-hidden" ref={chatContainerRef}>
        {chatMessages.length === 0 && !chatLoading && (
          <p className="text-gray-500 text-center mt-10">No messages yet. Start the chat!</p>
        )}

        {chatMessages.map((m, i) => {
          if (m.sender === "bot_text") {
            return (
              <div key={i} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"} mb-3 w-full`}>
                <div className={`px-4 py-2 rounded-lg shadow-md w-fit max-w-[80%] break-words ${
                  m.sender === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-900"
                }`}>
                  {m.content}
                </div>
              </div>
            );
          } else if (m.sender === "bot_meme") {
            return (
              <div key={i} className="flex justify-start mb-3">
                <div className="flex flex-col items-start">
                  <img src={m.content} alt="Meme" className="max-w-xs rounded-lg border border-gray-300 shadow-sm" />
                  <a 
                    href={m.content} 
                    download="meme.jpg" 
                    className="bg-blue-500 text-white px-3 py-1 rounded-lg mt-1 inline-flex items-center hover:bg-blue-600 transition"
                  >
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 16l4-5h-3V4h-2v7H8l4 5zm7 2H5v2h14v-2z" />
                    </svg>
                    Download Meme
                  </a>
                </div>
              </div>
            );
          } else {
            return (
              <div key={i} className="flex justify-end mb-3">
                <div className="bg-blue-200 text-blue-900 px-3 py-2 rounded-lg max-w-xs shadow">{m.content}</div>
              </div>
            );
          }
        })}

        {chatLoading && (
          <div className="flex justify-center mt-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-gray-600"></div>
            <p className="text-gray-600 ml-2">Generating meme...</p>
          </div>
        )}
      </div>

      {chatError && <div className="text-red-600 mb-4 text-center">{chatError}</div>}

      {/* Chat Input */}
      <div className="flex items-center gap-2 mt-4">
        <input
          type="text"
          className="flex-grow border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500 transition"
          placeholder='Type something... e.g. "I need a meme!"'
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSendChatMessage();
          }}
        />
        <button
          onClick={handleSendChatMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          disabled={chatLoading}
        >
          {chatLoading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  </div>
);
};