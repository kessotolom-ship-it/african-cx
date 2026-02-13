
/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // POUR MVP : On ignore les erreurs TS strictes au build
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    experimental: {
        serverComponentsExternalPackages: ["@mastra/core", "@mastra/memory", "@mastra/pg", "pg"],
    },
};

export default nextConfig;
