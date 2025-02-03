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

  // Append updatedAt timestamp to force reload when updated
  const imageUrl = meme.updatedAt
    ? `${meme.filePath}?t=${new Date(meme.updatedAt).getTime()}`
    : meme.filePath;

  return (
    <div className="relative w-full h-0 pb-[100%] bg-gray-200 rounded-lg overflow-hidden shadow">
      <img
        src={imageUrl}
        alt="Meme"
        className="absolute top-0 left-0 w-full h-full object-cover"
      />
    </div>
  );
};

export default MiniMemePreview;