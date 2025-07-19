import NextBundleAnalyzer from '@next/bundle-analyzer'
import createNextIntlPlugin from 'next-intl/plugin'
import type { NextConfig } from 'next'

const withNextIntl = createNextIntlPlugin()
const nextConfig: NextConfig = {
  // Tối ưu hóa build performance
  experimental: {
    // Tối ưu package imports để giảm bundle size
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-alert-dialog',
      'recharts'
    ],
    // Tăng tốc TypeScript compilation với turbo
    turbo: {
      rules: {
        '*.tsx': {
          loaders: ['swc-loader'],
          as: '*.tsx'
        }
      }
    }
  },

  // Compiler optimization với SWC
  compiler: {
    // Remove console statements in production
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error']
          }
        : false
  },

  // Webpack optimization
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all'
          },
          recharts: {
            test: /[\\/]node_modules[\\/]recharts[\\/]/,
            name: 'recharts',
            chunks: 'all',
            priority: 10
          },
          radix: {
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            name: 'radix-ui',
            chunks: 'all',
            priority: 5
          }
        }
      }
    }
    return config
  },

  images: {
    remotePatterns: [
      {
        hostname: 'localhost',
        pathname: '/**'
      },
      {
        hostname: 'api-bigboy.duthanhduoc.com',
        pathname: '/**'
      },
      {
        hostname: 'via.placeholder.com',
        pathname: '/**'
      }
    ]
  }
}

const withBundleAnalyzer = NextBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true'
})

export default withBundleAnalyzer(withNextIntl(nextConfig))
