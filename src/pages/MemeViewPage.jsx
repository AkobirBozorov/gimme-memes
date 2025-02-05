// gimme-memes-frontend/src/pages/MemeViewPage.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { baseApiUrl } from "../utils/api";
import { Helmet } from "react-helmet-async";

const MemeViewPage = () => {
  const { id } = useParams();
  const [meme, setMeme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${baseApiUrl}/api/community/view/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.meme) {
          setMeme(data.meme);
        } else {
          setError("Meme not found");
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Error fetching meme");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <Helmet>
        <title>{meme.title || "Meme View"}</title>
      </Helmet>
      <h1>{meme.title}</h1>
      <img src={meme.filePath} alt="Meme" style={{ maxWidth: "100%" }} />
      <p>Uploaded by: {meme.User?.username}</p>
      {/* Optionally, render social media links if available */}
      <div>
        {meme.User?.instagram && (
          <a href={meme.User.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>
        )}
        {meme.User?.reddit && (
          <a href={meme.User.reddit} target="_blank" rel="noopener noreferrer">Reddit</a>
        )}
        {meme.User?.youtube && (
          <a href={meme.User.youtube} target="_blank" rel="noopener noreferrer">YouTube</a>
        )}
        {meme.User?.tiktok && (
          <a href={meme.User.tiktok} target="_blank" rel="noopener noreferrer">TikTok</a>
        )}
      </div>
    </div>
  );
};

export default MemeViewPage;