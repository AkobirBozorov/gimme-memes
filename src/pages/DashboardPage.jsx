// gimme-memes-frontend/src/pages/DashboardPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MiniMemePreview from "../components/MiniMemePreview";
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
    const token = localStorage.getItem("token");
    fetch(`${baseApiUrl}/api/user/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const errMsg = await res.json();
          throw new Error(errMsg.error || "Failed to fetch user data");
        }
        return res.json();
      })
      .then((data) => {
        setUserData(data.user);
        const reversed = [...data.memes].reverse();
        setMemes(reversed);
        setAnalytics(data.analytics);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate]);

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
    const token = localStorage.getItem("token");
    try {
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
    const token = localStorage.getItem("token");
    try {
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
        <div className="mb-6 bg-white shadow-lg p-6 rounded-lg border-l-4 border-blue-500">
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
      <div className="mb-6 bg-white shadow-lg p-6 rounded-lg border-l-4 border-blue-500">
        <h2 className="text-2xl font-semibold mb-2 text-gray-800">Analytics</h2>
        <p className="text-gray-700">
          <strong>Total Memes Created:</strong> {analytics.totalMemes || 0}
        </p>
      </div>
      <div className="mb-6 bg-white shadow-lg p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">My Memes</h2>
        {memes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {memes.map((meme) => (
              <div
                key={meme.id}
                className="bg-gray-50 rounded-lg overflow-hidden shadow hover:shadow-xl transition duration-300 flex flex-col items-center"
              >
                <MiniMemePreview meme={meme} />
                {meme.title && (
                  <h3 className="font-semibold text-gray-700 mt-2 text-center px-2">
                    {meme.title}
                  </h3>
                )}
                {meme.sharedToCommunity ? (
                  <div className="text-green-600 text-sm mt-1 text-center">
                    Published to Community
                    <p className="text-gray-700 mt-1">
                      Likes: {meme.likeCount || 0}
                    </p>
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm mt-1 text-center">
                    Not Published
                  </div>
                )}
                <div className="flex justify-center space-x-2 mt-3 flex-wrap px-2 pb-3">
                  <button
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                    onClick={() => handleDeleteMeme(meme.id)}
                  >
                    Delete
                  </button>
                  {meme.sharedToCommunity ? (
                    <button
                      className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600 transition"
                      onClick={() => handleUnpublish(meme.id)}
                    >
                      Unpublish
                    </button>
                  ) : (
                    <button
                      className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600 transition"
                      onClick={() => handlePublish(meme.id)}
                    >
                      Publish
                    </button>
                  )}
                </div>
              </div>
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

export default DashboardPage;