import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["localhost", "127.0.0.1", "0.0.0.0"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "celqfbybspfyecgmnhaz.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "*.mm.bing.net",
        pathname: "/th/**",
      },
      {
        protocol: "https",
        hostname: "encrypted-tbn0.gstatic.com",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    optimizePackageImports: [
      "recharts",
      "lucide-react",
      "@supabase/supabase-js",
      "leaflet",
    ],
  },
};

export default nextConfig;
