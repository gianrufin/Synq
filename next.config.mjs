/** @type {import('next').NextConfig} */

// When deploying to GitHub Pages the site is served from a repo subpath
// (e.g. /Synq), passed in as NEXT_PUBLIC_BASE_PATH at build time. Locally the
// var is unset, so the app builds and runs at the root as before.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig = {
  reactStrictMode: true,
  // Emit a fully static site into ./out so it can be hosted anywhere
  // (GitHub Pages). The app is entirely client-rendered, so nothing is lost.
  output: "export",
  basePath,
  images: { unoptimized: true },
  // GitHub Pages serves each route as a directory index.
  trailingSlash: true,
};

export default nextConfig;
