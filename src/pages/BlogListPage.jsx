// gimme-memes-frontend/src/pages/BlogListPage.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { baseApiUrl } from "../utils/api";
import { Helmet } from "react-helmet-async";

const BlogListPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${baseApiUrl}/api/blog`)
      .then((res) => res.json())
      .then((data) => {
        setPosts(data.posts || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-4 text-center">Loading blogs...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <Helmet>
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-CR21WBQXGL"></script>
        <script>{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-CR21WBQXGL');
        `}</script>
      </Helmet>

      <h1 className="text-3xl font-bold mb-6">Our Blog</h1>
      {posts.length === 0 ? (
        <p>No blog posts yet.</p>
      ) : (
        <ul className="space-y-4">
          {posts.map((post) => (
            <li key={post.id} className="border p-4 rounded bg-white">
              <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
              <Link
                to={`/blog/${post.slug}`}
                className="text-blue-600 hover:underline"
              >
                Read More
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BlogListPage;