import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { baseApiUrl } from "../utils/api";
import { Helmet } from "react-helmet-async";
import { FaInstagram, FaRedditAlien, FaYoutube } from "react-icons/fa";
import { SiTiktok } from "react-icons/si";

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

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  if (error)
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        {error}
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8">
      <Helmet>
        <title>{meme.title || "Meme View"}</title>
      </Helmet>
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl">
        <h1 className="text-2xl font-bold text-center mb-4">{meme.title}</h1>
        <div className="flex justify-center mb-4">
          <img
            src={meme.filePath}
            alt="Meme"
            className="max-w-full max-h-[80vh] object-contain rounded"
          />
        </div>
        <p className="text-center text-gray-700 mb-4">
          Uploaded by:{" "}
          <span className="font-semibold">{meme.User?.username}</span>
        </p>
        <div className="flex justify-center space-x-4">
          {meme.User?.instagram && (
            <a
              href={meme.User.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-500 hover:text-pink-600"
            >
              <FaInstagram size={30} />
            </a>
          )}
          {meme.User?.reddit && (
            <a
              href={meme.User.reddit}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 hover:text-orange-600"
            >
              <FaRedditAlien size={30} />
            </a>
          )}
          {meme.User?.youtube && (
            <a
              href={meme.User.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-500 hover:text-red-600"
            >
              <FaYoutube size={30} />
            </a>
          )}
          {meme.User?.tiktok && (
            <a
              href={meme.User.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              className="text-black hover:text-gray-700"
            >
              <SiTiktok size={30} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemeViewPage;