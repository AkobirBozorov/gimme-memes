// src/pages/HomePage.jsx
import React, { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet-async";

/**
 * We rely on an OpenAI key stored in .env:
 *   VITE_OPENAI_API_KEY=sk-xxxxx
 */
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || "";

export default function HomePage() {
  // UI Mode
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

  // Reference to the chat container to auto-scroll
  const chatContainerRef = useRef(null);

  /**
   * Whenever chatMessages changes, scroll to the bottom
   */
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  //----------------------------------------------------------------
  // 1) Use OpenAI to interpret user text => short phrase (1-3 words)
  //----------------------------------------------------------------
  async function callOpenAIForKeywords(userText) {
    if (!userText.trim()) return "";

    const systemMessage = {
      role: "system",
      content: `
        You are a helpful AI that generates a concise phrase (1-3 words) 
        to search for relevant memes. 
        - Avoid providing synonyms or multiple OR terms. 
        - Output only a very short phrase (1 to 3 words), 
          capturing the comedic essence of the user's text. 
        - Do NOT include punctuation beyond spaces.
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
          max_tokens: 15,
          temperature: 0.7,
        }),
      });
      if (!resp.ok) {
        console.error("OpenAI error response:", resp);
        throw new Error(`OpenAI error: ${resp.status}`);
      }
      const data = await resp.json();
      const aiOutput = data.choices?.[0]?.message?.content?.trim() || "";
      console.log("OpenAI output (short phrase):", aiOutput);

      // Remove extra punctuation or lines
      let shortPhrase = aiOutput.replace(/[^\w\s]/gi, "");
      const words = shortPhrase.split(/\s+/).filter(Boolean).slice(0, 3);
      shortPhrase = words.join(" ");
      return shortPhrase;
    } catch (err) {
      console.error("OpenAI call failed:", err);
      return "";
    }
  }

  //----------------------------------------------------------------
  // 2) Chatbot Mode: user text -> AI -> fetch random meme
  //----------------------------------------------------------------

  /**
   * Helper to append a "bot" message to chat
   */
  function addBotMessage(url) {
    const botMsg = { sender: "bot", content: url };
    setChatMessages((prev) => [...prev, botMsg]);
  }

  async function handleSendChatMessage() {
    if (!chatInput.trim()) {
      // If user typed nothing, just fetch random top from r/memes
      const userMsg = { sender: "user", content: "(Random Meme)" };
      setChatMessages((prev) => [...prev, userMsg]);
      await fetchRandomMemeFromMultipleSubs("");
      setChatInput("");
      return;
    }

    setChatError(null);
    // Put user message in UI
    const userMsg = { sender: "user", content: chatInput };
    setChatMessages((prev) => [...prev, userMsg]);

    // Check cache
    if (chatCache[chatInput]) {
      const botCached = { sender: "bot", content: chatCache[chatInput] };
      setChatMessages((prev) => [...prev, botCached]);
      setChatInput("");
      return;
    }

    setChatLoading(true);
    try {
      const aiKeywords = await callOpenAIForKeywords(chatInput);
      const memeUrl = await fetchRandomMemeFromMultipleSubs(aiKeywords);
      if (memeUrl) {
        setChatCache((prev) => ({ ...prev, [chatInput]: memeUrl }));
      }
    } catch (err) {
      console.error("handleSendChatMessage error:", err);
      setChatError("Failed to fetch meme. Please try again or use simpler text.");
    } finally {
      setChatLoading(false);
      setChatInput("");
    }
  }

  /**
   * fetchRandomMemeFromMultipleSubs:
   * - We'll do a multi-subreddit search with the given keywords, pick 1 random result
   * - Subreddits: r/memes, r/dankmemes, r/wholesomememes
   * - If no keywords or none found, fallback to r/memes/hot
   */
  async function fetchRandomMemeFromMultipleSubs(aiKeywords) {
    try {
      if (!aiKeywords) {
        console.log("No AI keywords => fallback random hot from r/memes");
        const randomUrl = await fetchFromRedditMemesHot();
        addBotMessage(randomUrl);
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

      // De-duplicate
      const uniqueLinks = [...new Set(allLinks)];

      if (!uniqueLinks.length) {
        console.log("No results => fallback hot r/memes");
        const fallbackUrl = await fetchFromRedditMemesHot();
        addBotMessage(fallbackUrl);
        return fallbackUrl;
      }

      const randomPick = uniqueLinks[Math.floor(Math.random() * uniqueLinks.length)];
      addBotMessage(randomPick);
      return randomPick;
    } catch (err) {
      console.error("fetchRandomMemeFromMultipleSubs error:", err);
      // fallback
      const fallbackUrl = await fetchFromRedditMemesHot();
      addBotMessage(fallbackUrl);
      return fallbackUrl;
    }
  }

  //----------------------------------------------------------------
  // 3) Meme Search (multi-subreddit)
  //----------------------------------------------------------------
  async function handleSearchMeme() {
    if (!searchQuery.trim()) return;
    setSearchError(null);

    // check cache
    if (searchCache[searchQuery]) {
      setSearchResults(searchCache[searchQuery]);
      setSearchQuery("");
      return;
    }

    setSearchLoading(true);
    try {
      const aiKeywords = await callOpenAIForKeywords(searchQuery);
      const foundMemes = await fetchMultiSubredditSearch(aiKeywords);
      if (foundMemes.length) {
        setSearchCache((prev) => ({ ...prev, [searchQuery]: foundMemes }));
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
   * fetchMultiSubredditSearch:
   *  - Subreddits: r/memes, r/dankmemes, r/wholesomememes
   *  - If no AI keywords or no results, fallback to r/memes/hot
   */
  async function fetchMultiSubredditSearch(aiKeywords) {
    if (!aiKeywords) {
      console.log("No AI keywords => fallback to random hot from r/memes");
      const fallbackOne = await fetchFromRedditMemesHot();
      setSearchResults([
        { url: fallbackOne, title: "Random Meme from r/memes/hot" },
      ]);
      return [{ url: fallbackOne, title: "Random Meme from r/memes/hot" }];
    }

    const subreddits = ["memes", "dankmemes", "wholesomememes"];
    let allLinks = [];

    try {
      for (const sub of subreddits) {
        const query = encodeURIComponent(aiKeywords);
        const url = `https://www.reddit.com/r/${sub}/search.json?q=${query}&restrict_sr=1&sort=relevance&limit=6`;
        console.log(`Search GET from /r/${sub}:`, url);

        const resp = await fetch(url);
        if (!resp.ok) {
          console.error(`Reddit search error: ${resp.status} for /r/${sub}`);
          continue;
        }
        const data = await resp.json();
        const posts = data?.data?.children || [];
        const imageLinks = extractImagesFromRedditPosts(posts);
        allLinks = [...allLinks, ...imageLinks];
      }

      // remove duplicates
      const uniqueLinks = [...new Set(allLinks)];

      if (!uniqueLinks.length) {
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

      const shaped = uniqueLinks.map((link, i) => ({
        url: link,
        title: `Meme #${i + 1}`,
      }));
      setSearchResults(shaped);
      return shaped;
    } catch (err) {
      console.error("fetchMultiSubredditSearch error:", err);
      // fallback
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

  //----------------------------------------------------------------
  // fetchFromRedditMemesHot: fallback random from r/memes/hot
  //----------------------------------------------------------------
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
        console.log("No images found even in hot!");
        return "https://placekitten.com/400/400";
      }
      const randomPick = imageLinks[Math.floor(Math.random() * imageLinks.length)];
      return randomPick;
    } catch (err) {
      console.error("fetchFromRedditMemesHot error:", err);
      // final fallback
      return "https://placekitten.com/400/400";
    }
  }

  //----------------------------------------------------------------
  //  Utility: parse Reddit post data into image links
  //----------------------------------------------------------------
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
      // Some reddit links have &amp; or HTML escapes
      const sanitized = maybeImg.replace(/&amp;/g, "&");

      // Make sure it's an image extension or looks like an image
      if (/\.(jpg|jpeg|png|gif)/i.test(sanitized)) {
        images.push(sanitized);
      }
    }
    return images;
  }

  //----------------------------------------------------------------
  //  UI
  //----------------------------------------------------------------
  return (
    <div className="font-sans text-gray-800">
      <Helmet>
        <title>Meme Assistant</title>
        <meta 
          name="description" 
          content="Get personalized memes tailored to your mood. Instantly search or chat with our Meme Assistant!"
        />
        <link rel="canonical" href="https://www.gimmememes.com/" />
      </Helmet>

      {/* Simple top banner (title + tagline) */}
      <div className="bg-gradient-to-r from-green-500 via-green-400 to-green-500 py-8 text-white text-center shadow-lg">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 drop-shadow-sm">
          Get the Perfect Meme for Your Mood
        </h1>
        <p className="text-lg md:text-xl max-w-2xl mx-auto drop-shadow-sm">
          Chat or search to find the perfect laugh.
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

        {/* Chatbot UI */}
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
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex mb-3 ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.sender === "bot" ? (
                    <div className="flex flex-col items-start">
                      <img
                        src={msg.content}
                        alt="Bot Meme"
                        className="max-w-xs rounded-lg border border-gray-300 shadow-sm"
                      />
                      {/* Download link */}
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
                  ) : (
                    <div className="bg-green-100 text-green-900 px-3 py-2 rounded-lg max-w-xs shadow">
                      {msg.content}
                    </div>
                  )}
                </div>
              ))}
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

        {/* Search UI */}
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
                placeholder='e.g. "spiderman pointing" or "awkward office cat"'
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
                  No memes found yet. Try describing your meme above!
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}