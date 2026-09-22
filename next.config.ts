import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {};

export default nextConfig;

// Makes Cloudflare bindings available during `next dev`. No-op in production builds.
initOpenNextCloudflareForDev();
