import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// The page is statically prerendered and the API routes are dynamic, so there
// is nothing to cache incrementally. No R2 bucket needed.
export default defineCloudflareConfig({});
