// src/pages/CommunityPage.jsx
import React, { useEffect, useState } from 'react';
import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai';

const CommunityPage = () => {
  const [memes, setMemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/community')
      .then((res) => res.json())
      .then((data) => {
        setMemes(data.memes || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return <div className="p-4 text-center text-lg">Loading Community...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto p-4">
        <h1 className="text-3xl font-bold text-center mb-8">Community Memes</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {memes.map((meme) => (
            <CommunityMemeCard key={meme.id} initialMeme={meme} />
          ))}
        </div>
      </div>
    </div>
  );
};

function CommunityMemeCard({ initialMeme }) {
  const [meme, setMeme] = useState(initialMeme);
  const [animating, setAnimating] = useState(false);

  const handleLike = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('You must be logged in to like a meme.');
      return;
    }
    try {
      // Trigger a quick scale animation on like
      setAnimating(true);
      setTimeout(() => setAnimating(false), 300);

      const res = await fetch(
        `http://localhost:5000/api/community/${meme.id}/like`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Error liking meme');
        return;
      }
      // Update the like count in the card state
      setMeme((prev) => ({ ...prev, likeCount: data.likeCount }));
    } catch (err) {
      console.error(err);
      alert('Server error liking meme');
    }
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1">
      {/* Image Container */}
      <div className="w-full bg-gray-200 flex items-center justify-center h-48 sm:h-64">
        <img
          src={`http://localhost:5000/${meme.filePath}`}
          alt="Community Meme"
          className="max-h-full w-full object-contain"
        />
      </div>
      {/* Like Button & Count */}
      <div className="p-4 flex items-center justify-between">
        <button
          onClick={handleLike}
          className={`text-red-500 transition-transform duration-300 ${
            animating ? 'scale-125' : ''
          }`}
        >
          {meme.likeCount > 0 ? (
            <AiFillHeart size={24} />
          ) : (
            <AiOutlineHeart size={24} />
          )}
        </button>
        <span className="text-gray-700 font-semibold">
          {meme.likeCount || 0}
        </span>
      </div>
    </div>
  );
}

export default CommunityPage;