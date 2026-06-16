const getImagePrefix = () => {
  // Base path prefix for GitHub Pages deployment
  // Matches the REPO_NAME env in next.config.mjs
  const repo = process.env.REPO_NAME || "";
  return process.env.NODE_ENV === "production" && repo ? `/${repo}/` : "/";
};

export { getImagePrefix };
