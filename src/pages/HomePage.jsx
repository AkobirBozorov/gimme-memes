// src/pages/HomePage.jsx

import React, { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet-async";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || "";

export default function HomePage() {
  const [mode, setMode] = useState("chatbot");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const [chatCache, setChatCache] = useState({});
  const [searchCache, setSearchCache] = useState({});

  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  async function callOpenAIForChatReply(userText) {
    const sys = {
      role: "system",
      content: `
You produce EXACTLY 2 lines.
Line1: comedic or empathetic reply, no mention of "meme."
Line2: short phrase (1-5 words), no "meme," no quotes.
      `,
    };
    try {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [sys, { role: "user", content: userText }],
          max_tokens: 60,
          temperature: 0.8,
        }),
      });
      if (!r.ok) throw new Error(`OpenAI error: ${r.status}`);
      const d = await r.json();
      let out = d.choices?.[0]?.message?.content?.trim() || "";
      let lines = out.split("\n").map(s => s.trim()).filter(Boolean);
      if (lines.length > 2) {
        lines = [lines[0], lines.slice(1).join(" ")];
      }
      let rep = lines[0] || "Interesting!";
      let kw = lines[1] || "";
      kw = kw.replaceAll(/["']/g, "").replace(/[^\p{L}\p{N}\s]/giu, " ").trim();
      kw = kw.split(/\s+/).slice(0,5).join(" ");
      return { reply: rep, keywords: kw };
    } catch {
      return { reply: "Hmm, let's just get something random!", keywords: "" };
    }
  }

  async function callOpenAIForSearchPhrase(userText) {
    const sys = {
      role: "system",
      content: `
You output only a short phrase (1-5 words). No "meme," no quotes.
      `,
    };
    try {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [sys, { role: "user", content: userText }],
          max_tokens: 30,
          temperature: 0.7,
        }),
      });
      if (!r.ok) throw new Error(`OpenAI search error: ${r.status}`);
      const d = await r.json();
      let phrase = d.choices?.[0]?.message?.content?.trim() || "";
      phrase = phrase.replaceAll(/["']/g, "").replace(/[^\p{L}\p{N}\s]/giu, " ").trim();
      phrase = phrase.split(/\s+/).slice(0,5).join(" ");
      return phrase;
    } catch {
      return "";
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
  }

  async function handleSendChatMessage() {
    const txt = chatInput.trim();
    if (!txt) {
      addUserMessage("(Random)");
      await fetchRandomMeme("");
      setChatInput("");
      return;
    }
    setChatError(null);
    addUserMessage(txt);
    if (chatCache[txt]) {
      addBotMemeMessage(chatCache[txt]);
      setChatInput("");
      return;
    }
    setChatLoading(true);
    try {
      const { reply, keywords } = await callOpenAIForChatReply(txt);
      addBotTextMessage(reply);
      const memeUrl = await fetchRandomMeme(keywords);
      if (memeUrl) {
        setChatCache(p => ({ ...p, [txt]: memeUrl }));
      }
    } catch {
      setChatError("Couldn't fetch meme. Try again.");
    } finally {
      setChatLoading(false);
      setChatInput("");
    }
  }

  async function fetchRandomMeme(k) {
    if (!k) {
      const f = await fetchFromRedditMemesHot();
      addBotMemeMessage(f);
      return f;
    }
    const q = encodeURIComponent(`title:${k}`);
    const u = `https://www.reddit.com/r/memes/search.json?q=${q}&restrict_sr=1&sort=relevance&limit=30`;
    try {
      const r = await fetch(u);
      if (!r.ok) {
        const f = await fetchFromRedditMemesHot();
        addBotMemeMessage(f);
        return f;
      }
      const d = await r.json();
      const posts = d?.data?.children || [];
      if (!posts.length) {
        const ff = await fetchFromRedditMemesHot();
        addBotMemeMessage(ff);
        return ff;
      }
      const best = pickBestPost(posts, k);
      if (!best) {
        const fb = await fetchFromRedditMemesHot();
        addBotMemeMessage(fb);
        return fb;
      }
      addBotMemeMessage(best);
      return best;
    } catch {
      const f = await fetchFromRedditMemesHot();
      addBotMemeMessage(f);
      return f;
    }
  }

  async function handleSearchMeme() {
    const txt = searchQuery.trim();
    if (!txt) return;
    setSearchError(null);
    if (searchCache[txt]) {
      setSearchResults(searchCache[txt]);
      setSearchQuery("");
      return;
    }
    setSearchLoading(true);
    try {
      const phrase = await callOpenAIForSearchPhrase(txt);
      const foundMemes = await fetchMemeSearch(phrase);
      if (foundMemes.length) {
        setSearchCache(p => ({ ...p, [txt]: foundMemes }));
      }
    } catch {
      setSearchError("Couldn't search memes. Try again.");
    } finally {
      setSearchLoading(false);
      setSearchQuery("");
    }
  }

  async function fetchMemeSearch(k) {
    if (!k) {
      const f = await fetchFromRedditMemesHot();
      setSearchResults([{ url: f, title: "Random Meme" }]);
      return [{ url: f, title: "Random Meme" }];
    }
    const q = encodeURIComponent(`title:${k}`);
    const u = `https://www.reddit.com/r/memes/search.json?q=${q}&restrict_sr=1&sort=relevance&limit=30`;
    try {
      const r = await fetch(u);
      if (!r.ok) {
        const ff = await fetchFromRedditMemesHot();
        setSearchResults([{ url: ff, title: "No relevant memes. Random." }]);
        return [{ url: ff, title: "No relevant memes. Random." }];
      }
      const d = await r.json();
      const posts = d?.data?.children || [];
      if (!posts.length) {
        const ff = await fetchFromRedditMemesHot();
        setSearchResults([{ url: ff, title: "No relevant memes. Random." }]);
        return [{ url: ff, title: "No relevant memes. Random." }];
      }
      const bestArr = pickBestPostsArray(posts, k);
      setSearchResults(bestArr);
      return bestArr;
    } catch {
      const fb = await fetchFromRedditMemesHot();
      setSearchResults([{ url: fb, title: "Error. Fallback random." }]);
      return [{ url: fb, title: "Error. Fallback random." }];
    }
  }

  async function fetchFromRedditMemesHot() {
    const u = "https://www.reddit.com/r/memes/hot.json?limit=20";
    try {
      const r = await fetch(u);
      if (!r.ok) return "https://placekitten.com/400/400";
      const d = await r.json();
      const p = d?.data?.children || [];
      if (!p.length) return "https://placekitten.com/400/400";
      const arr = extractImages(p);
      if (!arr.length) return "https://placekitten.com/400/400";
      return arr[Math.floor(Math.random() * arr.length)];
    } catch {
      return "https://placekitten.com/400/400";
    }
  }

  function extractImages(posts) {
    const images = [];
    for (const c of posts) {
      const pd = c.data;
      if (!pd) continue;
      const prev = pd.preview;
      const link = prev?.images?.[0]?.source?.url || pd.url_overridden_by_dest || "";
      const clean = link.replace(/&amp;/g, "&");
      if (/\.(jpg|jpeg|png|gif)/i.test(clean)) images.push(clean);
    }
    return images;
  }

  function pickBestPost(posts, searchWords) {
    let bestUrl = null;
    let bestScore = -99999;
    const sw = searchWords.toLowerCase().split(/\s+/);

    for (const c of posts) {
      const pd = c.data;
      if (!pd) continue;
      const images = extractImages([c]);
      if (!images.length) continue;
      const title = (pd.title || "").toLowerCase();
      const score = pd.score || 0;
      const comm = pd.num_comments || 0;
      let rel = 0;
      let allFound = true;
      for (const w of sw) {
        if (!title.includes(w)) {
          allFound = false;
          break;
        }
      }
      if (allFound) rel += 10;
      else if (title.includes(searchWords.toLowerCase())) rel += 5;
      const total = rel + score * 0.1 + comm * 0.01;
      if (total > bestScore) {
        bestScore = total;
        bestUrl = images[0];
      }
    }
    if (!bestUrl || bestScore < -9999) return null;
    return bestUrl;
  }

  function pickBestPostsArray(posts, searchWords) {
    const arr = [];
    let bestScoreArr = [];
    const sw = searchWords.toLowerCase().split(/\s+/);

    for (const c of posts) {
      const pd = c.data;
      if (!pd) continue;
      const images = extractImages([c]);
      if (!images.length) continue;
      const title = (pd.title || "").toLowerCase();
      const score = pd.score || 0;
      const comm = pd.num_comments || 0;
      let rel = 0;
      let allFound = true;
      for (const w of sw) {
        if (!title.includes(w)) {
          allFound = false;
          break;
        }
      }
      if (allFound) rel += 10;
      else if (title.includes(searchWords.toLowerCase())) rel += 5;
      const total = rel + score * 0.1 + comm * 0.01;
      bestScoreArr.push({ url: images[0], val: total });
    }
    bestScoreArr.sort((a,b) => b.val - a.val);
    if (!bestScoreArr.length) return [];
    return bestScoreArr.map((o,i) => ({ url: o.url, title: "Meme #" + (i+1) }));
  }

  return (
    <div className="font-sans text-gray-800">
      <Helmet>
        <title>Meme Assistant</title>
        <meta name="description" content="Get personalized memes for your mood." />
      </Helmet>

      <div className="bg-gradient-to-r from-green-500 via-green-400 to-green-500 py-8 text-white text-center shadow-lg">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 drop-shadow-sm">Get Perfect Memes</h1>
        <p className="text-lg md:text-xl max-w-2xl mx-auto drop-shadow-sm">Chat or search for a quick laugh.</p>
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
            <h2 className="text-xl font-bold text-center mb-4">Chat with Bot</h2>
            <div
              ref={chatContainerRef}
              className="border border-gray-100 rounded-lg p-4 mb-4 bg-gray-50 overflow-y-auto"
              style={{ minHeight: "32rem", maxHeight: "75vh" }}
            >
              {!chatMessages.length && !chatLoading && (
                <p className="text-gray-500 text-center mt-10">No messages yet.</p>
              )}
              {chatMessages.map((m,i) => {
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
                        <img src={m.content} alt="Bot Meme" className="max-w-xs rounded-lg border border-gray-300 shadow-sm" />
                        <a href={m.content} download className="text-blue-600 text-sm underline mt-1 flex items-center">
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
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSendChatMessage(); }}
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
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSearchMeme(); }}
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
                  <div key={idx} className="p-4 bg-white rounded border border-gray-200 text-center shadow-sm">
                    <img src={item.url} alt={item.title || `Meme #${idx + 1}`} className="max-w-full h-auto mb-2 mx-auto" />
                    <p className="text-gray-700 mb-2">{item.title}</p>
                    <a href={item.url} download className="text-blue-600 text-sm underline inline-flex items-center">
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