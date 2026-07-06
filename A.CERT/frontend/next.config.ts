import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  outputFileTracingRoot: path.resolve(__dirname, ".."),
};

if (process.env.NEXT_EXPORT === "1") {
  nextConfig.output = "export";
} else {
  nextConfig.rewrites = async () => [
    {
      source: "/api/:path*",
      destination: "http://localhost:3001/api/:path*",
    },
    {
      source: "/uploads/:path*",
      destination: "http://localhost:3001/uploads/:path*",
    },
  ];
}

export default nextConfig;
