const withSass = require('@zeit/next-sass')
const withImages = require('next-images')
const webpack = require('webpack')
const envConfig = require('./env-config')
const serverEnvConfig = require('./server-env-config')

module.exports = withImages(
  withSass({
    cssLoaderOptions: {
      importLoaders: 1,
      localIdentName: '[local]___[hash:base64:5]',
    },
    cssModules: true,
    publicRuntimeConfig: envConfig,
    serverRuntimeConfig: serverEnvConfig,
    // options: {buildId, dev, isServer, defaultLoaders, webpack}   https://nextjs.org/docs#customizing-webpack-config
    webpack: (config, { dev, isServer }) => {
      config.node = {
        fs: 'empty',
      }
      config.resolve.alias = {
        ...config.resolve.alias,
        'react-native$': 'react-native-web',
      }
      if (!isServer) {
        config.resolve.alias['@sentry/node'] = '@sentry/browser'

        const cacheGroups = config.optimization.splitChunks.cacheGroups

        // delete cacheGroups.react
        cacheGroups.default = false

        cacheGroups.vendors = {
          minChunks: 5,
          // enforce: true,
          name: 'vendors',
          priority: 20,
          test: /[\\/](node_modules|packages)[\\/]/,
        }

        cacheGroups.commons = { name: 'commons', minChunks: 5, priority: 10 }
      }

      return config
    },
  })
)
