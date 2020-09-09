module.exports = {
  experimental: {
    modern: true,
    scss: false,
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Important: return the modified config
    config.module.rules.push({
      test: /\.md$/,
      use: [
        {
          loader: 'raw-loader',
          options: {
            esModule: false,
          },
        },
      ],
    })
    return config
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    FATHOM_KEY: process.env.FATHOM_KEY,
  },
}
