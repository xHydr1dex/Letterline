import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['rss-parser', '@react-pdf/renderer'],
}

export default nextConfig
