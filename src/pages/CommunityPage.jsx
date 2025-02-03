// gimme-memes-frontend/src/pages/CommunityPage.jsx
import React, { useEffect, useState, useRef } from "react";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { baseApiUrl } from "../utils/api";
import MiniMemePreview from "../components/MiniMemePreview";

const CommunityPage = () => {
  const [memes, setMemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Fetch published memes on mount
  useEffect(() => {
    fetch(`${baseApiUrl}/api/community`)
      .then((res) => res.json())
      .then((data) => {
        setMemes(data.memes || []);
      })
      .catch((err) => {
        console.error(err);
        setError("Error loading community memes.");
      })
      .finally(() => setLoading(false));
  }, []);

  // Handle "Upload Your Meme" button click: trigger hidden file input
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle direct file upload (for users who already have a ready meme image)
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Reset file input
    e.target.value = "";

    // For simplicity, we assume the user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in to upload your meme.");
      return;
    }
    try {
      // Create a new meme record
      const createRes = await fetch(`${baseApiUrl}/api/memes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "draft" }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) {
        alert(createData.error || "Error creating meme record");
        return;
      }
      const memeId = createData.meme.id;

      // Upload the file using the new meme ID
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch(`${baseApiUrl}/api/memes/${memeId}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        alert(uploadData.error || "Error uploading meme image");
        return;
      }
      // After successful upload, refresh the meme list
      alert("Meme uploaded successfully!");
      fetch(`${baseApiUrl}/api/community`)
        .then((res) => res.json())
        .then((data) => {
          setMemes(data.memes || []);
        })
        .catch((err) => console.error(err));
    } catch (err) {
      console.error(err);
      alert("Server error during upload.");
    }
  };

  // Handle like toggle for a meme
  const handleLike = async (meme, setMeme) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in to like a meme.");
      return;
    }
    try {
      // Quick animation (omitted here for brevity)
      const res = await fetch(`${baseApiUrl}/api/community/${meme.id}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Error liking meme");
        return;
      }
      // Update the like count in the state
      setMeme((prev) => ({ ...prev, likeCount: data.likeCount }));
    } catch (err) {
      console.error(err);
      alert("Server error liking meme");
    }
  };

  // Render each meme in a responsive grid
  if (loading) {
    return (
      <div className="p-4 text-center text-lg">Loading Community...</div>
    );
  }
  if (error) {
    return (
      <div className="p-4 text-center text-red-500">{error}</div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 py-8 relative">
      {/* Header Bar */}
      <div className="max-w-5xl mx-auto flex justify-between items-center px-4 mb-8">
        <h1 className="text-3xl font-bold">Community Memes</h1>
        <div>
          <button
            onClick={handleUploadClick}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Upload Your Meme
          </button>
          <button
            onClick={() => navigate("/create")}
            className="ml-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
          >
            Create New Meme
          </button>
        </div>
        {/* Hidden file input for direct upload */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
      {/* If no memes, show a friendly message */}
      {memes.length === 0 ? (
        <div className="max-w-5xl mx-auto text-center p-8 bg-white shadow rounded">
          <p className="text-xl mb-4">No memes yet. Be the first to share one!</p>
          <button
            onClick={() => navigate("/create")}
            className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 transition"
          >
            Create a Meme
          </button>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {memes.map((meme) => (
            <div
              key={meme.id}
              className="bg-white rounded-lg shadow hover:shadow-xl transition p-2"
            >
              <MiniMemePreview meme={meme} />
              {meme.title && (
                <h3 className="mt-2 font-semibold text-center text-gray-700">
                  {meme.title}
                </h3>
              )}
              <div className="flex justify-center mt-2">
                <button
                  onClick={() => navigate(`/create/${meme.id}`)}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommunityPage;