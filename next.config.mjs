/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/docs",
        destination: "/wiki",
        permanent: true,
      },
      {
        source: "/docs/:path*",
        destination: "/wiki/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
