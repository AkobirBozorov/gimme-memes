// gimme-memes-frontend/src/components/MiniMemePreview.jsx
import React from "react";

/**
 * Renders a meme with its updated overlays:
 * 1. Creates a container with correct aspect ratio (from meme.data.width/height).
 * 2. Renders the base image, appending ?t=timestamp to avoid caching if updatedAt changes.
 * 3. Positions text overlays absolutely, scaled according to the original width/height.
 */
const MiniMemePreview = ({ meme }) => {
  if (!meme || !meme.filePath) {
    return (
      <div className="w-full h-0 pb-[100%] bg-gray-200 flex items-center justify-center text-gray-600 rounded-lg">
        No image
      </div>
    );
  }

  // Force a cache-bust if updatedAt is present
  let imageUrl = meme.filePath;
  if (meme.updatedAt) {
    const timeValue = new Date(meme.updatedAt).getTime();
    if (!isNaN(timeValue)) {
      imageUrl += `?t=${timeValue}`;
    }
  }

  // Extract the overlay data
  const { width = 400, height = 400, overlays = [] } = meme.data || {};

  // We'll preserve the aspect ratio from width/height
  const aspectRatio = height / width; // e.g., 400/400 = 1 => square

  return (
    <div
      className="relative w-full bg-gray-200 rounded-lg overflow-hidden shadow"
      style={{
        // By using paddingBottom = aspectRatio*100%, the container keeps the correct shape
        paddingBottom: `${aspectRatio * 100}%`,
      }}
    >
      {/* Base image */}
      <img
        src={imageUrl}
        alt="Meme"
        className="absolute top-0 left-0 w-full h-full object-cover"
      />

      {/* Text Overlays */}
      {overlays.map((ov, idx) => {
        // Convert overlay coords [0..width], [0..height] to percentages
        const leftPercent = (ov.x / width) * 100;
        const topPercent = (ov.y / height) * 100;
        const wPercent = (ov.width / width) * 100;
        const hPercent = (ov.height / height) * 100;

        // For a simpler approach to fontSize, we do a relative scale:
        //   (ov.fontSize / width) * 100 => relative to container's width
        // But we must choose a CSS unit (e.g. '%', 'vw', etc.).
        // We'll choose '%' here for a more consistent scale inside the container.
        const scaledFontSize = (ov.fontSize / width) * 100;

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
              color: ov.textColor || "#FFFFFF",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              userSelect: "none",
              pointerEvents: "none",
              fontSize: `${scaledFontSize}%`, // a rough approach
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