import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { baseApiUrl } from "../utils/api";
import { Helmet } from "react-helmet-async";
import { FaInstagram, FaRedditAlien, FaYoutube } from "react-icons/fa";
import { SiTiktok } from "react-icons/si";

const DashboardPage = ({ isAuthenticated, setIsAuthenticated }) => {
  const [userData, setUserData] = useState(null);
  const [memes, setMemes] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    instagram: "",
    reddit: "",
    youtube: "",
    tiktok: "",
  });

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
      // Sort memes by updatedAt (fallback to createdAt)
      const sortedMemes = [...data.memes].sort((a, b) => {
        const aTime = a.updatedAt
          ? new Date(a.updatedAt).getTime()
          : new Date(a.createdAt).getTime();
        const bTime = b.updatedAt
          ? new Date(b.updatedAt).getTime()
          : new Date(b.createdAt).getTime();
        return bTime - aTime; // newest first
      });
      setUserData(data.user);
      setMemes(sortedMemes);
      setAnalytics(data.analytics);
      setFormData({
        username: data.user.username || "",
        instagram: data.user.instagram || "",
        reddit: data.user.reddit || "",
        youtube: data.user.youtube || "",
        tiktok: data.user.tiktok || "",
      });
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

  async function handleUpdateProfile(e) {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${baseApiUrl}/api/user/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error updating profile");
      }
      setUserData(data.user);
      setNotice("Profile updated successfully");
      setEditingProfile(false);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
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
      <div className="flex justify-center items-center h-screen text-lg">
        Loading...
      </div>
    );
  }
  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        {error}{" "}
        <button onClick={handleLogout} className="text-blue-600 underline">
          Log Out
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <Helmet>
        <title>Dashboard</title>
      </Helmet>

      <div className="max-w-4xl mx-auto bg-white p-6 shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Dashboard
        </h1>

        {notice && (
          <div className="mb-4 text-green-700 bg-green-100 p-3 rounded text-center">
            {notice}
          </div>
        )}

        {/* User Info Card */}
        {userData && (
          <div className="bg-gray-50 p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">User Info</h2>
            {!editingProfile ? (
              <>
                <p className="text-gray-700 mt-2">
                  <strong>Email:</strong> {userData.email}
                </p>
                <p className="text-gray-700">
                  <strong>Username:</strong> {userData.username || "Not set"}
                </p>

                {/* Social Media Icons */}
                <div className="flex justify-start space-x-4 mt-3">
                  {userData.instagram && (
                    <a
                      href={userData.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FaInstagram size={30} className="text-pink-500 hover:text-pink-600" />
                    </a>
                  )}
                  {userData.reddit && (
                    <a
                      href={userData.reddit}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FaRedditAlien size={30} className="text-orange-500 hover:text-orange-600" />
                    </a>
                  )}
                  {userData.youtube && (
                    <a
                      href={userData.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FaYoutube size={30} className="text-red-500 hover:text-red-600" />
                    </a>
                  )}
                  {userData.tiktok && (
                    <a
                      href={userData.tiktok}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <SiTiktok size={30} className="text-black hover:text-gray-700" />
                    </a>
                  )}
                </div>
                <button
                  onClick={() => setEditingProfile(true)}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                  Edit Profile
                </button>
              </>
            ) : (
              <form onSubmit={handleUpdateProfile} className="mt-4 space-y-4">
                <div>
                  <label className="block text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    className="w-full border p-2 rounded"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Instagram</label>
                  <input
                    type="url"
                    className="w-full border p-2 rounded"
                    value={formData.instagram}
                    onChange={(e) =>
                      setFormData({ ...formData, instagram: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Reddit</label>
                  <input
                    type="url"
                    className="w-full border p-2 rounded"
                    value={formData.reddit}
                    onChange={(e) =>
                      setFormData({ ...formData, reddit: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">YouTube</label>
                  <input
                    type="url"
                    className="w-full border p-2 rounded"
                    value={formData.youtube}
                    onChange={(e) =>
                      setFormData({ ...formData, youtube: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">TikTok</label>
                  <input
                    type="url"
                    className="w-full border p-2 rounded"
                    value={formData.tiktok}
                    onChange={(e) =>
                      setFormData({ ...formData, tiktok: e.target.value })
                    }
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingProfile(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Analytics */}
        <div className="mt-6 bg-gray-50 p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Analytics</h2>
          <p className="text-gray-700">
            <strong>Total Memes Created:</strong> {analytics.totalMemes || 0}
          </p>
        </div>

        {/* My Memes Section */}
        <div className="mt-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">My Memes</h2>
          {memes.length > 0 ? (
            <div className="grid gap-6">
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
    </div>
  );
};

const DashboardMemeCard = ({ meme, onDelete, onPublish, onUnpublish }) => {
  const navigate = useNavigate();
  return (
    <div className="bg-white p-4 shadow rounded-lg">
      {meme.title && (
        <h3 className="mb-2 text-lg font-semibold text-gray-700">{meme.title}</h3>
      )}
      <img
        src={meme.filePath}
        alt="Meme"
        className="w-full h-auto object-contain max-h-96 my-2 rounded"
      />
      <div className="text-xs text-gray-500">
        Last updated:{" "}
        {meme.updatedAt
          ? new Date(meme.updatedAt).toLocaleString(undefined, {
              dateStyle: "short",
              timeStyle: "short",
            })
          : "N/A"}
      </div>
      <div className="flex gap-2 mt-3 flex-wrap">
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