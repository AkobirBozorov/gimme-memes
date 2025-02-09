const fs = require("fs");
const { SitemapStream, streamToPromise } = require("sitemap");

async function generateSitemap() {
  const sitemap = new SitemapStream({ hostname: "https://www.gimmememes.com" });

  // Add your important pages
  sitemap.write({ url: "/", changefreq: "daily", priority: 1.0 });
  sitemap.write({ url: "/create", changefreq: "weekly", priority: 0.9 });
  sitemap.write({ url: "/about", changefreq: "monthly", priority: 0.7 });
  sitemap.write({ url: "/contact", changefreq: "monthly", priority: 0.7 });

  sitemap.end();
  
  const sitemapData = await streamToPromise(sitemap);
  fs.writeFileSync("public/sitemap.xml", sitemapData);
}

generateSitemap().then(() => console.log("✅ Sitemap generated successfully!"));