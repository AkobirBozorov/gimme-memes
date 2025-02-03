// gimme-memes-frontend/src/components/MiniMemePreview.jsx
import React from "react";
import { baseApiUrl } from "../utils/api";

const MiniMemePreview = ({ meme }) => {
  if (!meme || !meme.filePath) {
    return (
      <div className="w-48 h-48 bg-gray-200 flex items-center justify-center text-gray-600 rounded-lg">
        No image
      </div>
    );
  }

  const { overlays = [], width = 400, height = 400 } = meme.data || {};

  return (
    <div className="relative bg-gray-200 w-48 h-48 overflow-hidden rounded-lg shadow">
      {/* Base image filling the preview area */}
      <img
        src={`${baseApiUrl}/${meme.filePath}`}
        alt="Meme"
        className="absolute w-full h-full object-cover"
      />

      {/* Overlays positioned correctly */}
      {overlays.map((ov, idx) => (
        <div
          key={idx}
          style={{
            position: "absolute",
            left: `${(ov.x / width) * 100}%`,
            top: `${(ov.y / height) * 100}%`,
            width: `${(ov.width / width) * 100}%`,
            height: `${(ov.height / height) * 100}%`,
            backgroundColor: ov.bgColor || "transparent",
            color: ov.textColor === "white" ? "#fff" : "#000",
            fontWeight: "bold",
            fontSize: `${(ov.fontSize / width) * 100}%`,
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
  );
};

export default MiniMemePreview;