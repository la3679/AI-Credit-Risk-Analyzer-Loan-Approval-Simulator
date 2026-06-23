import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const apiOrigin = process.env.API_ORIGIN ?? "http://localhost:4000";
const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@credora/shared"],
  turbopack: { root: workspaceRoot },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiOrigin}/api/:path*` }];
  },
};
export default nextConfig;
