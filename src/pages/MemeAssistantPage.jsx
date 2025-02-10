import React, { useState } from "react";

/**
 * This component offers two modes:
 * 1) Meme Chatbot: The user types chat messages, the bot replies with a meme
 * 2) Meme Search: The user describes a meme they're looking for, we show the best match
 *
 * We use a toggle (two buttons) to switch between "chatbot" and "search" mode.
 *
 * The Humor API usage is sketched out with placeholders. Update the fetch calls
 * to match your actual Humor API endpoint and parameters.
 */

const MemeAssistantPage = () => {
  const [mode, setMode] = useState("chatbot"); // "chatbot" or "search"

  // --- States for the Chatbot ---
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]); 
  // Each message is { sender: "user" | "bot", content: string | imageURL }

  // --- States for the Meme Search ---
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null); // { url, title, ... }

  // --- Example: Meme GPT Chat Handler ---
  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) return;

    // Add user message to the chat
    const userMsg = {
      sender: "user",
      content: chatInput,
    };
    setChatMessages((prev) => [...prev, userMsg]);

    // Call Humor API (placeholder)
    try {
      // For example, if your Humor API allows searching by mood or context:
      const response = await fetch("https://api.humorapi.com/placeholder/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // "x-api-key": "a713941e0ad34473aa14a1a2c33848ff"
        },
        body: JSON.stringify({ text: chatInput }), 
      });
      const data = await response.json();

      // Suppose data.memeUrl is the link to the returned meme:
      const botMsg = {
        sender: "bot",
        content: data.memeUrl || "https://placekitten.com/300/300", 
      };
      setChatMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error("Chatbot error:", error);
      // You could show an error image or fallback meme
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          content: "https://placekitten.com/400/400", // fallback meme
        },
      ]);
    }

    setChatInput("");
  };

  // --- Example: Meme Search Handler ---
  const handleSearchMeme = async () => {
    if (!searchQuery.trim()) return;

    try {
      // Suppose Humor API has an endpoint for searching memes by description
      const response = await fetch("https://api.humorapi.com/placeholder/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // "x-api-key": "a713941e0ad34473aa14a1a2c33848ff"
        },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await response.json();

      // Suppose the top result is data.bestMeme
      setSearchResult({
        url: data.bestMeme || "https://placekitten.com/300/300",
        title: "Closest Meme Match",
      });
    } catch (error) {
      console.error("Search error:", error);
      setSearchResult({
        url: "https://placekitten.com/350/350",
        title: "Error retrieving meme",
      });
    }

    setSearchQuery("");
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

      {/* Chatbot Mode */}
      {mode === "chatbot" && (
        <div>
          <div className="border border-gray-200 rounded-lg p-4 mb-4 h-80 overflow-y-auto">
            {chatMessages.length === 0 && (
              <p className="text-gray-500">No messages yet. Say something!</p>
            )}
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex mb-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
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
          </div>
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
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Search Mode */}
      {mode === "search" && (
        <div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-1 font-semibold">
              Describe the Meme:
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="E.g. 'That awkward moment' or 'Office reaction meme'"
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
          >
            Search Meme
          </button>

          {/* Show the search result */}
          {searchResult && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">
                {searchResult.title || "Your Meme"}
              </h3>
              <img
                src={searchResult.url}
                alt="Searched Meme"
                className="max-w-full rounded border border-gray-300"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MemeAssistantPage;