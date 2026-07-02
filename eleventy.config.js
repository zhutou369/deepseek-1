const siteData = require("./src/_data/site.json");

function assetVersion() {
  return siteData.assetVersion || "1";
}

function cacheBustStaticUrl(url) {
  const path = String(url || "").trim();
  if (!path.startsWith("/static/")) return path;
  if (/[?&]v=/.test(path)) return path;
  return `${path}?v=${assetVersion()}`;
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/static");
  eleventyConfig.addPassthroughCopy({ "src/_headers": "_headers" });
  eleventyConfig.addPassthroughCopy({ "src/_redirects": "_redirects" });
  eleventyConfig.addPassthroughCopy("src/images.txt");
  eleventyConfig.addPassthroughCopy("src/ai1");
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy({ "src/*.txt": "/" });

  eleventyConfig.addFilter("assetUrl", cacheBustStaticUrl);

  eleventyConfig.addTransform("cache-bust-static-assets", function (content, outputPath) {
    if (!outputPath || !outputPath.endsWith(".html")) return content;
    const version = assetVersion();
    return content.replace(/\/static\/[^"'\s<>]+\.svg(?![^"']*[?&]v=)/g, (path) => `${path}?v=${version}`);
  });

  eleventyConfig.addGlobalData("eleventyComputed", {
    noindex: (data) => {
      if (data.noindex === true) return true;
      if (data.featured === true) return false;

      const inputPath = data.page?.inputPath || "";
      if (!inputPath.includes("posts")) return false;

      const desc = data.description || "";
      const title = data.title || "";

      if (desc.includes("專業技術解析與香港本地化實操指南")) return true;
      if (data.generated === true) return true;
      if (/官方|權威|站群|SEO 排名|黑帽|跨境流量|智能一號核心樞紐|免翻牆中轉|爆款文案秘籍/.test(title)) {
        return true;
      }

      return false;
    }
  });

  eleventyConfig.addCollection("posts", function (collectionApi) {
    return collectionApi.getFilteredByGlob("src/posts/*.md").sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addCollection("indexablePosts", function (collectionApi) {
    return collectionApi
      .getFilteredByGlob("src/posts/*.md")
      .filter((item) => {
        const data = item.data;
        if (data.noindex === true || data.generated === true) return false;
        if (data.featured === true) return true;
        const desc = data.description || "";
        const title = data.title || "";
        if (desc.includes("專業技術解析與香港本地化實操指南")) return false;
        if (/官方|權威|站群|SEO 排名|黑帽|跨境流量|智能一號核心樞紐|免翻牆中轉|爆款文案秘籍/.test(title)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addFilter("limit", function (arr, limit) {
    if (!Array.isArray(arr)) return [];
    return arr.slice(0, limit);
  });

  eleventyConfig.addFilter("dateFilter", function (dateValue) {
    if (!dateValue) return "";
    const d = new Date(dateValue);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}年${month}月${day}日`;
  });

  eleventyConfig.addFilter("htmlDate", function (dateValue) {
    if (!dateValue) return "";
    const d = new Date(dateValue);
    return d.toISOString().slice(0, 10);
  });

  eleventyConfig.addFilter("rfc822", function (dateValue) {
    if (!dateValue) return "";
    return new Date(dateValue).toUTCString();
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      output: "_site"
    },
    templateFormats: ["md", "njk", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
};
