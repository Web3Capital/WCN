/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/docs/chapter-:num/:rest*",
        destination: "/docs",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
