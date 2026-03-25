import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
    dest: "public",
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
    reactStrictMode: true,
    // Allow importing from backend models without issues
    serverExternalPackages: ["pg", "jsonwebtoken", "bcryptjs"],
    experimental: {
        optimizePackageImports: ["lucide-react", "recharts", "framer-motion"],
    },
    turbopack: {},
};

// Completely bypass next-pwa in development to prevent dev server hangs
export default process.env.NODE_ENV === "development"
    ? nextConfig
    : withPWA(nextConfig as any);
