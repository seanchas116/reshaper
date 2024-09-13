/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    swcPlugins: [["@reshaper/swc-plugin", {}]],
  },
};

export default nextConfig;
