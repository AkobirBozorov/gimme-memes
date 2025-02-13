// src/pages/HomePage.jsx
import React, { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet-async";

/**
 * We rely on an OpenAI key stored in .env:
 *   VITE_OPENAI_API_KEY=sk-xxxxx
 */
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || "";

export default function HomePage() {
  // ------------------ STATE ------------------ //
  const [mode, setMode] = useState("chatbot"); // "chatbot" or "search"

  // Chatbot
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Simple caches
  const [chatCache, setChatCache] = useState({});
  const [searchCache, setSearchCache] = useState({});

  // Chat container ref to auto-scroll
  const chatContainerRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // ---------------------------------------------------------
  // 1) GPT PROMPTS: separate for Chatbot vs. Meme Search
  // ---------------------------------------------------------

  /**
   * Chatbot Prompt:
   * We want exactly two lines:
   *   1) comedic/empathetic reply to user (1-2 sentences)
   *   2) a short search phrase (1-5 words) for a relevant meme
   */
  async function callOpenAIForChatReply(userText) {
    const systemMessage = {
      role: "system",
      content: `
You are a friendly, comedic AI. You must produce EXACTLY two lines:
Line1: comedic or empathetic reply to the user (1-2 sentences).
Line2: a short search phrase (1-5 words) describing the correct meme for their situation. 
No extra words or lines.
If user references a known meme template, use that exact name (e.g. "spiderman pointing meme").
      `,
    };

    const userMessage = { role: "user", content: userText };
    try {
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [systemMessage, userMessage],
          max_tokens: 60,
          temperature: 0.8,
        }),
      });
      if (!resp.ok) {
        console.error("OpenAI chat error:", resp);
        throw new Error(`OpenAI error: ${resp.status}`);
      }

      const data = await resp.json();
      const fullOutput = data.choices?.[0]?.message?.content?.trim() || "";
      console.log("Chatbot 2-line output:\n", fullOutput);

      const lines = fullOutput.split("\n").map((l) => l.trim()).filter(Boolean);
      let comedicReply = "Haha, here's a meme for you...";
      let shortPhrase = "";
      if (lines.length >= 2) {
        comedicReply = lines[0];
        shortPhrase = lines[1];
      } else if (lines.length === 1) {
        comedicReply = lines[0];
      }

      // sanitize shortPhrase
      shortPhrase = shortPhrase.replace(/[^\w\s]/g, " ").trim();
      const words = shortPhrase.split(/\s+/).filter(Boolean).slice(0, 5);
      const finalPhrase = words.join(" ");

      return {
        reply: comedicReply,
        keywords: finalPhrase,
      };
    } catch (err) {
      console.error("callOpenAIForChatReply failed:", err);
      return {
        reply: "Oops, something went wrong. Let's just get a random meme!",
        keywords: "",
      };
    }
  }

  /**
   * Meme Search Prompt:
   * We only need a short search phrase (1-5 words), no comedic line.
   */
  async function callOpenAIForSearchPhrase(userText) {
    const systemMessage = {
      role: "system",
      content: `
You are a helpful AI that outputs only a short search phrase (1-5 words), describing the user's requested meme. No extra lines or text. If user references a known meme (like "spiderman pointing"), keep it exact.
      `,
    };
    const userMessage = { role: "user", content: userText };
    try {
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [systemMessage, userMessage],
          max_tokens: 30,
          temperature: 0.7,
        }),
      });
      if (!resp.ok) {
        console.error("OpenAI search error:", resp);
        throw new Error(`OpenAI error: ${resp.status}`);
      }
      const data = await resp.json();
      let phrase = data.choices?.[0]?.message?.content?.trim() || "";
      console.log("Search phrase from GPT:", phrase);

      // sanitize
      phrase = phrase.replace(/[^\w\s]/g, " ").trim();
      const words = phrase.split(/\s+/).filter(Boolean).slice(0, 5);
      const finalPhrase = words.join(" ");

      return finalPhrase;
    } catch (err) {
      console.error("callOpenAIForSearchPhrase failed:", err);
      return "";
    }
  }

  // ---------------------------------------------------------
  // 2) CHATBOT FLOW
  // ---------------------------------------------------------

  // Adds user message to the chat
  function addUserMessage(content) {
    setChatMessages((prev) => [...prev, { sender: "user", content }]);
  }

  // Adds a text-based bot response
  function addBotTextMessage(content) {
    setChatMessages((prev) => [...prev, { sender: "bot_text", content }]);
  }

  // Adds a meme-based bot response
  function addBotMemeMessage(url) {
    setChatMessages((prev) => [...prev, { sender: "bot_meme", content: url }]);
  }

  async function handleSendChatMessage() {
    const userText = chatInput.trim();
    if (!userText) {
      // If empty, fetch random from fallback
      addUserMessage("(Random Meme)");
      await fetchRandomMemeFromMultipleSubs(""); 
      setChatInput("");
      return;
    }

    setChatError(null);
    addUserMessage(userText);

    // Cache check
    if (chatCache[userText]) {
      // We only stored a meme in cache, so let's display it
      addBotMemeMessage(chatCache[userText]);
      setChatInput("");
      return;
    }

    setChatLoading(true);
    try {
      // 1) Get comedic reply + short phrase
      const { reply, keywords } = await callOpenAIForChatReply(userText);
      // 2) Add comedic text
      addBotTextMessage(reply);
      // 3) fetch meme from multi-subreddits using `keywords`
      const memeUrl = await fetchRandomMemeFromMultipleSubs(keywords);
      if (memeUrl) {
        setChatCache((prev) => ({ ...prev, [userText]: memeUrl }));
      }
    } catch (err) {
      console.error("handleSendChatMessage error:", err);
      setChatError("Failed to fetch meme. Please try again or simpler text.");
    } finally {
      setChatLoading(false);
      setChatInput("");
    }
  }

  /**
   * We do multi-subreddit for the chatbot (broader coverage):
   *   r/memes, r/dankmemes, r/wholesomememes
   * If nothing found, fallback to random from r/memes/hot
   */
  async function fetchRandomMemeFromMultipleSubs(aiKeywords) {
    try {
      if (!aiKeywords) {
        console.log("Chatbot: no keywords => fallback hot from r/memes");
        const randomUrl = await fetchFromRedditMemesHot();
        addBotMemeMessage(randomUrl);
        return randomUrl;
      }

      const subreddits = ["memes", "dankmemes", "wholesomememes"];
      let allLinks = [];

      for (const sub of subreddits) {
        const query = encodeURIComponent(aiKeywords);
        const url = `https://www.reddit.com/r/${sub}/search.json?q=${query}&restrict_sr=1&sort=relevance&limit=5`;
        console.log(`Chatbot GET from /r/${sub}:`, url);

        const resp = await fetch(url);
        if (resp.ok) {
          const data = await resp.json();
          const posts = data?.data?.children || [];
          const imageLinks = extractImagesFromRedditPosts(posts);
          allLinks = [...allLinks, ...imageLinks];
        }
      }

      const uniqueLinks = [...new Set(allLinks)];
      if (!uniqueLinks.length) {
        console.log("No results => fallback hot r/memes");
        const fallbackUrl = await fetchFromRedditMemesHot();
        addBotMemeMessage(fallbackUrl);
        return fallbackUrl;
      }

      const randomPick = uniqueLinks[Math.floor(Math.random() * uniqueLinks.length)];
      addBotMemeMessage(randomPick);
      return randomPick;
    } catch (err) {
      console.error("fetchRandomMemeFromMultipleSubs error:", err);
      const fallbackUrl = await fetchFromRedditMemesHot();
      addBotMemeMessage(fallbackUrl);
      return fallbackUrl;
    }
  }

  // ---------------------------------------------------------
  // 3) MEME SEARCH FLOW (Simpler)
  // ---------------------------------------------------------

  async function handleSearchMeme() {
    const userText = searchQuery.trim();
    if (!userText) return;
    setSearchError(null);

    // cache check
    if (searchCache[userText]) {
      setSearchResults(searchCache[userText]);
      setSearchQuery("");
      return;
    }

    setSearchLoading(true);
    try {
      // Only a short phrase from GPT
      const phrase = await callOpenAIForSearchPhrase(userText);
      const foundMemes = await fetchMemeSearchFromMemes(phrase);
      if (foundMemes.length) {
        setSearchCache((prev) => ({ ...prev, [userText]: foundMemes }));
      }
    } catch (err) {
      console.error("handleSearchMeme error:", err);
      setSearchError("Failed to search memes. Try simpler text or check connection.");
    } finally {
      setSearchLoading(false);
      setSearchQuery("");
    }
  }

  /**
   * This time we only use r/memes to keep it more focused.
   * If no results, fallback random hot.
   */
  async function fetchMemeSearchFromMemes(aiKeywords) {
    if (!aiKeywords) {
      console.log("Search: no AI keywords => fallback random hot from r/memes");
      const fallback = await fetchFromRedditMemesHot();
      setSearchResults([{ url: fallback, title: "Random Meme from r/memes/hot" }]);
      return [{ url: fallback, title: "Random Meme from r/memes/hot" }];
    }

    try {
      const query = encodeURIComponent(aiKeywords);
      const url = `https://www.reddit.com/r/memes/search.json?q=${query}&restrict_sr=1&sort=relevance&limit=10`;
      console.log("Search GET from /r/memes:", url);

      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`Reddit search error: ${resp.status}`);
      const data = await resp.json();
      const posts = data?.data?.children || [];
      const imageLinks = extractImagesFromRedditPosts(posts);

      if (!imageLinks.length) {
        // fallback
        console.log("No memes found => fallback random hot from r/memes");
        const fallbackOne = await fetchFromRedditMemesHot();
        setSearchResults([
          {
            url: fallbackOne,
            title: "No relevant memes found. Here's a random hot meme.",
          },
        ]);
        return [
          {
            url: fallbackOne,
            title: "No relevant memes found. Here's a random hot meme.",
          },
        ];
      }

      // shape
      const shaped = imageLinks.map((link, i) => ({
        url: link,
        title: `Meme #${i + 1}`,
      }));
      setSearchResults(shaped);
      return shaped;
    } catch (err) {
      console.error("fetchMemeSearchFromMemes error:", err);
      const fallbackOne = await fetchFromRedditMemesHot();
      setSearchResults([
        {
          url: fallbackOne,
          title: "Error retrieving memes, fallback random hot",
        },
      ]);
      return [
        {
          url: fallbackOne,
          title: "Error retrieving memes, fallback random hot",
        },
      ];
    }
  }

  // ---------------------------------------------------------
  // 4) Fallback to random from r/memes/hot
  // ---------------------------------------------------------
  async function fetchFromRedditMemesHot() {
    const hotUrl = `https://www.reddit.com/r/memes/hot.json?limit=20`;
    console.log("Fetching from /r/memes/hot:", hotUrl);
    try {
      const resp = await fetch(hotUrl);
      if (!resp.ok) throw new Error(`Reddit hot error: ${resp.status}`);
      const data = await resp.json();
      const posts = data?.data?.children || [];
      const imageLinks = extractImagesFromRedditPosts(posts);
      if (!imageLinks.length) {
        return "https://placekitten.com/400/400";
      }
      const randomPick = imageLinks[Math.floor(Math.random() * imageLinks.length)];
      return randomPick;
    } catch (err) {
      console.error("fetchFromRedditMemesHot error:", err);
      return "https://placekitten.com/400/400";
    }
  }

  // ---------------------------------------------------------
  // 5) Helper: extract images from reddit posts
  // ---------------------------------------------------------
  function extractImagesFromRedditPosts(posts) {
    const images = [];
    for (const p of posts) {
      const pd = p.data;
      if (!pd) continue;
      const preview = pd.preview;
      const maybeImg =
        preview?.images?.[0]?.source?.url ||
        pd.url_overridden_by_dest ||
        "";
      // fix &amp;
      const sanitized = maybeImg.replace(/&amp;/g, "&");
      if (/\.(jpg|jpeg|png|gif)/i.test(sanitized)) {
        images.push(sanitized);
      }
    }
    return images;
  }

  // ---------------------------------------------------------
  // 6) RENDER
  // ---------------------------------------------------------
  return (
    <div className="font-sans text-gray-800">
      <Helmet>
        <title>Meme Assistant</title>
        <meta 
          name="description" 
          content="Get personalized memes for your mood! Chat or search for the perfect meme."
        />
        <link rel="canonical" href="https://www.gimmememes.com/" />
      </Helmet>

      {/* Simple top banner */}
      <div className="bg-gradient-to-r from-green-500 via-green-400 to-green-500 py-8 text-white text-center shadow-lg">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 drop-shadow-sm">
          Get the Perfect Meme for Your Mood
        </h1>
        <p className="text-lg md:text-xl max-w-2xl mx-auto drop-shadow-sm">
          Choose Chatbot or Search to find the best laugh.
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-10 mt-6">
        {/* Mode buttons */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setMode("chatbot")}
            className={`px-4 py-2 rounded-full font-semibold transition ${
              mode === "chatbot"
                ? "bg-green-600 text-white shadow-lg"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            Meme Chatbot
          </button>
          <button
            onClick={() => setMode("search")}
            className={`px-4 py-2 rounded-full font-semibold transition ${
              mode === "search"
                ? "bg-green-600 text-white shadow-lg"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            Meme Search
          </button>
        </div>

        {/* -------------- Chatbot UI -------------- */}
        {mode === "chatbot" && (
          <div className="border border-gray-200 rounded-lg bg-white shadow-md p-4">
            <h2 className="text-xl font-bold text-center mb-4">
              Chat with Meme Bot
            </h2>
            <div
              ref={chatContainerRef}
              className="border border-gray-100 rounded-lg p-4 mb-4 bg-gray-50 overflow-y-auto"
              style={{ minHeight: "32rem", maxHeight: "75vh" }}
            >
              {chatMessages.length === 0 && !chatLoading && (
                <p className="text-gray-500 text-center mt-10">
                  No messages yet. Type something to get a meme!
                </p>
              )}
              {chatMessages.map((msg, idx) => {
                if (msg.sender === "bot_text") {
                  // comedic text line
                  return (
                    <div key={idx} className="flex justify-start mb-3">
                      <div className="bg-green-100 text-green-900 px-3 py-2 rounded-lg max-w-xs shadow">
                        {msg.content}
                      </div>
                    </div>
                  );
                } else if (msg.sender === "bot_meme") {
                  // meme
                  return (
                    <div key={idx} className="flex justify-start mb-3">
                      <div className="flex flex-col items-start">
                        <img
                          src={msg.content}
                          alt="Bot Meme"
                          className="max-w-xs rounded-lg border border-gray-300 shadow-sm"
                        />
                        <a
                          href={msg.content}
                          download
                          className="text-blue-600 text-sm underline mt-1 flex items-center"
                        >
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 16l4-5h-3V4h-2v7H8l4 5zm7 2H5v2h14v-2z" />
                          </svg>
                          Download Meme
                        </a>
                      </div>
                    </div>
                  );
                } else {
                  // user message
                  return (
                    <div key={idx} className="flex justify-end mb-3">
                      <div className="bg-green-200 text-green-900 px-3 py-2 rounded-lg max-w-xs shadow">
                        {msg.content}
                      </div>
                    </div>
                  );
                }
              })}
              {chatLoading && (
                <div className="flex justify-center mt-4">
                  <div className="loader mr-2"></div>
                  <p className="text-gray-600">Loading...</p>
                </div>
              )}
            </div>

            {chatError && (
              <div className="text-red-600 mb-4 text-center">{chatError}</div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="text"
                className="flex-grow border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-green-500 transition"
                placeholder='e.g. "I won the lottery!"'
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendChatMessage();
                }}
              />
              <button
                onClick={handleSendChatMessage}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                disabled={chatLoading}
              >
                {chatLoading ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        )}

        {/* -------------- Search UI -------------- */}
        {mode === "search" && (
          <div className="border border-gray-200 rounded-lg bg-white shadow-md p-4">
            <h2 className="text-xl font-bold text-center mb-4">
              Search Memes
            </h2>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1 font-semibold">
                Describe the Meme:
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-green-500 transition"
                placeholder='e.g. "spiderman pointing to each other" or "drake meme"'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearchMeme();
                }}
              />
            </div>

            <button
              onClick={handleSearchMeme}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
              disabled={searchLoading}
            >
              {searchLoading ? "Searching..." : "Search Meme"}
            </button>

            {searchError && (
              <div className="text-red-600 mt-4 text-center">{searchError}</div>
            )}

            <div className="mt-6 min-h-[400px] bg-gray-50 border border-gray-100 rounded p-4">
              {searchResults.length > 0 && (
                <h3 className="text-lg font-semibold mb-2">
                  {searchResults.length === 1
                    ? "Your Meme Match"
                    : "Top Meme Results"}
                </h3>
              )}
              {searchLoading && (
                <div className="flex justify-center mt-4">
                  <div className="loader mr-2"></div>
                  <p className="text-gray-600">Loading...</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-white rounded border border-gray-200 text-center shadow-sm"
                  >
                    <img
                      src={item.url}
                      alt={item.title || `Meme #${idx + 1}`}
                      className="max-w-full h-auto mb-2 mx-auto"
                    />
                    <p className="text-gray-700 mb-2">{item.title}</p>
                    {/* Download link */}
                    <a
                      href={item.url}
                      download
                      className="text-blue-600 text-sm underline inline-flex items-center"
                    >
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 16l4-5h-3V4h-2v7H8l4 5zm7 2H5v2h14v-2z" />
                      </svg>
                      Download Meme
                    </a>
                  </div>
                ))}
              </div>

              {!searchLoading && searchResults.length === 0 && (
                <p className="text-gray-500 text-center mt-8">
                  No memes found. Try describing your meme differently!
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}