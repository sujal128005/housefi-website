import type { NextConfig } from 'next'

// A fully static site: `next build` writes plain HTML, CSS, JS and assets to `out/`, which any static host can serve.
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
}

export default nextConfig
