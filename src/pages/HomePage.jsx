import React, { useState, useEffect, useRef } from "react";
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
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  async function callOpenAIForChatReply(userText) {
    try {
      const sys = {
        role: "system",
        content: `You produce EXACTLY 2 lines.
Line1: A friendly, witty reply (1-2 sentences) to the user without mentioning "meme."
Line2: A short, precise meme template name (1-5 words) that best represents the user's request. Do not include quotes or the word "meme."`,
      };
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [sys, { role: "user", content: userText }],
          max_tokens: 60,
          temperature: 0.8,
        }),
      });
      if (!r.ok) throw new Error(`OpenAI error: ${r.status}`);
      const d = await r.json();
      const output = d.choices?.[0]?.message?.content?.trim() || "";
      console.log("GPT Chat Reply Output:", output);
      let lines = output.split("\n").map(s => s.trim()).filter(Boolean);
      if (lines.length > 2) lines = [lines[0], lines.slice(1).join(" ")];
      const reply = lines[0] || "Interesting!";
      let keywords = lines[1] || "";
      keywords = keywords.replaceAll(/["']/g, "").replace(/[^\p{L}\p{N}\s]/giu, " ").trim();
      keywords = keywords.split(/\s+/).slice(0,5).join(" ");
      console.log("Extracted keywords:", keywords);
      return { reply, keywords };
    } catch (err) {
      console.log("Error in callOpenAIForChatReply:", err);
      return { reply: "Let's get something random!", keywords: "" };
    }
  }

  async function callOpenAIForSearchPhrase(userText) {
    try {
      const sys = {
        role: "system",
        content: `Return only a short phrase (1-5 words) describing the requested meme. No quotes or extra words.`,
      };
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [sys, { role: "user", content: userText }],
          max_tokens: 30,
          temperature: 0.7,
        }),
      });
      if (!r.ok) throw new Error(`OpenAI error: ${r.status}`);
      const d = await r.json();
      let phrase = d.choices?.[0]?.message?.content?.trim() || "";
      phrase = phrase.replaceAll(/["']/g, "").replace(/[^\p{L}\p{N}\s]/giu, " ").trim();
      phrase = phrase.split(/\s+/).slice(0,5).join(" ");
      console.log("GPT Search Phrase:", phrase);
      return phrase;
    } catch (err) {
      console.log("Error in callOpenAIForSearchPhrase:", err);
      return "";
    }
  }

  function addUserMessage(msg) {
    setChatMessages(prev => [...prev, { sender: "user", content: msg }]);
  }
  function addBotTextMessage(msg) {
    setChatMessages(prev => [...prev, { sender: "bot_text", content: msg }]);
  }
  function addBotMemeMessage(url) {
    setChatMessages(prev => [...prev, { sender: "bot_meme", content: url }]);
  }

  async function fetchBestMeme(query) {
    if (!query) return await fetchFromHot();
    const variants = [`title:"${query}"`, query, `${query} meme`];
    let bestMeme = null;
    let bestScore = -Infinity;
    for (const q of variants) {
      const url = `https://www.reddit.com/r/memes/search.json?q=${encodeURIComponent(q)}&restrict_sr=1&sort=relevance&limit=50`;
      console.log("Reddit search URL:", url);
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const data = await res.json();
        const posts = data?.data?.children || [];
        console.log("Query variant:", q, "returned", posts.length, "posts");
        posts.forEach(post => {
          const img = extractImage(post);
          if (!img) return;
          const score = computeScore(post, query);
          console.log("Post:", post.data.title, "Score:", score);
          if (score > bestScore) {
            bestScore = score;
            bestMeme = img;
          }
        });
      } catch (err) {
        console.log("Error with query variant:", q, err);
      }
    }
    console.log("Best meme score:", bestScore);
    return bestMeme || await fetchFromHot();
  }

  function extractImage(post) {
    const pd = post.data;
    let url = pd.url_overridden_by_dest || "";
    if (!/\.(jpg|jpeg|png|gif)/i.test(url)) {
      url = pd.preview?.images?.[0]?.source?.url || "";
    }
    if (!/\.(jpg|jpeg|png|gif)/i.test(url)) return null;
    return url.replace(/&amp;/g, "&");
  }

  function computeScore(post, query) {
    const pd = post.data;
    const title = (pd.title || "").toLowerCase();
    const upvotes = pd.score || 0;
    const comments = pd.num_comments || 0;
    let relevance = 0;
    const words = query.toLowerCase().split(/\s+/);
    let allMatch = words.every(w => title.includes(w));
    if (allMatch) relevance += 20;
    else if (title.includes(query.toLowerCase())) relevance += 10;
    return relevance + upvotes * 0.1 + comments * 0.01;
  }

  async function fetchFromHot() {
    const url = "https://www.reddit.com/r/memes/hot.json?limit=50";
    console.log("Fetching hot memes from:", url);
    try {
      const res = await fetch(url);
      const data = await res.json();
      const posts = data?.data?.children || [];
      let best = null, bestScore = -Infinity;
      posts.forEach(post => {
        const img = extractImage(post);
        if (!img) return;
        const sc = computeScore(post, "");
        if (sc > bestScore) {
          bestScore = sc;
          best = img;
        }
      });
      console.log("Best hot meme score:", bestScore);
      return best || "https://placekitten.com/400/400";
    } catch (err) {
      console.log("Error fetching hot memes:", err);
      return "https://placekitten.com/400/400";
    }
  }

  async function handleSendChatMessage() {
    const text = chatInput.trim();
    if (!text) {
      addUserMessage("(Random)");
      const fallback = await fetchFromHot();
      addBotMemeMessage(fallback);
      setChatInput("");
      return;
    }
    addUserMessage(text);
    setChatLoading(true);
    try {
      const { reply, keywords } = await callOpenAIForChatReply(text);
      addBotTextMessage(reply);
      const memeUrl = await fetchBestMeme(keywords);
      addBotMemeMessage(memeUrl);
    } catch (err) {
      console.log("Chat error:", err);
      addBotTextMessage("Couldn't fetch meme. Try again.");
    } finally {
      setChatLoading(false);
      setChatInput("");
    }
  }

  async function handleSearchMeme() {
    const text = searchQuery.trim();
    if (!text) return;
    setSearchLoading(true);
    try {
      const phrase = await callOpenAIForSearchPhrase(text);
      const memes = await fetchMultiSearch(phrase);
      setSearchResults(memes);
    } catch (err) {
      console.log("Search error:", err);
      setSearchError("Couldn't search memes. Try again.");
    } finally {
      setSearchLoading(false);
      setSearchQuery("");
    }
  }

  async function fetchMultiSearch(query) {
    if (!query) {
      const fallback = await fetchFromHot();
      return [{ url: fallback, title: "Random Meme" }];
    }
    const url = `https://www.reddit.com/r/memes/search.json?q=${encodeURIComponent(`title:"${query}"`)}&restrict_sr=1&sort=relevance&limit=50`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Search error");
      const data = await res.json();
      const posts = data?.data?.children || [];
      if (!posts.length) {
        const fallback = await fetchFromHot();
        return [{ url: fallback, title: "Random Meme" }];
      }
      const arr = [];
      posts.forEach(post => {
        const img = extractImage(post);
        if (img) {
          arr.push({ url: img, title: post.data.title });
        }
      });
      arr.sort((a, b) => b.title.length - a.title.length);
      return arr.slice(0, 10).map((o, i) => ({ url: o.url, title: `Meme #${i + 1}` }));
    } catch (err) {
      console.log("Error in fetchMultiSearch:", err);
      const fallback = await fetchFromHot();
      return [{ url: fallback, title: "Random Meme" }];
    }
  }

  return (
    <div className="font-sans text-gray-800">
      <Helmet>
        <title>Meme Assistant</title>
        <meta name="description" content="Get personalized memes for your mood. Chat or search for the perfect meme." />
      </Helmet>
      <div className="bg-gradient-to-r from-green-500 via-green-400 to-green-500 py-8 text-white text-center shadow-lg">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Get the Perfect Meme</h1>
        <p className="text-lg md:text-xl max-w-2xl mx-auto">Choose Chatbot or Search for a quick laugh</p>
      </div>
      <div className="max-w-3xl mx-auto px-4 pb-10 mt-6">
        <div className="flex justify-center gap-4 mb-8">
          <button onClick={() => setMode("chatbot")} className={`px-4 py-2 rounded-full font-semibold transition ${mode === "chatbot" ? "bg-green-600 text-white shadow-lg" : "bg-gray-100 text-gray-800 hover:bg-gray-200"}`}>Meme Chatbot</button>
          <button onClick={() => setMode("search")} className={`px-4 py-2 rounded-full font-semibold transition ${mode === "search" ? "bg-green-600 text-white shadow-lg" : "bg-gray-100 text-gray-800 hover:bg-gray-200"}`}>Meme Search</button>
        </div>
        {mode === "chatbot" && (
          <div className="border border-gray-200 rounded-lg bg-white shadow-md p-4">
            <h2 className="text-xl font-bold text-center mb-4">Chat with Meme Bot</h2>
            <div ref={chatContainerRef} className="border border-gray-100 rounded-lg p-4 mb-4 bg-gray-50 overflow-y-auto" style={{ minHeight: "32rem", maxHeight: "75vh" }}>
              {chatMessages.length === 0 && !chatLoading && <p className="text-gray-500 text-center mt-10">No messages yet.</p>}
              {chatMessages.map((m, i) => {
                if (m.sender === "bot_text") return <div key={i} className="flex justify-start mb-3"><div className="bg-green-100 text-green-900 px-3 py-2 rounded-lg max-w-xs shadow">{m.content}</div></div>;
                else if (m.sender === "bot_meme") return <div key={i} className="flex justify-start mb-3"><div className="flex flex-col items-start"><img src={m.content} alt="Bot Meme" className="max-w-xs rounded-lg border border-gray-300 shadow-sm" /><a href={m.content} download className="text-blue-600 text-sm underline mt-1 flex items-center"><svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 16l4-5h-3V4h-2v7H8l4 5zm7 2H5v2h14v-2z" /></svg>Download</a></div></div>;
                else return <div key={i} className="flex justify-end mb-3"><div className="bg-green-200 text-green-900 px-3 py-2 rounded-lg max-w-xs shadow">{m.content}</div></div>;
              })}
              {chatLoading && <div className="flex justify-center mt-4"><div className="loader mr-2"></div><p className="text-gray-600">Loading...</p></div>}
            </div>
            {chatError && <div className="text-red-600 mb-4 text-center">{chatError}</div>}
            <div className="flex items-center gap-2">
              <input type="text" className="flex-grow border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-green-500 transition" placeholder='e.g. "I won the lottery!"' value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleSendChatMessage(); }} />
              <button onClick={handleSendChatMessage} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition" disabled={chatLoading}>{chatLoading ? "Sending..." : "Send"}</button>
            </div>
          </div>
        )}
        {mode === "search" && (
          <div className="border border-gray-200 rounded-lg bg-white shadow-md p-4">
            <h2 className="text-xl font-bold text-center mb-4">Search Memes</h2>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1 font-semibold">Describe the Meme:</label>
              <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-green-500 transition" placeholder='e.g. "spiderman pointing"' value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleSearchMeme(); }} />
            </div>
            <button onClick={handleSearchMeme} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition" disabled={searchLoading}>{searchLoading ? "Searching..." : "Search Meme"}</button>
            {searchError && <div className="text-red-600 mt-4 text-center">{searchError}</div>}
            <div className="mt-6 min-h-[400px] bg-gray-50 border border-gray-100 rounded p-4">
              {searchResults.length > 0 && <h3 className="text-lg font-semibold mb-2">{searchResults.length === 1 ? "Your Meme Match" : "Top Meme Results"}</h3>}
              {searchLoading && <div className="flex justify-center mt-4"><div className="loader mr-2"></div><p className="text-gray-600">Loading...</p></div>}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((item, idx) => (
                  <div key={idx} className="p-4 bg-white rounded border border-gray-200 text-center shadow-sm">
                    <img src={item.url} alt={item.title || `Meme #${idx + 1}`} className="max-w-full h-auto mb-2 mx-auto" />
                    <p className="text-gray-700 mb-2">{item.title}</p>
                    <a href={item.url} download className="text-blue-600 text-sm underline inline-flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 16l4-5h-3V4h-2v7H8l4 5zm7 2H5v2h14v-2z" /></svg>
                      Download
                    </a>
                  </div>
                ))}
              </div>
              {!searchLoading && searchResults.length === 0 && <p className="text-gray-500 text-center mt-8">No memes found!</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
