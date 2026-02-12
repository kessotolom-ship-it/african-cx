
/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    experimental: {
        // Cette option permet d'importer Mastra
        serverComponentsExternalPackages: ["@mastra/core"],
    },
};

export default nextConfig;
