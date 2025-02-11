import React, { useState } from "react";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || "YOUR_OPENAI_KEY";
const HUMOR_API_KEY = import.meta.env.VITE_HUMOR_API_KEY || "YOUR_HUMOR_KEY";

/**
 * MemeAssistantPage
 * 
 * 1) The user enters text in Chatbot or Search.
 * 2) We call "callOpenAIForKeywords(input)" to get a short comma-separated
 *    string of keywords from an LLM prompt.
 * 3) We call the Humor API with those AI-generated keywords => fetch a random or search memes.
 */
function MemeAssistantPage() {
  const [mode, setMode] = useState("chatbot"); // "chatbot" or "search"

  // Chatbot states
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Simple caches
  const [chatCache, setChatCache] = useState({});
  const [searchCache, setSearchCache] = useState({});

  // -----------------------------------------------------------
  //          1)  Call OpenAI to interpret user text
  // -----------------------------------------------------------
  async function callOpenAIForKeywords(userText) {
    // If empty, just return empty
    if (!userText.trim()) return "";

    const systemMessage = {
      role: "system",
      content: `You are a helpful AI that generates short, comma-separated keywords for a meme search. 
        The user text might be describing a scenario, mood, or feelings. 
        Output only a short comma separated list (no more than 5 words) that best captures the comedic essence. 
        Avoid punctuation other than commas.`
    };

    const userMessage = {
      role: "user",
      content: userText
    };

    // We'll ask the model for a single short answer
    const apiUrl = "https://api.openai.com/v1/chat/completions";
    const payload = {
      model: "gpt-3.5-turbo", // or "gpt-3.5-turbo-0301", etc.
      messages: [systemMessage, userMessage],
      max_tokens: 50,
      temperature: 0.7
    };

    try {
      const resp = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) {
        console.error("OpenAI error response:", resp);
        throw new Error(`OpenAI error: ${resp.status}`);
      }
      const data = await resp.json();
      // data.choices[0].message.content => "funny,dog,office"
      const aiOutput = data.choices?.[0]?.message?.content?.trim() || "";
      console.log("OpenAI output:", aiOutput);

      // We trust user typed "funny,dog,office" or "I,am,cat"
      // If the model adds weird punctuation, let's sanitize a bit
      let keywords = aiOutput.replace(/[^\w,\s]/g, ""); // remove extra punctuation
      // Ensure it's not too long
      const splitted = keywords.split(",").map(s => s.trim()).filter(Boolean);
      // limit to 5
      const limited = splitted.slice(0, 5).join(",");
      return limited;
    } catch (err) {
      console.error("OpenAI call failed:", err);
      return "";
    }
  }

  // -----------------------------------------------------------
  //       2)  Chatbot: handleSendChatMessage
  // -----------------------------------------------------------
  async function handleSendChatMessage() {
    if (!chatInput.trim()) {
      // Return random meme if user typed nothing
      const userMsg = { sender: "user", content: "(Random Meme)" };
      setChatMessages(prev => [...prev, userMsg]);
      await fetchRandomMeme(""); 
      setChatInput("");
      return;
    }

    setChatError(null);
    // Add user message
    const userMsg = { sender: "user", content: chatInput };
    setChatMessages(prev => [...prev, userMsg]);

    // Check cache
    if (chatCache[chatInput]) {
      const botCached = { sender: "bot", content: chatCache[chatInput] };
      setChatMessages(prev => [...prev, botCached]);
      setChatInput("");
      return;
    }

    setChatLoading(true);
    try {
      // 1) Get AI keywords
      const aiKeywords = await callOpenAIForKeywords(chatInput);
      // 2) Fetch random meme with those keywords
      const memeUrl = await fetchRandomMeme(aiKeywords);
      // Cache
      if (memeUrl && chatInput.trim()) {
        setChatCache(prev => ({ ...prev, [chatInput]: memeUrl }));
      }
    } catch (err) {
      console.error("handleSendChatMessage error:", err);
      setChatError("Failed to fetch meme. Please try again.");
    } finally {
      setChatLoading(false);
      setChatInput("");
    }
  }

  /**
   * fetchRandomMeme: calls Humor API /memes/random
   */
  async function fetchRandomMeme(aiKeywords) {
    try {
      let url = `https://api.humorapi.com/memes/random?api-key=${HUMOR_API_KEY}&media-type=image`;
      if (aiKeywords) {
        // e.g. "funny,dog" => encode => "funny%2Cdog"
        url += `&keywords=${encodeURIComponent(aiKeywords)}`;
      }
      console.log("Chatbot GET URL:", url);

      const resp = await fetch(url);
      if (!resp.ok) {
        console.error("Chatbot fetch error response:", resp);
        throw new Error(`API error: ${resp.status}`);
      }
      const data = await resp.json();
      console.log("Chatbot response data:", data);

      const memeUrl = data.url || "https://placekitten.com/300/300";
      const botMsg = { sender: "bot", content: memeUrl };
      setChatMessages(prev => [...prev, botMsg]);
      return memeUrl;
    } catch (error) {
      console.error("fetchRandomMeme error:", error);
      setChatError("Failed to fetch meme. Try simpler text or check your keys.");
      const fallback = "https://placekitten.com/400/400";
      const fallbackMsg = { sender: "bot", content: fallback };
      setChatMessages(prev => [...prev, fallbackMsg]);
      return fallback;
    }
  }

  // -----------------------------------------------------------
  //       3)  Meme Search: handleSearchMeme
  // -----------------------------------------------------------
  async function handleSearchMeme() {
    if (!searchQuery.trim()) {
      return;
    }
    setSearchError(null);

    if (searchCache[searchQuery]) {
      setSearchResults(searchCache[searchQuery]);
      setSearchQuery("");
      return;
    }

    setSearchLoading(true);
    try {
      // 1) call OpenAI to interpret
      const aiKeywords = await callOpenAIForKeywords(searchQuery);
      // 2) fetch from Humor API
      const memes = await fetchMemesSearch(aiKeywords);
      if (memes && memes.length && searchQuery.trim()) {
        setSearchCache(prev => ({ ...prev, [searchQuery]: memes }));
      }
    } catch (err) {
      console.error("handleSearchMeme error:", err);
      setSearchError("Failed to search memes. Please try again or simpler text.");
    } finally {
      setSearchLoading(false);
      setSearchQuery("");
    }
  }

  /**
   * fetchMemesSearch: calls Humor API /memes/search
   */
  async function fetchMemesSearch(aiKeywords) {
    try {
      // we fetch up to 4
      let url = `https://api.humorapi.com/memes/search?api-key=${HUMOR_API_KEY}&number=4&media-type=image`;
      if (aiKeywords) {
        url += `&keywords=${encodeURIComponent(aiKeywords)}`;
      }
      console.log("Search GET URL:", url);

      const resp = await fetch(url);
      if (!resp.ok) {
        console.error("Search fetch error response:", resp);
        throw new Error(`API error: ${resp.status}`);
      }
      const data = await resp.json();
      console.log("Search response data:", data);

      const memes = data.memes || [];
      if (!memes.length) {
        console.log("No memes found for AI keywords:", aiKeywords);
        setSearchResults([
          { url: "https://placekitten.com/350/350", title: "No memes found." },
        ]);
        return [];
      } else {
        const shaped = memes.map((m, idx) => ({
          url: m.url || "https://placekitten.com/300/300",
          title: `Meme #${m.id || idx + 1}`,
        }));
        setSearchResults(shaped);
        return shaped;
      }
    } catch (error) {
      console.error("fetchMemesSearch error:", error);
      setSearchError("Failed to search memes. Try simpler or fewer words.");
      setSearchResults([
        {
          url: "https://placekitten.com/350/350",
          title: "Error retrieving meme",
        },
      ]);
      return [];
    }
  }

  // -----------------------------------------------------------
  //                  RENDER
  // -----------------------------------------------------------
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-6">Meme Assistant (OpenAI + HumorAPI)</h1>

      {/* Mode Buttons */}
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
                <p className="text-gray-500">Fetching meme (AI + Humor API)...</p>
              </div>
            )}
          </div>
          {chatError && <div className="text-red-500 mb-4">{chatError}</div>}

          <div className="flex items-center gap-2">
            <input
              type="text"
              className="flex-grow border border-gray-300 rounded px-3 py-2"
              placeholder="Type anything (e.g. 'I won the lottery!')"
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
              placeholder='e.g. "cat office funny" or "awkward moment"'
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
                {searchResults.length === 1 ? "Your Meme Match" : "Top Meme Results"}
              </h3>
            )}
            {searchLoading && (
              <div className="flex justify-center mt-4">
                <div className="loader mr-2"></div>
                <p className="text-gray-500">Searching memes (AI + Humor API)...</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-white rounded border border-gray-200 text-center"
                >
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

export default MemeAssistantPage;