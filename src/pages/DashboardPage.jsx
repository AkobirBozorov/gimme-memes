// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MiniMemePreview from "../components/MiniMemePreview";

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
    console.log("Fetching with token:", token);

    fetch("http://localhost:5000/api/user/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (res.status === 401) {
          throw new Error("Session expired. Please log in again.");
        }
        if (!res.ok) {
          const errMsg = await res.json();
          throw new Error(errMsg.error || "Failed to fetch user data");
        }
        return res.json();
      })
      .then((data) => {
        setUserData(data.user);

        // Reverse memes so the newest appear first:
        // (assuming `data.memes` is oldest-first from the server)
        const reversedMemes = [...data.memes].reverse();
        setMemes(reversedMemes);

        setAnalytics(data.analytics);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        if (err.message.includes("Session expired")) {
          handleLogout();
        }
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [notice]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    navigate("/login");
  };

  const handleDeleteMeme = async (memeId) => {
    if (!window.confirm("Are you sure you want to delete this meme?")) {
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/memes/${memeId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error deleting meme");
        return;
      }
      // Remove from UI
      setMemes((prev) => prev.filter((m) => m.id !== memeId));
      // Adjust analytics
      setAnalytics((prev) => ({
        ...prev,
        totalMemes: Math.max((prev.totalMemes || 1) - 1, 0),
      }));
      setNotice("Meme deleted successfully");
    } catch (err) {
      console.error(err);
      setError("Server error deleting meme");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-xl">
        Loading your dashboard...
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-4 text-red-500 text-center">
        {error}{" "}
        <button
          onClick={handleLogout}
          className="ml-2 text-blue-600 underline"
        >
          Log Out
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-6 text-center">Dashboard</h1>

      {notice && (
        <div className="mb-4 text-green-600 font-semibold bg-green-100 p-3 rounded text-center transition duration-300">
          {notice}
        </div>
      )}

      {userData && (
        <div className="mb-6 bg-white shadow-md p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-2">User Info</h2>
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
            className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Log Out
          </button>
        </div>
      )}

      <div className="mb-6 bg-white shadow-md p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-2">Analytics</h2>
        <p className="text-gray-700">
          <strong>Total Memes Created:</strong> {analytics.totalMemes || 0}
        </p>
      </div>

      <div className="mb-6 bg-white shadow-md p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">My Memes</h2>
        {memes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {memes.map((meme) => (
              <div
                key={meme.id}
                className="border p-4 rounded bg-gray-50 flex flex-col items-center"
              >
                {/* If there's a title, show it */}
                {meme.title && (
                  <h3 className="font-semibold text-gray-700 mb-2 text-center">
                    {meme.title}
                  </h3>
                )}
                <MiniMemePreview meme={meme} />
                <div className="flex justify-center space-x-2 mt-3">
                  <button
                    className="bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-gray-300"
                    onClick={() => navigate(`/meme/${meme.id}`)}
                  >
                    View
                  </button>
                  <button
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    onClick={() => navigate(`/create/${meme.id}`)}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    onClick={() => handleDeleteMeme(meme.id)}
                  >
                    Delete
                  </button>
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