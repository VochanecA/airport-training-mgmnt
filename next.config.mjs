/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // swcMinify je uklonjen jer je sada automatski uključen
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  typescript: {
    // Preporuka: Isključi ovo čim popraviš sve TypeScript greške
    ignoreBuildErrors: true, 
  },
}

export default nextConfig