// gimme-memes-frontend/src/pages/SignUpPage.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { baseApiUrl } from "../utils/api";
import { Helmet } from "react-helmet-async";

const SignUpPage = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState("");
  // REMOVED username
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
        // Removed "username" from the body
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        if (data.token) {
          localStorage.setItem("token", data.token);
          setIsAuthenticated(true);
          // Just navigate to homepage or blog, instead of /create
          navigate("/");
        } else {
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
      <Helmet>
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-DQEQJR9424"></script>
        <script>{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-DQEQJR9424');
        `}</script>
      </Helmet>

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

        {/* REMOVED Username field */}

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