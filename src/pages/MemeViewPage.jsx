// gimme-memes-frontend/src/pages/MemeViewPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { baseApiUrl } from "../utils/api";
import { Helmet } from "react-helmet-async";
import { AiOutlineArrowLeft } from "react-icons/ai";

const MemeViewPage = () => {
  const { id } = useParams();
  const [meme, setMeme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${baseApiUrl}/api/memes/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.meme) {
          setMeme(data.meme);
        } else {
          setError("Meme not found");
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Error fetching meme details");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-4 text-center text-lg">Loading meme...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;
  if (!meme) return <div className="p-4 text-center">No meme found.</div>;

  // Assume the API includes associated user data (e.g., meme.User)
  const user = meme.User || {};

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Helmet>
        <title>{meme.title || "Meme View"}</title>
      </Helmet>
      <button onClick={() => navigate(-1)} className="flex items-center text-blue-500 mb-4">
        <AiOutlineArrowLeft size={20} className="mr-1" />
        Back
      </button>
      <div className="max-w-3xl mx-auto bg-white shadow rounded p-6">
        {meme.title && <h1 className="text-2xl font-bold mb-4">{meme.title}</h1>}
        <img src={meme.filePath} alt="Meme" className="w-full h-auto object-contain mb-4" />
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Uploaded by: {user.username || "Unknown"}</h2>
          <div className="flex space-x-4 mt-2">
            {user.instagram && (
              <a href={user.instagram} target="_blank" rel="noopener noreferrer">
                <img src="/icons/instagram.png" alt="Instagram" className="w-6 h-6" />
              </a>
            )}
            {user.reddit && (
              <a href={user.reddit} target="_blank" rel="noopener noreferrer">
                <img src="/icons/reddit.png" alt="Reddit" className="w-6 h-6" />
              </a>
            )}
            {user.youtube && (
              <a href={user.youtube} target="_blank" rel="noopener noreferrer">
                <img src="/icons/youtube.png" alt="YouTube" className="w-6 h-6" />
              </a>
            )}
            {user.tiktok && (
              <a href={user.tiktok} target="_blank" rel="noopener noreferrer">
                <img src="/icons/tiktok.png" alt="TikTok" className="w-6 h-6" />
              </a>
            )}
          </div>
        </div>
        <p className="text-gray-600">
          Last updated:{" "}
          {meme.updatedAt
            ? new Date(meme.updatedAt).toLocaleString(undefined, {
                dateStyle: "short",
                timeStyle: "short",
              })
            : "N/A"}
        </p>
      </div>
    </div>
  );
};

export default MemeViewPage;