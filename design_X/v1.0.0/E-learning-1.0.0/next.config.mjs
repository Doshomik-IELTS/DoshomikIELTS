/** @type {import('next').NextConfig} */
const repoName = process.env.REPO_NAME || "IELTS";
const isProd = process.env.NODE_ENV === "production";
const basePath = isProd ? `/${repoName}` : "";

const nextConfig = {
  basePath,
  assetPrefix: isProd ? `${basePath}/` : "",
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;