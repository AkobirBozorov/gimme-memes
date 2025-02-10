import React, { useState } from "react";

// The Humor API key from your .env
const API_KEY = import.meta.env.VITE_HUMOR_API_KEY || "YOUR_API_KEY_HERE";

/**
 * MemeAssistantPage - Enhanced
 * - Removes punctuation and extra spaces from user input
 * - Ensures media-type=image
 * - If user input is large or has punctuation, we gracefully handle it
 */
function MemeAssistantPage() {
  const [mode, setMode] = useState("chatbot"); // "chatbot" or "search"

  // --- Chatbot states ---
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);

  // --- Search states ---
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Simple in-memory caches
  const [chatCache, setChatCache] = useState({});
  const [searchCache, setSearchCache] = useState({});

  // --------------------------------------------------
  //                HELPER FUNCTIONS
  // --------------------------------------------------

  /**
   * sanitizeInput:
   *   - Removes punctuation except for letters/digits/spaces
   *   - Splits on whitespace
   *   - Discards empty tokens
   *   - Limits to maxWords if needed
   *   - Joins with commas
   */
  function sanitizeInput(str, maxWords = 5) {
    // Remove punctuation except letters, numbers, spaces
    // E.g. "I am depressed, any tips?" => "I am depressed any tips"
    const noPunct = str.replace(/[^\w\s]/g, " ");
    // Split on spaces
    const words = noPunct.trim().split(/\s+/).filter(Boolean);
    // Limit to 5 words if you like
    const limited = words.slice(0, maxWords);
    // e.g. ["I","am","depressed","any","tips"]
    // Join with commas => "I,am,depressed,any,tips"
    const joined = limited.join(",");
    return joined; // could be empty if user typed only punctuation
  }

  // --------------------------------------------------
  //                CHATBOT LOGIC
  // --------------------------------------------------

  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) {
      // If truly empty, fetch a random meme with no keywords
      const userMsg = { sender: "user", content: "(Random Meme)" };
      setChatMessages((prev) => [...prev, userMsg]);
      await fetchRandomMeme("");
      setChatInput("");
      return;
    }

    setChatError(null);

    // Add user message to chat
    const userMsg = { sender: "user", content: chatInput };
    setChatMessages((prev) => [...prev, userMsg]);

    // If we have it cached
    if (chatCache[chatInput]) {
      const botCached = { sender: "bot", content: chatCache[chatInput] };
      setChatMessages((prev) => [...prev, botCached]);
      setChatInput("");
      return;
    }

    await fetchRandomMeme(chatInput);
    setChatInput("");
  };

  async function fetchRandomMeme(input) {
    setChatLoading(true);
    try {
      // Sanitize
      const sanitized = sanitizeInput(input, 5); // up to 5 words
      let url = `https://api.humorapi.com/memes/random?api-key=${API_KEY}&media-type=image`;

      if (sanitized) {
        // If we have something left
        url += `&keywords=${encodeURIComponent(sanitized)}`;
      }

      console.log("Chatbot GET URL:", url);

      const resp = await fetch(url, { method: "GET" });
      if (!resp.ok) {
        console.error("Chatbot fetch error response:", resp);
        throw new Error(`API error: ${resp.status}`);
      }
      const data = await resp.json();
      console.log("Chatbot response data:", data);

      // data.url or fallback
      const memeUrl = data.url || "https://placekitten.com/300/300";
      const botMsg = { sender: "bot", content: memeUrl };
      setChatMessages((prev) => [...prev, botMsg]);

      // Cache if user typed something
      if (input.trim()) {
        setChatCache((prev) => ({ ...prev, [input]: memeUrl }));
      }
    } catch (err) {
      console.error("Chatbot error:", err);
      setChatError("Failed to fetch meme. Please try again or use simpler words.");
      // fallback
      const fallbackUrl = "https://placekitten.com/400/400";
      setChatMessages((prev) => [...prev, { sender: "bot", content: fallbackUrl }]);
    } finally {
      setChatLoading(false);
    }
  }

  // --------------------------------------------------
  //               SEARCH LOGIC
  // --------------------------------------------------

  const handleSearchMeme = async () => {
    if (!searchQuery.trim()) {
      console.log("Empty search query, ignoring");
      return;
    }

    setSearchError(null);

    // If cached
    if (searchCache[searchQuery]) {
      setSearchResults(searchCache[searchQuery]);
      setSearchQuery("");
      return;
    }

    setSearchLoading(true);
    try {
      const sanitized = sanitizeInput(searchQuery, 7); // up to 7 words, for instance
      let url = `https://api.humorapi.com/memes/search?api-key=${API_KEY}&number=4&media-type=image`;

      if (sanitized) {
        url += `&keywords=${encodeURIComponent(sanitized)}`;
      }

      console.log("Search GET URL:", url);

      const resp = await fetch(url, { method: "GET" });
      if (!resp.ok) {
        console.error("Search fetch error response:", resp);
        throw new Error(`API error: ${resp.status}`);
      }
      const data = await resp.json();
      console.log("Search response data:", data);

      const memes = data.memes || [];
      if (!memes.length) {
        console.log("No memes found for query:", searchQuery);
        setSearchResults([
          { url: "https://placekitten.com/350/350", title: "No memes found." },
        ]);
      } else {
        // shape them
        const shaped = memes.map((m, idx) => ({
          url: m.url || "https://placekitten.com/300/300",
          title: `Meme #${m.id || idx + 1}`,
        }));
        setSearchResults(shaped);
        setSearchCache((prev) => ({ ...prev, [searchQuery]: shaped }));
      }
    } catch (err) {
      console.error("Search error:", err);
      setSearchError("Failed to search memes. Try simpler keywords or fewer words.");
      setSearchResults([
        {
          url: "https://placekitten.com/350/350",
          title: "Error retrieving meme",
        },
      ]);
    } finally {
      setSearchLoading(false);
      setSearchQuery("");
    }
  };

  // --------------------------------------------------
  //               RENDER
  // --------------------------------------------------
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-6">Meme Assistant (Enhanced)</h1>

      {/* Toggle Buttons */}
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

      {/* Meme Chatbot */}
      {mode === "chatbot" && (
        <div>
          {/* Chat Container */}
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
                    alt="Meme from bot"
                    className="max-w-xs rounded-lg border border-gray-300"
                  />
                ) : (
                  <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg max-w-xs">
                    {msg.content}
                  </div>
                )}
              </div>
            ))}
            {/* Loading Spinner */}
            {chatLoading && (
              <div className="flex justify-center mt-4">
                <div className="loader mr-2"></div>
                <p className="text-gray-500">Fetching meme...</p>
              </div>
            )}
          </div>

          {/* Any error messages */}
          {chatError && <div className="text-red-500 mb-4">{chatError}</div>}

          {/* Input + Send */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              className="flex-grow border border-gray-300 rounded px-3 py-2"
              placeholder="Type a message..."
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

      {/* Meme Search */}
      {mode === "search" && (
        <div>
          {/* Search Input */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-1 font-semibold">
              Describe the Meme:
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder='e.g. "funny cat", "rocket dog", "office cringe"'
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

          {searchError && (
            <div className="text-red-500 mt-4">{searchError}</div>
          )}

          {/* Display Search Results */}
          <div className="mt-6">
            {searchResults.length > 0 && (
              <h3 className="text-lg font-semibold mb-2">
                {searchResults.length === 1 ? "Your Meme Match" : "Top Meme Results"}
              </h3>
            )}

            {searchLoading && (
              <div className="flex justify-center mt-4">
                <div className="loader mr-2"></div>
                <p className="text-gray-500">Searching memes...</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-white rounded border border-gray-200 text-center"
                >
                  <img
                    src={item.url || "https://placekitten.com/300/300"}
                    alt={item.title || `Meme #${idx + 1}`}
                    className="max-w-full h-auto mb-2 mx-auto"
                  />
                  <p className="text-gray-700">{item.title || "Meme"}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MemeAssistantPage;