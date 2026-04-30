import type { NextConfig } from "next";

const supabaseHostname = (() => {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url) return null;
    return new URL(url).hostname;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...(supabaseHostname
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHostname,
              pathname: "/storage/v1/object/**",
            },
          ]
        : []),
      // Apify CDN (raw screenshot blobs are streamed via storage; this
      // covers fallback cases).
      {
        protocol: "https" as const,
        hostname: "api.apify.com",
        pathname: "/v2/key-value-stores/**",
      },
    ],
  },
};

export default nextConfig;
