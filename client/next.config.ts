import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep default bundler (Webpack) for more reliable dev builds on Windows/OneDrive.
  allowedDevOrigins: ["192.168.0.233"],
};

export default nextConfig;
