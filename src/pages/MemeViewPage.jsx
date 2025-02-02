// src/pages/MemeViewPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  computeScale,
  realToDisplay,
  displayToReal,
  PREVIEW_MAX_WIDTH,
  PREVIEW_MAX_HEIGHT,
} from "../utils/scaleUtils"; // Adjust the path based on your project structure

const MemeViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meme, setMeme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const containerRef = useRef(null);

  // State for scaling
  const [realWidth, setRealWidth] = useState(400);
  const [realHeight, setRealHeight] = useState(400);
  const [displayWidth, setDisplayWidth] = useState(PREVIEW_MAX_WIDTH);
  const [displayHeight, setDisplayHeight] = useState(PREVIEW_MAX_HEIGHT);
  const [displayOverlays, setDisplayOverlays] = useState([]);

  useEffect(() => {
    loadMeme();
    // eslint-disable-next-line
  }, []);

  const loadMeme = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/memes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load meme");
      }
      setMeme(data.meme);
      const { filePath, data: memeData, title } = data.meme;
      const overlays = memeData?.overlays || [];
      const originalWidth = memeData?.width || 400;
      const originalHeight = memeData?.height || 400;

      setRealWidth(originalWidth);
      setRealHeight(originalHeight);

      // Compute scale based on original dimensions
      const { scale, dispW, dispH } = computeScale(originalWidth, originalHeight);
      setDisplayWidth(dispW);
      setDisplayHeight(dispH);

      // Convert real overlays to display overlays
      const scaledOverlays = overlays.map((ov) => realToDisplay(ov, scale));
      setDisplayOverlays(scaledOverlays);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading Meme...</div>;
  }
  if (error) {
    return <div className="p-4 text-center text-red-500">Error: {error}</div>;
  }
  if (!meme) {
    return <div className="p-4 text-center text-gray-500">No meme found.</div>;
  }

  const { filePath, data, title } = meme;
  const overlays = data?.overlays || [];
  const originalWidth = data?.width || 400;
  const originalHeight = data?.height || 400;

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-6">{title || "Meme View"}</h1>

      <div
        ref={containerRef}
        style={{
          width: `${displayWidth}px`,
          height: `${displayHeight}px`,
          position: "relative",
          overflow: "hidden",
          borderRadius: "8px",
          border: "1px solid #ccc",
          backgroundColor: "transparent",
        }}
      >
        {filePath ? (
          <img
            src={`http://localhost:5000/${filePath}`}
            alt="Meme"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain", // Ensures the image fits within the container without cropping
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#999",
            }}
          >
            No image
          </div>
        )}

        {/* Overlays Positioned Accurately */}
        {displayOverlays.map((ov, idx) => (
          <div
            key={idx}
            style={{
              position: "absolute",
              left: ov.x,
              top: ov.y,
              width: ov.width,
              height: ov.height,
              backgroundColor: ov.bgColor || "transparent",
              color: ov.textColor === "white" ? "#fff" : "#000",
              fontWeight: "bold",
              fontSize: `${ov.fontSize}px`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            {ov.text}
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate("/dashboard")}
        className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition mt-6"
      >
        Back to Dashboard
      </button>
    </div>
  );
};

export default MemeViewPage;