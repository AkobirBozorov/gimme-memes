// gimme-memes-frontend/src/components/MiniMemePreview.jsx
import React from "react";

const MiniMemePreview = ({ meme }) => {
  if (!meme || !meme.filePath) {
    return (
      <div className="w-full h-0 pb-[100%] bg-gray-200 flex items-center justify-center text-gray-600 rounded-lg">
        No image
      </div>
    );
  }

  // Force cache-bust if updatedAt is present
  let imageUrl = meme.filePath;
  if (meme.updatedAt) {
    const timeValue = new Date(meme.updatedAt).getTime();
    if (!isNaN(timeValue)) {
      imageUrl += `?t=${timeValue}`;
    }
  }

  const { width = 400, height = 400, overlays = [] } = meme.data || {};
  const aspectRatio = height / width;

  return (
    <div
      className="relative w-full bg-gray-200 rounded-lg overflow-hidden shadow"
      style={{
        paddingBottom: `${aspectRatio * 100}%`,
      }}
    >
      <img
        src={imageUrl}
        alt="Meme"
        className="absolute top-0 left-0 w-full h-full object-cover"
      />
      {overlays.map((ov, idx) => {
        const leftPercent = (ov.x / width) * 100;
        const topPercent = (ov.y / height) * 100;
        const wPercent = (ov.width / width) * 100;
        const hPercent = (ov.height / height) * 100;
        const scaledFontSize = (ov.fontSize / width) * 100; // a rough approach

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
              fontSize: `${scaledFontSize}%`,
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