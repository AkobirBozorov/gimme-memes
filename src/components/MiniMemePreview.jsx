// gimme-memes-frontend/src/components/MiniMemePreview.jsx
import React from "react";

/**
 * This component:
 * 1. Creates a square or scaled container for the base image
 * 2. Positions text overlays on top, scaled according to the original width/height
 * 3. Appends a ?t= timestamp to filePath (if updatedAt is available) to avoid caching
 */
const MiniMemePreview = ({ meme }) => {
  if (!meme || !meme.filePath) {
    return (
      <div className="w-full h-0 pb-[100%] bg-gray-200 flex items-center justify-center text-gray-600 rounded-lg">
        No image
      </div>
    );
  }

  // If updatedAt is present, append ?t= to force image refresh in case the underlying file changed
  let imageUrl = meme.filePath;
  if (meme.updatedAt) {
    const timeValue = new Date(meme.updatedAt).getTime();
    if (!isNaN(timeValue)) {
      imageUrl += `?t=${timeValue}`;
    }
  }

  // Pull out the data needed for overlays
  const { width = 400, height = 400, overlays = [] } = meme.data || {};

  // For a square-ish preview, we'll do the "padding bottom" trick
  // but we still need the correct aspect ratio to position overlays
  // If you prefer a strictly square preview, do "pb-[100%]" and scale overlays accordingly
  const aspectRatio = height / width;
  // We'll assume a container width of 100% and let the height match the aspect ratio
  // Then overlays are absolute-positioned relative to that.

  return (
    <div className="relative w-full bg-gray-200 rounded-lg overflow-hidden shadow"
         style={{
           // We'll set height via padding bottom to preserve aspect ratio
           // e.g. if aspect ratio is 1, it's square. If 1.5, it's taller, etc.
           paddingBottom: `${aspectRatio * 100}%`,
         }}
    >
      {/* Base image */}
      <img
        src={imageUrl}
        alt="Meme"
        className="absolute top-0 left-0 w-full h-full object-cover"
      />

      {/* Overlays: position them absolutely, scaling coordinates from [0..width], [0..height] -> [0..100%] */}
      {overlays.map((ov, i) => {
        const leftPercent = (ov.x / width) * 100;
        const topPercent = (ov.y / height) * 100;
        const wPercent = (ov.width / width) * 100;
        const hPercent = (ov.height / height) * 100;

        return (
          <div
            key={i}
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
              // scale the font size similarly
              // we do a rough scaling based on width:
              fontSize: `${(ov.fontSize / width) * 100}vw`, 
              // but 'vw' might be tricky if the container isn't the full viewport width
              // Alternatively, we can do a simpler approach, or read container's actual width
              // For a small preview, you may want to reduce this further
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