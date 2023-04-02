const { DateTime } = require("luxon");
module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("static/");
  eleventyConfig.addPassthroughCopy("css/");
  eleventyConfig.addPassthroughCopy("js/");

  eleventyConfig.addFilter("postDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj).toLocaleString(DateTime.DATE_MED);
  });

  return {
    pathPrefix: "/",
    dir: {
      input: "content",         // default: "."
      includes: "../_includes",  // default: "_includes"
      data: "../_data",          // default: "_data"
      output: "docs"
    }
  };
};
