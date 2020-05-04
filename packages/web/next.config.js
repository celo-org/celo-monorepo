const withImages = require('next-images')
const envConfig = require('./env-config')
const serverEnvConfig = require('./server-env-config')

module.exports = withImages({
  experimental: {
    granularChunks: true,
  },
  publicRuntimeConfig: envConfig,
  serverRuntimeConfig: serverEnvConfig,

  // options: {buildId, dev, isServer, defaultLoaders, webpack}   https://nextjs.org/docs#customizing-webpack-config
  webpack: (config, { isServer }) => {
    config.node = {
      fs: 'empty',
    }
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-native$': 'react-native-web',
    }

    if (!isServer) {
      config.resolve.alias['@sentry/node'] = '@sentry/browser'
    }

    config.module.rules.push({
      loader: 'ignore-loader',
      test: /\.test.ts$/,
    })

    return config
  },
})
