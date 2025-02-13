import React, { useState } from "react";

/** 
 * We rely on an OpenAI key stored in .env:
 *   VITE_OPENAI_API_KEY=sk-xxxxx
 */
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || "";

/**
 * MemeAssistantPage (OpenAI + Reddit "r/memes" search)
 *
 *  1) Chatbot mode: user text -> callOpenAIForKeywords -> fetchRedditRandomMeme(keywords).
 *  2) Search mode: user text -> callOpenAIForKeywords -> fetchRedditSearch(keywords).
 *  3) If no relevant memes found, fallback to random top from r/memes.
 */
export default function MemeAssistantPage() {
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

  //----------------------------------------------------------------
  // 1) Use OpenAI to interpret user text => single short phrase
  //----------------------------------------------------------------
  async function callOpenAIForKeywords(userText) {
    if (!userText.trim()) return "";

    const systemMessage = {
      role: "system",
      content: `
        You are a helpful AI that generates a concise phrase (1-3 words) 
        to search for relevant memes. 
        - Do not provide synonyms or multiple OR terms. 
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
  // 2) Chatbot Mode: get user text -> call AI -> fetch random meme
  //----------------------------------------------------------------
  async function handleSendChatMessage() {
    if (!chatInput.trim()) {
      // If user typed nothing, just fetch random top
      const userMsg = { sender: "user", content: "(Random Meme)" };
      setChatMessages((prev) => [...prev, userMsg]);
      await fetchRedditRandomMeme("");
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
      const memeUrl = await fetchRedditRandomMeme(aiKeywords);
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
   * fetchRedditRandomMeme:
   * - We'll do a search in r/memes with the given keywords, pick 1 random result from up to 10 results
   * - If no keywords or none found, fallback to top/hot from r/memes
   */
  async function fetchRedditRandomMeme(aiKeywords) {
    try {
      if (!aiKeywords) {
        console.log("Chatbot random approach with no keywords. Fetching /r/memes/hot");
        const randomUrl = await fetchFromRedditMemesHot();
        addBotMessage(randomUrl);
        return randomUrl;
      }

      console.log("Chatbot searching r/memes with query:", aiKeywords);
      const query = encodeURIComponent(aiKeywords);
      const url = `https://www.reddit.com/r/memes/search.json?q=${query}&restrict_sr=1&sort=relevance&limit=10`;
      console.log("Chatbot GET URL:", url);

      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`Reddit search error: ${resp.status}`);
      const data = await resp.json();

      const posts = data?.data?.children || [];
      const imageLinks = extractImagesFromRedditPosts(posts);
      if (!imageLinks.length) {
        // fallback to no keywords
        console.log("No results from search, fallback to random hot memes");
        const fallbackUrl = await fetchFromRedditMemesHot();
        addBotMessage(fallbackUrl);
        return fallbackUrl;
      }

      // pick a random one
      const randomPick = imageLinks[Math.floor(Math.random() * imageLinks.length)];
      addBotMessage(randomPick);
      return randomPick;
    } catch (err) {
      console.error("fetchRedditRandomMeme error:", err);
      // fallback
      const fallbackUrl = await fetchFromRedditMemesHot();
      addBotMessage(fallbackUrl);
      return fallbackUrl;
    }
  }

  // Fetch from the "hot" listing of r/memes, pick 1 random
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

  function addBotMessage(url) {
    const botMsg = { sender: "bot", content: url };
    setChatMessages((prev) => [...prev, botMsg]);
  }

  //----------------------------------------------------------------
  // 3) Meme Search
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
      const foundMemes = await fetchRedditSearch(aiKeywords);
      if (foundMemes.length && searchQuery.trim()) {
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
   * fetchRedditSearch:
   * - If AI gave no keywords or there's nothing found, fallback to random from r/memes/hot
   */
  async function fetchRedditSearch(aiKeywords) {
    if (!aiKeywords) {
      console.log("No AI keywords, fallback to random hot search");
      const randomOne = await fetchFromRedditMemesHot();
      setSearchResults([
        { url: randomOne, title: "Random Meme from r/memes/hot" },
      ]);
      return [
        { url: randomOne, title: "Random Meme from r/memes/hot" },
      ];
    }

    console.log("Search mode with AI query:", aiKeywords);
    const query = encodeURIComponent(aiKeywords);
    const url = `https://www.reddit.com/r/memes/search.json?q=${query}&restrict_sr=1&sort=relevance&limit=10`;
    console.log("Search GET URL:", url);

    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`Reddit search error: ${resp.status}`);
      const data = await resp.json();

      const posts = data?.data?.children || [];
      const imageLinks = extractImagesFromRedditPosts(posts);
      console.log("Search found image links:", imageLinks);

      if (!imageLinks.length) {
        // fallback random
        console.log("No memes found for AI keywords => fallback random hot...");
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
      } else {
        // shape
        const shaped = imageLinks.map((link, i) => ({
          url: link,
          title: `Meme #${i + 1}`,
        }));
        setSearchResults(shaped);
        return shaped;
      }
    } catch (err) {
      console.error("fetchRedditSearch error:", err);
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
  //  Utility to parse Reddit post data into image links
  //----------------------------------------------------------------
  function extractImagesFromRedditPosts(posts) {
    /**
     * We look for:
     *   - post.data.preview.images[0].source.url
     *   - or post.data.url_overridden_by_dest
     * Then we do basic checks for .jpg, .png, .gif
     */
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
  //                   RENDER
  //----------------------------------------------------------------
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-6">
        Meme Assistant (OpenAI + Reddit)
      </h1>

      {/* Mode buttons */}
      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={() => setMode("chatbot")}
          className={`px-4 py-2 rounded-full font-semibold transition ${
            mode === "chatbot" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
          }`}
        >
          Meme Chatbot
        </button>
        <button
          onClick={() => setMode("search")}
          className={`px-4 py-2 rounded-full font-semibold transition ${
            mode === "search" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
          }`}
        >
          Meme Search
        </button>
      </div>

      {/* Chatbot UI */}
      {mode === "chatbot" && (
        <div>
          <div className="border border-gray-200 rounded-lg p-4 mb-4 h-80 overflow-y-auto">
            {chatMessages.length === 0 && !chatLoading && (
              <p className="text-gray-500">No messages yet. Type something!</p>
            )}
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex mb-3 ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.sender === "bot" ? (
                  <img
                    src={msg.content}
                    alt="Bot Meme"
                    className="max-w-xs rounded-lg border border-gray-300"
                  />
                ) : (
                  <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg max-w-xs">
                    {msg.content}
                  </div>
                )}
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-center mt-4">
                <div className="loader mr-2"></div>
                <p className="text-gray-500">Fetching from OpenAI + Reddit ...</p>
              </div>
            )}
          </div>
          {chatError && <div className="text-red-500 mb-4">{chatError}</div>}

          <div className="flex items-center gap-2">
            <input
              type="text"
              className="flex-grow border border-gray-300 rounded px-3 py-2"
              placeholder='e.g. "I won the lottery!"'
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendChatMessage();
              }}
            />
            <button
              onClick={handleSendChatMessage}
              className="bg-blue-600 text-white px-4 py-2 rounded"
              disabled={chatLoading}
            >
              {chatLoading ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      )}

      {/* Search UI */}
      {mode === "search" && (
        <div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-1 font-semibold">
              Describe the Meme:
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2"
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
            className="bg-blue-600 text-white px-4 py-2 rounded"
            disabled={searchLoading}
          >
            {searchLoading ? "Searching..." : "Search Meme"}
          </button>
          {searchError && <div className="text-red-500 mt-4">{searchError}</div>}

          <div className="mt-6">
            {searchResults.length > 0 && (
              <h3 className="text-lg font-semibold mb-2">
                {searchResults.length === 1 ? "Your Meme Match" : "Top Meme Results"}
              </h3>
            )}
            {searchLoading && (
              <div className="flex justify-center mt-4">
                <div className="loader mr-2"></div>
                <p className="text-gray-500">Searching r/memes ...</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((item, idx) => (
                <div key={idx} className="p-4 bg-white rounded border border-gray-200 text-center">
                  <img
                    src={item.url}
                    alt={item.title || `Meme #${idx + 1}`}
                    className="max-w-full h-auto mb-2 mx-auto"
                  />
                  <p className="text-gray-700">{item.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}