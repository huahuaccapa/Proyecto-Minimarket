/** @type {import('next').NextConfig} */

const backendApiUrl =
  (
    process.env
      .BACKEND_API_URL ||
    'http://127.0.0.1:4000/api'
  ).replace(
    /\/$/,
    '',
  );

const nextConfig = {
  reactStrictMode:
    true,

  async rewrites() {
    return [
      {
        source:
          '/backend-api/:path*',

        destination:
          `${backendApiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;