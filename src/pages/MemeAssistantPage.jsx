import React, { useState } from "react";

// Humor API key from your environment
const API_KEY = import.meta.env.VITE_HUMOR_API_KEY || "YOUR_API_KEY_HERE";

function MemeAssistantPage() {
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

  // --------------------------------------------------
  //               Chatbot: handleSendChatMessage
  // --------------------------------------------------
  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) {
      // If empty, let's do a random meme with no keywords or do nothing
      const userMsg = { sender: "user", content: "(Random Meme)" };
      setChatMessages((prev) => [...prev, userMsg]);
      await fetchRandomMeme("");
      setChatInput("");
      return;
    }

    setChatError(null);

    // Add user message
    const userMsg = { sender: "user", content: chatInput };
    setChatMessages((prev) => [...prev, userMsg]);

    // Check cache
    if (chatCache[chatInput]) {
      const botMsg = { sender: "bot", content: chatCache[chatInput] };
      setChatMessages((prev) => [...prev, botMsg]);
      setChatInput("");
      return;
    }

    await fetchRandomMeme(chatInput);
    setChatInput("");
  };

  /**
   * Fetch a random meme given user input as keywords (comma-separated)
   */
  const fetchRandomMeme = async (input) => {
    setChatLoading(true);
    try {
      // Convert "I won lottery" => "I,won,lottery"
      const keywordsParam = input
        ? encodeURIComponent(input.trim().split(/\s+/).join(",")) 
        : "";

      // Build URL
      let url = `https://api.humorapi.com/memes/random?api-key=${API_KEY}`;
      if (keywordsParam) {
        url += `&keywords=${keywordsParam}`;
      }

      console.log("Chatbot GET URL:", url);

      const response = await fetch(url, { method: "GET" });
      if (!response.ok) {
        console.error("Chatbot fetch error response:", response);
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      console.log("Chatbot response data:", data);

      const memeUrl = data.url || "https://placekitten.com/300/300";
      const botMsg = { sender: "bot", content: memeUrl };
      setChatMessages((prev) => [...prev, botMsg]);

      // Cache if input is not empty
      if (input.trim()) {
        setChatCache((prev) => ({ ...prev, [input]: memeUrl }));
      }
    } catch (error) {
      console.error("Chatbot error:", error);
      setChatError("Failed to fetch meme. Please try again.");
      const fallback = "https://placekitten.com/400/400";
      setChatMessages((prev) => [...prev, { sender: "bot", content: fallback }]);
    } finally {
      setChatLoading(false);
    }
  };

  // --------------------------------------------------
  //               Meme Search
  // --------------------------------------------------
  const handleSearchMeme = async () => {
    if (!searchQuery.trim()) {
      console.log("Empty search query, ignoring");
      return;
    }

    setSearchError(null);

    // Check cache
    if (searchCache[searchQuery]) {
      setSearchResults(searchCache[searchQuery]);
      setSearchQuery("");
      return;
    }

    setSearchLoading(true);
    try {
      // Convert "A guy holding glass of champagne" => "A,guy,holding,glass,of,champagne"
      const keywordsParam = encodeURIComponent(
        searchQuery.trim().split(/\s+/).join(",")
      );

      // We'll fetch up to 4 memes
      let url = `https://api.humorapi.com/memes/search?api-key=${API_KEY}&number=4`;
      if (keywordsParam) {
        url += `&keywords=${keywordsParam}`;
      }

      console.log("Search GET URL:", url);

      const response = await fetch(url, { method: "GET" });
      if (!response.ok) {
        console.error("Search fetch error response:", response);
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      console.log("Search response data:", data);

      const memes = data.memes || [];
      if (!memes.length) {
        // No memes found
        console.log("No memes found for query:", searchQuery);
        setSearchResults([
          { url: "https://placekitten.com/350/350", title: "No memes found." },
        ]);
      } else {
        // Convert them to shape { url, title }
        const shapedResults = memes.map((m, idx) => ({
          url: m.url || "https://placekitten.com/300/300",
          title: `Meme #${m.id || idx + 1}`,
        }));
        setSearchResults(shapedResults);
        setSearchCache((prev) => ({ ...prev, [searchQuery]: shapedResults }));
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchError("Failed to search memes. Please try again.");
      setSearchResults([
        { url: "https://placekitten.com/350/350", title: "Error retrieving meme" },
      ]);
    } finally {
      setSearchLoading(false);
      setSearchQuery("");
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-6">Meme Assistant</h1>

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
          <div className="border border-gray-200 rounded-lg p-4 mb-4 h-80 overflow-y-auto">
            {chatMessages.length === 0 && !chatLoading && (
              <p className="text-gray-500">No messages yet. Say something!</p>
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
            {chatLoading && (
              <div className="flex justify-center mt-4">
                <div className="loader mr-2"></div>
                <p className="text-gray-500">Fetching meme...</p>
              </div>
            )}
          </div>

          {chatError && <div className="text-red-500 mb-4">{chatError}</div>}

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
          <div className="mb-4">
            <label className="block text-gray-700 mb-1 font-semibold">
              Describe the Meme:
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder='e.g. "rocket", "office cat", "funny dog"...'
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

          <div className="mt-6">
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