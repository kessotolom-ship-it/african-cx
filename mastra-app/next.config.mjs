
/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // POUR MVP : On ignore les erreurs TS strictes au build
    // Cela permet de déployer même si Mastra v1.3 a des types exotiques
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    experimental: {
        serverComponentsExternalPackages: ["@mastra/core"],
    },
};

export default nextConfig;
