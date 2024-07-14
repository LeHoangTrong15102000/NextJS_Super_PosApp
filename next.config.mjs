/** @type {import('next').NextConfig} */
const nextConfig = {
  // Sử dụng cho các đường dẫn hình ảnh ở localhost
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
        pathname: '/**'
      }
    ]
  }
  // reactStrictMode: false
}

export default nextConfig
