// gimme-memes-frontend/src/components/MiniMemePreview.jsx
import React from "react";

/**
 * Renders a meme with updated overlays in a preview.
 * 1. Creates a container with correct aspect ratio (meme.data.width/height).
 * 2. Positions the base image behind overlays.
 * 3. Makes text bigger by scaling overlay font size more aggressively.
 */
const MiniMemePreview = ({ meme }) => {
  if (!meme || !meme.filePath) {
    return (
      <div className="w-full h-0 pb-[100%] bg-gray-200 flex items-center justify-center text-gray-600 rounded-lg">
        No image
      </div>
    );
  }

  // Append a cache-busting query param if updatedAt is present
  let imageUrl = meme.filePath;
  if (meme.updatedAt) {
    const timeValue = new Date(meme.updatedAt).getTime();
    if (!isNaN(timeValue)) {
      imageUrl += `?t=${timeValue}`;
    }
  }

  // Destructure data (width, height, overlays) with defaults
  const { width = 400, height = 400, overlays = [] } = meme.data || {};
  const aspectRatio = height / width;

  return (
    <div
      className="relative w-full bg-gray-200 rounded-lg overflow-hidden shadow"
      style={{
        paddingBottom: `${aspectRatio * 100}%`, // container shape
      }}
    >
      {/* Base image */}
      <img
        src={imageUrl}
        alt="Meme"
        className="absolute top-0 left-0 w-full h-full object-cover"
      />

      {/* Overlays */}
      {overlays.map((ov, idx) => {
        // Convert coordinates to percentages
        const leftPercent = (ov.x / width) * 100;
        const topPercent = (ov.y / height) * 100;
        const wPercent = (ov.width / width) * 100;
        const hPercent = (ov.height / height) * 100;

        /**
         * Original approach: (ov.fontSize / width) * 100 => small text
         * We'll multiply by 300 to enlarge text. Tweak as desired: 200, 400, etc.
         */
        const scaledFontSize = (ov.fontSize / width) * 300;

        return (
          <div
            key={idx}
            style={{
              position: "absolute",
              left: `${leftPercent}%`,
              top: `${topPercent}%`,
              width: `${wPercent}%`,
              height: `${hPercent}%`,
              backgroundColor: ov.bgColor || "transparent",
              color: ov.textColor || "#FFF",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              userSelect: "none",
              pointerEvents: "none",
              fontSize: `${scaledFontSize}%`, // Larger text in previews
            }}
          >
            {ov.text}
          </div>
        );
      })}
    </div>
  );
};

export default MiniMemePreview;