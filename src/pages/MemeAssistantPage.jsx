import React, { useState } from "react";

// Put your keys in .env files
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || "YOUR_OPENAI_KEY";
const HUMOR_API_KEY = import.meta.env.VITE_HUMOR_API_KEY || "YOUR_HUMOR_KEY";

/**
 * MemeAssistantPage
 * 
 *   - We use OpenAI to generate 3-5 short keywords from the user input
 *   - Then we call the Humor API with those keywords
 *   - If that fails, we fallback to random/no-keywords
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

  //------------------------------------------------
  // 1) Call OpenAI to interpret user text
  //------------------------------------------------
  async function callOpenAIForKeywords(userText) {
    if (!userText.trim()) return "";
    const systemMessage = {
      role: "system",
      content: `
        You are a helpful AI that generates short, comma-separated keywords for a meme search. 
        The user text might be describing a scenario, mood, or feelings. 
        Output only a short comma separated list (no more than 5 words) that best captures the comedic essence.
        Avoid punctuation other than commas.
      `,
    };
    const userMessage = { role: "user", content: userText };
    const apiUrl = "https://api.openai.com/v1/chat/completions";
    const payload = {
      model: "gpt-3.5-turbo",
      messages: [systemMessage, userMessage],
      max_tokens: 50,
      temperature: 0.7,
    };

    try {
      const resp = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        console.error("OpenAI error response:", resp);
        throw new Error(`OpenAI error: ${resp.status}`);
      }
      const data = await resp.json();
      const aiOutput = data.choices?.[0]?.message?.content?.trim() || "";
      console.log("OpenAI output:", aiOutput);

      // Clean punctuation, etc.
      let keywords = aiOutput.replace(/[^\w,\s]/g, ""); 
      // Split on comma, filter empty
      const splitted = keywords
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      // Limit to 5
      const limited = splitted.slice(0, 5).join(",");
      return limited;
    } catch (err) {
      console.error("OpenAI call failed:", err);
      return "";
    }
  }

  //------------------------------------------------
  // 2) Chatbot
  //------------------------------------------------
  async function handleSendChatMessage() {
    if (!chatInput.trim()) {
      // If user typed nothing, just fetch a random meme
      const userMsg = { sender: "user", content: "(Random Meme)" };
      setChatMessages((prev) => [...prev, userMsg]);
      await fetchRandomMeme("");
      setChatInput("");
      return;
    }

    setChatError(null);
    const userMsg = { sender: "user", content: chatInput };
    setChatMessages((prev) => [...prev, userMsg]);

    // Check cache
    if (chatCache[chatInput]) {
      // Reuse
      const botCached = { sender: "bot", content: chatCache[chatInput] };
      setChatMessages((prev) => [...prev, botCached]);
      setChatInput("");
      return;
    }

    setChatLoading(true);
    try {
      const aiKeywords = await callOpenAIForKeywords(chatInput);
      const memeUrl = await fetchRandomMeme(aiKeywords);
      if (memeUrl) {
        setChatCache((prev) => ({ ...prev, [chatInput]: memeUrl }));
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
   * fetchRandomMeme:
   *   1) Attempt call with aiKeywords
   *   2) If fails, fallback to random with no keywords
   */
  async function fetchRandomMeme(aiKeywords) {
    let urlWithKeywords = `https://api.humorapi.com/memes/random?api-key=${HUMOR_API_KEY}&media-type=image`;
    if (aiKeywords) {
      urlWithKeywords += `&keywords=${encodeURIComponent(aiKeywords)}`;
    }
    console.log("Chatbot GET URL:", urlWithKeywords);

    try {
      const resp = await fetch(urlWithKeywords);
      if (!resp.ok) {
        throw new Error(`API error: ${resp.status}`);
      }
      const data = await resp.json();
      console.log("Chatbot response data:", data);

      const memeUrl = data.url || "https://placekitten.com/300/300";
      const botMsg = { sender: "bot", content: memeUrl };
      setChatMessages((prev) => [...prev, botMsg]);
      return memeUrl;
    } catch (error) {
      console.error("fetchRandomMeme error:", error);

      // Fallback attempt with NO keywords if we had any
      if (aiKeywords) {
        console.log("Retrying random meme with no keywords...");
        try {
          const fallbackUrl = `https://api.humorapi.com/memes/random?api-key=${HUMOR_API_KEY}&media-type=image`;
          const fallbackResp = await fetch(fallbackUrl);
          if (!fallbackResp.ok) {
            throw new Error(`Fallback API error: ${fallbackResp.status}`);
          }
          const fallbackData = await fallbackResp.json();
          console.log("Fallback random data:", fallbackData);

          const fallbackMemeUrl = fallbackData.url || "https://placekitten.com/300/300";
          const fallbackMsg = { sender: "bot", content: fallbackMemeUrl };
          setChatMessages((prev) => [...prev, fallbackMsg]);
          return fallbackMemeUrl;
        } catch (fallbackErr) {
          console.error("Fallback random meme also failed:", fallbackErr);
        }
      }

      // Final fallback
      setChatError("Humor API request failed. Maybe try again or simpler text.");
      const localFallback = "https://placekitten.com/400/400";
      const fallbackMsg = { sender: "bot", content: localFallback };
      setChatMessages((prev) => [...prev, fallbackMsg]);
      return localFallback;
    }
  }

  //------------------------------------------------
  // 3) Meme Search
  //------------------------------------------------
  async function handleSearchMeme() {
    if (!searchQuery.trim()) return;
    setSearchError(null);

    if (searchCache[searchQuery]) {
      setSearchResults(searchCache[searchQuery]);
      setSearchQuery("");
      return;
    }

    setSearchLoading(true);
    try {
      const aiKeywords = await callOpenAIForKeywords(searchQuery);
      const memes = await fetchMemesSearch(aiKeywords);
      if (memes && memes.length) {
        setSearchCache((prev) => ({ ...prev, [searchQuery]: memes }));
      }
    } catch (err) {
      console.error("handleSearchMeme error:", err);
      setSearchError("Failed to search memes. Please try simpler text.");
    } finally {
      setSearchLoading(false);
      setSearchQuery("");
    }
  }

  /**
   * fetchMemesSearch:
   * 1) Attempt call with aiKeywords
   * 2) If fails or empty, fallback
   */
  async function fetchMemesSearch(aiKeywords) {
    let url = `https://api.humorapi.com/memes/search?api-key=${HUMOR_API_KEY}&number=4&media-type=image`;
    if (aiKeywords) {
      url += `&keywords=${encodeURIComponent(aiKeywords)}`;
    }
    console.log("Search GET URL:", url);

    try {
      const resp = await fetch(url);
      if (!resp.ok) {
        throw new Error(`API error: ${resp.status}`);
      }
      const data = await resp.json();
      console.log("Search response data:", data);

      const memes = data.memes || [];
      if (!memes.length) {
        console.log("No memes found for AI keywords:", aiKeywords);

        // Fallback attempt with fewer or no keywords
        if (aiKeywords.includes(",")) {
          // Try just the first word or random
          const firstKeyword = aiKeywords.split(",")[0].trim();
          if (firstKeyword) {
            return await fetchMemesSearch(firstKeyword);
          }
        }
        // final fallback => random
        setSearchResults([
          {
            url: "https://placekitten.com/350/350",
            title: "No memes found. Try another search",
          },
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

      // fallback random?
      try {
        console.log("Retry searching with NO keywords => random...");
        const fallbackResp = await fetch(
          `https://api.humorapi.com/memes/random?api-key=${HUMOR_API_KEY}&media-type=image`
        );
        if (fallbackResp.ok) {
          const fallbackData = await fallbackResp.json();
          console.log("Fallback random data (search):", fallbackData);
          const randomMeme = [
            {
              url: fallbackData.url || "https://placekitten.com/350/350",
              title: "Random Meme (fallback)",
            },
          ];
          setSearchResults(randomMeme);
          return randomMeme;
        }
      } catch (fallbackErr) {
        console.error("Fallback random also failed in search:", fallbackErr);
      }

      // final local fallback
      setSearchError("Humor API request failed. Possibly blocked or no network.");
      setSearchResults([
        {
          url: "https://placekitten.com/350/350",
          title: "Error retrieving meme",
        },
      ]);
      return [];
    }
  }

  //------------------------------------------------
  //                 RENDER
  //------------------------------------------------
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-6">Meme Assistant (OpenAI + Humor API)</h1>

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
                <p className="text-gray-500">Fetching meme (AI + Humor API)...</p>
              </div>
            )}
          </div>
          {chatError && <div className="text-red-500 mb-4">{chatError}</div>}

          <div className="flex items-center gap-2">
            <input
              type="text"
              className="flex-grow border border-gray-300 rounded px-3 py-2"
              placeholder="e.g. 'I won the lottery!'"
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
              placeholder='e.g. "cat office funny" or "spiderman pointing"'
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