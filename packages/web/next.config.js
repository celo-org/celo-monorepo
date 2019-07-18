const withTypescript = require('@zeit/next-typescript')
const withSass = require('@zeit/next-sass')
const withImages = require('next-images')
const webpack = require('webpack')

const envConfig = require('./env-config')
const serverEnvConfig = require('./server-env-config')

module.exports = withImages(
  withTypescript(
    withSass({
      cssLoaderOptions: {
        importLoaders: 1,
        localIdentName: '[local]___[hash:base64:5]',
      },
      cssModules: true,
      publicRuntimeConfig: envConfig,
      serverRuntimeConfig: serverEnvConfig,
      webpack: (config, { dev }) => {
        config.node = {
          fs: 'empty',
        }
        config.resolve.alias = {
          ...config.resolve.alias,
          'react-native$': 'react-native-web',
        }
        return config
      },
    })
  )
)
