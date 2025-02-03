// gimme-memes-frontend/src/pages/SignUpPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { baseApiUrl } from "../utils/api";

const SignUpPage = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${baseApiUrl}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username }),
      });
      const data = await res.json();

      if (res.ok) {
        // If the backend returned a token, store it
        if (data.token) {
          localStorage.setItem("token", data.token);
          setIsAuthenticated(true);
          // Redirect user to "Create" page
          navigate("/create");
        } else {
          // If for some reason no token is returned, prompt user to log in
          alert("User registered, please log in.");
          navigate("/login");
        }
      } else {
        setError(data.error || "Error signing up");
      }
    } catch (err) {
      console.error(err);
      setError("Server error");
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 mt-10">
      <h1 className="text-2xl font-bold mb-4">Sign Up</h1>
      <form onSubmit={handleSignUp} className="space-y-4">
        <div>
          <label className="block text-gray-700 mb-1">Email</label>
          <input
            type="email"
            className="w-full border p-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-1">Username (optional)</label>
          <input
            type="text"
            className="w-full border p-2"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-1">Password</label>
          <input
            type="password"
            className="w-full border p-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Sign Up
        </button>
        {error && <p className="text-red-500 text-center">{error}</p>}
      </form>
    </div>
  );
};

export default SignUpPage;