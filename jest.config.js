// Jest configuration without Next.js createJestConfig to avoid SWC conflicts

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Handle CSS modules and static assets
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/src/__mocks__/fileMock.js',
    // Mock ESM-only query-string package
    '^query-string$': '<rootDir>/src/__mocks__/query-string.js'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/app/api/**' // Sẽ test riêng với integration tests
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': [
      'babel-jest',
      {
        presets: [
          [
            '@babel/preset-env',
            {
              targets: {
                node: 'current'
              }
            }
          ],
          [
            '@babel/preset-react',
            {
              runtime: 'automatic',
              importSource: 'react'
            }
          ],
          '@babel/preset-typescript'
        ],
        plugins: ['@babel/plugin-syntax-import-attributes']
      }
    ]
  },
  transformIgnorePatterns: ['<rootDir>/node_modules/(?!(.+\\.mjs$|query-string|split-on-first|filter-obj|decode-uri-component))'],
  testMatch: ['<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}', '<rootDir>/src/**/*.(test|spec).{js,jsx,ts,tsx}'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testEnvironmentOptions: {
    customExportConditions: ['']
  }
}

module.exports = customJestConfig
