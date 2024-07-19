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
      },
      {
        hostname: 'via.placeholder.com',
        pathname: '/**'
      }
    ]
  }
  // reactStrictMode: false
}

export default nextConfig
