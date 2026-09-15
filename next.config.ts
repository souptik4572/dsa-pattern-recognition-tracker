import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]
    : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // Enables forbidden() and the forbidden.tsx boundary for 403 responses.
    authInterrupts: true,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [
      {
        // Patterns used to have their own pages (/patterns/1-1); they now open in place on /patterns.
        source: "/patterns/:family(\\d{1,2})-:pattern(\\d{1,2})",
        destination: "/patterns?open=:family.:pattern#pattern-:family-:pattern",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
