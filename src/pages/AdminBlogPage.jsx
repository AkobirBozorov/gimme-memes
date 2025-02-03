// gimme-memes-frontend/src/pages/AdminBlogPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { baseApiUrl } from "../utils/api";

const AdminBlogPage = ({ isAdmin }) => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  
  // NEW FIELDS
  const [mainImageFile, setMainImageFile] = useState(null);
  const [mainImageAlt, setMainImageAlt] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  // For listing existing posts
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
      return;
    }
    const token = localStorage.getItem("token");

    fetch(`${baseApiUrl}/api/blog`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setPosts(data.posts || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [isAdmin, navigate]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      // 1) Create the blog post record WITHOUT mainImage
      const postRes = await fetch(`${baseApiUrl}/api/blog`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          content,
          mainImageAlt,
          metaTitle,
          metaDescription,
        }),
      });
      const postData = await postRes.json();
      if (!postRes.ok) {
        alert(postData.error || "Error creating post");
        return;
      }
      const newPostId = postData.post.id;

      // 2) If user selected a main image file, upload it
      if (mainImageFile) {
        const formData = new FormData();
        formData.append("file", mainImageFile);

        const uploadRes = await fetch(
          `${baseApiUrl}/api/blog/${newPostId}/upload-image`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          alert(uploadData.error || "Error uploading main image");
        }
      }

      alert("Post created. You can see it in the list below or publish it.");

      // Clear form
      setTitle("");
      setContent("");
      setMainImageFile(null);
      setMainImageAlt("");
      setMetaTitle("");
      setMetaDescription("");

      // Optionally refresh posts or just leave as is
    } catch (err) {
      console.error(err);
    }
  };

  const handlePublish = async (postId) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${baseApiUrl}/api/blog/${postId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isPublished: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Error publishing post");
        return;
      }
      alert("Post published!");
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="p-4">Loading admin blog...</div>;
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin Blog Panel</h1>

      {/* CREATE FORM */}
      <form onSubmit={handleCreate} className="mb-8 space-y-4 border p-4 rounded">
        <div>
          <label className="block font-semibold mb-1">Title</label>
          <input
            type="text"
            className="w-full border p-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Content</label>
          <textarea
            className="w-full border p-2 h-32"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>

        {/* MAIN IMAGE + ALT */}
        <div>
          <label className="block font-semibold mb-1">Main Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setMainImageFile(e.target.files[0] || null)}
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Main Image Alt Text</label>
          <input
            type="text"
            className="w-full border p-2"
            value={mainImageAlt}
            onChange={(e) => setMainImageAlt(e.target.value)}
          />
        </div>

        {/* SEO FIELDS */}
        <div>
          <label className="block font-semibold mb-1">Meta Title (SEO)</label>
          <input
            type="text"
            className="w-full border p-2"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Meta Description (SEO)</label>
          <input
            type="text"
            className="w-full border p-2"
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Create New Post
        </button>
      </form>

      {/* LIST OF POSTS */}
      <h2 className="text-xl font-bold mb-2">Existing Blog Posts</h2>
      {posts.length === 0 ? (
        <p>No posts yet.</p>
      ) : (
        <ul className="space-y-3">
          {posts.map((post) => (
            <li key={post.id} className="border p-3 rounded">
              <h3 className="font-semibold text-lg">{post.title}</h3>
              {post.isPublished ? (
                <span className="inline-block mt-1 text-green-600">
                  Published
                </span>
              ) : (
                <button
                  onClick={() => handlePublish(post.id)}
                  className="ml-2 bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                >
                  Publish
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdminBlogPage;