// gimme-memes-frontend/src/pages/BlogPostPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { baseApiUrl } from "../utils/api";

const BlogPostPage = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${baseApiUrl}/api/blog/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.post) {
          setPost(data.post);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <div className="p-4 text-center">Loading post...</div>;
  }
  if (!post) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-2xl font-bold">Post Not Found</h1>
        <Link to="/blog" className="text-blue-500 hover:underline">
          Go back to Blog
        </Link>
      </div>
    );
  }

  const seoTitle = post.metaTitle || post.title;
  const seoDescription =
    post.metaDescription || `Check out this post: ${post.title}`;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <Helmet>
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-DQEQJR9424"></script>
        <script>{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-DQEQJR9424');
        `}</script>

        <title>{seoTitle} - GimmeMemes Blog</title>
        <meta name="description" content={seoDescription} />
        {post.mainImage && (
          <meta
            property="og:image"
            content={`${baseApiUrl}/${post.mainImage}`}
          />
        )}
      </Helmet>

      {post.mainImage && (
        <img
          src={`${baseApiUrl}/${post.mainImage}`}
          alt={post.mainImageAlt || ""}
          className="mb-4 w-full h-auto object-contain"
        />
      )}

      <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
      <div className="text-gray-700 whitespace-pre-line">{post.content}</div>

      <Link to="/blog" className="inline-block mt-6 text-blue-500 hover:underline">
        &larr; Back to Blog
      </Link>
    </div>
  );
};

export default BlogPostPage;