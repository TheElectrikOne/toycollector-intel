/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['postgres'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.hasbro.com' },
      { protocol: 'https', hostname: '**.goodsmile.info' },
      { protocol: 'https', hostname: '**.p-bandai.com' },
      { protocol: 'https', hostname: '**.necaonline.com' },
      { protocol: 'https', hostname: '**.sideshowtoy.com' },
      { protocol: 'https', hostname: '**.hottoys.com.hk' },
      { protocol: 'https', hostname: '**.mattel.com' },
      { protocol: 'https', hostname: '**.mcfarlane.com' },
      { protocol: 'https', hostname: '**.kotobukiya.co.jp' },
      { protocol: 'https', hostname: '**.funko.com' },
      { protocol: 'https', hostname: '**.bigbadtoystore.com' },
      { protocol: 'https', hostname: '**.entertainmentearth.com' },
    ],
  },
}

export default nextConfig
