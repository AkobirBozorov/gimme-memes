// src/pages/HomePage.jsx

import React, { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || "";

export default function HomePage() {
  const [mode, setMode] = useState("chatbot");

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

  // Caches (optional)
  const [chatCache, setChatCache] = useState({});
  const [searchCache, setSearchCache] = useState({});

  // For auto-scrolling the chatbot container
  const chatContainerRef = useRef(null);
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // ─────────────────────────────────────────────────────────────────────────────
  // GPT PROMPTS
  // ─────────────────────────────────────────────────────────────────────────────

  // Chatbot: produce EXACTLY two lines:
  //  1) comedic/empathetic reply
  //  2) short search phrase (1-5 words)
  async function callOpenAIForChatReply(userText) {
    try {
      const systemPrompt = {
        role: "system",
        content: `
You are a funny, empathetic AI assistant. You respond in EXACTLY 2 lines:
Line 1: comedic or empathetic reply to the user (1-2 sentences), no mention of the word "meme".
Line 2: a short phrase (1-5 words) representing a known meme template or search terms, no quotes or "meme".
        `,
      };

      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          // or "gpt-4" if you have access and want higher accuracy
          messages: [systemPrompt, { role: "user", content: userText }],
          max_tokens: 60,
          temperature: 0.8,
        }),
      });

      if (!resp.ok) {
        throw new Error(`OpenAI error: ${resp.status}`);
      }

      const data = await resp.json();
      const text = data.choices?.[0]?.message?.content?.trim() || "";
      const lines = text.split("\n").map(s => s.trim()).filter(Boolean);
      if (lines.length < 2) {
        return { reply: lines[0] || "Interesting!", keywords: "" };
      }
      const comedicReply = lines[0];
      let shortPhrase = lines[1];

      shortPhrase = shortPhrase.replaceAll(/["']/g, "");
      shortPhrase = shortPhrase.replace(/[^\p{L}\p{N}\s]/giu, " ").trim();
      shortPhrase = shortPhrase.split(/\s+/).slice(0,5).join(" ");

      return { reply: comedicReply, keywords: shortPhrase };
    } catch (err) {
      console.error("callOpenAIForChatReply error:", err);
      return { reply: "Let's just get a random meme!", keywords: "" };
    }
  }

  // Search: produce a short phrase (1-5 words), no "meme" or quotes
  async function callOpenAIForSearchPhrase(userText) {
    try {
      const systemPrompt = {
        role: "system",
        content: `
Return a short phrase (1-5 words) describing the user's meme request.
No quotes, no "meme" in the text. If user references a known template, use that name.
        `,
      };

      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [systemPrompt, { role: "user", content: userText }],
          max_tokens: 30,
          temperature: 0.7,
        }),
      });

      if (!resp.ok) {
        throw new Error(`OpenAI error: ${resp.status}`);
      }

      const data = await resp.json();
      let phrase = data.choices?.[0]?.message?.content?.trim() || "";
      phrase = phrase.replaceAll(/["']/g, "");
      phrase = phrase.replace(/[^\p{L}\p{N}\s]/giu, " ").trim();
      phrase = phrase.split(/\s+/).slice(0,5).join(" ");

      return phrase;
    } catch (err) {
      console.error("callOpenAIForSearchPhrase error:", err);
      return "";
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // REDDIT FETCHING (with multi-query & scoring)
  // ─────────────────────────────────────────────────────────────────────────────

  async function fetchRedditForKeywords(keywords) {
    // If no keywords, fallback
    if (!keywords) {
      return await fetchFromRedditMemesHot();
    }

    // We'll do multiple queries to increase coverage:
    // 1) title:keywords
    // 2) keywords
    // 3) keywords + "meme"
    const queries = [`title:${keywords}`, keywords, `${keywords} meme`];
    let bestUrl = null;
    let bestScore = -999999;

    for (const q of queries) {
      const url = `https://www.reddit.com/r/memes/search.json?q=${encodeURIComponent(q)}&restrict_sr=1&sort=relevance&limit=30`;
      try {
        const r = await fetch(url);
        if (!r.ok) continue;

        const data = await r.json();
        const posts = data?.data?.children || [];

        for (const post of posts) {
          const potentialUrl = pickBestImageUrl(post);
          if (!potentialUrl) continue;

          const scoreVal = computeScore(post, keywords);
          if (scoreVal > bestScore) {
            bestScore = scoreVal;
            bestUrl = potentialUrl;
          }
        }
      } catch {
        // ignore and continue
      }
    }

    if (!bestUrl) {
      // fallback
      return await fetchFromRedditMemesHot();
    }
    return bestUrl;
  }

  async function fetchMultiSearchArray(keywords) {
    // If no keywords, fallback random
    if (!keywords) {
      const fallback = await fetchFromRedditMemesHot();
      return [{ url: fallback, title: "Random Meme" }];
    }

    const queries = [`title:${keywords}`, keywords, `${keywords} meme`];
    let postList = [];
    for (const q of queries) {
      const url = `https://www.reddit.com/r/memes/search.json?q=${encodeURIComponent(q)}&restrict_sr=1&sort=relevance&limit=30`;
      try {
        const r = await fetch(url);
        if (!r.ok) continue;
        const d = await r.json();
        const p = d?.data?.children || [];
        postList = [...postList, ...p];
      } catch {
        // ignore
      }
    }

    if (!postList.length) {
      const fallbackUrl = await fetchFromRedditMemesHot();
      return [{ url: fallbackUrl, title: "No relevant memes. Fallback random." }];
    }

    const arrScored = [];
    for (const post of postList) {
      const potentialUrl = pickBestImageUrl(post);
      if (!potentialUrl) continue;
      const sc = computeScore(post, keywords);
      arrScored.push({ url: potentialUrl, sc });
    }
    arrScored.sort((a, b) => b.sc - a.sc);

    if (!arrScored.length) {
      const fallbackUrl = await fetchFromRedditMemesHot();
      return [{ url: fallbackUrl, title: "No relevant memes. Fallback random." }];
    }

    return arrScored.map((obj, i) => ({
      url: obj.url,
      title: `Meme #${i + 1}`,
    }));
  }

  function pickBestImageUrl(redditPost) {
    const pd = redditPost?.data;
    if (!pd) return null;
    let url = pd.url_overridden_by_dest || "";
    if (!/\.(jpg|jpeg|png|gif)/i.test(url)) {
      const preview = pd.preview;
      const alt = preview?.images?.[0]?.source?.url || "";
      url = alt;
    }
    if (!/\.(jpg|jpeg|png|gif)/i.test(url)) return null;
    return url.replace(/&amp;/g, "&");
  }

  function computeScore(redditPost, keywords) {
    const pd = redditPost?.data;
    if (!pd) return -999999;
    const title = (pd.title || "").toLowerCase();
    const upvotes = pd.score || 0;
    const commentCount = pd.num_comments || 0;
    let relevance = 0;
    const kwArr = keywords.toLowerCase().split(/\s+/);

    let allFound = true;
    for (const w of kwArr) {
      if (!title.includes(w)) {
        allFound = false;
        break;
      }
    }
    if (allFound) relevance += 10;
    else if (title.includes(keywords.toLowerCase())) relevance += 5;

    const total = relevance + upvotes * 0.1 + commentCount * 0.01;
    return total;
  }

  async function fetchFromRedditMemesHot() {
    const url = "https://www.reddit.com/r/memes/hot.json?limit=20";
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error();
      const data = await r.json();
      const posts = data?.data?.children || [];
      let best = null;
      let bestScore = -9999;

      for (const post of posts) {
        const potentialUrl = pickBestImageUrl(post);
        if (!potentialUrl) continue;
        const sc = computeScore(post, ""); 
        if (sc > bestScore) {
          bestScore = sc;
          best = potentialUrl;
        }
      }
      if (!best) return "https://placekitten.com/400/400";
      return best;
    } catch {
      return "https://placekitten.com/400/400";
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CHATBOT FLOW
  // ─────────────────────────────────────────────────────────────────────────────

  function addUserMessage(content) {
    setChatMessages((prev) => [...prev, { sender: "user", content }]);
  }
  function addBotTextMessage(content) {
    setChatMessages((prev) => [...prev, { sender: "bot_text", content }]);
  }
  function addBotMemeMessage(url) {
    setChatMessages((prev) => [...prev, { sender: "bot_meme", content: url }]);
  }

  async function handleSendChatMessage() {
    const text = chatInput.trim();
    if (!text) {
      addUserMessage("(Random Meme)");
      try {
        setChatLoading(true);
        const fallbackUrl = await fetchFromRedditMemesHot();
        addBotMemeMessage(fallbackUrl);
      } finally {
        setChatLoading(false);
        setChatInput("");
      }
      return;
    }
    setChatError(null);
    addUserMessage(text);
    if (chatCache[text]) {
      addBotMemeMessage(chatCache[text]);
      setChatInput("");
      return;
    }
    setChatLoading(true);
    try {
      const { reply, keywords } = await callOpenAIForChatReply(text);
      addBotTextMessage(reply);
      const memeUrl = await fetchRedditForKeywords(keywords);
      addBotMemeMessage(memeUrl);
      setChatCache((prev) => ({ ...prev, [text]: memeUrl }));
    } catch (err) {
      setChatError("Failed to fetch meme. Try again.");
    } finally {
      setChatLoading(false);
      setChatInput("");
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SEARCH FLOW
  // ─────────────────────────────────────────────────────────────────────────────

  async function handleSearchMeme() {
    const text = searchQuery.trim();
    if (!text) return;
    setSearchError(null);
    if (searchCache[text]) {
      setSearchResults(searchCache[text]);
      setSearchQuery("");
      return;
    }
    setSearchLoading(true);
    try {
      const phrase = await callOpenAIForSearchPhrase(text);
      const arr = await fetchMultiSearchArray(phrase);
      setSearchResults(arr);
      setSearchCache((prev) => ({ ...prev, [text]: arr }));
    } catch {
      setSearchError("Failed to search memes. Try again.");
    } finally {
      setSearchLoading(false);
      setSearchQuery("");
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="font-sans text-gray-800">
      <Helmet>
        <title>Meme Assistant</title>
        <meta
          name="description"
          content="Get personalized memes for your mood. Chat or search for the perfect meme."
        />
      </Helmet>

      <div className="bg-gradient-to-r from-green-500 via-green-400 to-green-500 py-8 text-white text-center shadow-lg">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Get the Perfect Meme</h1>
        <p className="text-lg md:text-xl max-w-2xl mx-auto">Choose Chatbot or Search for a quick laugh</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-10 mt-6">
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setMode("chatbot")}
            className={`px-4 py-2 rounded-full font-semibold transition ${
              mode === "chatbot" ? "bg-green-600 text-white shadow-lg" : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            Meme Chatbot
          </button>
          <button
            onClick={() => setMode("search")}
            className={`px-4 py-2 rounded-full font-semibold transition ${
              mode === "search" ? "bg-green-600 text-white shadow-lg" : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            Meme Search
          </button>
        </div>

        {mode === "chatbot" && (
          <div className="border border-gray-200 rounded-lg bg-white shadow-md p-4">
            <h2 className="text-xl font-bold text-center mb-4">Chat with Meme Bot</h2>
            <div
              ref={chatContainerRef}
              className="border border-gray-100 rounded-lg p-4 mb-4 bg-gray-50 overflow-y-auto"
              style={{ minHeight: "32rem", maxHeight: "75vh" }}
            >
              {chatMessages.length === 0 && !chatLoading && (
                <p className="text-gray-500 text-center mt-10">No messages yet.</p>
              )}
              {chatMessages.map((m, i) => {
                if (m.sender === "bot_text") {
                  return (
                    <div key={i} className="flex justify-start mb-3">
                      <div className="bg-green-100 text-green-900 px-3 py-2 rounded-lg max-w-xs shadow">
                        {m.content}
                      </div>
                    </div>
                  );
                } else if (m.sender === "bot_meme") {
                  return (
                    <div key={i} className="flex justify-start mb-3">
                      <div className="flex flex-col items-start">
                        <img
                          src={m.content}
                          alt="Bot Meme"
                          className="max-w-xs rounded-lg border border-gray-300 shadow-sm"
                        />
                        <a
                          href={m.content}
                          download
                          className="text-blue-600 text-sm underline mt-1 flex items-center"
                        >
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 16l4-5h-3V4h-2v7H8l4 5zm7 2H5v2h14v-2z" />
                          </svg>
                          Download
                        </a>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div key={i} className="flex justify-end mb-3">
                      <div className="bg-green-200 text-green-900 px-3 py-2 rounded-lg max-w-xs shadow">
                        {m.content}
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
            {chatError && <div className="text-red-600 mb-4 text-center">{chatError}</div>}

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

        {mode === "search" && (
          <div className="border border-gray-200 rounded-lg bg-white shadow-md p-4">
            <h2 className="text-xl font-bold text-center mb-4">Search Memes</h2>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1 font-semibold">Describe the Meme:</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-green-500 transition"
                placeholder='e.g. "spiderman pointing"'
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
            {searchError && <div className="text-red-600 mt-4 text-center">{searchError}</div>}

            <div className="mt-6 min-h-[400px] bg-gray-50 border border-gray-100 rounded p-4">
              {searchResults.length > 0 && (
                <h3 className="text-lg font-semibold mb-2">
                  {searchResults.length === 1 ? "Your Meme Match" : "Top Meme Results"}
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
                    <a
                      href={item.url}
                      download
                      className="text-blue-600 text-sm underline inline-flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 16l4-5h-3V4h-2v7H8l4 5zm7 2H5v2h14v-2z" />
                      </svg>
                      Download
                    </a>
                  </div>
                ))}
              </div>
              {!searchLoading && searchResults.length === 0 && (
                <p className="text-gray-500 text-center mt-8">No memes found!</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}