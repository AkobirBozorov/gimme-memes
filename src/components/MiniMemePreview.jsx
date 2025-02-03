// gimme-memes-frontend/src/components/MiniMemePreview.jsx
import React, { useRef, useState, useEffect } from "react";

/**
 * Renders a meme with its updated overlays in a preview that
 * replicates the same text size proportions from CreateMemePage.
 *
 * Steps:
 * 1. We measure the container's actual width (in px).
 * 2. We compute scale = containerWidth / meme.data.width (the original width).
 * 3. Overlays are absolutely positioned with scaled font sizes => exact proportion.
 */
const MiniMemePreview = ({ meme }) => {
  // 1. If there's no filePath or data, return a placeholder
  if (!meme || !meme.filePath) {
    return (
      <div className="w-full h-0 pb-[100%] bg-gray-200 flex items-center justify-center text-gray-600 rounded-lg">
        No image
      </div>
    );
  }

  // 2. We'll measure the container
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // 3. Extract info from meme.data
  const { width = 400, height = 400, overlays = [] } = meme.data || {};

  // 4. On mount (and resize), measure the actual container's width
  //    Then compute the scale factor
  useEffect(() => {
    function measure() {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    }
    measure(); // initial

    // (Optional) If you want dynamic resizing, add a listener:
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // 5. Calculate scale = (containerWidth) / (original Meme width)
  //    If containerWidth = 0 or the data.width is 0, default scale=1
  const scale = width > 0 && containerWidth > 0
    ? containerWidth / width
    : 1;

  // 6. Append a timestamp param to bust cache if updatedAt exists
  let imageUrl = meme.filePath;
  if (meme.updatedAt) {
    const timeValue = new Date(meme.updatedAt).getTime();
    if (!isNaN(timeValue)) {
      imageUrl += `?t=${timeValue}`;
    }
  }

  // 7. We'll keep aspect ratio by setting container's height using "padding-bottom".
  //    This only sets the container height, but we measure the actual .clientWidth for scaling text.
  const aspectRatio = height / width;
  
  return (
    <div
      ref={containerRef}
      className="relative w-full bg-gray-200 rounded-lg overflow-hidden shadow"
      style={{
        // Maintain aspect ratio
        paddingBottom: `${aspectRatio * 100}%`,
      }}
    >
      {/* Base image */}
      <img
        src={imageUrl}
        alt="Meme"
        className="absolute top-0 left-0 w-full h-full object-cover"
      />

      {overlays.map((ov, idx) => {
        // Convert overlay coords => absolute percentages
        const leftPercent = (ov.x / width) * 100;
        const topPercent = (ov.y / height) * 100;
        const wPercent = (ov.width / width) * 100;
        const hPercent = (ov.height / height) * 100;

        // Scale the font size by the container scale so text is
        // proportionally the same as in CreateMemePage.
        const scaledFontSizePx = ov.fontSize * scale; // e.g. if user typed 20px, scale might be 0.5 => 10px

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
              // Use scaledFontSizePx in px
              fontSize: `${scaledFontSizePx}px`,
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