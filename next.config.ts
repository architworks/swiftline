import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent large parsing libraries from being bundled into serverless functions.
  // pdfjs-dist alone is ~40MB which would breach Vercel's bundle size limits.
  serverExternalPackages: ['pdfjs-dist', 'mammoth', 'epubjs'],
};

export default nextConfig;
