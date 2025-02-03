// gimme-memes-frontend/src/pages/DashboardPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { baseApiUrl } from "../utils/api";

const DashboardPage = ({ isAuthenticated, setIsAuthenticated }) => {
  const [userData, setUserData] = useState(null);
  const [memes, setMemes] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    fetchUserData();
  }, [isAuthenticated, navigate]);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${baseApiUrl}/api/user/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errMsg = await res.json();
        throw new Error(errMsg.error || "Failed to fetch user data");
      }
      const data = await res.json();

      // Sort by updatedAt => newest first
      const sorted = [...data.memes].sort((a, b) => {
        const aTime = a.updatedAt
          ? new Date(a.updatedAt).getTime()
          : new Date(a.createdAt).getTime();
        const bTime = b.updatedAt
          ? new Date(b.updatedAt).getTime()
          : new Date(b.createdAt).getTime();
        return bTime - aTime;
      });

      setUserData(data.user);
      setMemes(sorted);
      setAnalytics(data.analytics);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [notice]);

  function handleLogout() {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    navigate("/login");
  }

  async function handleDeleteMeme(memeId) {
    if (!window.confirm("Are you sure you want to delete this meme?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${baseApiUrl}/api/memes/${memeId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error deleting meme");
        return;
      }
      setMemes((prev) => prev.filter((m) => m.id !== memeId));
      setAnalytics((prev) => ({
        ...prev,
        totalMemes: Math.max((prev.totalMemes || 1) - 1, 0),
      }));
      setNotice("Meme deleted successfully");
    } catch (err) {
      console.error(err);
      setError("Server error deleting meme");
    }
  }

  async function handlePublish(memeId) {
    if (!window.confirm("Publish this meme to the community?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${baseApiUrl}/api/memes/${memeId}/publish`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Error publishing meme");
        return;
      }
      setMemes((prev) =>
        prev.map((m) => (m.id === memeId ? { ...m, sharedToCommunity: true } : m))
      );
      setNotice("Meme published to community");
    } catch (err) {
      console.error(err);
      setError("Server error publishing meme");
    }
  }

  async function handleUnpublish(memeId) {
    if (!window.confirm("Unpublish this meme from the community?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${baseApiUrl}/api/memes/${memeId}/unpublish`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Error unpublishing meme");
        return;
      }
      setMemes((prev) =>
        prev.map((m) => (m.id === memeId ? { ...m, sharedToCommunity: false } : m))
      );
      setNotice("Meme unpublished from community");
    } catch (err) {
      console.error(err);
      setError("Server error unpublishing meme");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-xl">
        Loading...
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-4 text-red-500 text-center">
        {error}{" "}
        <button onClick={handleLogout} className="ml-2 text-blue-600 underline">
          Log Out
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-50 to-blue-50 p-6">
      <h1 className="text-4xl font-bold mb-6 text-center text-gray-800">
        Dashboard
      </h1>

      {notice && (
        <div className="mb-4 text-green-700 bg-green-100 p-3 rounded text-center transition duration-300">
          {notice}
        </div>
      )}

      {userData && (
        <div className="mb-6 bg-white shadow-lg p-6 rounded-lg border-l-4 border-blue-500 max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold mb-2 text-gray-800">User Info</h2>
          <p className="text-gray-700">
            <strong>Email:</strong> {userData.email}
          </p>
          {userData.username && (
            <p className="text-gray-700">
              <strong>Username:</strong> {userData.username}
            </p>
          )}
          <button
            onClick={handleLogout}
            className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
          >
            Log Out
          </button>
        </div>
      )}

      <div className="mb-6 bg-white shadow-lg p-6 rounded-lg border-l-4 border-blue-500 max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-2 text-gray-800">Analytics</h2>
        <p className="text-gray-700">
          <strong>Total Memes Created:</strong> {analytics.totalMemes || 0}
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-2">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">My Memes</h2>
        {memes.length > 0 ? (
          <div className="space-y-6">
            {memes.map((meme) => (
              <DashboardMemeCard
                key={meme.id}
                meme={meme}
                onDelete={handleDeleteMeme}
                onPublish={handlePublish}
                onUnpublish={handleUnpublish}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-700 text-center">
            No memes yet.{" "}
            <button
              onClick={() => navigate("/create")}
              className="text-blue-600 font-semibold hover:underline"
            >
              Create one!
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

const DashboardMemeCard = ({ meme, onDelete, onPublish, onUnpublish }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      {/* Meme title if any */}
      {meme.title && (
        <h3 className="mb-2 text-lg font-semibold text-gray-700">{meme.title}</h3>
      )}

      {/* Limit tall images => max-h-96 */}
      <img
        src={meme.filePath}
        alt="Meme"
        className="w-full h-auto object-contain max-h-96 mb-2"
      />

      <p className="text-xs text-gray-500">
        Last updated:{" "}
        {meme.updatedAt
          ? new Date(meme.updatedAt).toLocaleString(undefined, {
              dateStyle: "short",
              timeStyle: "short",
            })
          : "N/A"}
      </p>

      <div className="flex gap-2 mt-3 flex-wrap">
        {/* Removed "Edit" button => no direct link to /create/:id */}
        <button
          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
          onClick={() => onDelete(meme.id)}
        >
          Delete
        </button>
        {meme.sharedToCommunity ? (
          <button
            className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600 transition"
            onClick={() => onUnpublish(meme.id)}
          >
            Unpublish
          </button>
        ) : (
          <button
            className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600 transition"
            onClick={() => onPublish(meme.id)}
          >
            Publish
          </button>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;