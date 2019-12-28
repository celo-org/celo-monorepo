const withSass = require('@zeit/next-sass')
const withImages = require('next-images')
const envConfig = require('./env-config')
const serverEnvConfig = require('./server-env-config')
const Visualizer = require('webpack-visualizer-plugin')

module.exports = withImages(
  withSass({
    cssLoaderOptions: {
      importLoaders: 1,
      localIdentName: '[local]___[hash:base64:5]',
    },
    cssModules: true,
    experimental: {
      granularChunks: true,
    },
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

      config.plugins = config.plugins || []
      config.plugins.push(new Visualizer())

      if (!isServer) {
        config.resolve.alias['@sentry/node'] = '@sentry/browser'
      }

      return config
    },
  })
)
