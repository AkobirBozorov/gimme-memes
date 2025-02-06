// gimme-memes-frontend/src/pages/CommunityPage.jsx
import React, { useEffect, useState } from "react";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { baseApiUrl } from "../utils/api";
import { Helmet } from "react-helmet-async";

const CommunityPage = () => {
  const [allMemes, setAllMemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("new"); // "new" or "popular"
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${baseApiUrl}/api/community`)
      .then((res) => res.json())
      .then((data) => {
        setAllMemes(data.memes || []);
      })
      .catch((err) => {
        console.error(err);
        setError("Error loading community memes.");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-4 text-center text-lg">Loading Community...</div>;
  }
  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  // Sort memes for each category
  const newMemes = [...allMemes].sort((a, b) => {
    const aTime = a.updatedAt
      ? new Date(a.updatedAt).getTime()
      : new Date(a.createdAt).getTime();
    const bTime = b.updatedAt
      ? new Date(b.updatedAt).getTime()
      : new Date(b.createdAt).getTime();
    return bTime - aTime;
  });
  const popularMemes = [...allMemes].sort(
    (a, b) => (b.likeCount || 0) - (a.likeCount || 0)
  );

  // Choose which memes to display based on active tab
  const displayedMemes = activeTab === "new" ? newMemes : popularMemes;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Helmet>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-CR21WBQXGL"></script>
        <script>{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-CR21WBQXGL');
        `}</script>
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 mb-8 flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-4">Community Memes</h1>
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => setActiveTab("new")}
            className={`px-4 py-2 rounded ${
              activeTab === "new"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            New Memes
          </button>
          <button
            onClick={() => setActiveTab("popular")}
            className={`px-4 py-2 rounded ${
              activeTab === "popular"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            Popular Memes
          </button>
        </div>
        <button
          onClick={() => navigate("/create")}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
        >
          Create New Meme
        </button>
      </div>

      {allMemes.length === 0 ? (
        <div className="max-w-2xl mx-auto text-center p-8 bg-white shadow rounded">
          <p className="text-xl mb-4">No memes yet. Be the first to share one!</p>
          <button
            onClick={() => navigate("/create")}
            className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 transition"
          >
            Create a Meme
          </button>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto space-y-8 px-4">
          {/* Display memes one at a time in a vertical list */}
          {displayedMemes.map((meme) => (
            <CommunityMemeCard key={meme.id} meme={meme} />
          ))}
        </div>
      )}
    </div>
  );
};

function CommunityMemeCard({ meme }) {
  const [localMeme, setLocalMeme] = useState(meme);
  const [animating, setAnimating] = useState(false);
  const navigate = useNavigate();

  const handleCardClick = () => {
    // Navigate to the Meme View page
    navigate(`/meme/${localMeme.id}`);
  };

  const handleLikeClick = async (e) => {
    e.stopPropagation(); // Prevent the card click
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in to like a meme.");
      return;
    }
    try {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 300);
      const res = await fetch(`${baseApiUrl}/api/community/${localMeme.id}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Error liking meme");
        return;
      }
      setLocalMeme((prev) => ({ ...prev, likeCount: data.likeCount }));
    } catch (err) {
      console.error(err);
      alert("Server error liking meme");
    }
  };

  return (
    <div
      className="bg-white rounded-lg shadow p-4 mb-6 cursor-pointer"
      onClick={handleCardClick}
    >
      {localMeme.title && (
        <h3 className="mb-2 text-lg font-semibold text-gray-700">
          {localMeme.title}
        </h3>
      )}
      <div className="w-full h-96 relative mb-2 overflow-hidden">
        <img
          src={localMeme.filePath}
          alt="Meme"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleLikeClick(e);
          }}
          className={`text-red-500 transition-transform duration-300 ${
            animating ? "scale-125" : ""
          }`}
        >
          {localMeme.likeCount > 0 ? (
            <AiFillHeart size={24} />
          ) : (
            <AiOutlineHeart size={24} />
          )}
        </button>
        <span className="text-gray-700 font-semibold">
          {localMeme.likeCount || 0}
        </span>
      </div>
    </div>
  );
}

export default CommunityPage;