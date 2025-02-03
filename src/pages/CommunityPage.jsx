// gimme-memes-frontend/src/pages/CommunityPage.jsx
import React, { useEffect, useState } from "react";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { baseApiUrl } from "../utils/api";

/**
 * We fetch all community memes once, then derive:
 * 1) newMemes = sort by updatedAt/createdAt desc
 * 2) popularMemes = sort by likeCount desc
 * and display in two columns side-by-side.
 */
const CommunityPage = () => {
  const [allMemes, setAllMemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Fetch all shared memes
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

  // newMemes => sort by updatedAt desc
  const newMemes = [...allMemes].sort((a, b) => {
    const aTime = a.updatedAt
      ? new Date(a.updatedAt).getTime()
      : new Date(a.createdAt).getTime();
    const bTime = b.updatedAt
      ? new Date(b.updatedAt).getTime()
      : new Date(b.createdAt).getTime();
    return bTime - aTime; // newest first
  });

  // popularMemes => sort by likeCount desc
  const popularMemes = [...allMemes].sort((a, b) => {
    return (b.likeCount || 0) - (a.likeCount || 0);
  });

  if (loading) {
    return <div className="p-4 text-center text-lg">Loading Community...</div>;
  }
  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Header with Create New Meme button */}
      <div className="max-w-6xl mx-auto flex justify-between items-center px-4 mb-8">
        <h1 className="text-3xl font-bold">Community Memes</h1>
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
        /**
         * Two columns: left => New Memes, right => Popular Memes
         */
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Column 1: New Memes */}
            <div className="flex-1">
              <h2 className="text-2xl font-semibold mb-4">New Memes</h2>
              <div className="space-y-6">
                {newMemes.map((meme) => (
                  <CommunityMemeCard key={meme.id} meme={meme} />
                ))}
              </div>
            </div>

            {/* Column 2: Popular Memes */}
            <div className="flex-1">
              <h2 className="text-2xl font-semibold mb-4">Popular Memes</h2>
              <div className="space-y-6">
                {popularMemes.map((meme) => (
                  <CommunityMemeCard key={meme.id} meme={meme} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Meme card that sets a max-h so vertical images don't get too tall
const CommunityMemeCard = ({ meme }) => {
  const [localMeme, setLocalMeme] = useState(meme);
  const [animating, setAnimating] = useState(false);

  const handleLikeClick = async () => {
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
    <div className="bg-white rounded-lg shadow p-4">
      {/* Title if present */}
      {localMeme.title && (
        <h3 className="mb-2 text-lg font-semibold text-gray-700">
          {localMeme.title}
        </h3>
      )}

      {/* Meme image => limit height so very tall images won't blow up */}
      <img
        src={localMeme.filePath}
        alt="Meme"
        className="w-full h-auto object-contain max-h-96 mb-2"
      />

      {/* Like button + count */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleLikeClick}
          className={`text-red-500 transition-transform duration-300 ${
            animating ? "scale-125" : ""
          }`}
        >
          {localMeme.likeCount > 0 ? <AiFillHeart size={20} /> : <AiOutlineHeart size={20} />}
        </button>
        <span className="text-gray-700 font-semibold">
          {localMeme.likeCount || 0}
        </span>
      </div>
    </div>
  );
};

export default CommunityPage;